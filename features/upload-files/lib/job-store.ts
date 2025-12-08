import 'server-only';

import type { Job } from '../model/types';

/**
 * In-memory job store
 * In production, replace with Redis or database
 * 
 * Using globalThis to persist across hot reloads in development
 */
declare global {
  // eslint-disable-next-line no-var
  var __jobStore: Map<string, Job> | undefined;
}

const getJobStore = (): Map<string, Job> => {
  if (!global.__jobStore) {
    console.log('[JOB STORE] 🆕 Initializing new job store');
    global.__jobStore = new Map<string, Job>();
  } else {
    console.log('[JOB STORE] ♻️ Using existing job store, size:', global.__jobStore.size);
  }
  return global.__jobStore;
};

/**
 * Get job by ID
 */
export function getJob(jobId: string): Job | undefined {
  // Ensure we're using the global store
  const store = getJobStore();
  const job = store.get(jobId);
  console.log('[JOB STORE] 🔍 Getting job:', {
    jobId,
    found: !!job,
    storeSize: store.size,
    availableJobIds: Array.from(store.keys()),
    isGlobalStore: store === global.__jobStore,
  });
  return job;
}

/**
 * Create or update job
 */
export function setJob(job: Job): void {
  // Ensure we're using the global store
  const store = getJobStore();
  console.log('[JOB STORE] 📝 Setting job:', {
    jobId: job.id,
    status: job.status,
    storeSize: store.size,
    isGlobalStore: store === global.__jobStore,
  });
  store.set(job.id, job);
  console.log('[JOB STORE] ✅ Job set, new store size:', store.size);
  
  // Verify the job was actually stored
  const verify = store.get(job.id);
  if (!verify) {
    console.error('[JOB STORE] ❌ Job was not stored correctly!');
  } else {
    console.log('[JOB STORE] ✅ Job verified in store');
  }
}

/**
 * Update job fields
 */
export function updateJob(jobId: string, updates: Partial<Job>): void {
  // Ensure we're using the global store
  const store = getJobStore();
  console.log('[JOB STORE] 🔄 Updating job:', {
    jobId,
    updates,
    storeSize: store.size,
    existingJobIds: Array.from(store.keys()),
    isGlobalStore: store === global.__jobStore,
  });

  const existingJob = store.get(jobId);
  if (!existingJob) {
    console.error('[JOB STORE] ❌ Job not found for update:', {
      jobId,
      availableJobs: Array.from(store.keys()),
      storeSize: store.size,
    });
    throw new Error(`Job ${jobId} not found`);
  }

  const updatedJob: Job = {
    ...existingJob,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  store.set(jobId, updatedJob);
  console.log('[JOB STORE] ✅ Job updated:', {
    jobId,
    newStatus: updatedJob.status,
    storeSize: store.size,
  });
}

/**
 * Delete job
 */
export function deleteJob(jobId: string): void {
  const store = getJobStore();
  store.delete(jobId);
}

/**
 * Get all jobs (for debugging)
 */
export function getAllJobs(): Job[] {
  const store = getJobStore();
  return Array.from(store.values());
}

// Export getJobStore for direct access if needed
export { getJobStore };

