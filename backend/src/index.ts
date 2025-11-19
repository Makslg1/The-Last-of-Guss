import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { config } from './config';
import { authRoutes } from './routes/auth.routes';
import { roundsRoutes } from './routes/rounds.routes';
import { prisma } from './utils/prisma';

async function main(): Promise<void> {
  const fastify = Fastify({
    logger: true,
  });

  await fastify.register(cors, {
    origin: true,
    credentials: true,
  });

  await fastify.register(cookie);

  fastify.register(authRoutes, { prefix: '/api/auth' });
  fastify.register(roundsRoutes, { prefix: '/api/rounds' });

  fastify.get('/api/health', async () => {
    return { status: 'ok' };
  });

  try {
    await prisma.$connect();
    console.log('Connected to database');

    await fastify.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`Server running on port ${config.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
