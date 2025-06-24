import { useAuth } from '../context/authContext';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = ({ roles, redirectTo = '/login' }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};