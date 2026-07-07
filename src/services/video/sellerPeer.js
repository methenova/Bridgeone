import { supabase } from "@/config/supabase";
import { createPeer, createRoom, addCandidate, deleteRoom, cleanOldRooms } from "./webrtcService";

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
    // Scheduled poll timers for answer (retry safety net)
    this._pollTimers = [];
  }

  async start() {
    try {
      const actualRoomCode = this.customRoomCode || this.shopId;
      console.log("[SellerPeer] Cleaning up old rooms for room code:", actualRoomCode);
      await cleanOldRooms(actualRoomCode);

      if (this.isDestroyed) return;

      console.log("[SellerPeer] Creating RTCPeerConnection...");
      this.peer = createPeer();
      this.remoteStream = new MediaStream();

      // Remote track handler — debounced so callback fires ONCE after all tracks arrive
      this.peer.ontrack = (event) => {
        console.log("[SellerPeer] Remote track received:", event.track.kind);
        const tracks = event.streams?.[0]?.getTracks() ?? [event.track];
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
      this.peer.oniceconnectionstatechange = () => {
        const state = this.peer?.iceConnectionState;
        console.log("[SellerPeer] ICE state:", state);
        if (this.onConnectionStateChange && !this.isDestroyed) {
          this.onConnectionStateChange(state);
        }
      };

      // Add local tracks to connection
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          this.peer.addTrack(track, this.localStream);
          console.log("[SellerPeer] Added local track:", track.kind);
        });
      }

      // Upload local ICE candidates as they are gathered
      this.peer.onicecandidate = async (event) => {
        if (event.candidate && this.roomId && !this.isDestroyed) {
          try {
            await addCandidate(this.roomId, "seller", event.candidate.toJSON());
            console.log("[SellerPeer] ICE candidate uploaded");
          } catch (err) {
            console.error("[SellerPeer] Failed to upload ICE candidate:", err);
          }
        }
      };

      // Create SDP Offer
      console.log("[SellerPeer] Creating SDP Offer...");
      const offer = await this.peer.createOffer();
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
      console.log("[SellerPeer] Room created. Room ID:", this.roomId);

      // Start listening for answer + ICE candidates via Realtime
      this.setupSignaling(room.id);

      // Safety polls: retry at 2s, 5s, 10s in case Realtime subscription was slow to activate
      [2000, 5000, 10000].forEach((delay) => {
        const t = setTimeout(() => this.pollForAnswer(), delay);
        this._pollTimers.push(t);
      });

    } catch (err) {
      console.error("[SellerPeer] Failed to start:", err);
      this.destroy();
      throw err;
    }
  }

  /** Poll DB directly for an answer (safety net against Realtime race condition) */
  async pollForAnswer() {
    if (this.isDestroyed || !this.roomId || this.remoteDescriptionSet) return;
    try {
      console.log("[SellerPeer] Polling DB for answer...");
      const { data: room } = await supabase
        .from("video_rooms")
        .select("answer")
        .eq("id", this.roomId)
        .single();

      if (room?.answer && this.peer && this.peer.signalingState !== "stable" && !this.isDestroyed) {
        console.log("[SellerPeer] Answer found via poll — applying remote description...");
        await this.peer.setRemoteDescription(new RTCSessionDescription(room.answer));
        this.remoteDescriptionSet = true;
        for (const cand of this.remoteCandidatesQueue) {
          await this.peer.addIceCandidate(new RTCIceCandidate(cand));
        }
        this.remoteCandidatesQueue = [];
      }
    } catch (err) {
      // Room may not exist yet or answer not set — non-critical
      console.warn("[SellerPeer] Poll skipped:", err?.message);
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
          const room = payload.new;
          if (
            room.answer &&
            this.peer &&
            this.peer.signalingState !== "stable" &&
            !this.isDestroyed &&
            !this.remoteDescriptionSet
          ) {
            try {
              console.log("[SellerPeer] SDP Answer received via Realtime — applying...");
              await this.peer.setRemoteDescription(new RTCSessionDescription(room.answer));
              this.remoteDescriptionSet = true;
              console.log(`[SellerPeer] Processing ${this.remoteCandidatesQueue.length} queued ICE candidates...`);
              for (const cand of this.remoteCandidatesQueue) {
                await this.peer.addIceCandidate(new RTCIceCandidate(cand));
              }
              this.remoteCandidatesQueue = [];
            } catch (err) {
              console.error("[SellerPeer] Error applying SDP answer:", err);
            }
          }
        }
      )
      // Listen for viewer ICE candidates
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "video_candidates", filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const { sender, candidate } = payload.new;
          if (sender === "viewer" && this.peer && !this.isDestroyed) {
            try {
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
      .subscribe();
  }

  /** Trigger renegotiation (used when a viewer joins the live stream as speaker) */
  async renegotiate() {
    if (!this.peer || this.isDestroyed) return;
    console.log("[SellerPeer] Renegotiating connection...");
    this.remoteDescriptionSet = false;
    await supabase.from("video_rooms").update({ answer: null }).eq("id", this.roomId);
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    await supabase.from("video_rooms").update({ offer }).eq("id", this.roomId);
  }

  async destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    console.log("[SellerPeer] Destroying session");

    // Cancel all pending poll timers
    this._pollTimers.forEach(clearTimeout);
    this._pollTimers = [];
    clearTimeout(this._trackDebounceTimer);

    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    if (this.peer) {
      this.peer.close();
      this.peer = null;
    }

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
