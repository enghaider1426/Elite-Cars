import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaEnvelope, FaCheck, FaExclamationTriangle } from 'react-icons/fa'
import { useAuth } from './AuthContext'
import './Email.css'

const API_BASE = import.meta.env.VITE_API_URL || ''

function Email() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { checkAuth } = useAuth()

  const [status, setStatus] = useState('checking')
  const [message, setMessage] = useState(
    'جاري التحقق من رابط البريد الإلكتروني...'
  )

  const verifyEmail = useCallback(
    async (token) => {
      try {
        setStatus('checking')
        setMessage('جاري التحقق من بريدك الإلكتروني...')

        const response = await fetch(
          `${API_BASE}/api/auth/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: 'GET',
            credentials: 'include',
            headers: {
              Accept: 'application/json'
            }
          }
        )

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(
            data.message ||
              data.error ||
              'رابط التحقق غير صالح أو منتهي الصلاحية'
          )
        }

        await checkAuth()

        setStatus('success')
        setMessage(
          'تم التحقق من بريدك الإلكتروني بنجاح. مرحبًا بك في Elite Cars.'
        )

        setTimeout(() => {
          navigate('/', { replace: true })
        }, 1200)
      } catch (error) {
        console.error('Email verification error:', error)

        setStatus('error')
        setMessage(
          error.message ||
            'تعذر التحقق من البريد الإلكتروني. يرجى المحاولة مرة أخرى.'
        )
      }
    },
    [checkAuth, navigate]
  )

  useEffect(() => {
    const token =
      searchParams.get('token') ||
      searchParams.get('code') ||
      searchParams.get('verificationToken')

    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus('waiting')
      setMessage(
        'تم إنشاء حسابك بنجاح. يرجى فتح رسالة التحقق المرسلة إلى بريدك الإلكتروني والضغط على رابط التحقق.'
      )
      return
    }

    verifyEmail(token)
  }, [searchParams, verifyEmail])

  const handleGoLogin = () => {
    navigate('/login', { replace: true })
  }

  const handleGoHome = () => {
    navigate('/', { replace: true })
  }

  return (
    <div className="email-page" dir="rtl">
      <div className="email-card">
        {status === 'checking' && (
          <>
            <div className="email-icon loading">
              <FaEnvelope />
            </div>

            <h1>جاري التحقق</h1>

            <p>{message}</p>

            <div className="email-loader">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </>
        )}

        {status === 'waiting' && (
          <>
            <div className="email-icon">
              <FaEnvelope />
            </div>

            <h1>تحقق من بريدك الإلكتروني</h1>

            <p>{message}</p>

            <div className="email-info">
              <strong>ملاحظة</strong>
              <span>
                إذا لم تجد الرسالة في البريد الوارد، تحقق من مجلد الرسائل
                غير المرغوب فيها أو Spam.
              </span>
            </div>

            <button
              type="button"
              className="email-button"
              onClick={handleGoLogin}
            >
              العودة إلى تسجيل الدخول
            </button>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="email-icon success">
              <FaCheck />
            </div>

            <h1>تم التحقق بنجاح</h1>

            <p>{message}</p>

            <div className="email-success">
              سيتم تحويلك إلى الصفحة الرئيسية...
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="email-icon error">
              <FaExclamationTriangle />
            </div>

            <h1>تعذر التحقق</h1>

            <p>{message}</p>

            <div className="email-actions">
              <button
                type="button"
                className="email-button"
                onClick={handleGoLogin}
              >
                تسجيل الدخول
              </button>

              <button
                type="button"
                className="email-secondary-button"
                onClick={handleGoHome}
              >
                الصفحة الرئيسية
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Email