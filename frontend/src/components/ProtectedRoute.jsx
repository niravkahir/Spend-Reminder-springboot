import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export default function ProtectedRoute() {
  const { token } = useAuth()
  return token ? <Outlet /> : <Navigate to="/login" replace />
}
export function AdminRoute() {
  const { user } = useAuth()
  return user?.role === 'ADMIN' ? <Outlet /> : <Navigate to="/" replace />
}
