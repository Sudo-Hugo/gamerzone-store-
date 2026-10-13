import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loading } from './Status';

// Exige login (e, se adminOnly, papel de administrador). A API também
// verifica isso: esconder a tela é conforto, a proteção real é no servidor.
export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, checking, isAdmin } = useAuth();
  const location = useLocation();

  if (checking) return <Loading label="Verificando sessão..." />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;
  return children;
}
