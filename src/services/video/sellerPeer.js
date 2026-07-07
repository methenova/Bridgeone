import { supabase } from "@/config/supabase";
import { createPeer, createRoom, addCandidate, deleteRoom, cleanOldRooms } from "./webrtcService";

export class SellerPeer {
  constructor(shopId, sellerId, localStream, onRemoteStream, customRoomCode = null) {
    this.shopId = shopId;
    this.sellerId = sellerId;
    this.customRoomCode = customRoomCode;
    this.localStream = localStream;
    this.onRemoteStream = onRemoteStream;
    this.peer = null;
    this.roomId = null;
    this.channel = null;
    this.remoteStream = null;
    this.isDestroyed = false;

    // Queue to handle candidates received before remote description (SDP answer) is set
    this.remoteCandidatesQueue = [];
    this.remoteDescriptionSet = false;
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

      // Handle receiving remote tracks (e.g. from joining viewer or 1-on-1 peer)
      this.peer.ontrack = (event) => {
        console.log("[SellerPeer] Remote track received:", event.track.kind);
        if (event.streams && event.streams[0]) {
          event.streams[0].getTracks().forEach((track) => {
            this.remoteStream.addTrack(track);
          });
        } else {
          this.remoteStream.addTrack(event.track);
        }
        if (this.onRemoteStream) {
          this.onRemoteStream(this.remoteStream);
        }
      };

      // Add local stream tracks to the connection
      if (this.localStream) {
        this.localStream.getTracks().forEach((track) => {
          this.peer.addTrack(track, this.localStream);
          console.log("[SellerPeer] Added track to connection:", track.kind);
        });
      }

      // Handle local ICE candidates and save them to the database
      this.peer.onicecandidate = async (event) => {
        if (event.candidate && this.roomId && !this.isDestroyed) {
          try {
            await addCandidate(this.roomId, "seller", event.candidate.toJSON());
            console.log("[SellerPeer] Local ICE candidate uploaded");
          } catch (err) {
            console.error("[SellerPeer] Failed to add local candidate to DB:", err);
          }
        }
      };

      // Create WebRTC Offer
      console.log("[SellerPeer] Creating SDP Offer...");
      const offer = await this.peer.createOffer();
      await this.peer.setLocalDescription(offer);

      if (this.isDestroyed) return;

      // Create database room
      const { data: room, error } = await createRoom(
        actualRoomCode, // room_code
        this.shopId,    // shop_id
        this.sellerId,  // host_id (the caller or seller)
        offer
      );

      if (error) throw error;
      if (!room) throw new Error("No room details returned from creation");

      this.roomId = room.id;
      console.log("[SellerPeer] Room successfully created in DB. Room ID:", this.roomId);

      // Start listening to signaling events (Answer & Candidates)
      this.setupSignaling(room.id);

      // Race condition safety: poll once for an answer that may have arrived
      // before the Supabase Realtime subscription became active
      setTimeout(() => this.pollForAnswer(), 2000);

    } catch (err) {
      console.error("[SellerPeer] Failed to start seller session:", err);
      this.destroy();
      throw err;
    }
  }

  async pollForAnswer() {
    if (this.isDestroyed || !this.roomId || this.remoteDescriptionSet) return;
    try {
      console.log("[SellerPeer] Polling DB for existing answer (race condition check)...");
      const { data: room } = await supabase
        .from("video_rooms")
        .select("answer")
        .eq("id", this.roomId)
        .single();

      if (room?.answer && this.peer && this.peer.signalingState !== "stable" && !this.isDestroyed) {
        console.log("[SellerPeer] Found existing answer via poll, setting remote description...");
        await this.peer.setRemoteDescription(new RTCSessionDescription(room.answer));
        this.remoteDescriptionSet = true;
        for (const cand of this.remoteCandidatesQueue) {
          await this.peer.addIceCandidate(new RTCIceCandidate(cand));
        }
        this.remoteCandidatesQueue = [];
      }
    } catch (err) {
      console.warn("[SellerPeer] Poll for answer failed (non-critical):", err);
    }
  }

  setupSignaling(roomId) {
    if (this.isDestroyed) return;

    console.log("[SellerPeer] Setting up signaling channel for room:", roomId);
    this.channel = supabase
      .channel(`webrtc-signaling-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "video_rooms",
          filter: `id=eq.${roomId}`,
        },
        async (payload) => {
          const room = payload.new;
          if (room.answer && this.peer && this.peer.signalingState !== "stable" && !this.isDestroyed) {
            try {
              console.log("[SellerPeer] SDP Answer received from viewer, setting remote description...");
              const rtcDesc = new RTCSessionDescription(room.answer);
              await this.peer.setRemoteDescription(rtcDesc);
              
              // Process any remote candidates that were queued
              this.remoteDescriptionSet = true;
              console.log(`[SellerPeer] Remote description set. Processing ${this.remoteCandidatesQueue.length} queued candidates...`);
              for (const cand of this.remoteCandidatesQueue) {
                await this.peer.addIceCandidate(new RTCIceCandidate(cand));
              }
              this.remoteCandidatesQueue = [];
            } catch (err) {
              console.error("[SellerPeer] Error setting remote description / ICE candidates:", err);
            }
          }
        }
      )
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
          if (sender === "viewer" && this.peer && !this.isDestroyed) {
            try {
              if (!this.remoteDescriptionSet) {
                console.log("[SellerPeer] Queueing remote candidate (answer not yet set)");
                this.remoteCandidatesQueue.push(candidate);
              } else {
                console.log("[SellerPeer] Remote candidate received, adding to peer connection");
                await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
              }
            } catch (err) {
              console.error("[SellerPeer] Error handling viewer ICE candidate:", err);
            }
          }
        }
      )
      .subscribe();
  }

  async renegotiate() {
    if (!this.peer || this.isDestroyed) return;
    
    console.log("[SellerPeer] Initiating renegotiation, generating new SDP Offer...");
    
    // Clear old answer so we can detect the new answer update
    this.remoteDescriptionSet = false;
    await supabase
      .from("video_rooms")
      .update({ answer: null })
      .eq("id", this.roomId);

    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);

    // Update the room's offer
    await supabase
      .from("video_rooms")
      .update({ offer })
      .eq("id", this.roomId);
  }

  async destroy() {
    if (this.isDestroyed) return;
    this.isDestroyed = true;
    console.log("[SellerPeer] Destroying seller session");

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
        console.log("[SellerPeer] Room deleted from DB:", this.roomId);
      } catch (err) {
        console.error("[SellerPeer] Failed to delete room on destroy:", err);
      }
      this.roomId = null;
    }
  }
}
