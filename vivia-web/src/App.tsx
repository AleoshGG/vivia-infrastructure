import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/presentation/pages/LoginPage';
import { useLogout } from './features/auth/presentation/hooks/useLogout';
import { ReportsPage } from './features/reports/presentation/pages/ReportsPage';
import { ProtectedRoute } from './shared/components/ProtectedRoute';

function AppRoutes() {
  const { logout } = useLogout();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/reports" element={<ReportsPage onLogout={logout} />} />
      </Route>
      <Route path="*" element={<Navigate to="/reports" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
