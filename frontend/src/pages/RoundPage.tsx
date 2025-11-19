import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { api } from '../api/client';
import type { RoundDetails } from '../types';

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function RoundPage() {
  const { id } = useParams<{ id: string }>();
  const [round, setRound] = useState<RoundDetails | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const loadRound = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.getRound(id);
      setRound(data as RoundDetails);
    } catch (err) {
      console.error('Failed to load round:', err);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadRound();
  }, [loadRound]);

  useEffect(() => {
    if (!round) return;

    const updateTime = () => {
      const now = new Date().getTime();
      const startAt = new Date(round.startAt).getTime();
      const endAt = new Date(round.endAt).getTime();

      if (now < startAt) {
        setTimeLeft(Math.ceil((startAt - now) / 1000));
      } else if (now < endAt) {
        setTimeLeft(Math.ceil((endAt - now) / 1000));
      } else {
        setTimeLeft(0);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, [round]);

  const handleTap = async () => {
    if (!id || !round || round.status !== 'active') return;

    try {
      const result = await api.tap(id);
      setRound((prev) =>
        prev
          ? {
              ...prev,
              myPoints: result.points,
              myTaps: result.taps,
            }
          : null
      );
    } catch (err) {
      console.error('Failed to tap:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!round) {
    return <div className="error">Раунд не найден</div>;
  }

  const getStatusTitle = () => {
    switch (round.status) {
      case 'cooldown':
        return 'Cooldown';
      case 'active':
        return 'Раунд активен!';
      case 'finished':
        return 'Раунд завершен';
    }
  };

  return (
    <div className="round-container">
      <header className="header">
        <Link to="/rounds" className="back-link">
          Раунды
        </Link>
        <div className="user-info">
          <span>{user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            Выйти
          </button>
        </div>
      </header>

      <div className="guss-container">
        <div
          className={`guss ${round.status === 'active' ? 'clickable' : ''}`}
          onClick={handleTap}
        >
          <pre>{`
            ░░░░░░░░░░░░░░░
          ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
        ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░
      ░░░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░
    ░░▒▒▒▒░░░░▓▓▓▓▓▓▓▓▓▓▓▓░░░░▒▒▒▒░░
    ░░▒▒▒▒▒▒▒▒░░░░░░░░░░░░▒▒▒▒▒▒▒▒░░
    ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
      ░░▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒░░
        ░░░░░░░░░░░░░░░░░░░░░░░░░░
          `}</pre>
        </div>

        <div className="round-info">
          <h2>{getStatusTitle()}</h2>

          {round.status === 'cooldown' && (
            <p>до начала раунда {formatTime(timeLeft)}</p>
          )}

          {round.status === 'active' && (
            <>
              <p>До конца осталось: {formatTime(timeLeft)}</p>
              <p className="my-points">Мои очки - {round.myPoints}</p>
            </>
          )}

          {round.status === 'finished' && (
            <div className="results">
              <hr />
              <p>Всего: {round.totalPoints}</p>
              {round.winner && (
                <p>
                  Победитель - {round.winner.username}: {round.winner.points}
                </p>
              )}
              <p>Мои очки: {round.myPoints}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
