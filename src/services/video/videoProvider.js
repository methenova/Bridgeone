import { supabase } from "../../config/supabase";

/**
 * 1. SIGNALING LAYER ABSTRACTION
 */
export class SignalingService {
  async sendSignal(roomCode, signalType, payload) {
    throw new Error("sendSignal() not implemented");
  }
  subscribeToSignals(roomCode, onSignal) {
    throw new Error("subscribeToSignals() not implemented");
  }
  unsubscribeFromSignals(roomCode) {
    throw new Error("unsubscribeFromSignals() not implemented");
  }
}

export class WebRTCSignaling extends SignalingService {
  async sendSignal(roomCode, signalType, payload) {
    // In WebRTC, signals are candidates or answer updates via Supabase
    return { success: true };
  }
  subscribeToSignals(roomCode, onSignal) {
    console.log(`[WebRTCSignaling] Subscribed to signals for room: ${roomCode}`);
  }
  unsubscribeFromSignals(roomCode) {
    console.log(`[WebRTCSignaling] Unsubscribed from room: ${roomCode}`);
  }
}

export class LiveKitSignaling extends SignalingService {
  async sendSignal(roomCode, signalType, payload) {
    console.log(`[LiveKitSignaling] Sending ${signalType} for room: ${roomCode}`);
    return { success: true };
  }
  subscribeToSignals(roomCode, onSignal) {
    console.log(`[LiveKitSignaling] Subscribed to LiveKit room: ${roomCode}`);
  }
  unsubscribeFromSignals(roomCode) {
    console.log(`[LiveKitSignaling] Unsubscribed from LiveKit room: ${roomCode}`);
  }
}

/**
 * 2. MEDIA LAYER ABSTRACTION
 */
export class MediaService {
  async getLocalStream(deviceId = "") {
    const constraints = {
      video: deviceId ? { deviceId: { exact: deviceId } } : true,
      audio: true,
    };
    return navigator.mediaDevices.getUserMedia(constraints);
  }

  stopStream(stream) {
    if (!stream) return;
    stream.getTracks().forEach((track) => track.stop());
  }

  async getVideoDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((d) => d.kind === "videoinput");
  }
}

/**
 * 3. ROOM MANAGEMENT ABSTRACTION
 */
export class RoomManager {
  async createRoom(roomCode, shopId, agentId, options = {}) {
    throw new Error("createRoom() not implemented");
  }
  async joinRoom(roomCode, participantId, options = {}) {
    throw new Error("joinRoom() not implemented");
  }
  async leaveRoom(roomCode, participantId) {
    throw new Error("leaveRoom() not implemented");
  }
  async endRoom(roomCode) {
    throw new Error("endRoom() not implemented");
  }
}

export class WebRTCRoomManager extends RoomManager {
  async createRoom(roomCode, shopId, agentId, options = {}) {
    const offer = options.offer;
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      const apiKey = window.BridgeOneShopApiKey || "";
      const { data, error } = await supabase.functions.invoke("guest-gateway", {
        body: {
          action: "create_room",
          shopId,
          apiKey,
          roomCode,
          sellerId: agentId,
          offer
        }
      });
      if (error) {
        console.warn("[WebRTCRoomManager] guest-gateway invoke warning:", error);
        return { data: null, error };
      }
      return { data, error: null };
    }

    return supabase
      .from("video_rooms")
      .insert({
        room_code: roomCode,
        shop_id: shopId,
        agent_id: agentId,
        status: "waiting",
        offer
      })
      .select()
      .single();
  }

  async joinRoom(roomCode, participantId, options = {}) {
    const { answer } = options;
    if (answer) {
      return supabase
        .from("video_rooms")
        .update({ answer })
        .eq("room_code", roomCode);
    }

    const { data, error } = await supabase
      .from("video_rooms")
      .select("*")
      .eq("room_code", roomCode)
      .in("status", ["waiting", "ringing", "connected"])
      .maybeSingle();

    return { data, error };
  }

  async leaveRoom(roomCode, participantId) {
    console.log(`[WebRTCRoomManager] Participant ${participantId} left room ${roomCode}`);
    return { success: true };
  }

  async endRoom(roomCode) {
    if (!roomCode) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      const apiKey = window.BridgeOneShopApiKey || "";
      const shopId = window.BridgeOneShopId || "";
      return supabase.functions.invoke("guest-gateway", {
        body: {
          action: "delete_room",
          shopId,
          apiKey,
          roomId: roomCode
        }
      });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(roomCode);
    
    if (isUuid) {
      await supabase.from("video_candidates").delete().eq("room_id", roomCode);
      await supabase.from("video_rooms").delete().eq("id", roomCode);
    } else {
      const { data: room } = await supabase
        .from("video_rooms")
        .select("id")
        .eq("room_code", roomCode)
        .maybeSingle();

      if (room) {
        await supabase.from("video_candidates").delete().eq("room_id", room.id);
        await supabase.from("video_rooms").delete().eq("id", room.id);
      }
    }
    return { success: true };
  }
}

