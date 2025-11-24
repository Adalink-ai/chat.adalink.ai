import 'server-only';

import type { Job } from '../model/types';

/**
 * In-memory job store
 * In production, replace with Redis or database
 */
const jobStore = new Map<string, Job>();

/**
 * Get job by ID
 */
export function getJob(jobId: string): Job | undefined {
  const job = jobStore.get(jobId);
  console.log('[JOB STORE] 🔍 Getting job:', {
    jobId,
    found: !!job,
    storeSize: jobStore.size,
    availableJobIds: Array.from(jobStore.keys()),
  });
  return job;
}

/**
 * Create or update job
 */
export function setJob(job: Job): void {
  console.log('[JOB STORE] 📝 Setting job:', {
    jobId: job.id,
    status: job.status,
    storeSize: jobStore.size,
  });
  jobStore.set(job.id, job);
  console.log('[JOB STORE] ✅ Job set, new store size:', jobStore.size);
}

/**
 * Update job fields
 */
export function updateJob(jobId: string, updates: Partial<Job>): void {
  console.log('[JOB STORE] 🔄 Updating job:', {
    jobId,
    updates,
    storeSize: jobStore.size,
    existingJobIds: Array.from(jobStore.keys()),
  });

  const existingJob = jobStore.get(jobId);
  if (!existingJob) {
    console.error('[JOB STORE] ❌ Job not found for update:', {
      jobId,
      availableJobs: Array.from(jobStore.keys()),
      storeSize: jobStore.size,
    });
    throw new Error(`Job ${jobId} not found`);
  }

  const updatedJob: Job = {
    ...existingJob,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  jobStore.set(jobId, updatedJob);
  console.log('[JOB STORE] ✅ Job updated:', {
    jobId,
    newStatus: updatedJob.status,
    storeSize: jobStore.size,
  });
}

/**
 * Delete job
 */
export function deleteJob(jobId: string): void {
  jobStore.delete(jobId);
}

/**
 * Get all jobs (for debugging)
 */
export function getAllJobs(): Job[] {
  return Array.from(jobStore.values());
}

// Export jobStore for direct access if needed
export { jobStore };

