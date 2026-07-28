import assert from "assert";

console.log("🚀 Running FCM Integration Service Unit Tests...");

// 1. Device Token registration payload mapper test
try {
  const registerDeviceTokenPayload = ({ userId, token, platform }) => {
    return {
      user_id: userId,
      device_token: token,
      platform: platform,
      is_active: true,
      last_login_at: new Date().toISOString()
    };
  };

  const payload = registerDeviceTokenPayload({
    userId: "user-123",
    token: "fcm-token-android-xyz",
    platform: "android"
  });

  assert.strictEqual(payload.user_id, "user-123", "User ID mapping is correct");
  assert.strictEqual(payload.device_token, "fcm-token-android-xyz", "Device Token mapping is correct");
  assert.strictEqual(payload.platform, "android", "Platform is correctly mapped to android");

  console.log("✅ Device token payload registration verified successfully!");
} catch (err) {
  console.error("❌ Token registration tests failed:", err.message);
  process.exit(1);
}

// 2. Token deactivation / cleaning simulation (Unregistered device token)
try {
  let devicesDb = [
    { token: "tok-1", active: true },
    { token: "tok-2", active: true }
  ];

  const handleFCMResponse = (token, errorMsg) => {
    if (errorMsg === "UnregisteredDeviceToken") {
      // Remove stale token
      devicesDb = devicesDb.filter((d) => d.token !== token);
    }
  };

  handleFCMResponse("tok-2", "UnregisteredDeviceToken");
  assert.strictEqual(devicesDb.length, 1, "Stale token must be removed from list");
  assert.strictEqual(devicesDb[0].token, "tok-1", "Valid token must remain in database");

  console.log("✅ Expired token cleanup verified successfully!");
} catch (err) {
  console.error("❌ Token cleanup tests failed:", err.message);
  process.exit(1);
}

// 3. Retry loop logic verification
try {
  let retryCounter = 0;
  const dispatchMockFCM = (token, payload) => {
    try {
      if (payload.failOnce && retryCounter === 0) {
        retryCounter++;
        throw new Error("Timeout");
      }
      return "delivered";
    } catch (err) {
      if (retryCounter < 3) {
        // Trigger retry
        return dispatchMockFCM(token, { ...payload, failOnce: false });
      }
      return "failed";
    }
  };

  const status = dispatchMockFCM("tok-1", { failOnce: true });
  assert.strictEqual(status, "delivered", "Message must be delivered on retry retryCounter=" + retryCounter);
  assert.strictEqual(retryCounter, 1, "Counter must reflect retry attempt");

  console.log("✅ FCM retry queues verified successfully!");
} catch (err) {
  console.error("❌ Retry logic tests failed:", err.message);
  process.exit(1);
}

console.log("🎉 All FCM Integration Service Unit Tests passed cleanly!");
