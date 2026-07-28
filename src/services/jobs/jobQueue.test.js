import assert from "assert";
import { JobQueue } from "./jobQueue.js";

console.log("🚀 Running Job Queue Unit Tests...");

// 1. Test basic asynchronous queue execution
try {
  const queue = new JobQueue();
  let executionCount = 0;
  let receivedPayload = null;

  const jobPromise = queue.add("test-job-1", { foo: "bar" }, async (payload) => {
    executionCount++;
    receivedPayload = payload;
  });

  // Verify non-blocking queue return
  assert.strictEqual(executionCount, 0, "Job must not execute synchronously");
  
  jobPromise.then((job) => {
    assert.strictEqual(job.name, "test-job-1", "Queued job name mismatch");
    assert.strictEqual(job.status, "queued", "Job status must initialize as queued");

    // Wait for the async macro-task worker loop to complete execution
    setTimeout(() => {
      try {
        const finishedJob = queue.getJob(job.id);
        assert.strictEqual(executionCount, 1, "Job handler should have run exactly once");
        assert.strictEqual(receivedPayload.foo, "bar", "Job payload parameter mismatch");
        assert.strictEqual(finishedJob.status, "completed", "Job status must transition to completed");
        assert.ok(finishedJob.completedAt, "Job completion timestamp missing");

        console.log("✅ Basic asynchronous queue execution checks passed!");
      } catch (innerErr) {
        console.error("❌ Asynchronous queue assertion failed:", innerErr.message);
        process.exit(1);
      }
    }, 50);
  });

} catch (err) {
  console.error("❌ Basic queue tests failed:", err.message);
  process.exit(1);
}

// 2. Test failed job error captures
try {
  const queue = new JobQueue();

  queue.add("test-failing-job", {}, async () => {
    throw new Error("Simulated job failure");
  }).then((job) => {
    setTimeout(() => {
      try {
        const failedJob = queue.getJob(job.id);
        assert.strictEqual(failedJob.status, "failed", "Failing job status must transition to failed");
        assert.strictEqual(failedJob.error, "Simulated job failure", "Job error message missing");
        assert.ok(failedJob.failedAt, "Job failure timestamp missing");

        console.log("✅ Failed job error capture checks passed!");
      } catch (innerErr) {
        console.error("❌ Failed job assertion failed:", innerErr.message);
        process.exit(1);
      }
    }, 50);
  });

} catch (err) {
  console.error("❌ Failed queue tests failed:", err.message);
  process.exit(1);
}
