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
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const { jobId } = resolvedParams;

    if (!jobId || typeof jobId !== 'string') {
      return NextResponse.json(
        { error: 'Invalid job ID' },
        { status: 400 }
      );
    }

    // Check in-memory store first (for testing)
    const cachedJob = jobStore.get(jobId);
    if (cachedJob) {
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

    return NextResponse.json(defaultJob, {
      headers: {
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=2',
        'Content-Type': 'application/json',
        'X-Job-Status': defaultJob.status,
      },
    });
  } catch (error) {
    console.error('Job status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get job status' },
      { status: 500 }
    );
  }
}

// Export jobStore for potential updates from worker webhooks
export { jobStore };

