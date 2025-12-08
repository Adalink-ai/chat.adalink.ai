import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Verify webhook signature using HMAC-SHA256
 * Uses timing-safe comparison to prevent timing attacks
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature.length !== expectedSignature.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Check if IP is allowed based on WEBHOOK_ALLOWED_IPS environment variable
 * Supports wildcards (e.g., "172.16.*.*")
 */
export function isAllowedIP(ip: string | null): boolean {
  if (!process.env.WEBHOOK_ALLOWED_IPS) {
    return true; // If not configured, allow all (for development)
  }

  if (!ip) {
    return false;
  }

  const allowedIPs = process.env.WEBHOOK_ALLOWED_IPS.split(',').map((s) => s.trim());

  if (allowedIPs.includes('*')) {
    return true; // Allow all if explicitly set
  }

  return allowedIPs.some((allowedIP) => {
    if (allowedIP.includes('*')) {
      // Support wildcards: "172.16.*.*" -> regex
      const pattern = allowedIP.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(ip);
    }
    return ip === allowedIP;
  });
}

/**
 * Get client IP from request headers
 * Handles various proxy headers (X-Forwarded-For, X-Real-IP, etc.)
 */
export function getClientIP(request: Request): string | null {
  // Try various headers in order of preference
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  return null;
}

