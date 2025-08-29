import { useAuth } from '../hooks/useAuth';
import { Navigate, useLocation } from 'react-router';

export default function ProtectedRoute({ children, fallback = null, redirectTo = '/ecl-reborn/signin' }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '200px',
        color: 'var(--color-white-70)'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    if (fallback) {
      return fallback;
    }
    
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
}