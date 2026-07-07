import { supabase } from "@/config/supabase";
import { createPeer, getRoom, updateAnswer, addCandidate } from "./webrtcService";

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
  }

  async start() {
    try {
      console.log("[ViewerPeer] Fetching room for:", this.shopId);
      const room = await getRoom(this.shopId);
      if (!room) throw new Error("No active room found for this shop");

      if (this.isDestroyed) return;

      this.roomId = room.id;
      console.log("[ViewerPeer] Room found. ID:", this.roomId);

      this.peer = createPeer();
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
      this.peer.oniceconnectionstatechange = () => {
        const state = this.peer?.iceConnectionState;
        console.log("[ViewerPeer] ICE state:", state);
        if (this.onConnectionStateChange && !this.isDestroyed) {
          this.onConnectionStateChange(state);
        }
      };

      // Apply customer's offer as remote description
      console.log("[ViewerPeer] Applying remote offer...");
      await this.peer.setRemoteDescription(new RTCSessionDescription(room.offer));
      this.remoteDescriptionSet = true;

      // Upload local ICE candidates as they are gathered
      this.peer.onicecandidate = async (event) => {
        if (event.candidate && this.roomId && !this.isDestroyed) {
          try {
            await addCandidate(this.roomId, "viewer", event.candidate.toJSON());
            console.log("[ViewerPeer] ICE candidate uploaded");
          } catch (err) {
            console.error("[ViewerPeer] Failed to upload ICE candidate:", err);
          }
        }
      };

      // Create SDP Answer
      console.log("[ViewerPeer] Creating SDP Answer...");
      const answer = await this.peer.createAnswer();
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
        .eq("sender", "seller");

      if (error) throw error;

      if (candidates?.length > 0) {
        console.log(`[ViewerPeer] Applying ${candidates.length} existing seller ICE candidates...`);
        for (const item of candidates) {
          if (this.peer) await this.peer.addIceCandidate(new RTCIceCandidate(item.candidate));
        }
      }
    } catch (err) {
      console.error("[ViewerPeer] Error fetching existing candidates:", err);
    }
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
          const { sender, candidate } = payload.new;
          if (sender === "seller" && this.peer && !this.isDestroyed) {
            try {
              if (!this.remoteDescriptionSet) {
                this.remoteCandidatesQueue.push(candidate);
              } else {
                await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
                console.log("[ViewerPeer] Seller ICE candidate added");
              }
            } catch (err) {
              console.error("[ViewerPeer] Error adding seller ICE candidate:", err);
            }
          }
        }
      )
      .subscribe();
  }

  /** Dynamically add a local stream and renegotiate (used for live stream speaker joining) */
  async addLocalStream(stream) {
    if (!this.peer || this.isDestroyed) return;
    console.log("[ViewerPeer] Adding local stream and renegotiating...");
    stream.getTracks().forEach((track) => this.peer.addTrack(track, stream));
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    await supabase.from("video_rooms").update({ offer, answer: null }).eq("id", this.roomId);
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    console.log("[ViewerPeer] Destroying session");

    clearTimeout(this._trackDebounceTimer);

    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    if (this.peer) {
      this.peer.close();
      this.peer = null;
    }

    this.remoteStream = null;
  }
}
