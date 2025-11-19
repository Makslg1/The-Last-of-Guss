import { prisma } from '../utils/prisma';
import { config } from '../config';
import { RoundDetails, RoundListItem, TapResponse } from '../types';
import { calculatePointsForTap } from '../utils/points';

function getRoundStatus(startAt: Date, endAt: Date): 'cooldown' | 'active' | 'finished' {
  const now = new Date();

  if (now < startAt) {
    return 'cooldown';
  }

  if (now >= startAt && now < endAt) {
    return 'active';
  }

  return 'finished';
}

export async function createRound(): Promise<{
  id: string;
  createdAt: Date;
  startAt: Date;
  endAt: Date;
}> {
  const now = new Date();
  const startAt = new Date(now.getTime() + config.cooldownDuration * 1000);
  const endAt = new Date(startAt.getTime() + config.roundDuration * 1000);

  const round = await prisma.round.create({
    data: {
      startAt,
      endAt,
    },
  });

  return round;
}

export async function getRounds(): Promise<RoundListItem[]> {
  const now = new Date();

  const rounds = await prisma.round.findMany({
    where: {
      endAt: {
        gte: now,
      },
    },
    orderBy: {
      startAt: 'asc',
    },
  });

  return rounds.map((round) => ({
    id: round.id,
    startAt: round.startAt,
    endAt: round.endAt,
    status: getRoundStatus(round.startAt, round.endAt),
  }));
}

export async function getRoundDetails(
  roundId: string,
  userId: string
): Promise<RoundDetails | null> {
  const round = await prisma.round.findUnique({
    where: { id: roundId },
    include: {
      playerStats: {
        include: {
          user: {
            select: {
              username: true,
              role: true,
            },
          },
        },
        orderBy: {
          points: 'desc',
        },
      },
    },
  });

  if (!round) {
    return null;
  }

  const status = getRoundStatus(round.startAt, round.endAt);
  const myStats = round.playerStats.find((stats) => stats.userId === userId);

  let winner: { username: string; points: number } | undefined;

  if (status === 'finished' && round.playerStats.length > 0) {
    const topPlayer = round.playerStats.find(
      (stats) => stats.user.role !== 'nikita'
    );
    if (topPlayer) {
      winner = {
        username: topPlayer.user.username,
        points: topPlayer.points,
      };
    }
  }

  return {
    id: round.id,
    startAt: round.startAt,
    endAt: round.endAt,
    status,
    totalPoints: round.totalPoints,
    myPoints: myStats?.points ?? 0,
    myTaps: myStats?.taps ?? 0,
    winner,
  };
}

export async function tap(
  roundId: string,
  userId: string,
  isNikita: boolean
): Promise<TapResponse | { error: string }> {
  return await prisma.$transaction(async (tx) => {
    const round = await tx.round.findUnique({
      where: { id: roundId },
    });

    if (!round) {
      return { error: 'Round not found' };
    }

    const now = new Date();
    if (now < round.startAt || now >= round.endAt) {
      return { error: 'Round is not active' };
    }

    let playerStats = await tx.playerRoundStats.findUnique({
      where: {
        userId_roundId: {
          userId,
          roundId,
        },
      },
    });

    if (!playerStats) {
      playerStats = await tx.playerRoundStats.create({
        data: {
          userId,
          roundId,
          taps: 0,
          points: 0,
        },
      });
    }

    const pointsEarned = calculatePointsForTap(playerStats.taps);

    if (isNikita) {
      await tx.playerRoundStats.update({
        where: { id: playerStats.id },
        data: {
          taps: { increment: 1 },
        },
      });

      return {
        points: 0,
        taps: playerStats.taps + 1,
      };
    }

    const updatedStats = await tx.playerRoundStats.update({
      where: { id: playerStats.id },
      data: {
        taps: { increment: 1 },
        points: { increment: pointsEarned },
      },
    });

    await tx.round.update({
      where: { id: roundId },
      data: {
        totalPoints: { increment: pointsEarned },
      },
    });

    return {
      points: updatedStats.points,
      taps: updatedStats.taps,
    };
  });
}
