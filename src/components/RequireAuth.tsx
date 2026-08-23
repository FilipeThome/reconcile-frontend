import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Layout } from './Layout'

export function RequireAuth() {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  return <Layout />
}
