import { afterEach, describe, expect, it } from 'vitest';

import { logger, type LogTransport } from '@/lib/logging/logger';

const calls: { level: string; message: string; context?: unknown; error?: unknown }[] = [];
const transport: LogTransport = (level, message, context, error) => {
  calls.push({ level, message, context, error });
};

describe('logger', () => {
  afterEach(() => {
    calls.length = 0;
    logger.setLevel('info');
    logger.setTransport(null);
  });

  it('forwards enabled levels to the transport with sanitized context', () => {
    logger.setTransport(transport);
    logger.info('hello', { password: 'hunter2', requestId: 'req-1' });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.level).toBe('info');
    expect(calls[0]?.message).toBe('hello');
    expect(calls[0]?.context).toEqual({ password: '[REDACTED]', requestId: 'req-1' });
  });

  it('includes the error argument for warn/error', () => {
    logger.setTransport(transport);
    const error = new Error('boom');
    logger.error('failed', {}, error);

    expect(calls[0]?.level).toBe('error');
    expect(calls[0]?.error).toBe(error);
  });

  it('suppresses levels below the configured minimum', () => {
    logger.setLevel('warn');
    logger.setTransport(transport);
    logger.debug('hidden');
    logger.info('hidden');
    logger.warn('shown');
    logger.error('also shown');

    expect(calls.map((c) => c.message)).toEqual(['shown', 'also shown']);
  });

  it('silent suppresses everything', () => {
    logger.setLevel('silent');
    logger.setTransport(transport);
    logger.error('nope');
    expect(calls).toHaveLength(0);
  });

  it('withContext merges permanent context into every log call', () => {
    logger.setTransport(transport);
    const child = logger.withContext({ requestId: 'req-42' });
    child.info('first');
    child.info('second', { userId: 'u-7' });

    expect(calls.map((c) => c.context)).toEqual([
      { requestId: 'req-42' },
      { requestId: 'req-42', userId: 'u-7' },
    ]);
  });

  it('child loggers inherit the parent level and transport', () => {
    logger.setLevel('error');
    logger.setTransport(transport);
    const child = logger.withContext({});
    child.warn('hidden');
    child.error('shown');
    expect(calls.map((c) => c.message)).toEqual(['shown']);
  });
});
