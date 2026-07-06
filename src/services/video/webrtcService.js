import { supabase } from "@/config/supabase";
import { RTC_CONFIGURATION } from "./constants";

export function createPeer() {
    return new RTCPeerConnection(RTC_CONFIGURATION);
}

export async function cleanOldRooms(shopId) {
    // Get room ids for this shop
    const { data: rooms } = await supabase
        .from("video_rooms")
        .select("id")
        .eq("shop_id", shopId);

    if (rooms && rooms.length > 0) {
        const ids = rooms.map((r) => r.id);
        // Delete candidates for these rooms
        await supabase.from("video_candidates").delete().in("room_id", ids);
        // Delete the rooms themselves
        await supabase.from("video_rooms").delete().in("id", ids);
    }
}

export async function createRoom(roomCode, shopId, sellerId, offer) {
    return supabase
        .from("video_rooms")
        .insert({
            room_code: roomCode,
            shop_id: shopId,
            seller_id: sellerId,
            status: "live",
            offer,
        })
        .select()
        .single();
}

export async function updateAnswer(roomCode, answer) {
    return supabase
        .from("video_rooms")
        .update({ answer })
        .eq("room_code", roomCode);
}

export async function getRoom(roomCode) {
    const { data } = await supabase
        .from("video_rooms")
        .select("*")
        .eq("room_code", roomCode)
        .eq("status", "live")
        .maybeSingle();

    return data;
}

export async function deleteRoom(roomId) {
    if (!roomId) return;
    await supabase.from("video_candidates").delete().eq("room_id", roomId);
    await supabase.from("video_rooms").delete().eq("id", roomId);
}

export async function addCandidate(roomId, sender, candidate) {
    return supabase.from("video_candidates").insert({
        room_id: roomId,
        sender,
        candidate,
    });
}