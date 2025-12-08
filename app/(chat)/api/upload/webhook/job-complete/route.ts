import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  verifyWebhookSignature,
  isAllowedIP,
  getClientIP,
} from '@/features/upload-files/lib/webhook-auth';
import {
  AuthenticationError,
  ValidationError,
  ERROR_MESSAGES,
} from '@/features/upload-files/lib/webhook-errors';
import { getJob, updateJob, getAllJobs } from '@/features/upload-files/lib/job-store';
import type { JobStatus } from '@/features/upload-files/model/types';

/**
 * Schema for webhook payload validation
 */
const WebhookPayloadSchema = z.object({
  jobId: z.string().uuid('Invalid job ID format'),
  status: z.enum(['pending', 'processing', 'complete', 'error']),
  result: z.record(z.any()).nullable().optional(), // Allow null or undefined
  error: z.string().nullable().optional(), // Allow null or undefined
  timestamp: z.string().datetime('Invalid timestamp format').optional(), // Optional - will be generated if missing
  signature: z.string().min(64, 'Signature must be at least 64 characters').optional(), // Optional - HMAC verification skipped if missing
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log('[WEBHOOK] 📥 Webhook request received');

  try {
    // ============================================
    // CAMADA 1: Verificação de IP
    // ============================================
    const clientIP = getClientIP(request);
    console.log('[WEBHOOK] 🔍 Client IP:', clientIP);

    if (!isAllowedIP(clientIP)) {
      console.error('[WEBHOOK] ❌ IP not allowed:', clientIP);
      throw new AuthenticationError(ERROR_MESSAGES.INVALID_IP);
    }
    console.log('[WEBHOOK] ✅ IP verified');

    // ============================================
    // CAMADA 2: Header Secret
    // ============================================
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (!webhookSecret || webhookSecret.length < 32) {
      console.error('[WEBHOOK] ❌ WEBHOOK_SECRET not configured or too short');
      throw new Error('Webhook secret not configured');
    }

    const providedSecret = request.headers.get('x-webhook-secret');
    if (!providedSecret || providedSecret !== webhookSecret) {
      console.error('[WEBHOOK] ❌ Invalid webhook secret');
      throw new AuthenticationError(ERROR_MESSAGES.WEBHOOK_AUTH_FAILED);
    }
    console.log('[WEBHOOK] ✅ Header secret verified');

    // ============================================
    // CAMADA 3: Assinatura HMAC
    // ============================================
    const body = await request.text();
    let payload: any;

    try {
      payload = JSON.parse(body);
    } catch {
      console.error('[WEBHOOK] ❌ Invalid JSON payload');
      throw new ValidationError('Invalid JSON payload');
    }

    const validationResult = WebhookPayloadSchema.safeParse(payload);
    if (!validationResult.success) {
      console.error('[WEBHOOK] ❌ Payload validation failed:', validationResult.error.flatten());
      throw new ValidationError('Invalid webhook payload', validationResult.error.flatten());
    }

    const { jobId, status, result, error, signature, timestamp } = validationResult.data;

    // Generate timestamp if not provided
    const payloadTimestamp = timestamp || new Date().toISOString();

    // Verify HMAC signature if provided (optional for now if worker doesn't implement it yet)
    if (signature) {
      // Remove signature from payload before verifying
      const payloadWithoutSignature = JSON.stringify({
        jobId,
        status,
        result,
        error,
        timestamp: payloadTimestamp,
      });

      if (!verifyWebhookSignature(payloadWithoutSignature, signature, webhookSecret)) {
        console.error('[WEBHOOK] ❌ Invalid webhook signature');
        throw new AuthenticationError(ERROR_MESSAGES.INVALID_SIGNATURE);
      }
      console.log('[WEBHOOK] ✅ HMAC signature verified');
    } else {
      console.warn('[WEBHOOK] ⚠️ No HMAC signature provided - skipping signature verification');
      console.warn('[WEBHOOK] ⚠️ Consider implementing HMAC signature in worker for better security');
    }

    // ============================================
    // Validação do Job
    // ============================================
    console.log('[WEBHOOK] 🔍 Looking for job:', jobId);
    const existingJob = getJob(jobId);

    if (!existingJob) {
      console.warn(`[WEBHOOK] ⚠️ Job not found: ${jobId}`);
      console.log('[WEBHOOK] 🔍 Available jobs in store:', {
        count: getAllJobs().length,
        jobIds: getAllJobs().map(j => j.id),
      });
      return NextResponse.json(
        { success: false, error: ERROR_MESSAGES.JOB_NOT_FOUND },
        { status: 404 },
      );
    }

    console.log('[WEBHOOK] ✅ Job found:', {
      jobId,
      currentStatus: existingJob.status,
      newStatus: status,
      existingJob: JSON.stringify(existingJob, null, 2),
    });

    // ============================================
    // Atualização do Job
    // ============================================
    const completedStatuses: JobStatus[] = ['complete', 'error'];
    const updates: Partial<typeof existingJob> = {
      status: status as JobStatus,
      result: result ?? undefined, // Convert null to undefined
      error: error ?? undefined, // Convert null to undefined
      updatedAt: new Date().toISOString(),
    };

    if (completedStatuses.includes(status as JobStatus)) {
      // Add completedAt timestamp for completed jobs
      updates.completedAt = new Date().toISOString();
    }

    console.log('[WEBHOOK] 🔄 Updating job with:', {
      jobId,
      updates: JSON.stringify(updates, null, 2),
    });

    try {
      updateJob(jobId, updates);
      
      // Verify the update worked
      const updatedJob = getJob(jobId);
      console.log('[WEBHOOK] ✅ Job updated successfully:', {
        jobId,
        newStatus: updatedJob?.status,
        hasResult: !!updatedJob?.result,
        hasError: !!updatedJob?.error,
        completedAt: updatedJob?.completedAt,
        updatedJob: JSON.stringify(updatedJob, null, 2),
      });
    } catch (updateError) {
      console.error('[WEBHOOK] ❌ Error updating job:', {
        jobId,
        error: updateError instanceof Error ? updateError.message : 'Unknown error',
        stack: updateError instanceof Error ? updateError.stack : undefined,
      });
      throw updateError;
    }

    // ============================================
    // Logging e Métricas
    // ============================================
    const duration = Date.now() - startTime;

    if (status === 'complete') {
      const jobDuration = existingJob.createdAt
        ? Date.now() - new Date(existingJob.createdAt).getTime()
        : 0;
      console.log('[WEBHOOK] 🎉 Upload completed:', {
        jobId,
        duration: `${jobDuration}ms`,
        processingTime: `${duration}ms`,
      });
    } else if (status === 'error') {
      console.error('[WEBHOOK] ❌ Upload failed:', {
        jobId,
        error: error || 'Unknown error',
        processingTime: `${duration}ms`,
      });
    }

    console.log('[WEBHOOK] ✅ Webhook processed successfully:', {
      jobId,
      status,
      duration: `${duration}ms`,
    });

    return NextResponse.json(
      {
        success: true,
        jobId,
        status,
      },
      { status: 200 },
    );
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[WEBHOOK] ❌ Webhook error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
    });

    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 401 },
      );
    }

    if (error instanceof ValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error.details,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}

