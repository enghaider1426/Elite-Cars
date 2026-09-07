import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../Auth/AuthContext'

export default function OAuthCallback() {
  const { checkAuth } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true
    const processOAuthCallback = async () => {
      try {
        await checkAuth()
        if (mounted) navigate('/', { replace: true })
      } catch (err) {
        if (!mounted) return
        setError(err.message || 'فشل في المصادقة')
        setTimeout(() => navigate('/login', { replace: true }), 2000)
      }
    }
    processOAuthCallback()
    return () => { mounted = false }
  }, [checkAuth, navigate])

  if (error) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#D4AF37', fontFamily: 'Tajawal, sans-serif' }}><p>{error}</p></div>

  return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', color: '#D4AF37', fontFamily: 'Tajawal, sans-serif' }}><div style={{ textAlign: 'center' }}><div className="login-spinner" style={{ width: 40, height: 40, borderWidth: 3, borderColor: 'rgba(212,175,55,0.2)', borderTopColor: '#D4AF37', margin: '0 auto 16px' }} /><p>جاري التحقق من المصادقة...</p></div></div>
}
