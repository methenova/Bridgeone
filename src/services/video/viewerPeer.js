import { supabase } from "@/config/supabase";
import { createPeer, getRoom, updateAnswer, addCandidate } from "./webrtcService";

export class ViewerPeer {
  constructor(shopId, onStreamReceived, localStream = null) {
    this.shopId = shopId;
    this.onStreamReceived = onStreamReceived;
    this.localStream = localStream;
    this.peer = null;
    this.roomId = null;
    this.channel = null;
    this.remoteStream = null;
    this.isDestroyed = false;

    this.remoteCandidatesQueue = [];
    this.remoteDescriptionSet = false;
  }

  async start() {
    try {
      console.log("[ViewerPeer] Fetching active room for shop:", this.shopId);
      const room = await getRoom(this.shopId);
      if (!room) {
        throw new Error("No active live stream found for this shop");
      }

      if (this.isDestroyed) return;

      this.roomId = room.id;
      console.log("[ViewerPeer] Active room found. Room ID:", this.roomId);

      // Create Peer Connection
      console.log("[ViewerPeer] Creating RTCPeerConnection...");
      this.peer = createPeer();
      this.remoteStream = new MediaStream();

      // Add local stream tracks if available (e.g. for 1-on-1 consultations)
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          this.peer.addTrack(track, this.localStream);
          console.log("[ViewerPeer] Added local track:", track.kind);
        });
      }

      // Handle receiving remote tracks
      this.peer.ontrack = (event) => {
        console.log("[ViewerPeer] Remote track received:", event.track.kind);
        if (event.streams && event.streams[0]) {
          // Add all tracks from the first stream to our remoteStream
          event.streams[0].getTracks().forEach((track) => {
            this.remoteStream.addTrack(track);
          });
          this.onStreamReceived(this.remoteStream);
        } else {
          // Fallback if no streams array is present
          this.remoteStream.addTrack(event.track);
          this.onStreamReceived(this.remoteStream);
        }
      };

      // Set Remote Description (Seller's Offer)
      console.log("[ViewerPeer] Setting remote description (Seller SDP Offer)...");
      const rtcOffer = new RTCSessionDescription(room.offer);
      await this.peer.setRemoteDescription(rtcOffer);
      this.remoteDescriptionSet = true;

      // Handle local ICE candidates and upload them as viewer
      this.peer.onicecandidate = async (event) => {
        if (event.candidate && this.roomId && !this.isDestroyed) {
          try {
            await addCandidate(this.roomId, "viewer", event.candidate.toJSON());
            console.log("[ViewerPeer] Local ICE candidate uploaded");
          } catch (err) {
            console.error("[ViewerPeer] Failed to upload local candidate:", err);
          }
        }
      };

      // Create WebRTC SDP Answer
      console.log("[ViewerPeer] Creating SDP Answer...");
      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(answer);

      if (this.isDestroyed) return;

      // Save SDP Answer back to the room
      console.log("[ViewerPeer] Uploading SDP Answer...");
      const { error: answerError } = await updateAnswer(this.shopId, answer);
      if (answerError) throw answerError;

      // Fetch existing seller candidates
      await this.fetchExistingCandidates();

      // Process any queued candidates (should be empty, but safety first)
      console.log(`[ViewerPeer] Processing ${this.remoteCandidatesQueue.length} queued remote candidates...`);
      for (const cand of this.remoteCandidatesQueue) {
        await this.peer.addIceCandidate(new RTCIceCandidate(cand));
      }
      this.remoteCandidatesQueue = [];

      // Subscribe to any new candidates from seller
      this.setupSignaling(this.roomId);

    } catch (err) {
      console.error("[ViewerPeer] Failed to start viewer session:", err);
      this.destroy();
      throw err;
    }
  }

  async fetchExistingCandidates() {
    if (this.isDestroyed || !this.roomId) return;

    try {
      console.log("[ViewerPeer] Querying existing seller ICE candidates...");
      const { data: candidates, error } = await supabase
        .from("video_candidates")
        .select("*")
        .eq("room_id", this.roomId)
        .eq("sender", "seller");

      if (error) throw error;

      if (candidates && candidates.length > 0) {
        console.log(`[ViewerPeer] Found ${candidates.length} existing seller candidates. Adding to peer connection...`);
        for (const item of candidates) {
          if (this.peer) {
            await this.peer.addIceCandidate(new RTCIceCandidate(item.candidate));
          }
        }
      }
    } catch (err) {
      console.error("[ViewerPeer] Error fetching existing seller candidates:", err);
    }
  }

  setupSignaling(roomId) {
    if (this.isDestroyed) return;

    console.log("[ViewerPeer] Subscribing to candidates for room ID:", roomId);
    this.channel = supabase
      .channel(`webrtc-candidates-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "video_candidates",
          filter: `room_id=eq.${roomId}`,
        },
        async (payload) => {
          const { sender, candidate } = payload.new;
          if (sender === "seller" && this.peer && !this.isDestroyed) {
            try {
              if (!this.remoteDescriptionSet) {
                console.log("[ViewerPeer] Queueing remote candidate");
                this.remoteCandidatesQueue.push(candidate);
              } else {
                console.log("[ViewerPeer] Remote candidate received, adding to peer connection");
                await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
              }
            } catch (err) {
              console.error("[ViewerPeer] Error adding remote candidate:", err);
            }
          }
        }
      )
      .subscribe();
  }

  async addLocalStream(stream) {
    if (!this.peer || this.isDestroyed) return;
    
    console.log("[ViewerPeer] Dynamically adding local tracks to peer connection...");
    stream.getTracks().forEach((track) => {
      this.peer.addTrack(track, stream);
    });

    // WebRTC Renegotiation: Viewer creates a new Offer and updates the DB
    console.log("[ViewerPeer] Renegotiating connection, generating new SDP Offer...");
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);

    // Update the room's offer and clear the answer so the seller will send a new answer
    await supabase
      .from("video_rooms")
      .update({ offer, answer: null })
      .eq("id", this.roomId);
  }

  destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    console.log("[ViewerPeer] Destroying viewer session");

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
