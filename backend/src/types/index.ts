import { UserRole } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  username: string;
  role: UserRole;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: JwtPayload;
  }
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface CreateRoundResponse {
  id: string;
  createdAt: Date;
  startAt: Date;
  endAt: Date;
}

export interface RoundListItem {
  id: string;
  startAt: Date;
  endAt: Date;
  status: 'cooldown' | 'active' | 'finished';
}

export interface RoundDetails {
  id: string;
  startAt: Date;
  endAt: Date;
  status: 'cooldown' | 'active' | 'finished';
  totalPoints: number;
  myPoints: number;
  myTaps: number;
  winner?: {
    username: string;
    points: number;
  };
}

export interface TapResponse {
  points: number;
  taps: number;
}
