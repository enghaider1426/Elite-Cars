
/**
 * RegisterPage — DIRECT VARIATION of LoginPage (master template)
 *
 * نفس صفحة Login تمامًا:
 *   ✓ Same SmokeyBackground (WebGL, same color/position/size/overlay)
 *   ✓ Same page shell (.login-page / .login-page-content)
 *   ✓ Same glass card + logo typography (RegisterForm reuses login-form.css)
 *   ✓ Same success overlay pattern
 *   ✓ No Navbar, No Footer — standalone authentication page
 *   ✓ Google ONLY (no WhatsApp / Phone / Facebook / Apple)
 *
 * الفرق الوحيد: محتوى النموذج (Name / Email / Password / Confirm Password)
 *
 * Auth logic: AuthContext.register(name, email, password)
 *   → POST /api/auth/register
 *   → success → verify email → enter site as user
 */
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { FaCheck } from 'react-icons/fa'
import { SmokeyBackground } from '../Components/ui/LoginForm'
import { RegisterForm } from '../Components/ui/RegisterForm'
import { useAuth } from './AuthContext'
import '../Pages/LoginPage.css'

const API_BASE = import.meta.env.VITE_API_URL || ''

function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  // Called by <RegisterForm /> when the user submits valid data
  async function handleSubmit(name, email, password) {
    if (isSubmitting) return
    setServerError('')
    setIsSubmitting(true)

    try {
      // Registration creates the account and sends the email verification link.
      await register({ name, email, password })

      setShowSuccess(true)

      const redirect = searchParams.get('redirect')
      let target = '/'
      try {
        target = redirect ? decodeURIComponent(redirect) : '/'
      } catch {
        target = '/'
      }

      // Prevent open-redirect: only allow same-origin relative paths after decoding
      const safeTarget =
        target.startsWith('/') && !target.startsWith('//') ? target : '/'

      setTimeout(() => {
        navigate('/verify-email', {
          replace: true,
          state: { email, redirect: safeTarget }
        })
      }, 900)
    } catch (err) {
      setServerError(err.message || 'فشل إنشاء الحساب')
      setIsSubmitting(false)
    }
  }

  // Google ONLY — same OAuth flow as Login (no WhatsApp / Phone / Apple)
  const handleGoogleRegister = () => {
    window.location.href = `${API_BASE}/api/auth/google`
  }

  // Real routing back to Login (React Router)
  const handleSwitchToLogin = () => {
    navigate('/login')
  }

  return (
    <div className="login-page" dir="rtl">
      {/* Same WebGL animated background as Login */}
      <SmokeyBackground color="#b8945a" className="login-page-bg" />

      {/* Same centered glass card container as Login */}
      <div className="login-page-content">
        <RegisterForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          serverError={serverError}
          onGoogleLogin={handleGoogleRegister}
          onSwitchToLogin={handleSwitchToLogin}
        />
      </div>

      {/* Success overlay (same design as Login's) */}
      {showSuccess && (
        <div className="login-success-overlay" role="status" aria-live="polite">
          <div className="login-success-box">
            <div className="login-success-check">
              <FaCheck aria-hidden="true" />
            </div>
            <div className="login-success-text">تم إنشاء الحساب بنجاح</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default RegisterPage

