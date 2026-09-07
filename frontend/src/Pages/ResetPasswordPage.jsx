import { useState } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { FaArrowLeft, FaLock } from 'react-icons/fa'
import { SmokeyBackground } from '../Components/ui/LoginForm'
import { useAuth } from '../Auth/AuthContext'
import './ResetPasswordPage.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function ResetPasswordPage() {
  const { forgotPassword } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)
  const [done, setDone] = useState(false)

  const handleRequestReset = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setMsg(null)

    try {
      await forgotPassword(email.trim())
      setDone(true)
      setMsg({
        type: 'success',
        text: 'تم إرسال رابط الاستعادة إلى بريدك الإلكتروني'
      })
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.message || 'فشل إرسال رابط الاستعادة'
      })
    }

    setLoading(false)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (newPassword.length < 6) {
      setMsg({
        type: 'error',
        text: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      })
      return
    }

    if (newPassword !== confirmPassword) {
      setMsg({
        type: 'error',
        text: 'كلمة المرور وتأكيدها غير متطابقتين'
      })
      return
    }

    setLoading(true)
    setMsg(null)

    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token,
          password: newPassword
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(
          data.message || 'فشل إعادة تعيين كلمة المرور'
        )
      }

      setDone(true)

      setMsg({
        type: 'success',
        text: 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.'
      })

      setTimeout(() => {
        navigate('/login', { replace: true })
      }, 2000)
    } catch (err) {
      setMsg({
        type: 'error',
        text: err.message
      })
    }

    setLoading(false)
  }

  return (
    <div className="reset-page" dir="rtl">
      <SmokeyBackground
        color="#b8945a"
        className="reset-page-bg"
      />

      <div className="reset-page-content">
        <div className="login-card-glass" dir="rtl">

          <div className="login-glass-header">
            <h2 className="login-glass-title">
              {token
                ? 'إعادة تعيين كلمة المرور'
                : 'استعادة كلمة المرور'}
            </h2>

            <p className="login-glass-subtitle">
              {token
                ? 'أدخل كلمة المرور الجديدة'
                : 'أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة'}
            </p>
          </div>

          <form
            className="login-glass-form"
            onSubmit={
              token
                ? handleResetPassword
                : handleRequestReset
            }
            noValidate
          >

            {msg && (
              <div
                className={`login-glass-error ${
                  msg.type === 'success'
                    ? 'reset-success'
                    : ''
                }`}
                role="alert"
              >
                <span>{msg.text}</span>
              </div>
            )}

            {!done && !token && (
              <div className="login-glass-field">
                <input
                  type="email"
                  id="reset_email"
                  className={`login-glass-input ${
                    email ? 'has-value' : ''
                  }`}
                  placeholder=" "
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  dir="ltr"
                />

                <label
                  htmlFor="reset_email"
                  className="login-glass-label"
                >
                  <span>البريد الإلكتروني</span>
                </label>
              </div>
            )}

            {!done && token && (
              <>
                <div className="login-glass-field">
                  <input
                    type="password"
                    id="reset_password"
                    className={`login-glass-input ${
                      newPassword ? 'has-value' : ''
                    }`}
                    placeholder=" "
                    value={newPassword}
                    onChange={e =>
                      setNewPassword(e.target.value)
                    }
                    disabled={loading}
                    autoComplete="new-password"
                    dir="ltr"
                  />

                  <label
                    htmlFor="reset_password"
                    className="login-glass-label"
                  >
                    <FaLock
                      className="login-glass-label-icon"
                      aria-hidden="true"
                    />

                    <span>كلمة المرور الجديدة</span>
                  </label>
                </div>

                <div className="login-glass-field">
                  <input
                    type="password"
                    id="reset_confirm"
                    className={`login-glass-input ${
                      confirmPassword ? 'has-value' : ''
                    }`}
                    placeholder=" "
                    value={confirmPassword}
                    onChange={e =>
                      setConfirmPassword(e.target.value)
                    }
                    disabled={loading}
                    autoComplete="new-password"
                    dir="ltr"
                  />

                  <label
                    htmlFor="reset_confirm"
                    className="login-glass-label"
                  >
                    <FaLock
                      className="login-glass-label-icon"
                      aria-hidden="true"
                    />

                    <span>تأكيد كلمة المرور</span>
                  </label>
                </div>
              </>
            )}

            {!done && (
              <button
                type="submit"
                className="login-glass-submit"
                disabled={loading}
              >
                {loading ? (
                  <span>جارٍ المعالجة...</span>
                ) : (
                  <>
                    <span>
                      {token
                        ? 'إعادة تعيين'
                        : 'إرسال رابط الاستعادة'}
                    </span>

                    <FaArrowLeft
                      className="login-glass-submit-icon"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>
            )}

            <p className="login-glass-alt">
              <Link
                to="/login"
                className="login-glass-alt-link"
                style={{ textDecoration: 'none' }}
              >
                العودة لتسجيل الدخول
              </Link>
            </p>

          </form>
        </div>
      </div>
    </div>
  )
}