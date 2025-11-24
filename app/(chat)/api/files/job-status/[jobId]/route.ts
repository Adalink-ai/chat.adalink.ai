import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getJob } from '@/features/upload-files/lib/job-store';
import type { Job } from '@/features/upload-files/model/types';
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const startTime = Date.now();
  console.log('[JOB STATUS API] 📥 Request received');

  const session = await auth();

  if (!session?.user?.id) {
    console.error('[JOB STATUS API] ❌ Unauthorized - no user session');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const { jobId } = resolvedParams;

    console.log('[JOB STATUS API] 🔍 Fetching job status:', {
      jobId,
      userId: session.user.id,
    });

    if (!jobId || typeof jobId !== 'string') {
      console.error('[JOB STATUS API] ❌ Invalid job ID:', jobId);
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    // Get job from store (in-memory for now, Redis in production)
    const job = getJob(jobId);

    if (job) {
      const duration = Date.now() - startTime;
      console.log('[JOB STATUS API] ✅ Job found:', {
        jobId,
        status: job.status,
        hasResult: !!job.result,
        hasError: !!job.error,
        completedAt: job.completedAt,
        cache: 'HIT',
        duration: `${duration}ms`,
        fullJob: JSON.stringify(job, null, 2),
      });

      return NextResponse.json(job, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Content-Type': 'application/json',
          'X-Job-Status': job.status,
          'X-Timestamp': Date.now().toString(), // Add timestamp to prevent caching
        },
      });
    }

    // Job not found - return 404
    const duration = Date.now() - startTime;
    console.log('[JOB STATUS API] ⚠️ Job not found:', {
      jobId,
      cache: 'MISS',
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      { error: 'Job not found' },
      {
        status: 404,
        headers: {
          'X-Cache': 'MISS',
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[JOB STATUS API] ❌ Error fetching job status:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get job status' },
      { status: 500 }
    );
  }
}


