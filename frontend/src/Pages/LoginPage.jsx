import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaCheck } from 'react-icons/fa'
import { SmokeyBackground, LoginForm } from '../Components/ui/LoginForm'
import { useAuth } from '../Auth/AuthContext'
import './LoginPage.css'

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/+$/, '').replace(/\/api$/, '')

function LoginPage() {
  const { login, forgotPassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [showForgotModal, setShowForgotModal] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotMsg, setForgotMsg] = useState(null)
  const [forgotLoading, setForgotLoading] = useState(false)

  async function handleSubmit(email, password) {
    if (isSubmitting) return
    setServerError('')
    setIsSubmitting(true)

    try {
      await login(email, password)
      setShowSuccess(true)
      const redirect = searchParams.get('redirect')
      let target = '/'
      try {
        target = redirect ? decodeURIComponent(redirect) : '/'
      } catch {
        target = '/'
      }
      const safeTarget =
        target.startsWith('/') && !target.startsWith('//') ? target : '/'
      setTimeout(() => {
        navigate(safeTarget, { replace: true })
      }, 900)
    } catch (err) {
      setServerError(err.message || 'فشل تسجيل الدخول')
      setIsSubmitting(false)
    }
  }

  const handleCreateAccount = () => {
    navigate('/register')
  }

  const handleForgotPassword = () => {
    setShowForgotModal(true)
    setForgotEmail('')
    setForgotMsg(null)
  }

  const handleForgotSubmit = async (e) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return
    setForgotLoading(true)
    setForgotMsg(null)
    try {
      await forgotPassword(forgotEmail.trim())
      setForgotMsg({ type: 'success', text: 'تم إرسال رابط الاستعادة إلى بريدك الإلكتروني' })
    } catch (err) {
      setForgotMsg({ type: 'error', text: err.message || 'فشل إرسال رابط الاستعادة' })
    }
    setForgotLoading(false)
  }

  const handleGoogleLogin = () => {
    // Google ONLY — real OAuth flow (no WhatsApp / Phone / Facebook / Apple)
    window.location.href = `${API_BASE}/api/auth/google`
  }

  return (
    <div className="login-page" dir="rtl">
      <SmokeyBackground color="#b8945a" className="login-page-bg" />

      <div className="login-page-content">
        <LoginForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          serverError={serverError}
          onCreateAccount={handleCreateAccount}
          onForgotPassword={handleForgotPassword}
          onGoogleLogin={handleGoogleLogin}
        />
      </div>

      {/* Success overlay */}
      {showSuccess && (
        <div className="login-success-overlay" role="status" aria-live="polite">
          <div className="login-success-box">
            <div className="login-success-check">
              <FaCheck aria-hidden="true" />
            </div>
            <div className="login-success-text">تم تسجيل الدخول بنجاح</div>
          </div>
        </div>
      )}

      {/* Forgot password modal */}
      {showForgotModal && (
        <div className="forgot-modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="forgot-modal" onClick={e => e.stopPropagation()} dir="rtl">
            <h3>استعادة كلمة المرور</h3>
            <p>أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.</p>
            <form onSubmit={handleForgotSubmit}>
              <input
                type="email"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                placeholder="البريد الإلكتروني"
                required
                dir="ltr"
              />
              {forgotMsg && (
                <div className={`forgot-msg ${forgotMsg.type}`}>{forgotMsg.text}</div>
              )}
              <div className="forgot-modal-actions">
                <button type="button" className="forgot-cancel" onClick={() => setShowForgotModal(false)}>إلغاء</button>
                <button type="submit" className="forgot-submit" disabled={forgotLoading}>
                  {forgotLoading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default LoginPage
