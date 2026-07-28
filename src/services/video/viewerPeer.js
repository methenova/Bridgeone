import { supabase } from "@/config/supabase";
import { createPeer, getRoom, updateAnswer, addCandidate, optimizeSdp, validateSdp } from "./webrtcService";
import { callTelemetry } from "./callTelemetry";
import { WebRTCStatsMonitor } from "./webrtcStats";
import { WebRTCAdaptiveQualityController } from "./webrtcAdaptiveQuality";

export class ViewerPeer {
  /**
   * @param {string} shopId - room_code to look up (shop ID or call room code)
   * @param {(stream: MediaStream) => void} onStreamReceived
   * @param {MediaStream|null} localStream - local camera/mic to send to remote peer
   * @param {(state: RTCIceConnectionState) => void} [onConnectionStateChange]
   */
  constructor(shopId, onStreamReceived, localStream = null, onConnectionStateChange = null) {
    this.shopId = shopId;
    this.onStreamReceived = onStreamReceived;
    this.localStream = localStream;
    this.onConnectionStateChange = onConnectionStateChange;
    this.peer = null;
    this.roomId = null;
    this.channel = null;
    this.remoteStream = null;
    this.isDestroyed = false;

    this.remoteCandidatesQueue = [];
    this.remoteDescriptionSet = false;

    // Debounce timer: fires onStreamReceived once after all tracks arrive
    this._trackDebounceTimer = null;
    this._iceRecoveryTimer = null;
    this._iceEscalationTimer = null;
    this._iceRestartCount = 0;
    this._recreationCount = 0;  // FI-1 FIX: bounded recreation attempts
    this._hasConnected = false;
    this._isRecovering = false;
    this.pollForCandidatesInterval = null;
    this.appliedCandidateIds = new Set();
    this.onRoomDeleted = null;

    // Atomic guard: prevents duplicate setRemoteDescription on concurrent Realtime UPDATE events
    this._applyingOffer = false;

    // RTCStats monitor — verifies quality metrics after every recovery event
    // and continuously during active calls. Must be stopped in destroy().
    this._statsMonitor  = new WebRTCStatsMonitor("[ViewerPeer]");
    this.callId = null;
    this._recoveryEvent = null;

    // Adaptive quality controller
    this._adaptiveQuality = null;
    this._lastQualityProfile = null;
  }

