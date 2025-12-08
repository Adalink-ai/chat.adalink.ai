import 'server-only';

/**
 * Custom error for authentication failures
 */
export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Custom error for validation failures
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Error messages constants
 */
export const ERROR_MESSAGES = {
  WEBHOOK_AUTH_FAILED: 'Webhook authentication failed',
  INVALID_IP: 'IP address not allowed',
  INVALID_SIGNATURE: 'Invalid webhook signature',
  INVALID_PAYLOAD: 'Invalid webhook payload',
  JOB_NOT_FOUND: 'Job not found',
} as const;

