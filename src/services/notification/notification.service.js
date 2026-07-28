import { supabase } from "@/config/supabase";
import { getUserDeviceTokens, deleteDeviceToken } from "@/services/device/deviceToken.service";
import { activeJobQueue } from "../jobs/jobQueue";

// Export Device Token utilities directly from notification service for unified Flutter API
export { 
  registerDeviceToken, 
  touchDeviceToken, 
  deactivateDeviceToken,
  deleteDeviceToken
} from "@/services/device/deviceToken.service";

/**
 * Fetch a user's notification preferences. If none exist, initializes defaults.
 */
export async function getNotificationPreferences(userId) {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.warn("getNotificationPreferences warning:", error.message);
    }

    if (data) return data;

    // Initialize default preferences
    const defaultPrefs = {
      user_id: userId,
      email_enabled: true,
      push_enabled: true,
      sms_enabled: false,
      in_app_enabled: true,
      categories: { alerts: true, marketing: false, consultations: true },
    };

    const { data: createdPrefs, error: createErr } = await supabase
      .from("notification_preferences")
      .insert(defaultPrefs)
      .select()
      .maybeSingle();

    if (createErr) {
      console.warn("getNotificationPreferences init warning:", createErr.message);
      return defaultPrefs;
    }

    return createdPrefs || defaultPrefs;
  } catch (err) {
    console.warn("getNotificationPreferences error:", err);
    return null;
  }
}

/**
 * Update a user's notification preferences
 */
export async function updateNotificationPreferences(userId, updates) {
  if (!userId) return null;

  try {
    const { data, error } = await supabase
      .from("notification_preferences")
      .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("updateNotificationPreferences error:", err);
    throw err;
  }
}

/**
 * Write a notification log for auditing purposes.
 */
