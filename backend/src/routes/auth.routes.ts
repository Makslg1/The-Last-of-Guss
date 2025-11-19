import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { loginOrRegister } from '../services/auth.service';
import { LoginRequest } from '../types';
import { authMiddleware } from '../middleware/auth';

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post<{ Body: LoginRequest }>(
    '/login',
    async (request: FastifyRequest<{ Body: LoginRequest }>, reply: FastifyReply) => {
      const { username, password } = request.body;

      if (!username || !password) {
        return reply.status(400).send({ error: 'Username and password are required' });
      }

      const result = await loginOrRegister(username, password);

      if (!result) {
        return reply.status(401).send({ error: 'Invalid password' });
      }

      reply.setCookie('token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      });

      return reply.send({
        token: result.token,
        user: result.user,
      });
    }
  );

  fastify.post('/logout', async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.clearCookie('token', { path: '/' });
    return reply.send({ message: 'Logged out' });
  });

  fastify.get(
    '/me',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      return reply.send({
        user: {
          id: request.user.userId,
          username: request.user.username,
          role: request.user.role,
        },
      });
    }
  );
}
