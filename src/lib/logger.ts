const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const isDev = process.env.NODE_ENV !== 'production';

export function log(level: string, context: string, message: string, metadata?: Record<string, any>) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    context,
    message,
    ...metadata,
  };

  if (isDev || level === 'error') {
    const prefix = `[${level.toUpperCase()}]`;
    console[level === 'error' ? 'error' : 'log'](prefix, context, '—', message, metadata || '');
  }
}

export function logAdminAction(adminId: number | string, action: string, details?: Record<string, any>) {
  log('info', 'admin', `Admin ${adminId}: ${action}`, details);
}

export function logError(context: string, error: Error | string, metadata?: Record<string, any>) {
  log('error', context, typeof error === 'string' ? error : error.message, {
    ...metadata,
    stack: typeof error === 'object' ? (error as Error).stack : undefined,
  });
}

export function logInfo(context: string, message: string, metadata?: Record<string, any>) {
  log('info', context, message, metadata);
}