export async function logNotification({ userId, notificationId = null, channel, status, recipient = null, errorMessage = null }) {
  try {
    const { data, error } = await supabase
      .from("notification_logs")
      .insert({
        user_id: userId,
        notification_id: notificationId,
        channel,
        status,
        recipient,
        error_message: errorMessage,
        sent_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (error) {
      console.warn("logNotification database log warning:", error.message);
    }
    return data;
  } catch (err) {
    console.warn("logNotification error:", err);
    return null;
  }
}

/**
 * Create an In-App notification record
 */
export async function createInAppNotification({ userId, title, body, type = "system", data = {} }) {
  try {
    const { data: notification, error } = await supabase
      .from("notifications")
      .insert({
        user_id: userId,
        title,
        body,
        type,
        data,
        is_read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    await logNotification({
      userId,
      notificationId: notification.id,
      channel: "in_app",
      status: "delivered",
      recipient: `User ID: ${userId}`,
    });

    return notification;
  } catch (err) {
    console.warn("createInAppNotification error:", err);
    return null;
  }
}

// Client-side deduplication cache
const recentDispatches = new Map();

function checkAndTrackDuplicate(key) {
  const now = Date.now();
  const lastTime = recentDispatches.get(key);
  if (lastTime && (now - lastTime) < 5000) {
    return true;
  }
  recentDispatches.set(key, now);
  // Auto-prune after 10s to prevent memory leaks
  setTimeout(() => recentDispatches.delete(key), 10000);
  return false;
}

/**
 * Send email notification via secure Deno Edge Function using SendGrid/SES
 */
export async function sendEmailNotification(userId, subject, body, emailAddress = null) {
  let recipientEmail = emailAddress;

  try {
    if (!recipientEmail) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", userId)
        .single();
      recipientEmail = profile?.email;
    }

    if (!recipientEmail) {
      throw new Error("Recipient email address could not be resolved.");
    }

    // Deduplicate identical calls within 5s
    const dupKey = `email:${recipientEmail}:${subject}:${body}`;
    if (checkAndTrackDuplicate(dupKey)) {
      console.info(`[Notification] Suppressed duplicate email dispatch: ${dupKey}`);
      return true;
    }

    // Invoke backend Edge Function securely (no secrets on client)
    const { data, error } = await supabase.functions.invoke("send-notification", {
      body: {
        channel: "email",
        recipient: recipientEmail,
        subject,
        message: body
      }
    });

    if (error) throw error;

    await logNotification({
      userId,
      channel: "email",
      status: "sent",
      recipient: recipientEmail,
    });

    return true;
  } catch (err) {
    console.warn("sendEmailNotification error:", err);
    await logNotification({
      userId,
      channel: "email",
      status: "failed",
      recipient: recipientEmail || "Unknown",
      errorMessage: err.message,
    });
    return false;
  }
}

/**
 * Send SMS notification via secure Deno Edge Function using Twilio
 */
export async function sendSMSNotification(userId, message, phoneNumber = null) {
  let recipientPhone = phoneNumber;

  try {
    if (!recipientPhone) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", userId)
        .single();
      recipientPhone = profile?.phone;
    }

    if (!recipientPhone) {
      throw new Error("Recipient phone number could not be resolved.");
    }

    // Deduplicate identical calls within 5s
    const dupKey = `sms:${recipientPhone}:${message}`;
    if (checkAndTrackDuplicate(dupKey)) {
      console.info(`[Notification] Suppressed duplicate SMS dispatch: ${dupKey}`);
      return true;
    }

    // Invoke backend Edge Function securely (no secrets on client)
    const { data, error } = await supabase.functions.invoke("send-notification", {
      body: {
        channel: "sms",
        recipient: recipientPhone,
        message
      }
    });

    if (error) throw error;

    await logNotification({
      userId,
      channel: "sms",
      status: "sent",
      recipient: recipientPhone,
    });

    return true;
  } catch (err) {
    console.warn("sendSMSNotification error:", err);
    await logNotification({
      userId,
      channel: "sms",
      status: "failed",
      recipient: recipientPhone || "Unknown",
      errorMessage: err.message,
    });
    return false;
  }
}

/**
 * Background retry wrapper for failed email deliveries (up to 3 attempts)
 */
export async function sendEmailWithRetry(userId, subject, body, emailAddress = null, attempt = 1) {
  const success = await sendEmailNotification(userId, subject, body, emailAddress);
  if (!success && attempt < 3) {
    const nextAttempt = attempt + 1;
    console.info(`[Notification] Scheduling email retry attempt ${nextAttempt} for user ${userId}`);
    activeJobQueue.add(`email-retry-${nextAttempt}`, { userId, subject, body, emailAddress, attempt: nextAttempt }, async (payload) => {
      await sendEmailWithRetry(payload.userId, payload.subject, payload.body, payload.emailAddress, payload.attempt);
    });
  }
}

/**
 * Background retry wrapper for failed SMS deliveries (up to 3 attempts)
 */
export async function sendSMSWithRetry(userId, message, phoneNumber = null, attempt = 1) {
  const success = await sendSMSNotification(userId, message, phoneNumber);
  if (!success && attempt < 3) {
    const nextAttempt = attempt + 1;
    console.info(`[Notification] Scheduling SMS retry attempt ${nextAttempt} for user ${userId}`);
    activeJobQueue.add(`sms-retry-${nextAttempt}`, { userId, message, phoneNumber, attempt: nextAttempt }, async (payload) => {
      await sendSMSWithRetry(payload.userId, payload.message, payload.phoneNumber, payload.attempt);
    });
  }
}

/**
 * Send simulated FCM Token Push Message to a single device (with retry & logging tracking)
 */
export async function sendFCMTokenMessage({
  userId,
  deviceToken,
  platform,
  notificationType,
  title,
  body,
  payload = {},
  retryCount = 0
}) {
  let logId = null;

  try {
    // 1. Create audit trace in public.notification_logs with status 'pending'
    const { data: logRecord, error: logErr } = await supabase
      .from("notification_logs")
      .insert({
        user_id: userId,
        device_token: deviceToken,
        notification_type: notificationType,
        title,
        body,
        payload,
        status: "pending",
        channel: "push",
        recipient: deviceToken,
        retry_count: retryCount
      })
      .select()
      .maybeSingle();

    if (logErr) throw logErr;
    logId = logRecord?.id;

    // 2. Mock FCM Request payload (simulating Android and iOS rules)
    console.info(`[FCM-Push] Dispatching payload to platform=${platform} token=${deviceToken.substring(0, 12)}...`);

    // Simulate transient network or invalid token behavior
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        // Trigger Unregistered Token error (stale tokens cleanup)
        if (payload?.simulate_invalid_token === true) {
          reject(new Error("UnregisteredDeviceToken"));
        }
        // Trigger Transient network failure
        else if (payload?.simulate_network_failure === true && retryCount < 2) {
          reject(new Error("Transient connection timeout"));
        }
        else {
          resolve();
        }
      }, 50);
    });

    // 3. Mark as successfully delivered
    if (logId) {
      await supabase
        .from("notification_logs")
        .update({
          status: "delivered",
          delivered_at: new Date().toISOString()
        })
        .eq("id", logId);
    }

    console.info(`[FCM-Push] Delivered successfully to token=${deviceToken.substring(0, 12)}`);
    return true;

  } catch (err) {
    console.warn(`[FCM-Push] Delivery failed: ${err.message}`);

    // Clean up stale invalid token
    if (err.message === "UnregisteredDeviceToken") {
      console.info(`[FCM-Push] Expired token detected. Deleting stale device: ${deviceToken}`);
      await deleteDeviceToken(deviceToken);
      
      if (logId) {
        await supabase
          .from("notification_logs")
          .update({
            status: "failed",
            error_message: "FCM token unregistered/expired. Stale device removed."
          })
          .eq("id", logId);
      }
      return false;
    }

    // Update log to failed
    if (logId) {
      await supabase
        .from("notification_logs")
        .update({
          status: "failed",
          error_message: err.message
        })
        .eq("id", logId);
    }

    // Retry failed notifications (max 3 times) using the active background Job Queue
    if (retryCount < 3) {
      const nextAttempt = retryCount + 1;
      console.info(`[FCM-Push] Scheduling retry attempt ${nextAttempt} for device token ${deviceToken.substring(0, 12)}`);
      
      activeJobQueue.add("fcm-retry", {
        userId,
        deviceToken,
        platform,
        notificationType,
        title,
        body,
        payload,
        retryCount: nextAttempt
      }, async (jobPayload) => {
        await sendFCMTokenMessage(jobPayload);
      });
    }

    return false;
  }
}

