import assert from "assert";

console.log("🚀 Running Call State Machine Unit Tests...");

// Declarative transition table
const Transitions = {
  ringing: {
    accept: "connected",
    reject: "rejected",
    busy: "busy",
    timeout: "timeout",
    cancel: "canceled",
    missed: "missed"
  },
  connected: {
    hangup: "completed",
    fail: "failed"
  },
  waiting: {
    ringing: "ringing",
    cancel: "canceled"
  }
};

const transitionState = (currentState, action) => {
  const allowed = Transitions[currentState];
  if (!allowed || !allowed[action]) {
    throw new Error(`Invalid transition action '${action}' from state '${currentState}'`);
  }
  return allowed[action];
};

// 1. Verify ringing allowed transitions
try {
  assert.strictEqual(transitionState("ringing", "accept"), "connected", "ringing + accept -> connected");
  assert.strictEqual(transitionState("ringing", "reject"), "rejected", "ringing + reject -> rejected");
  assert.strictEqual(transitionState("ringing", "busy"), "busy", "ringing + busy -> busy");
  assert.strictEqual(transitionState("ringing", "timeout"), "timeout", "ringing + timeout -> timeout");
  assert.strictEqual(transitionState("ringing", "cancel"), "canceled", "ringing + cancel -> canceled");
  assert.strictEqual(transitionState("ringing", "missed"), "missed", "ringing + missed -> missed");

  console.log("✅ Ringing allowed actions validated successfully!");
} catch (err) {
  console.error("❌ Ringing transitions failed:", err.message);
  process.exit(1);
}

// 2. Verify connected transitions
try {
  assert.strictEqual(transitionState("connected", "hangup"), "completed", "connected + hangup -> completed");
  assert.strictEqual(transitionState("connected", "fail"), "failed", "connected + fail -> failed");

  console.log("✅ Connected actions validated successfully!");
} catch (err) {
  console.error("❌ Connected transitions failed:", err.message);
  process.exit(1);
}

// 3. Verify blocked / invalid transitions
try {
  assert.throws(
    () => transitionState("connected", "reject"),
    /Invalid transition action/,
    "Reject should be blocked from connected state"
  );
  assert.throws(
    () => transitionState("rejected", "accept"),
    /Invalid transition action/,
    "Accept should be blocked from rejected state"
  );

  console.log("✅ Invalid/illegal actions rejected successfully!");
} catch (err) {
  console.error("❌ Invalid transition enforcement failed:", err.message);
  process.exit(1);
}

console.log("🎉 All Call State Machine Unit Tests passed cleanly!");
