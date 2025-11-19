import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { UserRole } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { JwtPayload } from '../types';

function determineRole(username: string): UserRole {
  const lowerUsername = username.toLowerCase();

  if (lowerUsername === 'admin') {
    return 'admin';
  }

  if (lowerUsername === 'никита' || lowerUsername === 'nikita') {
    return 'nikita';
  }

  return 'survivor';
}

export async function loginOrRegister(
  username: string,
  password: string
): Promise<{ token: string; user: { id: string; username: string; role: UserRole } } | null> {
  let user = await prisma.user.findUnique({
    where: { username },
  });

  if (user) {
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return null;
    }
  } else {
    const passwordHash = await bcrypt.hash(password, 10);
    const role = determineRole(username);

    user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        role,
      },
    });
  }

  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '24h' });

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  };
}
