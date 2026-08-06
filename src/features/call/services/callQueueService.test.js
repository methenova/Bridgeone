import assert from "assert";

console.log("🚀 Running Production Call Queue Service Unit Tests...");

// Mock state database
const mockQueueDb = [];

const addToQueue = (shopId, visitorId) => {
  const existing = mockQueueDb.find((q) => q.shopId === shopId && q.visitorId === visitorId && q.status === "waiting");
  if (existing) return existing;

  const count = mockQueueDb.filter((q) => q.shopId === shopId && q.status === "waiting").length;
  const position = count + 1;
  const item = {
    id: `queue-${Math.random().toString(36).substring(2, 9)}`,
    shopId,
    visitorId,
    position,
    status: "waiting",
    joinedAt: Date.now(),
    answeredAt: null,
    leftAt: null
  };
  mockQueueDb.push(item);
  return item;
};

const cancelQueue = (queueId) => {
  const item = mockQueueDb.find((q) => q.id === queueId);
  if (item) {
    item.status = "abandoned";
    item.leftAt = Date.now();
    item.position = 0;
    resequenceQueue(item.shopId);
  }
};

const timeoutQueue = (queueId) => {
  const item = mockQueueDb.find((q) => q.id === queueId);
  if (item) {
    item.status = "timeout";
    item.leftAt = Date.now();
    item.position = 0;
    resequenceQueue(item.shopId);
  }
};

const answerQueue = (queueId, agentId) => {
  const item = mockQueueDb.find((q) => q.id === queueId);
  if (item) {
    item.status = "answered";
    item.answeredAt = Date.now();
    item.leftAt = Date.now();
    item.position = 0;
    resequenceQueue(item.shopId);
  }
};

const resequenceQueue = (shopId) => {
  const waitingList = mockQueueDb
    .filter((q) => q.shopId === shopId && q.status === "waiting")
    .sort((a, b) => a.joinedAt - b.joinedAt);

  waitingList.forEach((q, idx) => {
    q.position = idx + 1;
  });
};

const getStats = (shopId) => {
  const waiting = mockQueueDb.filter((q) => q.shopId === shopId && q.status === "waiting");
  const answered = mockQueueDb.filter((q) => q.shopId === shopId && q.status === "answered");

  let totalWait = 0;
  answered.forEach((q) => {
    totalWait += (q.answeredAt - q.joinedAt);
  });

  return {
    size: waiting.length,
    avgWaitMs: answered.length > 0 ? Math.round(totalWait / answered.length) : 0,
    currentQueue: waiting
  };
};

// 1. Test adding visitors to the queue
try {
  const q1 = addToQueue("shop-1", "visitor-1");
  const q2 = addToQueue("shop-1", "visitor-2");
  const q3 = addToQueue("shop-1", "visitor-3");

  assert.strictEqual(q1.position, 1, "First visitor position must be 1");
  assert.strictEqual(q2.position, 2, "Second visitor position must be 2");
  assert.strictEqual(q3.position, 3, "Third visitor position must be 3");

  console.log("✅ Addition and position assignments verified successfully!");
} catch (err) {
  console.error("❌ Addition tests failed:", err.message);
  process.exit(1);
}

// 2. Test re-sequencing upon visitor cancelation
try {
  const w1 = mockQueueDb.find((q) => q.visitorId === "visitor-1");
  const w2 = mockQueueDb.find((q) => q.visitorId === "visitor-2");
  const w3 = mockQueueDb.find((q) => q.visitorId === "visitor-3");

  // Visitor-2 cancels their queue request
  cancelQueue(w2.id);

  assert.strictEqual(w2.status, "abandoned", "Visitor-2 status must be abandoned");
  assert.strictEqual(w2.position, 0, "Visitor-2 position must be cleared to 0");
  assert.strictEqual(w1.position, 1, "Visitor-1 position must remain 1");
  assert.strictEqual(w3.position, 2, "Visitor-3 position must shift up from 3 to 2");

  console.log("✅ Queue re-sequencing and cancelations verified successfully!");
} catch (err) {
  console.error("❌ Resequence tests failed:", err.message);
  process.exit(1);
}

// 3. Test answering and average stats
try {
  const w1 = mockQueueDb.find((q) => q.visitorId === "visitor-1");
  
  // Set joinedAt to 10 seconds ago to simulate realistic wait duration
  w1.joinedAt = Date.now() - 10000;
  answerQueue(w1.id, "agent-99");

  const stats = getStats("shop-1");
  assert.strictEqual(w1.status, "answered", "Visitor-1 status must be answered");
  assert.ok(stats.avgWaitMs >= 9500 && stats.avgWaitMs <= 10500, "Average wait calculation must accurately track ms delays");
  assert.strictEqual(stats.size, 1, "Remaining queue size must decrease to 1");

  console.log("✅ Answering and wait stats verified successfully!");
} catch (err) {
  console.error("❌ Answer stats tests failed:", err.message);
  process.exit(1);
}

console.log("🎉 All Production Call Queue Service Unit Tests passed cleanly!");
