import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';

// Simple in-memory job store (replace with Redis in production)
// In production, this should use Redis or a database
const jobStore = new Map<string, any>();

// For now, we'll return a mock job status
// In production, this should fetch from Redis
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

    // Check in-memory store first (for testing)
    const cachedJob = jobStore.get(jobId);
    if (cachedJob) {
      const duration = Date.now() - startTime;
      console.log('[JOB STATUS API] ✅ Job found in cache:', {
        jobId,
        status: cachedJob.status,
        cache: 'HIT',
        duration: `${duration}ms`,
      });

      return NextResponse.json(cachedJob, {
        headers: {
          'X-Cache': 'HIT',
          'Cache-Control': 'private, max-age=5',
          'Content-Type': 'application/json',
          'X-Job-Status': cachedJob.status,
        },
      });
    }

    // TODO: In production, fetch from Redis:
    // const redisClient = getRedisClient();
    // const job = await redisClient.getJob(jobId);
    // if (!job) {
    //   return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    // }

    // For now, return a default pending status
    // The worker should update this job in Redis when processing completes
    const defaultJob = {
      id: jobId,
      status: 'pending' as const,
      fileName: '',
      fileSize: 0,
      fileType: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const duration = Date.now() - startTime;
    console.log('[JOB STATUS API] ⚠️ Job not found, returning default pending status:', {
      jobId,
      status: defaultJob.status,
      cache: 'MISS',
      duration: `${duration}ms`,
      note: 'Worker should update job status in Redis when processing completes',
    });

    return NextResponse.json(defaultJob, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=2',
        'Content-Type': 'application/json',
        'X-Job-Status': defaultJob.status,
      },
    });
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

// Export jobStore for potential updates from worker webhooks
export { jobStore };