export class LiveKitRoomManager extends RoomManager {
  async createRoom(roomCode, shopId, agentId, options = {}) {
    console.log(`[LiveKitRoomManager] Creating room: ${roomCode}`);
    return {
      data: {
        id: `lk_room_${Math.random().toString(36).substring(2, 9)}`,
        room_code: roomCode,
        shop_id: shopId,
        agent_id: agentId,
        status: "waiting",
        provider: "livekit"
      },
      error: null
    };
  }

  async joinRoom(roomCode, participantId, options = {}) {
    console.log(`[LiveKitRoomManager] Joining room: ${roomCode}`);
    return {
      data: {
        room_code: roomCode,
        status: "connected",
        provider: "livekit"
      },
      error: null
    };
  }

  async leaveRoom(roomCode, participantId) {
    console.log(`[LiveKitRoomManager] Participant left room: ${roomCode}`);
    return { success: true };
  }

  async endRoom(roomCode) {
    console.log(`[LiveKitRoomManager] Ending room: ${roomCode}`);
    return { success: true };
  }
}

/**
 * 4. PARTICIPANT MANAGEMENT ABSTRACTION
 */
export class ParticipantManager {
  trackParticipant(participantId, metadata) {
    throw new Error("trackParticipant() not implemented");
  }
  getParticipantDetails(participantId) {
    throw new Error("getParticipantDetails() not implemented");
  }
}

export class WebRTCParticipantManager extends ParticipantManager {
  trackParticipant(participantId, metadata) {
    console.log(`[WebRTCParticipant] Tracking ${participantId}`);
  }
  getParticipantDetails(participantId) {
    return { id: participantId, role: "peer" };
  }
}

export class LiveKitParticipantManager extends ParticipantManager {
  trackParticipant(participantId, metadata) {
    console.log(`[LiveKitParticipant] Tracking ${participantId} on LiveKit server`);
  }
  getParticipantDetails(participantId) {
    return { id: participantId, role: "livekit_participant" };
  }
}

/**
 * Base Video Provider Interface describing standard methods.
 */
export class VideoProviderInterface {
  async createRoom(roomCode, shopId, agentId, options = {}) {
    throw new Error("createRoom() not implemented");
  }

  async joinRoom(roomCode, participantId, options = {}) {
    throw new Error("joinRoom() not implemented");
  }

  async leaveRoom(roomCode, participantId) {
    throw new Error("leaveRoom() not implemented");
  }

  async endRoom(roomCode) {
    throw new Error("endRoom() not implemented");
  }

  async generateAccessToken(roomCode, participantId, identity, options = {}) {
    throw new Error("generateAccessToken() not implemented");
  }
}

/**
 * Abstraction layer combining Room, Signaling, Media, and Participant Services.
 */
export class BaseVideoProvider extends VideoProviderInterface {
  constructor(signalingService, mediaService, roomManager, participantManager) {
    super();
    this.signaling = signalingService;
    this.media = mediaService;
    this.room = roomManager;
    this.participant = participantManager;
  }

  async createRoom(roomCode, shopId, agentId, options = {}) {
    return this.room.createRoom(roomCode, shopId, agentId, options);
  }

  async joinRoom(roomCode, participantId, options = {}) {
    return this.room.joinRoom(roomCode, participantId, options);
  }

  async leaveRoom(roomCode, participantId) {
    return this.room.leaveRoom(roomCode, participantId);
  }

  async endRoom(roomCode) {
    return this.room.endRoom(roomCode);
  }
}

/**
 * WebRTC Implementation (Supabase DB Signaling + Room Management)
 */
export class WebRTCProvider extends BaseVideoProvider {
  constructor() {
    super(
      new WebRTCSignaling(),
      new MediaService(),
      new WebRTCRoomManager(),
      new WebRTCParticipantManager()
    );
  }

  async generateAccessToken(roomCode, participantId, identity, options = {}) {
    return { token: `mock_webrtc_token_${roomCode}_${participantId}` };
  }
}

/**
 * LiveKit Implementation
 */
export class LiveKitProvider extends BaseVideoProvider {
  constructor() {
    super(
      new LiveKitSignaling(),
      new MediaService(),
      new LiveKitRoomManager(),
      new LiveKitParticipantManager()
    );
  }

  async generateAccessToken(roomCode, participantId, identity, options = {}) {
    console.log(`[LiveKitProvider] Generating access token for ${identity} in room ${roomCode}`);
    return { token: `lk_jwt_token_placeholder_for_${identity}` };
  }
}

// Factory Selector
const providerType = (typeof import.meta !== "undefined" && import.meta.env?.VITE_VIDEO_PROVIDER) || "webrtc";

let selectedProvider;
if (providerType === "livekit") {
  selectedProvider = new LiveKitProvider();
} else {
  selectedProvider = new WebRTCProvider();
}

export { selectedProvider as VideoProvider };
