import { Navigate, Outlet } from 'react-router-dom';
import { sessionManager } from '@/core/session';

export function ProtectedRoute() {
  if (!sessionManager.hasSession()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
