import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authMiddleware, adminMiddleware } from '../middleware/auth';
import { createRound, getRounds, getRoundDetails, tap } from '../services/round.service';

export async function roundsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/', async (_request: FastifyRequest, reply: FastifyReply) => {
    const rounds = await getRounds();
    return reply.send(rounds);
  });

  fastify.post(
    '/',
    { preHandler: adminMiddleware },
    async (_request: FastifyRequest, reply: FastifyReply) => {
      const round = await createRound();
      return reply.status(201).send(round);
    }
  );

  fastify.get<{ Params: { id: string } }>(
    '/:id',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const round = await getRoundDetails(request.params.id, request.user.userId);

      if (!round) {
        return reply.status(404).send({ error: 'Round not found' });
      }

      return reply.send(round);
    }
  );

  fastify.post<{ Params: { id: string } }>(
    '/:id/tap',
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      const isNikita = request.user.role === 'nikita';
      const result = await tap(request.params.id, request.user.userId, isNikita);

      if ('error' in result) {
        return reply.status(400).send({ error: result.error });
      }

      return reply.send(result);
    }
  );
}
