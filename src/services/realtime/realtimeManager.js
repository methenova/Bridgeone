import { supabase } from "@/config/supabase";

/**
 * Singleton RealtimeManager Service
 * Centralizes Supabase Realtime channel subscriptions, reference counting,
 * channel deduplication, safe cleanup, and automatic reconnection.
 */
class RealtimeManager {
  constructor() {
    this.channels = new Map(); // topic => { channel, refCount, status }
  }

  /**
   * Get or create a deduplicated Supabase channel by topic name.
   * Increments reference count for safe shared lifecycle management.
   */
  getOrCreateChannel(topic, config = {}) {
    if (this.channels.has(topic)) {
      const entry = this.channels.get(topic);
      entry.refCount += 1;
      console.log(`[RealtimeManager] Reusing existing channel for topic "${topic}" (refCount: ${entry.refCount})`);
      return entry.channel;
    }

    console.log(`[RealtimeManager] Creating new channel for topic "${topic}"`);
    const channel = supabase.channel(topic, config);
    const entry = {
      channel,
      refCount: 1,
      status: "INIT",
    };

    this.channels.set(topic, entry);
    return channel;
  }

  /**
   * Subscribes to a channel topic with reference counting and automatic status tracking.
   */
  subscribe(topic, config = {}, onStatusChange = null) {
    const channel = this.getOrCreateChannel(topic, config);
    const entry = this.channels.get(topic);

    if (entry.status !== "SUBSCRIBED" && entry.status !== "SUBSCRIBING") {
      entry.status = "SUBSCRIBING";
      channel.subscribe((status, err) => {
        entry.status = status;
        console.log(`[RealtimeManager] Channel "${topic}" status:`, status);
        if (err) {
          console.warn(`[RealtimeManager] Channel "${topic}" error:`, err);
        }
        if (onStatusChange) {
          onStatusChange(status, err);
        }
      });
    }

    return channel;
  }

  /**
   * Decrements reference count and safely removes the channel when refCount reaches 0.
   */
  unsubscribe(topic) {
    if (!this.channels.has(topic)) return;

    const entry = this.channels.get(topic);
    entry.refCount -= 1;
    console.log(`[RealtimeManager] Unsubscribing from topic "${topic}" (remaining refCount: ${entry.refCount})`);

    if (entry.refCount <= 0) {
      console.log(`[RealtimeManager] Cleaning up channel for topic "${topic}"`);
      try {
        supabase.removeChannel(entry.channel);
      } catch (err) {
        console.warn(`[RealtimeManager] Failed to remove channel "${topic}":`, err);
      }
      this.channels.delete(topic);
    }
  }

  /**
   * Removes all active realtime channels (useful during logout or app teardown).
   */
  destroyAll() {
    console.log("[RealtimeManager] Destroying all active channels...");
    for (const [topic, entry] of this.channels.entries()) {
      try {
        supabase.removeChannel(entry.channel);
      } catch (err) {
        console.warn(`[RealtimeManager] Cleanup error for topic "${topic}":`, err);
      }
    }
    this.channels.clear();
  }
}

export const realtimeManager = new RealtimeManager();
