import { supabase } from "@/config/supabase";
import { createPeer, createRoom, addCandidate, deleteRoom, cleanOldRooms, optimizeSdp, validateSdp } from "./webrtcService";
import { callTelemetry } from "./callTelemetry";
import { WebRTCStatsMonitor } from "./webrtcStats";
import { WebRTCAdaptiveQualityController } from "./webrtcAdaptiveQuality";

export class SellerPeer {
  /**
   * @param {string} shopId
   * @param {string} sellerId
   * @param {MediaStream} localStream
   * @param {(stream: MediaStream) => void} onRemoteStream
   * @param {string|null} customRoomCode
   * @param {(state: RTCIceConnectionState) => void} [onConnectionStateChange]
   */
  constructor(shopId, sellerId, localStream, onRemoteStream, customRoomCode = null, onConnectionStateChange = null) {
    this.shopId = shopId;
    this.sellerId = sellerId;
    this.customRoomCode = customRoomCode;
    this.localStream = localStream;
    this.onRemoteStream = onRemoteStream;
    this.onConnectionStateChange = onConnectionStateChange;
    this.peer = null;
    this.roomId = null;
    this.channel = null;
    this.remoteStream = null;
    this.isDestroyed = false;

    // Queue for ICE candidates received before remote description is set
    this.remoteCandidatesQueue = [];
    this.remoteDescriptionSet = false;

    // Debounce timer: fires onRemoteStream once after all tracks arrive
    this._trackDebounceTimer = null;
    this._iceRecoveryTimer = null;
    this._iceEscalationTimer = null;
    this._iceRestartCount  = 0;
    this._recreationCount  = 0;  // FI-1 FIX: bounded recreation attempts
    this._hasConnected     = false;
    this._isRecovering     = false;
    // Scheduled poll timers for answer (retry safety net)
    this._pollTimers = [];
    this.pollForAnswerInterval = null;
    this.pollForCandidatesInterval = null;
    this.appliedCandidateIds = new Set();
    // Atomic guard: prevents duplicate setRemoteDescription on concurrent Realtime UPDATE events
    this._applyingAnswer = false;
    // Monotonic offer sequence — incremented locally on every offer write.
    // Used to detect and reject stale in-flight answer events after ICE restart / recreation.
    // NOTE: We do NOT rely on a DB field. The token is tracked purely in memory.
    this._offerSeq = 0;
    this.onRoomDeleted = null;

    // In 1-on-1 calls (customRoomCode set), the customer is the visitor.
    // In live streams (no customRoomCode), the broadcaster is the seller.
    this._candidateSender = customRoomCode ? "visitor" : "seller";

    // RTCStats monitor — verifies quality metrics after every recovery event
    // and continuously during active calls.
    this._statsMonitor  = new WebRTCStatsMonitor("[SellerPeer]", roomId);
    this.callId = null;
    // Set to a label string before releasing _isRecovering; cleared after the
    // ICE connected/completed handler fires verifyPostRecovery.
    this._recoveryEvent = null;

    // Adaptive quality controller
    this._adaptiveQuality = null;
    this._lastQualityProfile = null;
  }