/**
 * Dispatch Push Notification using user's registered FCM device tokens (Flutter multiple device support)
 */
export async function sendPushNotification(userId, title, body, data = {}) {
  try {
    const devices = await getUserDeviceTokens(userId);

    if (!devices || devices.length === 0) {
      console.warn(`[FCM] No active device tokens found for user ${userId}`);
      return false;
    }

    const notificationType = data.type || "incoming_video_call";

    // Send push message to all active user device tokens (multiple devices)
    for (const dev of devices) {
      await sendFCMTokenMessage({
        userId,
        deviceToken: dev.device_token,
        platform: dev.platform, // android or ios
        notificationType,
        title,
        body,
        payload: data,
        retryCount: 0
      });
    }

    return true;
  } catch (err) {
    console.warn("sendPushNotification error:", err);
    return false;
  }
}

/**
 * Reusable high-level notification dispatcher (runs as background job)
 */
export async function dispatchNotification(params) {
  if (!params?.userId) return false;

  // Add dispatch to the background job queue (non-blocking)
  activeJobQueue.add("dispatch-notification", params, async (payload) => {
    await dispatchNotificationSync(payload);
  });

  return true; // Return immediately to prevent blocking requests
}

/**
 * Synchronous notification dispatcher worker
 */
export async function dispatchNotificationSync({
  userId,
  title,
  body,
  type = "system",
  data = {},
  channels = ["in_app", "email", "push"],
}) {
  if (!userId) return false;

  try {
    // 1. Fetch user preferences
    const prefs = await getNotificationPreferences(userId);

    // 2. Dispatch to In-App if enabled
    if (channels.includes("in_app") && (!prefs || prefs.in_app_enabled)) {
      await createInAppNotification({ userId, title, body, type, data });
    }

    // 3. Dispatch to Email if enabled
    if (channels.includes("email") && prefs?.email_enabled) {
      await sendEmailWithRetry(userId, title, body);
    }

    // 4. Dispatch to Push if enabled
    if (channels.includes("push") && prefs?.push_enabled) {
      await sendPushNotification(userId, title, body, { type, ...data });
    }

    // 5. Dispatch to SMS if enabled
    if (channels.includes("sms") && prefs?.sms_enabled) {
      await sendSMSWithRetry(userId, body);
    }

    return true;
  } catch (err) {
    console.warn("dispatchNotificationSync error:", err);
    return false;
  }
}

/**
 * Fetch all in-app notifications for a user
 */
export async function getInAppNotifications(userId, unreadOnly = false) {
  if (!userId) return [];

  try {
    let query = supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (unreadOnly) {
      query = query.eq("is_read", false);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.warn("getInAppNotifications error:", err);
    return [];
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId) {
  if (!notificationId) return null;

  try {
    const { data, error } = await supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", notificationId)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.warn("markAsRead error:", err);
    return null;
  }
}
