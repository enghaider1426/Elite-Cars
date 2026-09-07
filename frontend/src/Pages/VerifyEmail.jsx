import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../Auth/AuthContext'

const API = (
  import.meta.env.VITE_API_URL || 'http://localhost:5000'
)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '')

export default function VerifyEmail() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { checkAuth } = useAuth()

  const [message, setMessage] = useState(
    'جاري تأكيد البريد الإلكتروني...'
  )
  const [error, setError] = useState(false)

  useEffect(() => {
    const token = params.get('token')

    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(true)
      setMessage('رابط التحقق غير صالح')
      return
    }

    fetch(
      `${API}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
      { credentials: 'include' }
    )
      .then(async res => {
        const data = await res.json().catch(() => ({}))

        if (!res.ok) {
          throw new Error(
            data.message || 'تعذر تأكيد البريد الإلكتروني'
          )
        }

        setMessage('تم تأكيد بريدك الإلكتروني بنجاح')

        await checkAuth()

        setTimeout(
          () => navigate('/', { replace: true }),
          1200
        )
      })
      .catch(err => {
        setError(true)
        setMessage(err.message)
      })
  }, [params, checkAuth, navigate])

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        color: error ? '#ff7676' : '#D4AF37',
        fontFamily: 'Tajawal, sans-serif'
      }}
    >
      <p>{message}</p>
    </div>
  )
}
