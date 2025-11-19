import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { api } from '../api/client';
import type { Round } from '../types';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString('ru-RU');
}

function getStatusText(status: string): string {
  switch (status) {
    case 'cooldown':
      return 'Cooldown';
    case 'active':
      return 'Активен';
    case 'finished':
      return 'Завершен';
    default:
      return status;
  }
}

export function RoundsPage() {
  const [rounds, setRounds] = useState<Round[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    loadRounds();
  }, []);

  const loadRounds = async () => {
    try {
      const data = await api.getRounds();
      setRounds(data as Round[]);
    } catch (err) {
      console.error('Failed to load rounds:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateRound = async () => {
    try {
      const round = await api.createRound();
      navigate(`/rounds/${round.id}`);
    } catch (err) {
      console.error('Failed to create round:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (isLoading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="rounds-container">
      <header className="header">
        <h1>Список РАУНДОВ</h1>
        <div className="user-info">
          <span>{user?.username}</span>
          <button onClick={handleLogout} className="logout-btn">
            Выйти
          </button>
        </div>
      </header>

      {user?.role === 'admin' && (
        <button onClick={handleCreateRound} className="create-round-btn">
          Создать раунд
        </button>
      )}

      <div className="rounds-list">
        {rounds.length === 0 ? (
          <p>Нет доступных раундов</p>
        ) : (
          rounds.map((round) => (
            <Link to={`/rounds/${round.id}`} key={round.id} className="round-card">
              <div className="round-id">
                <span className="bullet">●</span> Round ID: {round.id}
              </div>
              <div className="round-times">
                <div>Start: {formatDate(round.startAt)}</div>
                <div>End: {formatDate(round.endAt)}</div>
              </div>
              <hr />
              <div className={`round-status status-${round.status}`}>
                Статус: {getStatusText(round.status)}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
