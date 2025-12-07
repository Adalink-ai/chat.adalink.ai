'use client';

import { atom } from 'jotai';
import type { Job } from './types';
import type { FileUIPart } from 'ai';

/**
 * Type for upload file job results
 * Array of completed jobs
 */
export type UploadFileJobResult = Job[];


/**
 * Atom to store upload file job results
 */
export const uploadFileJobResultAtom = atom<UploadFileJobResult>([
//    {
//    id:"c8179f20-0eec-480d-aa83-24264fa548f8",
//    status:"complete",
//    fileName:"Painel de Engajamento de Alunos.pdf",
//    fileSize:538142,
//    fileType:"application/pdf",
//    createdAt:"2025-11-24T19:05:13.833Z",
//    updatedAt:"2025-11-24T19:05:19.430Z",
//    metadata:{
//       originalFileName:"Painel de Engajamento de Alunos.pdf",
//       s3Key:"uploads/temp-uploads/c8179f20-0eec-480d-aa83-24264fa548f8/Painel de Engajamento de Alunos.pdf",
//       userId:"f90eb41e-b437-4cae-9d27-c31779a11b03"
//    },
//    result:{
//       fileName:"Painel de Engajamento de Alunos.pdf",
//       fileSize:538142,
//       fileType:"application/pdf",
//       fileUrl:"https://d174zueqw84ii9.cloudfront.net/uploads/temp-uploads/c8179f20-0eec-480d-aa83-24264fa548f8/Painel%20de%20Engajamento%20de%20Alunos.pdf",
//       s3Key:"uploads/temp-uploads/c8179f20-0eec-480d-aa83-24264fa548f8/Painel de Engajamento de Alunos.pdf",
//       provider:"zai",
//       ingestion:"fileId"
//    },
//    completedAt:"2025-11-24T19:05:19.429Z"
// }
]);

/**
 * Atom to get jobs as FileUIPart array for AI SDK
 * Only includes completed jobs with a valid fileUrl in result
 */
export const uploadFileJobResultAsFileUIPartsAtom = atom<FileUIPart[]>((get) => {
  const jobs = get(uploadFileJobResultAtom);
  
  return jobs
    .filter((job) => {
      // Only include completed jobs with a fileUrl or url
      return (
        job.status === 'complete' &&
        (job.result?.fileUrl || job.result?.url) &&
        typeof (job.result?.fileUrl || job.result?.url) === 'string'
      );
    })
    .map((job) => {
      const fileUrl = (job.result?.fileUrl || job.result?.url) as string;
      
      return {
        type: 'file' as const,
        mediaType: job.fileType || 'application/octet-stream',
        filename: job.fileName,
        url: fileUrl,
        providerMetadata: {
         provider: job.result?.provider,
         fileId: job.result?.fileId,
        },
      };
    });
});

/**
 * Atom to add a job to the uploadFileJobResultAtom
 * Usage: set(addJobAtom, job)
 */
export const addJobAtom = atom(
  null,
  (get, set, job: Job) => {
    const currentJobs = get(uploadFileJobResultAtom);
    // Check if job already exists (by id) to avoid duplicates
    const jobExists = currentJobs.some((j) => j.id === job.id);
    if (!jobExists) {
      set(uploadFileJobResultAtom, [...currentJobs, job]);
    }
  }
);

/**
 * Atom to remove a job from the uploadFileJobResultAtom
 * Usage: set(removeJobAtom, jobId)
 */
export const removeJobAtom = atom(
  null,
  (get, set, jobId: string) => {
    const currentJobs = get(uploadFileJobResultAtom);
    set(uploadFileJobResultAtom, currentJobs.filter((j) => j.id !== jobId));
  }
);

/**
 * Atom to update a job in the uploadFileJobResultAtom
 * Usage: set(updateJobAtom, { jobId, updates })
 */
export const updateJobAtom = atom(
  null,
  (get, set, { jobId, updates }: { jobId: string; updates: Partial<Job> }) => {
    const currentJobs = get(uploadFileJobResultAtom);
    set(
      uploadFileJobResultAtom,
      currentJobs.map((job) =>
        job.id === jobId ? { ...job, ...updates, updatedAt: new Date().toISOString() } : job
      )
    );
  }
);
