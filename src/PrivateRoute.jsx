import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  const { adminUser, loading } = useContext(AuthContext);

  if (loading) {
    // Você pode retornar um spinner aqui, ou nada
    return null; // ou <div>Carregando...</div>
  }

  return adminUser ? children : <Navigate to="/login" />;
}
