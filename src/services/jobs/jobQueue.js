/**
 * Background Job Queue Service
 * Implements a memory-backed asynchronous queue.
 * Designed to mirror the BullMQ API, making it easy to swap with Redis/BullMQ.
 */
export class JobQueue {
  constructor() {
    this.jobs = [];
    this.isProcessing = false;
  }

  /**
   * Add a job to the queue.
   * 
   * @param {string} name - Job descriptor name
   * @param {object} payload - Job payload parameters
   * @param {function} handler - Asynchronous function containing the execution logic
   * @returns {Promise<object>} Returns the queued job object representation
   */
  async add(name, payload, handler) {
    const job = {
      id: `job_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`,
      name,
      payload,
      handler,
      status: "queued",
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      failedAt: null,
      error: null
    };

    this.jobs.push(job);
    console.info(`[JobQueue] Queued job: ${name} (ID: ${job.id})`);

    // Run execution out of current event-loop tick (non-blocking)
    setTimeout(() => this.processQueue(), 0);

    return job;
  }

  /**
   * Process all queued jobs sequentially.
   */
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      while (this.jobs.some((j) => j.status === "queued")) {
        const job = this.jobs.find((j) => j.status === "queued");
        if (!job) break;

        job.status = "processing";
        job.startedAt = new Date().toISOString();
        console.info(`[JobQueue] Processing job: ${job.name} (ID: ${job.id})`);

        try {
          await job.handler(job.payload);
          job.status = "completed";
          job.completedAt = new Date().toISOString();
          console.info(`[JobQueue] Completed job: ${job.name} (ID: ${job.id})`);
        } catch (err) {
          job.status = "failed";
          job.failedAt = new Date().toISOString();
          job.error = err?.message || String(err);
          console.error(`[JobQueue] Failed job: ${job.name} (ID: ${job.id}) - Error:`, err);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Retrieve active jobs list.
   */
  getJobs() {
    return this.jobs;
  }

  /**
   * Retrieve job status by ID.
   */
  getJob(jobId) {
    return this.jobs.find((j) => j.id === jobId) || null;
  }

  /**
   * Clear all jobs history.
   */
  clear() {
    this.jobs = [];
    this.isProcessing = false;
  }
}

// Global active queue instance
export const activeJobQueue = new JobQueue();
