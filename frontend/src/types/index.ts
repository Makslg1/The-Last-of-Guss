export type UserRole = 'admin' | 'survivor' | 'nikita';

export interface User {
  id: string;
  username: string;
  role: UserRole;
}

export interface Round {
  id: string;
  startAt: string;
  endAt: string;
  status: 'cooldown' | 'active' | 'finished';
}

export interface RoundDetails {
  id: string;
  startAt: string;
  endAt: string;
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
