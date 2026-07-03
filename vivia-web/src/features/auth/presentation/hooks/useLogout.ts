import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logoutUseCase } from '../../data/di';

export function useLogout() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function logout() {
    setLoading(true);
    try {
      await logoutUseCase.execute();
    } finally {
      setLoading(false);
      navigate('/login', { replace: true });
    }
  }

  return { logout, loading };
}
