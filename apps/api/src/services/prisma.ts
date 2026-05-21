import { PrismaClient } from '@prisma/client';

// ============================================
// PRISMA CLIENT SINGLETON
// ============================================

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Development helpers: optionally emit Prisma query and error details to server logs to aid debugging.
// Control via env vars:
//  PRISMA_LOG_QUERIES=true       -> enable query logging
//  PRISMA_SLOW_MS=500            -> threshold in ms to always log as slow
//  PRISMA_QUERY_SAMPLE_RATE=0.01 -> fraction [0..1] of queries to sample (0=no sampling)
const shouldLogQueries = process.env.PRISMA_LOG_QUERIES === 'true';
const slowMs = Number(process.env.PRISMA_SLOW_MS || '500');
const sampleRate = Number(process.env.PRISMA_QUERY_SAMPLE_RATE || '0');

if (shouldLogQueries) {
  try {
    const p: any = prisma as any;
    p.$on('query', (e: any) => {
      try {
        const dur = e.duration != null ? Math.round(e.duration) : null;
        const isSlow = dur != null && dur >= slowMs;
        const sampled = sampleRate > 0 && Math.random() < sampleRate;
        if (isSlow || sampled) {
          console.debug(`[Prisma][QUERY]${dur != null ? ` ${dur}ms` : ''} ${e.query} -- params: ${e.params ?? ''}`);
        }
        if (isSlow) {
          console.warn(`[Prisma][SLOW QUERY] ${dur}ms -> ${e.query}`);
        }
      } catch (inner) {
        // ignore logging errors
      }
    });

    p.$on('error', (e: any) => {
      console.error('[Prisma][ERROR]', e);
    });
  } catch (e) {
    console.warn('Prisma debug hooks not attached:', e);
  }
} else {
  // Always attach error hook to catch runtime errors even when queries aren't logged
  try {
    const p: any = prisma as any;
    p.$on && p.$on('error', (e: any) => {
      console.error('[Prisma][ERROR]', e);
    });
  } catch (e) {
    // ignore
  }
}

export default prisma;
