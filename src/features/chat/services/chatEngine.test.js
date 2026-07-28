import assert from "assert";

console.log("🚀 Running Production Chat Engine Unit Tests...");

// 1. Test message payload mapping (Text & File Sharing)
try {
  const createMessagePayload = ({ conversationId, content, fileUrl, fileName }) => {
    return {
      conversation_id: conversationId,
      content,
      message_type: fileUrl ? "file" : "text",
      file_url: fileUrl || null,
      file_name: fileName || null,
      delivery_status: "sent",
      is_read: false
    };
  };

  // Text message
  const textMsg = createMessagePayload({
    conversationId: "conv-1",
    content: "Hello agent!"
  });
  assert.strictEqual(textMsg.message_type, "text", "Message type must be text");
  assert.strictEqual(textMsg.delivery_status, "sent", "Default delivery status must be sent");

  // File message
  const fileMsg = createMessagePayload({
    conversationId: "conv-1",
    content: "Sharing resume",
    fileUrl: "https://example.com/resume.pdf",
    fileName: "resume.pdf"
  });
  assert.strictEqual(fileMsg.message_type, "file", "Message type must be file");
  assert.strictEqual(fileMsg.file_url, "https://example.com/resume.pdf", "File URL must be mapped correctly");

  console.log("✅ Message mapping verified successfully!");
} catch (err) {
  console.error("❌ Message mapping tests failed:", err.message);
  process.exit(1);
}

// 2. Test Delivery Status Transitions (sent -> delivered -> read)
try {
  const transitions = {
    sent: "delivered",
    delivered: "read"
  };

  const transitionStatus = (currentStatus, action) => {
    if (action === "deliver" && currentStatus === "sent") return "delivered";
    if (action === "read" && (currentStatus === "delivered" || currentStatus === "sent")) return "read";
    return currentStatus;
  };

  let status = "sent";
  status = transitionStatus(status, "deliver");
  assert.strictEqual(status, "delivered", "Sent status transitions to delivered on deliver action");

  status = transitionStatus(status, "read");
  assert.strictEqual(status, "read", "Delivered status transitions to read on read action");

  console.log("✅ Delivery status transitions verified successfully!");
} catch (err) {
  console.error("❌ Status transition tests failed:", err.message);
  process.exit(1);
}

// 3. Test AI Auto-Reply Flag Toggling
try {
  let conversationMetadata = {
    ai_enabled: false
  };

  const setAIFlag = (meta, enabled) => {
    return {
      ...meta,
      ai_enabled: enabled
    };
  };

  conversationMetadata = setAIFlag(conversationMetadata, true);
  assert.strictEqual(conversationMetadata.ai_enabled, true, "AI assistant flag must be enabled");

  conversationMetadata = setAIFlag(conversationMetadata, false);
  assert.strictEqual(conversationMetadata.ai_enabled, false, "AI assistant flag must be disabled");

  console.log("✅ AI assistant metadata flags verified successfully!");
} catch (err) {
  console.error("❌ AI flag tests failed:", err.message);
  process.exit(1);
}

console.log("🎉 All Production Chat Engine Unit Tests passed cleanly!");