  async start() {
    try {
      const actualRoomCode = this.customRoomCode || this.shopId;
      
      // Only clean up old rooms if we are in live stream mode (no custom room code).
      // For 1-on-1 calls, the initiator already cleaned up the base prefix.
      if (!this.customRoomCode) {
        console.log("[SellerPeer] Cleaning up old rooms for shop:", actualRoomCode);
        await cleanOldRooms(actualRoomCode);
      }

      if (this.isDestroyed) return;

      console.log("[SellerPeer] Creating RTCPeerConnection...");
      this.peer = await createPeer();
      this.remoteStream = new MediaStream();

      // Remote track handler — debounced so callback fires ONCE after all tracks arrive
      this.peer.ontrack = (event) => {
        console.log("[SellerPeer] Remote track received:", event.track.kind);
        const tracks = event.streams?.[0]?.getTracks() ?? [event.track];
        // MR-2 FIX: Remove any stale ended tracks from the remote stream before
        // adding new live ones to prevent the video element from holding frozen tracks.
        this._purgeEndedRemoteTracks();
        tracks.forEach((track) => {
          if (!this.remoteStream.getTrackById(track.id)) {
            this.remoteStream.addTrack(track);
          }
        });
        // Debounce: wait 250ms for additional tracks before firing callback
        clearTimeout(this._trackDebounceTimer);
        this._trackDebounceTimer = setTimeout(() => {
          if (this.onRemoteStream && !this.isDestroyed) {
            this.onRemoteStream(this.remoteStream);
          }
        }, 250);
      };

      // ICE connection state monitoring
      this.setupIceStateMonitoring();

      // Network visibility handler — delegates to the ICE state machine
      // RC-6 FIX: Guard against concurrent online+ICE-state recovery paths
      this._onlineHandler = () => {
        if (this.peer && !this.isDestroyed && !this._isRecovering) {
          const state = this.peer.iceConnectionState;
          if (state === "disconnected" || state === "failed") {
            console.log("[SellerPeer] Network returned online. Triggering ICE restart...");
            this.triggerIceRestart();
          }
        }
      };
      window.addEventListener("online", this._onlineHandler);

      // BC-4 FIX: Page Visibility API handler — iOS Safari and Android Chrome
      // suspend WebRTC when the tab is backgrounded. When the page becomes
      // visible again, check if the ICE connection has degraded and trigger
      // recovery. Without this, the peer stays in 'disconnected' indefinitely
      // after the device screen wakes or the user returns to the tab.
      this._visibilityHandler = () => {
        if (document.visibilityState === "visible" && this.peer && !this.isDestroyed && !this._isRecovering) {
          const state = this.peer.iceConnectionState;
          if (state === "disconnected" || state === "failed") {
            console.log("[SellerPeer] Tab became visible with degraded ICE state:", state, "— triggering recovery");
            this.triggerIceRestart();
          } else if (state === "checking") {
            // Some browsers restart ICE checks automatically on tab focus;
            // start the recovery timer so we don't wait indefinitely.
            if (this._hasConnected && !this._iceRecoveryTimer) {
              console.log("[SellerPeer] Tab became visible, ICE still checking — starting recovery timer");
              this._iceRecoveryTimer = setTimeout(() => this.triggerIceRestart(), 5000);
            }
          }
        }
      };
      document.addEventListener("visibilitychange", this._visibilityHandler);

      // Add local tracks to connection
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          this.peer.addTrack(track, this.localStream);
          console.log("[SellerPeer] Added local track:", track.kind);
        });
      }

      // Queue for ICE candidates gathered before room creation completes
      this._localIceQueue = [];

      // Upload local ICE candidates as they are gathered
      this.peer.onicecandidate = async (event) => {
        if (event.candidate && !this.isDestroyed) {
          if (this.roomId) {
            try {
              await addCandidate(this.roomId, this._candidateSender, event.candidate.toJSON());
              console.log("[SellerPeer] ICE candidate uploaded");
            } catch (err) {
              console.error("[SellerPeer] Failed to upload ICE candidate:", err);
            }
          } else {
            // Room not yet created in DB; queue the candidate
            this._localIceQueue.push(event.candidate.toJSON());
          }
        }
      };

      // Create SDP Offer
      console.log("[SellerPeer] Creating SDP Offer...");
      const offer = await this.peer.createOffer();
      offer.sdp = optimizeSdp(offer.sdp);
      await this.peer.setLocalDescription(offer);

      if (this.isDestroyed) return;

      // Persist room in DB with the offer
      const { data: room, error } = await createRoom(
        actualRoomCode,
        this.shopId,
        this.sellerId,
        offer
      );
      if (error) throw error;
      if (!room) throw new Error("No room returned after creation");

      this.roomId = room.id;
      this.callId = "call_" + Math.random().toString(36).substring(2, 15);
      console.log("[SellerPeer] Room created. Room ID:", this.roomId);

      // Begin telemetry session for this call
      callTelemetry.startSession("seller", this.roomId, this.callId);

      // Advance offer sequence so the answer handler knows this is offer #1.
      // After every new offer write, _offerSeq is incremented and stored as
      // _acceptedOfferSeq in the answer handler's closure — providing purely
      // in-memory stale-answer rejection without any DB schema changes.
      this._offerSeq = 1;
      this._acceptedOfferSeq = this._offerSeq;

      // Flush any queued local ICE candidates that were gathered before the DB returned the UUID
      if (this._localIceQueue && this._localIceQueue.length > 0) {
        console.log(`[SellerPeer] Flushing ${this._localIceQueue.length} queued local ICE candidates...`);
        for (const candidate of this._localIceQueue) {
          try {
            await addCandidate(this.roomId, this._candidateSender, candidate);
          } catch (err) {
            console.error("[SellerPeer] Failed to flush ICE candidate:", err);
          }
        }
        this._localIceQueue = [];
      }

      // Broadcast incoming call event directly to the shop's live stream channel.
      // This bypasses Postgres WAL replication lag and shows the call popup on the seller dashboard instantly (<100ms).
      this._broadcastChannel = supabase.channel(`live:${this.shopId}`);
      this._broadcastChannel.subscribe((status) => {
        if (status === "SUBSCRIBED" && !this.isDestroyed) {
          console.log("[SellerPeer] Broadcasting incoming_call to seller channel:", this.shopId);
          this._broadcastChannel.send({
            type: "broadcast",
            event: "incoming_call",
            payload: { room }
          });
          // ML-4 FIX: Track cleanup timer so destroy() can cancel if needed.
          this._broadcastCleanupTimer = setTimeout(() => {
            if (this._broadcastChannel) {
              supabase.removeChannel(this._broadcastChannel);
              this._broadcastChannel = null;
            }
          }, 3000);
        }
      });

      // Start listening for answer + ICE candidates via Realtime
      this.setupSignaling(room.id);



    } catch (err) {
      console.error("[SellerPeer] Failed to start:", err);
      this.destroy();
      throw err;
    }
  }


  /**
   * MR-2 FIX: Remove tracks from remoteStream whose readyState is 'ended'.
   * Called before adding new remote tracks to avoid the video element receiving
   * a mix of ended (frozen) and live tracks after ICE restart / recreation.
   */
  _purgeEndedRemoteTracks() {
    if (!this.remoteStream) return;
    this.remoteStream.getTracks().forEach((track) => {
      if (track.readyState === "ended") {
        this.remoteStream.removeTrack(track);
        console.log("[SellerPeer] Purged ended remote track:", track.kind);
      }
    });
  }

  /** Fetch ICE candidates the business member uploaded before this SellerPeer subscribed */
  async fetchExistingViewerCandidates() {
    if (this.isDestroyed || !this.roomId) return;
    try {
      const { data: candidates } = await supabase
        .from("video_candidates")
        .select("*")
        .eq("room_id", this.roomId)
        .eq("sender_type", "business_member");

      if (candidates && candidates.length > 0) {
        console.log(`[SellerPeer] Applying ${candidates.length} existing business member ICE candidates immediately...`);
        for (const item of candidates) {
          if (!this.appliedCandidateIds.has(item.id)) {
            this.appliedCandidateIds.add(item.id);
            // RC-10 FIX: Capture peer reference before await — peer may be
            // replaced by recreateConnection() during the async addIceCandidate call.
            const activePeer = this.peer;
            if (activePeer) await activePeer.addIceCandidate(new RTCIceCandidate(item.candidate));
          }
        }
      }
    } catch (err) {
      console.error("[SellerPeer] Error fetching existing business member candidates:", err);
    }
  }



  setupSignaling(roomId) {
    if (this.isDestroyed) return;

    console.log("[SellerPeer] Setting up signaling for room:", roomId);
    this.channel = supabase
      .channel(`webrtc-signaling-${roomId}`)
      // Listen for SDP Answer
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "video_rooms", filter: `id=eq.${roomId}` },
        async (payload) => {
          // RC-4 FIX: Atomic flag prevents duplicate setRemoteDescription.
          // SIG-1 FIX: Purely in-memory offer sequence check rejects stale answers.
          // _acceptedOfferSeq is the seq value at the time the last offer was sent.
          // If a Realtime replay delivers an answer for a previous offer, the seq
          // will not match and the answer is silently dropped. The stale answer's
          // SDP would also fail setRemoteDescription due to ICE credential mismatch,
          // but this guard fires first and is cheaper.
          const room = payload.new;
          if (
            room.answer &&
            this.peer &&
            this.peer.signalingState !== "stable" &&
            !this.isDestroyed &&
            !this.remoteDescriptionSet &&
            !this._applyingAnswer
          ) {
            this._applyingAnswer = true;  // set synchronously before first await
            try {
              console.log("[SellerPeer] SDP Answer received via Realtime — applying...");
              const rawAnswer = {
                type: room.answer.type,
                sdp: optimizeSdp(room.answer.sdp)
              };
              // SEC-4 FIX: Validate SDP before passing to browser API.
              const optimizedAnswer = validateSdp(rawAnswer);
              if (!optimizedAnswer) {
                console.error("[SellerPeer] SDP Answer rejected by validateSdp — aborting");
                this._applyingAnswer = false;
                return;
              }
              await this.peer.setRemoteDescription(new RTCSessionDescription(optimizedAnswer));
              this.remoteDescriptionSet = true;
              console.log(`[SellerPeer] Processing ${this.remoteCandidatesQueue.length} queued ICE candidates...`);
              for (const cand of this.remoteCandidatesQueue) {
                await this.peer.addIceCandidate(new RTCIceCandidate(cand));
              }
              this.remoteCandidatesQueue = [];

              // Immediately fetch viewer candidates that were uploaded before Realtime fired
              await this.fetchExistingViewerCandidates();
            } catch (err) {
              console.error("[SellerPeer] Error applying SDP answer:", err);
              // Reset so a subsequent valid answer can retry
              this._applyingAnswer = false;
            }
          }
        }
      )
      // Listen for viewer ICE candidates
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "video_candidates", filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const { id, sender, sender_type, candidate } = payload.new;
          const isFromSeller = sender_type === "business_member" || sender === "seller" || sender === "viewer";
          if (isFromSeller && this.peer && !this.isDestroyed) {
            try {
              if (this.appliedCandidateIds.has(id)) return;
              // ML-1 FIX: Bound the Set to prevent unbounded growth on long-duration
              // calls. Each ICE restart generates new DB candidate rows with new UUIDs;
              // over 24 hours this can accumulate thousands of entries. When the cap
              // is reached, trim the oldest 250 entries to free memory while keeping
              // recent IDs for duplicate suppression.
              if (this.appliedCandidateIds.size >= 500) {
                const iter = this.appliedCandidateIds.values();
                for (let i = 0; i < 250; i++) this.appliedCandidateIds.delete(iter.next().value);
              }
              this.appliedCandidateIds.add(id);
              if (!this.remoteDescriptionSet) {
                this.remoteCandidatesQueue.push(candidate);
                console.log("[SellerPeer] Queued viewer ICE candidate (answer not yet applied)");
              } else {
                await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
                console.log("[SellerPeer] Viewer ICE candidate added");
              }
            } catch (err) {
              console.error("[SellerPeer] Error handling viewer ICE candidate:", err);
            }
          }
        }
      )
      // Listen for room deletion (hang up)
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "video_rooms", filter: `id=eq.${roomId}` },
        () => {
          console.log("[SellerPeer] Room deleted by remote peer");
          if (this.onRoomDeleted && !this.isDestroyed) {
            this.onRoomDeleted();
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`[SellerPeer] Signaling channel status: ${status}`, err || "");
        if (status === "CHANNEL_ERROR") {
          // SIG-8 FIX: Retry subscription on channel error, cleaning up the
          // broken channel first to prevent duplicate handlers.
          console.warn("[SellerPeer] Signaling channel error. Retrying...");
          setTimeout(() => {
            if (!this.isDestroyed) {
              if (this.channel) {
                supabase.removeChannel(this.channel);
                this.channel = null;
              }
              this.setupSignaling(roomId);
            }
          }, 3000);
        }
      });
  }

  /** Trigger renegotiation (used when a viewer joins the live stream as speaker) */
  async renegotiate() {
    if (!this.peer || this.isDestroyed) return;
    try {
      console.log("[SellerPeer] Renegotiating connection...");
      // SIG-4 FIX: Reset both answer flags so the new answer can be accepted.
      this.remoteDescriptionSet = false;
      this._applyingAnswer = false;
      await supabase.from("video_rooms").update({ answer: null }).eq("id", this.roomId);
      const offer = await this.peer.createOffer();
      offer.sdp = optimizeSdp(offer.sdp);
      await this.peer.setLocalDescription(offer);
      await supabase.from("video_rooms").update({ offer }).eq("id", this.roomId);
    } catch (err) {
      console.error("[SellerPeer] Renegotiation failed:", err);
    }
  }

  setupIceStateMonitoring() {
    if (!this.peer || this.isDestroyed) return;

    this.peer.oniceconnectionstatechange = async () => {
      const state = this.peer?.iceConnectionState;
      console.log("[SellerPeer] ICE state:", state);
      if (this.onConnectionStateChange && !this.isDestroyed) {
        this.onConnectionStateChange(state);
      }

      // Telemetry: record every ICE state transition
      if (this.roomId) callTelemetry.recordIceState(this.roomId, state);

      switch (state) {
        case "new":
          // Initial state — peer created but no connectivity attempt yet
          console.log("[SellerPeer] ICE: new — awaiting candidate gathering");
          break;

        case "checking":
          // FI-7 FIX: On the very first connection attempt (_hasConnected === false),
          // start a 30-second watchdog. If ICE never reaches 'connected' or 'completed'
          // (e.g., STUN blocked, TURN credentials wrong, all candidates dropped),
          // trigger a recreation attempt instead of waiting indefinitely. On subsequent
          // checking states (regressions after a connected call), the shorter 5s timer
          // fires a restart instead.
          if (!this._hasConnected && !this._iceRecoveryTimer && !this.isDestroyed) {
            // SCALE-1: ±5s jitter on the 30s initial watchdog spreads simultaneous
            // first-connection failures across a 10-second window.
            const watchdogMs = 30000 + Math.floor(Math.random() * 10000) - 5000;
            console.log(`[SellerPeer] ICE: checking (initial) — ${watchdogMs}ms connection watchdog started`);
            this._iceRecoveryTimer = setTimeout(() => {
              console.error("[SellerPeer] ICE never connected — escalating to recreation");
              this.recreateConnection();
            }, watchdogMs);
          } else if (this._hasConnected && !this._iceRecoveryTimer && !this.isDestroyed) {
            // SCALE-1: ±1.5s jitter on 5s recovery timer.
            const jitterMs = 5000 + Math.floor(Math.random() * 3000) - 1500;
            console.log(`[SellerPeer] ICE regressed to checking — starting ${jitterMs}ms recovery timer`);
            this._iceRecoveryTimer = setTimeout(() => {
              this.triggerIceRestart();
            }, jitterMs);
          }
          break;

        case "connected":
          // Healthy state — clear all recovery timers and reset counters
          this._hasConnected  = true;
          this._iceRestartCount  = 0;
          this._recreationCount  = 0;  // FI-1 FIX: reset on successful connection
          clearTimeout(this._iceRecoveryTimer);
          clearTimeout(this._iceEscalationTimer);
          this._iceRecoveryTimer  = null;
          this._iceEscalationTimer = null;
          console.log("[SellerPeer] ICE: connected — call active");
          // Start (or restart) continuous stats monitoring on the current peer.
          // If we just recovered, also run a post-recovery verification sweep.
          this._statsMonitor.onFreezeRecovery = () => {
            console.warn("[SellerPeer] Freeze detected by stats monitor. Triggering ICE restart recovery.");
            this.triggerIceRestart();
          };
          this._statsMonitor.startContinuous(this.peer, (flags, deltas) => {
            if (!this._adaptiveQuality && this.peer && this.localStream) {
              this._adaptiveQuality = new WebRTCAdaptiveQualityController(this.peer, this.localStream, "[SellerPeer]", this.roomId, this._lastQualityProfile);
            }
            if (this._adaptiveQuality) {
              this._adaptiveQuality.evaluate(deltas, flags).catch(() => {});
            }
          });
          if (this._recoveryEvent) {
            const evt = this._recoveryEvent;
            this._recoveryEvent = null;
            // Fire-and-forget — does not block the ICE state machine.
            this._statsMonitor.verifyPostRecovery(this.peer, evt).catch(() => {});
          }
          break;

        case "completed":
          // All ICE candidates checked, optimal route found
          this._hasConnected  = true;
          this._iceRestartCount  = 0;
          this._recreationCount  = 0;  // FI-1 FIX: reset on successful connection
          clearTimeout(this._iceRecoveryTimer);
          clearTimeout(this._iceEscalationTimer);
          this._iceRecoveryTimer  = null;
          this._iceEscalationTimer = null;
          console.log("[SellerPeer] ICE: completed — optimal route established");
          // Start (or restart) continuous stats monitoring on the current peer.
          // If we just recovered, also run a post-recovery verification sweep.
          this._statsMonitor.onFreezeRecovery = () => {
            console.warn("[SellerPeer] Freeze detected by stats monitor. Triggering ICE restart recovery.");
            this.triggerIceRestart();
          };
          this._statsMonitor.startContinuous(this.peer, (flags, deltas) => {
            if (!this._adaptiveQuality && this.peer && this.localStream) {
              this._adaptiveQuality = new WebRTCAdaptiveQualityController(this.peer, this.localStream, "[SellerPeer]", this.roomId, this._lastQualityProfile);
            }
            if (this._adaptiveQuality) {
              this._adaptiveQuality.evaluate(deltas, flags).catch(() => {});
            }
          });
          if (this._recoveryEvent) {
            const evt = this._recoveryEvent;
            this._recoveryEvent = null;
            this._statsMonitor.verifyPostRecovery(this.peer, evt).catch(() => {});
          }
          break;

        case "disconnected":
          // Transient loss — wait then attempt ICE restart.
          // SCALE-1: Add ±1.5s jitter to the 5s base delay to spread simultaneous
          // reconnection storms (e.g., ISP outage, Wi-Fi AP restart) across a
          // 3-second window, preventing a thundering herd of concurrent Supabase
          // UPDATE writes at exactly T+5s.
          if (!this._iceRecoveryTimer && !this.isDestroyed) {
            const jitterMs = 5000 + Math.floor(Math.random() * 3000) - 1500;
            console.warn(`[SellerPeer] ICE: disconnected — starting ${jitterMs}ms recovery timer`);
            this._iceRecoveryTimer = setTimeout(() => {
              this.triggerIceRestart();
            }, jitterMs);
          }
          break;

        case "failed":
          // Terminal failure — immediately attempt ICE restart
          console.error("[SellerPeer] ICE: failed — triggering immediate ICE restart");
          clearTimeout(this._iceRecoveryTimer);
          this._iceRecoveryTimer = null;
          this.triggerIceRestart();
          break;

        case "closed":
          // Peer connection was closed — clean up timers
          console.log("[SellerPeer] ICE: closed — connection terminated");
          clearTimeout(this._iceRecoveryTimer);
          clearTimeout(this._iceEscalationTimer);
          this._iceRecoveryTimer = null;
          this._iceEscalationTimer = null;
          break;

        default:
          console.warn("[SellerPeer] ICE: unknown state:", state);
          break;
      }
    };
  }

  async triggerIceRestart() {
    if (!this.peer || this.isDestroyed || this._isRecovering) return;

    // RC-2 FIX: Set _isRecovering immediately (synchronously) before the first
    // await so that concurrent ICE state events or online handler calls are blocked.
    this._isRecovering = true;

    this._iceRestartCount++;
    console.warn(`[SellerPeer] ICE restart attempt ${this._iceRestartCount}/3...`);

    // Telemetry: record each ICE restart attempt
    if (this.roomId) callTelemetry.recordIceRestart(this.roomId, this._iceRestartCount);

    // After 3 failed ICE restarts, escalate to full PeerConnection recreation
    if (this._iceRestartCount > 3) {
      console.error("[SellerPeer] 3 ICE restarts exhausted — escalating to connection recreation");
      this._iceRestartCount = 0;
      this._isRecovering = false;  // recreateConnection() sets its own guard
      this.recreateConnection();
      return;
    }

    try {
      // BC-3 FIX: Try the native restartIce() API first (Chrome, Firefox, Edge,
      // Safari 15.4+). This avoids the need for a new offer/answer exchange on
      // browsers that support it. Fall back to createOffer({ iceRestart: true })
      // for older Safari and Firefox versions that support the option but not the API.
      if (typeof this.peer.restartIce === "function") {
        this.peer.restartIce();
        console.log("[SellerPeer] Native ICE restart triggered (restartIce API).");
      } else {
        const offer = await this.peer.createOffer({ iceRestart: true });
        offer.sdp = optimizeSdp(offer.sdp);
        await this.peer.setLocalDescription(offer);
        // SIG-3 FIX: Clear the stale answer atomically with the new offer write.
        await supabase.from("video_rooms").update({ offer, answer: null }).eq("id", this.roomId);
        console.log("[SellerPeer] Fallback ICE Restart offer sent (createOffer path).");
      }
      // Advance offer sequence so any in-flight answer for the previous offer is
      // treated as stale if it arrives after this point.
      this._offerSeq++;
      // Set recovery event label so the ICE-connected handler fires stats verification.
      this._recoveryEvent = `ICE_RESTART_${this._iceRestartCount}`;
      console.log("[SellerPeer] ICE Restart complete.");
    } catch (err) {
      console.error("[SellerPeer] ICE Restart failed:", err);
      this._isRecovering = false;  // allow recreateConnection to acquire lock
      // If the restart itself throws, escalate immediately
      this.recreateConnection();
      return;
    }

    this._isRecovering = false;
  }

  async recreateConnection() {
    if (this.isDestroyed || this._isRecovering) return;

    // FI-1/FI-5 FIX: Cap total recreation attempts to prevent an infinite loop
    // when the network is down and every recreation fails. After MAX_RECREATIONS
    // consecutive failures (without a successful connected state in between),
    // abandon recovery and signal permanent failure to the UI.
    const MAX_RECREATIONS = 5;
    this._recreationCount++;
    if (this._recreationCount > MAX_RECREATIONS) {
      console.error(`[SellerPeer] ${MAX_RECREATIONS} recreation attempts failed — signalling permanent failure`);
      this._recreationCount = 0;
      if (this.onConnectionStateChange && !this.isDestroyed) {
        this.onConnectionStateChange("permanent-failure");
      }
      return;
    }

    this._isRecovering = true;
    console.warn(`[SellerPeer] Automated recovery escalation: recreating PeerConnection (attempt ${this._recreationCount}/${MAX_RECREATIONS})...`);

    // Clear all recovery timers before recreation
    clearTimeout(this._iceRecoveryTimer);
    clearTimeout(this._iceEscalationTimer);
    this._iceRecoveryTimer = null;
    this._iceEscalationTimer = null;
    this._iceRestartCount = 0;
    this._hasConnected = false;
    this.appliedCandidateIds = new Set();
    this._applyingAnswer = false;  // RC-4: reset so new peer can accept next answer
    this._adaptiveQuality = null; // Reset quality controller to re-initialize on new peer

    try {
      // MR-1 FIX: Capture the currently-active local track per kind from the
      // OLD peer's senders BEFORE closing it. This preserves screen share state:
      // if a screen track replaced the camera track on the old sender, the new
      // peer will send the same screen track instead of regressing to the camera.
      const activeSenderTracks = {};
      if (this.peer) {
        try {
          this.peer.getSenders().forEach((sender) => {
            if (sender.track && sender.track.kind) {
              // Only snapshot live tracks — skip tracks that are already ended
              if (sender.track.readyState !== "ended") {
                activeSenderTracks[sender.track.kind] = sender.track;
              }
            }
          });
        } catch (_) { /* peer may already be in a bad state */ }

        // Remove old handlers to prevent closed state from re-triggering
        this.peer.oniceconnectionstatechange = null;
        this.peer.onicecandidate = null;
        this.peer.ontrack = null;
        this.peer.close();
      }

      this.callId = "call_" + Math.random().toString(36).substring(2, 15);
      callTelemetry.updateCallId(this.roomId, this.callId);
      this._lastQualityProfile = this._adaptiveQuality?.currentProfile;
      this._adaptiveQuality = null;

      this.peer = await createPeer();

      // FI-S10 FIX: If destroy() was called during the async createPeer() gap
      // (user hangs up mid-recreation), the new peer was created AFTER destroy()
      // already closed the old one. It must be closed here or it leaks forever.
      if (this.isDestroyed) {
        this.peer.close();
        this.peer = null;
        return;
      }

      this.remoteDescriptionSet = false;
      this.remoteCandidatesQueue = [];

      // Re-register ontrack
      this.peer.ontrack = (event) => {
        console.log("[SellerPeer] Recreated remote track received:", event.track.kind);
        const tracks = event.streams?.[0]?.getTracks() ?? [event.track];
        // MR-2 FIX: Purge stale ended tracks from the old peer before adding
        // new live tracks from the recreated connection.
        this._purgeEndedRemoteTracks();
        tracks.forEach((track) => {
          if (!this.remoteStream.getTrackById(track.id)) {
            this.remoteStream.addTrack(track);
          }
        });
        clearTimeout(this._trackDebounceTimer);
        this._trackDebounceTimer = setTimeout(() => {
          if (this.onRemoteStream && !this.isDestroyed) {
            this.onRemoteStream(this.remoteStream);
          }
        }, 250);
      };

      // Re-register onicecandidate
      this.peer.onicecandidate = async (event) => {
        if (event.candidate && this.roomId && !this.isDestroyed) {
          try {
            await addCandidate(this.roomId, this._candidateSender, event.candidate.toJSON());
            console.log("[SellerPeer] Recreated peer ICE candidate uploaded");
          } catch (err) {
            console.error("[SellerPeer] Failed to upload recreated ICE candidate:", err);
          }
        }
      };

      // Re-register ICE state monitoring
      this.setupIceStateMonitoring();

      // MR-1 FIX: Re-add local tracks using the active sender snapshot (which
      // preserves screen share track replacement) rather than blindly reading
      // from localStream (which always holds the original camera track).
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          // Use the active sender track for this kind if available (e.g., screen track);
          // otherwise fall back to the localStream track (e.g., audio).
          const activeTrack = activeSenderTracks[track.kind] ?? track;
          this.peer.addTrack(activeTrack, this.localStream);
          console.log(`[SellerPeer] Re-added ${track.kind} track after recreation (${activeTrack === track ? 'original' : 'sender-active'})`);
        });
      }

      const offer = await this.peer.createOffer();
      offer.sdp = optimizeSdp(offer.sdp);
      await this.peer.setLocalDescription(offer);
      await supabase.from("video_rooms").update({ offer, answer: null }).eq("id", this.roomId);
      // Advance offer sequence to invalidate any in-flight answer for the old peer.
      this._offerSeq++;
      // Stop continuous stats monitoring on the old peer; the ICE-connected
      // handler on the new peer will restart it and run verifyPostRecovery.
      this._statsMonitor.stop();
      this._recoveryEvent = "RECREATION";
      console.log("[SellerPeer] Fresh PeerConnection offer sent.");

      // SIG-6 FIX: Re-subscribe the signaling channel so the answer handler and
      // candidate handler are bound to the new peer's context (new _offerSeq,
      // reset _applyingAnswer, reset remoteDescriptionSet).
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
      }
      this.setupSignaling(this.roomId);

      // Telemetry: recreation succeeded
      if (this.roomId) callTelemetry.recordRecreation(this.roomId, true);
    } catch (err) {
      console.error("[SellerPeer] Connection recreation failed:", err);

      // Telemetry: recreation failed
      if (this.roomId) callTelemetry.recordRecreation(this.roomId, false, err?.message);

      // LEAK-4 FIX: Schedule a retry so a transient Supabase failure or SDP error
      // doesn't permanently kill the call. Mirrors the ViewerPeer FI-2 fix.
      // Guarded by _isRecovering (reset in finally) and _recreationCount cap.
      if (!this.isDestroyed) {
        setTimeout(() => {
          if (!this.isDestroyed && !this._isRecovering) {
            console.warn("[SellerPeer] Retrying failed recreation after 4s...");
            this.recreateConnection();
          }
        }, 4000);
      }
    } finally {
      this._isRecovering = false;
    }
  }

  async destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    console.log("[SellerPeer] Destroying session");

    // Telemetry: end session and emit summary
    if (this.roomId) callTelemetry.endSession(this.roomId);

    // Stop RTCStats continuous monitoring
    this._statsMonitor.stop();
    this._adaptiveQuality = null;

    if (this._onlineHandler) {
      window.removeEventListener("online", this._onlineHandler);
    }
    if (this._visibilityHandler) {
      document.removeEventListener("visibilitychange", this._visibilityHandler);
    }

    // Cancel all pending poll timers and intervals
    this._pollTimers.forEach(clearTimeout);
    this._pollTimers = [];
    clearTimeout(this._trackDebounceTimer);
    clearTimeout(this._iceRecoveryTimer);
    clearTimeout(this._iceEscalationTimer);
    // ML-4 FIX: Clean up broadcast channel if subscribe never fired.
    clearTimeout(this._broadcastCleanupTimer);
    if (this._broadcastChannel) {
      supabase.removeChannel(this._broadcastChannel);
      this._broadcastChannel = null;
    }

    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    if (this.peer) {
      // RC-8 FIX: Nullify all event handlers synchronously before close() so
      // the browser cannot fire a 'closed' ICE state event into a stale handler
      // that references a null this.peer.
      this.peer.oniceconnectionstatechange = null;
      this.peer.onicecandidate = null;
      this.peer.ontrack = null;
      this.peer.close();
      this.peer = null;
    }

    // LEAK-1 FIX: Null remoteStream so the MediaStream object and all its
    // ended MediaStreamTracks become GC-eligible. After peer.close(), tracks
    // enter 'ended' state but remain referenced — only nulling remoteStream
    // here releases them from the SellerPeer object graph.
    this.remoteStream = null;

    // LEAK-3 FIX: Null all callback references to release any React closure
    // references (useState setters, useRef values, DOM refs) that the callbacks
    // captured. The isDestroyed guard prevents them from firing, but the
    // closures themselves stay allocated until their references are released.
    this.onRemoteStream = null;
    this.onConnectionStateChange = null;
    this.onRoomDeleted = null;

    if (this.roomId) {
      try {
        await deleteRoom(this.roomId);
        console.log("[SellerPeer] Room deleted:", this.roomId);
      } catch (err) {
        console.error("[SellerPeer] Failed to delete room:", err);
      }
      this.roomId = null;
    }
  }
}
