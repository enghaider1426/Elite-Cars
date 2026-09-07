import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthContext'

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoading />
  if (!user) return <Navigate to="/login" replace />
  return children
}

export function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <AuthLoading />
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

function AuthLoading() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#0a0a0a', color: '#D4AF37', fontFamily: 'Tajawal, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div className="login-spinner" style={{
          width: 40, height: 40, borderWidth: 3,
          borderColor: 'rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', margin: '0 auto 16px'
        }} />
        <p>جاري التحقق...</p>
      </div>
    </div>
  )
}