  async start() {
    try {
      console.log("[ViewerPeer] Fetching room for:", this.shopId);
      const room = await getRoom(this.shopId);
      if (!room) throw new Error("No active room found for this shop");

      if (this.isDestroyed) return;

      this.roomId = room.id;
      this._statsMonitor.roomId = room.id;
      this.callId = "call_" + Math.random().toString(36).substring(2, 15);
      console.log("[ViewerPeer] Room found. ID:", this.roomId);

      // Begin telemetry session for this call
      callTelemetry.startSession("viewer", this.roomId, this.callId);

      this.peer = await createPeer();
      this.remoteStream = new MediaStream();

      // Add local tracks (seller's camera/mic for 1-on-1 call)
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          this.peer.addTrack(track, this.localStream);
          console.log("[ViewerPeer] Added local track:", track.kind);
        });
      }

      // Remote track handler — debounced so callback fires ONCE after all tracks arrive
      this.peer.ontrack = (event) => {
        console.log("[ViewerPeer] Remote track received:", event.track.kind);
        const tracks = event.streams?.[0]?.getTracks() ?? [event.track];
        // MR-3 FIX: Purge stale ended tracks before adding new live tracks.
        this._purgeEndedRemoteTracks();
        tracks.forEach((track) => {
          if (!this.remoteStream.getTrackById(track.id)) {
            this.remoteStream.addTrack(track);
          }
        });
        clearTimeout(this._trackDebounceTimer);
        this._trackDebounceTimer = setTimeout(() => {
          if (this.onStreamReceived && !this.isDestroyed) {
            this.onStreamReceived(this.remoteStream);
          }
        }, 250);
      };

      // ICE connection state monitoring
      this.setupIceStateMonitoring();

      // Network visibility handler — delegates to the ICE state machine
      // RC-7 FIX: Guard against concurrent online+ICE-state recovery paths
      this._onlineHandler = () => {
        if (this.peer && !this.isDestroyed && !this._isRecovering) {
          const state = this.peer.iceConnectionState;
          if (state === "disconnected" || state === "failed") {
            console.log("[ViewerPeer] Network returned online. Triggering ICE restart...");
            this.triggerIceRestart();
          }
        }
      };
      window.addEventListener("online", this._onlineHandler);

      // BC-4 FIX: Page Visibility API — iOS Safari and Android Chrome suspend
      // WebRTC when the tab is backgrounded. Re-check ICE state when the tab
      // becomes visible again and trigger recovery if connection has degraded.
      this._visibilityHandler = () => {
        if (document.visibilityState === "visible" && this.peer && !this.isDestroyed && !this._isRecovering) {
          const state = this.peer.iceConnectionState;
          if (state === "disconnected" || state === "failed") {
            console.log("[ViewerPeer] Tab became visible with degraded ICE state:", state, "— triggering recovery");
            this.triggerIceRestart();
          } else if (state === "checking" && this._hasConnected && !this._iceRecoveryTimer) {
            console.log("[ViewerPeer] Tab became visible, ICE still checking — starting recovery timer");
            this._iceRecoveryTimer = setTimeout(() => this.triggerIceRestart(), 5000);
          }
        }
      };
      document.addEventListener("visibilitychange", this._visibilityHandler);

      // Apply customer's offer as remote description
      console.log("[ViewerPeer] Applying remote offer...");
      const rawOffer = {
        type: room.offer.type,
        sdp: optimizeSdp(room.offer.sdp)
      };
      // SEC-4 FIX: Validate the remote offer SDP before passing to the browser.
      const optimizedOffer = validateSdp(rawOffer);
      if (!optimizedOffer) {
        throw new Error("[ViewerPeer] Remote offer rejected by validateSdp — aborting start()");
      }
      await this.peer.setRemoteDescription(new RTCSessionDescription(optimizedOffer));
      this.remoteDescriptionSet = true;

      // Upload local ICE candidates as they are gathered
      this.peer.onicecandidate = async (event) => {
        if (event.candidate && this.roomId && !this.isDestroyed) {
          try {
            await addCandidate(this.roomId, "business_member", event.candidate.toJSON());
            console.log("[ViewerPeer] ICE candidate uploaded");
          } catch (err) {
            console.error("[ViewerPeer] Failed to upload ICE candidate:", err);
          }
        }
      };

      // Create SDP Answer
      console.log("[ViewerPeer] Creating SDP Answer...");
      const answer = await this.peer.createAnswer();
      answer.sdp = optimizeSdp(answer.sdp);
      await this.peer.setLocalDescription(answer);

      if (this.isDestroyed) return;

      // Upload answer to DB (triggers SellerPeer's Realtime subscription)
      console.log("[ViewerPeer] Uploading SDP Answer...");
      const { error: answerError } = await updateAnswer(this.shopId, answer);
      if (answerError) throw answerError;

      // Fetch any seller ICE candidates that were uploaded before we subscribed
      await this.fetchExistingCandidates();

      // Apply any candidates that were queued during setup
      for (const cand of this.remoteCandidatesQueue) {
        await this.peer.addIceCandidate(new RTCIceCandidate(cand));
      }
      this.remoteCandidatesQueue = [];

      // Subscribe to new seller ICE candidates going forward
      this.setupSignaling(this.roomId);



    } catch (err) {
      console.error("[ViewerPeer] Failed to start:", err);
      this.destroy();
      throw err;
    }
  }

  /** Fetch ICE candidates the seller uploaded before this ViewerPeer subscribed */
  async fetchExistingCandidates() {
    if (this.isDestroyed || !this.roomId) return;
    try {
      const { data: candidates, error } = await supabase
        .from("video_candidates")
        .select("*")
        .eq("room_id", this.roomId)
        .eq("sender_type", "visitor");

      if (error) throw error;

      if (candidates?.length > 0) {
        console.log(`[ViewerPeer] Applying ${candidates.length} existing visitor ICE candidates...`);
        for (const item of candidates) {
          if (this.appliedCandidateIds.has(item.id)) continue;
          this.appliedCandidateIds.add(item.id);
          // SIG-7 FIX: Capture peer reference before await — prevents applying
          // candidates to a new peer if recreateConnection() swaps this.peer mid-loop.
          const activePeer = this.peer;
          if (activePeer && !this.isDestroyed) {
            await activePeer.addIceCandidate(new RTCIceCandidate(item.candidate));
          }
        }
      }
    } catch (err) {
      console.error("[ViewerPeer] Error fetching existing candidates:", err);
    }
  }



  /**
   * MR-3 FIX: Remove tracks from remoteStream whose readyState is 'ended'.
   * Prevents the video element from displaying a frozen frame from the old peer
   * alongside the new live tracks after PeerConnection recreation.
   */
  _purgeEndedRemoteTracks() {
    if (!this.remoteStream) return;
    this.remoteStream.getTracks().forEach((track) => {
      if (track.readyState === "ended") {
        this.remoteStream.removeTrack(track);
        console.log("[ViewerPeer] Purged ended remote track:", track.kind);
      }
    });
  }



  setupSignaling(roomId) {
    if (this.isDestroyed) return;

    console.log("[ViewerPeer] Subscribing to ICE candidates for room:", roomId);
    this.channel = supabase
      .channel(`webrtc-candidates-${roomId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "video_candidates", filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const { id, sender, sender_type, candidate } = payload.new;
          const isFromVisitor = sender_type === "visitor" || sender === "visitor";
          if (isFromVisitor && this.peer && !this.isDestroyed) {
            try {
              if (this.appliedCandidateIds.has(id)) return;
              // ML-1 FIX: Same unbounded Set bound as SellerPeer — cap at 500,
              // trim oldest 250 when full.
              if (this.appliedCandidateIds.size >= 500) {
                const iter = this.appliedCandidateIds.values();
                for (let i = 0; i < 250; i++) this.appliedCandidateIds.delete(iter.next().value);
              }
              this.appliedCandidateIds.add(id);
              if (!this.remoteDescriptionSet) {
                this.remoteCandidatesQueue.push(candidate);
              } else {
                await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
                console.log("[ViewerPeer] Visitor ICE candidate added");
              }
            } catch (err) {
              console.error("[ViewerPeer] Error adding visitor ICE candidate:", err);
            }
          }
        }
      )
      // Listen for SDP Offer updates (Renegotiation / ICE Restart)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "video_rooms", filter: `id=eq.${roomId}` },
        async (payload) => {
          const room = payload.new;
          if (
            room.offer &&
            !room.answer &&
            this.peer &&
            !this.isDestroyed &&
            !this._applyingOffer
          ) {
            this._applyingOffer = true;
            try {
              console.log("[ViewerPeer] New SDP Offer received via Realtime — applying renegotiation...");
              this.remoteDescriptionSet = false;
              this.remoteCandidatesQueue = [];

              const rawOffer = {
                type: room.offer.type,
                sdp: optimizeSdp(room.offer.sdp)
              };

              const optimizedOffer = validateSdp(rawOffer);
              if (!optimizedOffer) {
                console.error("[ViewerPeer] New SDP Offer rejected by validateSdp — aborting");
                this._applyingOffer = false;
                return;
              }

              await this.peer.setRemoteDescription(new RTCSessionDescription(optimizedOffer));
              this.remoteDescriptionSet = true;

              // Create answer
              const answer = await this.peer.createAnswer();
              answer.sdp = optimizeSdp(answer.sdp);
              await this.peer.setLocalDescription(answer);

              // Upload answer
              await updateAnswer(this.shopId, answer);
              console.log("[ViewerPeer] New SDP Answer uploaded successfully.");

              // Flush queued candidates
              console.log(`[ViewerPeer] Processing ${this.remoteCandidatesQueue.length} queued ICE candidates...`);
              for (const cand of this.remoteCandidatesQueue) {
                await this.peer.addIceCandidate(new RTCIceCandidate(cand));
              }
              this.remoteCandidatesQueue = [];
            } catch (err) {
              console.error("[ViewerPeer] Error during renegotiation/offer application:", err);
            } finally {
              this._applyingOffer = false;
            }
          }
        }
      )
      // Listen for room deletion (hang up)
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "video_rooms", filter: `id=eq.${roomId}` },
        () => {
          console.log("[ViewerPeer] Room deleted by customer");
          if (this.onRoomDeleted && !this.isDestroyed) {
            this.onRoomDeleted();
          }
        }
      )
      .subscribe((status, err) => {
        console.log(`[ViewerPeer] Signaling channel status: ${status}`, err || "");
        if (status === "CHANNEL_ERROR") {
          console.warn("[ViewerPeer] Channel error. Retrying subscription...");
          setTimeout(() => {
            if (!this.isDestroyed) {
              // RC-5 FIX: Remove the broken channel before creating a new one to
              // prevent duplicate event handlers and duplicate candidate application.
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

  /** Dynamically add a local stream and renegotiate (used for live stream speaker joining) */
  async addLocalStream(stream) {
    if (!this.peer || this.isDestroyed) return;
    console.log("[ViewerPeer] Adding local stream and renegotiating...");
    stream.getTracks().forEach((track) => this.peer.addTrack(track, stream));
    const offer = await this.peer.createOffer();
    offer.sdp = optimizeSdp(offer.sdp);
    await this.peer.setLocalDescription(offer);
    await supabase.from("video_rooms").update({ offer, answer: null }).eq("id", this.roomId);
  }

  setupIceStateMonitoring() {
    if (!this.peer || this.isDestroyed) return;

    this.peer.oniceconnectionstatechange = async () => {
      const state = this.peer?.iceConnectionState;
      console.log("[ViewerPeer] ICE state:", state);
      if (this.onConnectionStateChange && !this.isDestroyed) {
        this.onConnectionStateChange(state);
      }

      // Telemetry: record every ICE state transition
      if (this.roomId) callTelemetry.recordIceState(this.roomId, state);

      switch (state) {
        case "new":
          // Initial state — peer created but no connectivity attempt yet
          console.log("[ViewerPeer] ICE: new — awaiting candidate gathering");
          break;

        case "checking":
          // FI-7 FIX: 30-second watchdog on the very first connection attempt.
          // SCALE-1: ±5s jitter on watchdog to spread simultaneous first-connect
          // failures (e.g., entire office Wi-Fi goes down) across a 10s window.
          if (!this._hasConnected && !this._iceRecoveryTimer && !this.isDestroyed) {
            const watchdogMs = 30000 + Math.floor(Math.random() * 10000) - 5000;
            console.log(`[ViewerPeer] ICE: checking (initial) — ${watchdogMs}ms connection watchdog started`);
            this._iceRecoveryTimer = setTimeout(() => {
              console.error("[ViewerPeer] ICE never connected — escalating to recreation");
              this.recreateConnection();
            }, watchdogMs);
          } else if (this._hasConnected && !this._iceRecoveryTimer && !this.isDestroyed) {
            // SCALE-1: ±1.5s jitter on 5s recovery timer.
            const jitterMs = 5000 + Math.floor(Math.random() * 3000) - 1500;
            console.log(`[ViewerPeer] ICE regressed to checking — starting ${jitterMs}ms recovery timer`);
            this._iceRecoveryTimer = setTimeout(() => {
              this.triggerIceRestart();
            }, jitterMs);
          }
          break;

        case "connected":
          // Healthy state — clear all recovery timers and reset counters
          this._hasConnected    = true;
          this._iceRestartCount  = 0;
          this._recreationCount  = 0;  // FI-1 FIX: reset on successful connection
          clearTimeout(this._iceRecoveryTimer);
          clearTimeout(this._iceEscalationTimer);
          this._iceRecoveryTimer  = null;
          this._iceEscalationTimer = null;
          console.log("[ViewerPeer] ICE: connected — call active");
          // Start continuous stats monitoring and adaptive quality adaptation
          this._statsMonitor.onFreezeRecovery = () => {
            console.warn("[ViewerPeer] Freeze detected by stats monitor. Triggering ICE restart recovery.");
            this.triggerIceRestart();
          };
          this._statsMonitor.startContinuous(this.peer, (flags, deltas) => {
            if (!this._adaptiveQuality && this.peer && this.localStream) {
              this._adaptiveQuality = new WebRTCAdaptiveQualityController(this.peer, this.localStream, "[ViewerPeer]", this.roomId, this._lastQualityProfile);
            }
            if (this._adaptiveQuality) {
              this._adaptiveQuality.evaluate(deltas, flags).catch(() => {});
            }
          });
          break;

        case "completed":
          // All ICE candidates checked, optimal route found
          this._hasConnected    = true;
          this._iceRestartCount  = 0;
          this._recreationCount  = 0;  // FI-1 FIX: reset on successful connection
          clearTimeout(this._iceRecoveryTimer);
          clearTimeout(this._iceEscalationTimer);
          this._iceRecoveryTimer  = null;
          this._iceEscalationTimer = null;
          console.log("[ViewerPeer] ICE: completed — optimal route established");
          // Start continuous stats monitoring and adaptive quality adaptation
          this._statsMonitor.onFreezeRecovery = () => {
            console.warn("[ViewerPeer] Freeze detected by stats monitor. Triggering ICE restart recovery.");
            this.triggerIceRestart();
          };
          this._statsMonitor.startContinuous(this.peer, (flags, deltas) => {
            if (!this._adaptiveQuality && this.peer && this.localStream) {
              this._adaptiveQuality = new WebRTCAdaptiveQualityController(this.peer, this.localStream, "[ViewerPeer]", this.roomId, this._lastQualityProfile);
            }
            if (this._adaptiveQuality) {
              this._adaptiveQuality.evaluate(deltas, flags).catch(() => {});
            }
          });
          break;

        case "disconnected":
          // Transient loss — wait then attempt ICE restart.
          // SCALE-1: ±1.5s jitter to avoid thundering herd on Supabase.
          if (!this._iceRecoveryTimer && !this.isDestroyed) {
            const jitterMs = 5000 + Math.floor(Math.random() * 3000) - 1500;
            console.warn(`[ViewerPeer] ICE: disconnected — starting ${jitterMs}ms recovery timer`);
            this._iceRecoveryTimer = setTimeout(() => {
              this.triggerIceRestart();
            }, jitterMs);
          }
          break;

        case "failed":
          // Terminal failure — immediately attempt ICE restart
          console.error("[ViewerPeer] ICE: failed — triggering immediate ICE restart");
          clearTimeout(this._iceRecoveryTimer);
          this._iceRecoveryTimer = null;
          this.triggerIceRestart();
          break;

        case "closed":
          // Peer connection was closed — clean up timers
          console.log("[ViewerPeer] ICE: closed — connection terminated");
          clearTimeout(this._iceRecoveryTimer);
          clearTimeout(this._iceEscalationTimer);
          this._iceRecoveryTimer = null;
          this._iceEscalationTimer = null;
          break;

        default:
          console.warn("[ViewerPeer] ICE: unknown state:", state);
          break;
      }
    };
  }

  async triggerIceRestart() {
    if (!this.peer || this.isDestroyed || this._isRecovering) return;

    // RC-3 FIX: Set _isRecovering immediately (synchronously) before the first
    // await so concurrent ICE state events or online handler calls are blocked.
    this._isRecovering = true;

    this._iceRestartCount++;
    console.warn(`[ViewerPeer] ICE restart attempt ${this._iceRestartCount}/3...`);

    // Telemetry: record each ICE restart attempt
    if (this.roomId) callTelemetry.recordIceRestart(this.roomId, this._iceRestartCount);

    // After 3 failed ICE restarts, escalate to full PeerConnection recreation
    if (this._iceRestartCount > 3) {
      console.error("[ViewerPeer] 3 ICE restarts exhausted — escalating to connection recreation");
      this._iceRestartCount = 0;
      this._isRecovering = false;  // recreateConnection() sets its own guard
      this.recreateConnection();
      return;
    }

    try {
      if (this.peer.restartIce) {
        this.peer.restartIce();
        console.log("[ViewerPeer] Native ICE restart triggered.");
      } else {
        const offer = await this.peer.createOffer();
        offer.sdp = optimizeSdp(offer.sdp);
        await this.peer.setLocalDescription(offer);
        await supabase.from("video_rooms").update({ offer, answer: null }).eq("id", this.roomId);
        console.log("[ViewerPeer] Fallback ICE restart offer sent.");
      }
    } catch (err) {
      console.error("[ViewerPeer] ICE Restart failed:", err);
      this._isRecovering = false;  // allow recreateConnection to acquire lock
      // If the restart itself throws, escalate immediately
      this.recreateConnection();
      return;
    }

    this._isRecovering = false;
  }

  async recreateConnection() {
    if (this.isDestroyed || this._isRecovering) return;

    // FI-1/FI-5 FIX: Cap total recreation attempts.
    const MAX_RECREATIONS = 5;
    this._recreationCount++;
    if (this._recreationCount > MAX_RECREATIONS) {
      console.error(`[ViewerPeer] ${MAX_RECREATIONS} recreation attempts failed — signalling permanent failure`);
      this._recreationCount = 0;
      if (this.onConnectionStateChange && !this.isDestroyed) {
        this.onConnectionStateChange("permanent-failure");
      }
      return;
    }

    this.callId = "call_" + Math.random().toString(36).substring(2, 15);
    callTelemetry.updateCallId(this.roomId, this.callId);

    this._isRecovering = true;
    console.warn(`[ViewerPeer] Automated recovery escalation: recreating PeerConnection (attempt ${this._recreationCount}/${MAX_RECREATIONS})...`);

    // Clear all recovery timers before recreation
    clearTimeout(this._iceRecoveryTimer);
    clearTimeout(this._iceEscalationTimer);
    this._iceRecoveryTimer = null;
    this._iceEscalationTimer = null;
    this._iceRestartCount = 0;
    this._hasConnected = false;
    this.appliedCandidateIds = new Set();
    this._lastQualityProfile = this._adaptiveQuality?.currentProfile;
    this._adaptiveQuality = null; // Reset quality controller to re-initialize on new peer

    try {
      // MR-3 FIX: Capture the currently-active local track per kind BEFORE
      // closing the old peer so any replaceTrack state is preserved in the new peer.
      const activeSenderTracks = {};
      if (this.peer) {
        try {
          this.peer.getSenders().forEach((sender) => {
            if (sender.track && sender.track.kind && sender.track.readyState !== "ended") {
              activeSenderTracks[sender.track.kind] = sender.track;
            }
          });
        } catch (_) { /* peer may already be in a bad state */ }

        // Remove old handlers to prevent closed state from re-triggering
        this.peer.oniceconnectionstatechange = null;
        this.peer.onicecandidate = null;
        this.peer.ontrack = null;
        this.peer.close();
      }

      this.peer = await createPeer();

      // FI-S10 FIX: If destroy() was called during the async createPeer() gap,
      // close the stray new peer immediately to prevent a leak.
      if (this.isDestroyed) {
        this.peer.close();
        this.peer = null;
        return;
      }

      this.remoteDescriptionSet = false;
      this.remoteCandidatesQueue = [];

      // Re-register ontrack
      this.peer.ontrack = (event) => {
        console.log("[ViewerPeer] Recreated remote track received:", event.track.kind);
        const tracks = event.streams?.[0]?.getTracks() ?? [event.track];
        // MR-3 FIX: Purge stale ended tracks before adding new live tracks.
        this._purgeEndedRemoteTracks();
        tracks.forEach((track) => {
          if (!this.remoteStream.getTrackById(track.id)) {
            this.remoteStream.addTrack(track);
          }
        });
        clearTimeout(this._trackDebounceTimer);
        this._trackDebounceTimer = setTimeout(() => {
          if (this.onStreamReceived && !this.isDestroyed) {
            this.onStreamReceived(this.remoteStream);
          }
        }, 250);
      };

      // Re-register onicecandidate
      this.peer.onicecandidate = async (event) => {
        if (event.candidate && this.roomId && !this.isDestroyed) {
          try {
            await addCandidate(this.roomId, "business_member", event.candidate.toJSON());
            console.log("[ViewerPeer] Recreated peer ICE candidate uploaded");
          } catch (err) {
            console.error("[ViewerPeer] Failed to upload recreated ICE candidate:", err);
          }
        }
      };

      // Re-register ICE state monitoring
      this.setupIceStateMonitoring();

      // MR-3 FIX: Re-add local tracks using the active sender snapshot to
      // preserve any replaceTrack state from before the recreation.
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          const activeTrack = activeSenderTracks[track.kind] ?? track;
          this.peer.addTrack(activeTrack, this.localStream);
          console.log(`[ViewerPeer] Re-added ${track.kind} track after recreation (${activeTrack === track ? 'original' : 'sender-active'})`);
        });
      }

      // RC-1 FIX: Properly close the if(room) block before catch/finally so
      // telemetry and _isRecovering reset happen correctly on all code paths.
      const room = await getRoom(this.shopId);
      if (room) {
        const rawOffer = {
          type: room.offer.type,
          sdp: optimizeSdp(room.offer.sdp)
        };
        // SEC-4 FIX: Validate the remote SDP before passing to the new peer.
        const optimizedOffer = validateSdp(rawOffer);
        if (!optimizedOffer) {
          throw new Error("[ViewerPeer] Remote offer rejected by validateSdp during recreation");
        }
        await this.peer.setRemoteDescription(new RTCSessionDescription(optimizedOffer));
        this.remoteDescriptionSet = true;

        const answer = await this.peer.createAnswer();
        answer.sdp = optimizeSdp(answer.sdp);
        await this.peer.setLocalDescription(answer);
        await updateAnswer(this.shopId, answer);
        console.log("[ViewerPeer] Recreated PeerConnection answer sent.");

        // SIG-5 FIX: Drain any ICE candidates that arrived during the async
        // teardown gap (between old peer close and setRemoteDescription above).
        // These were queued in remoteCandidatesQueue by the still-active channel.
        if (this.remoteCandidatesQueue.length > 0) {
          console.log(`[ViewerPeer] Draining ${this.remoteCandidatesQueue.length} queued candidates after recreation...`);
          for (const cand of this.remoteCandidatesQueue) {
            const activePeer = this.peer;
            if (activePeer && !this.isDestroyed) {
              await activePeer.addIceCandidate(new RTCIceCandidate(cand));
            }
          }
          this.remoteCandidatesQueue = [];
        }

        // SIG-5 FIX: Fetch any seller candidates already in the DB that
        // arrived before this new channel subscription was active.
        await this.fetchExistingCandidates();
      }

      // Telemetry: recreation succeeded (outside if block — correct placement)
      if (this.roomId) callTelemetry.recordRecreation(this.roomId, true);
    } catch (err) {
      console.error("[ViewerPeer] Connection recreation failed:", err);

      // Telemetry: recreation failed
      if (this.roomId) callTelemetry.recordRecreation(this.roomId, false, err?.message);

      // FI-2 FIX: Schedule a retry after a transient failure (SDP corruption,
      // Supabase network error). Without this, a single failed recreation permanently
      // kills the call — the peer is left with no remote description and no active
      // recovery. The retry fires after 4s (enough for a brief network blip to clear)
      // and is guarded by _isRecovering being reset in finally below.
      if (!this.isDestroyed) {
        setTimeout(() => {
          if (!this.isDestroyed && !this._isRecovering) {
            console.warn("[ViewerPeer] Retrying failed recreation after 4s...");
            this.recreateConnection();
          }
        }, 4000);
      }
    } finally {
      this._isRecovering = false;
    }
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    console.log("[ViewerPeer] Destroying session");

    // Telemetry: end session and emit summary
    if (this.roomId) callTelemetry.endSession(this.roomId);

    // ML-3 FIX: Stop RTCStats continuous monitoring. Without this the 5-second
    // polling setInterval keeps running after destroy(), calling getStats() on
    // a closed null peer indefinitely — a real timer leak on long-duration calls.
    this._statsMonitor.stop();
    this._adaptiveQuality = null;

    if (this._onlineHandler) {
      window.removeEventListener("online", this._onlineHandler);
    }
    if (this._visibilityHandler) {
      document.removeEventListener("visibilitychange", this._visibilityHandler);
    }

    clearTimeout(this._trackDebounceTimer);
    clearTimeout(this._iceRecoveryTimer);
    clearTimeout(this._iceEscalationTimer);


    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    if (this.peer) {
      // RC-9 FIX: Nullify all event handlers synchronously before close() so
      // the browser cannot fire a 'closed' ICE state event into a stale handler.
      this.peer.oniceconnectionstatechange = null;
      this.peer.onicecandidate = null;
      this.peer.ontrack = null;
      this.peer.close();
      this.peer = null;
    }

    // remoteStream is already set to null before the patch; keep it explicit.
    this.remoteStream = null;

    // LEAK-3 FIX: Null all callback references to release React closure references
    // (useState setters, useRef DOM nodes) captured by these callbacks.
    this.onStreamReceived = null;
    this.onConnectionStateChange = null;
    this.onRoomDeleted = null;
  }
}
