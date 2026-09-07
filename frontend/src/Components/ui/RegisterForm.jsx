/**
 * RegisterForm — DIRECT VARIATION of LoginForm (same master design)
 *
 * LOGIN  + تغيير محتوى النموذج فقط = REGISTER
 *
 * This component reuses the EXACT same CSS classes from login-form.css:
 *   ✓ Same background (mounted by the page: SmokeyBackground)
 *   ✓ Same glass card (.login-card-glass — same dimensions/radius/shadows)
 *   ✓ Same typography (.login-glass-title / .login-glass-subtitle)
 *   ✓ Same floating-label inputs (.login-glass-input / .login-glass-label)
 *   ✓ Same submit button (.login-glass-submit)
 *   ✓ Same divider (.login-glass-divider)
 *   ✓ Same Google button (.login-glass-google — Google ONLY)
 *   ✓ Same alt link (.login-glass-alt-link)
 *   ✓ Same spacing / colors / responsive behavior
 *
 * The ONLY differences from LoginForm:
 *   - Header text: "إنشاء حساب" / "أنشئ حسابك للمتابعة إلى Elite Cars"
 *   - Fields: Name, Email, Password, Confirm Password (no phone, no terms)
 *   - Submit label: "إنشاء حساب"
 *   - Alt link: "لديك حساب بالفعل؟ تسجيل الدخول" → back to /login
 *
 * Pure presentation — auth logic lives in AuthContext (register).
 */
import { useState } from 'react'
import { FaUser, FaEnvelope, FaLock, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa'
import GoogleIcon from './GoogleIcon'
import './login-form.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * RegisterForm — presentation only.
 *
 * Props:
 *   - onSubmit: async (name, email, password) => void (parent owns AuthContext.register)
 *   - isSubmitting: external loading flag (controlled by parent)
 *   - serverError: error message from parent (e.g. "البريد الإلكتروني مسجل مسبقاً")
 *   - onGoogleLogin: callback for the Google button (Google ONLY)
 *   - onSwitchToLogin: callback for "تسجيل الدخول" link (real routing → /login)
 */
export function RegisterForm({
  onSubmit,
  isSubmitting = false,
  serverError = '',
  onGoogleLogin,
  onSwitchToLogin,
}) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [localError, setLocalError] = useState('')

  const clearFieldError = (field) => {
    setFieldErrors((prev) => (prev[field] ? { ...prev, [field]: '' } : prev))
    if (localError) setLocalError('')
  }

  const handleChange = (field) => (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, [field]: value }))
    clearFieldError(field)
  }

  function validate() {
    const errors = { name: '', email: '', password: '', confirmPassword: '' }
    let isValid = true

    if (!form.name.trim()) {
      errors.name = 'يرجى إدخال الاسم'
      isValid = false
    } else if (form.name.trim().length < 2) {
      errors.name = 'الاسم يجب أن يكون حرفين على الأقل'
      isValid = false
    } else if (form.name.trim().length > 50) {
      errors.name = 'الاسم يجب أن يكون أقل من 50 حرف'
      isValid = false
    }

    if (!form.email.trim()) {
      errors.email = 'يرجى إدخال البريد الإلكتروني'
      isValid = false
    } else if (!EMAIL_REGEX.test(form.email.trim())) {
      errors.email = 'صيغة البريد الإلكتروني غير صحيحة'
      isValid = false
    }

    if (!form.password) {
      errors.password = 'يرجى إدخال كلمة المرور'
      isValid = false
    } else if (form.password.length < 6) {
      errors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      isValid = false
    }

    if (!form.confirmPassword) {
      errors.confirmPassword = 'يرجى تأكيد كلمة المرور'
      isValid = false
    } else if (form.password !== form.confirmPassword) {
      errors.confirmPassword = 'كلمتا المرور غير متطابقتين'
      isValid = false
    }

    setFieldErrors(errors)
    return isValid
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (isSubmitting) return
    setLocalError('')
    if (!validate()) return
    await onSubmit(form.name.trim(), form.email.trim(), form.password)
  }

  function handleConfirmKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Show serverError from parent if present, else local validation error
  const displayError = serverError || localError

  return (
    <div className="login-card-glass" dir="rtl">
      <div className="login-glass-header">
        <h2 className="login-glass-title">إنشاء حساب</h2>
        <p className="login-glass-subtitle">أنشئ حسابك للمتابعة إلى Elite Cars</p>
      </div>

      <form className="login-glass-form" onSubmit={handleSubmit} noValidate>
        {/* Server / network error */}
        {displayError && (
          <div className="login-glass-error" role="alert" aria-live="assertive">
            <span>{displayError}</span>
          </div>
        )}

        {/* Name with floating label */}
        <div className="login-glass-field">
          <input
            type="text"
            id="register_name"
            className={`login-glass-input ${fieldErrors.name ? 'has-error' : ''} ${form.name ? 'has-value' : ''}`}
            placeholder=" "
            value={form.name}
            onChange={handleChange('name')}
            disabled={isSubmitting}
            autoComplete="name"
            aria-invalid={!!fieldErrors.name}
            aria-describedby={fieldErrors.name ? 'register-name-err' : undefined}
          />
          <label htmlFor="register_name" className="login-glass-label">
            <FaUser className="login-glass-label-icon" aria-hidden="true" />
            <span>الاسم</span>
          </label>
          {fieldErrors.name && (
            <span id="register-name-err" className="login-glass-field-err" role="alert">
              {fieldErrors.name}
            </span>
          )}
        </div>

        {/* Email with floating label */}
        <div className="login-glass-field">
          <input
            type="email"
            id="register_email"
            className={`login-glass-input ${fieldErrors.email ? 'has-error' : ''} ${form.email ? 'has-value' : ''}`}
            placeholder=" "
            value={form.email}
            onChange={handleChange('email')}
            disabled={isSubmitting}
            autoComplete="email"
            inputMode="email"
            aria-invalid={!!fieldErrors.email}
            aria-describedby={fieldErrors.email ? 'register-email-err' : undefined}
          />
          <label htmlFor="register_email" className="login-glass-label">
            <FaEnvelope className="login-glass-label-icon" aria-hidden="true" />
            <span>البريد الإلكتروني</span>
          </label>
          {fieldErrors.email && (
            <span id="register-email-err" className="login-glass-field-err" role="alert">
              {fieldErrors.email}
            </span>
          )}
        </div>

        {/* Password with floating label + visibility toggle */}
        <div className="login-glass-field">
          <div className="login-glass-input-row">
            <input
              type={showPassword ? 'text' : 'password'}
              id="register_password"
              className={`login-glass-input with-toggle ${fieldErrors.password ? 'has-error' : ''} ${form.password ? 'has-value' : ''}`}
              placeholder=" "
              value={form.password}
              onChange={handleChange('password')}
              disabled={isSubmitting}
              autoComplete="new-password"
              aria-invalid={!!fieldErrors.password}
              aria-describedby={fieldErrors.password ? 'register-password-err' : undefined}
            />
            <label htmlFor="register_password" className="login-glass-label">
              <FaLock className="login-glass-label-icon" aria-hidden="true" />
              <span>كلمة المرور</span>
            </label>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={isSubmitting}
              className="login-glass-toggle"
              aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
              aria-pressed={showPassword}
              tabIndex={0}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {fieldErrors.password && (
            <span id="register-password-err" className="login-glass-field-err" role="alert">
              {fieldErrors.password}
            </span>
          )}
        </div>

        {/* Confirm password with floating label + visibility toggle */}
        <div className="login-glass-field">
          <div className="login-glass-input-row">
            <input
              type={showConfirm ? 'text' : 'password'}
              id="register_confirm"
              className={`login-glass-input with-toggle ${fieldErrors.confirmPassword ? 'has-error' : ''} ${form.confirmPassword ? 'has-value' : ''}`}
              placeholder=" "
              value={form.confirmPassword}
              onChange={handleChange('confirmPassword')}
              onKeyDown={handleConfirmKeyDown}
              disabled={isSubmitting}
              autoComplete="new-password"
              aria-invalid={!!fieldErrors.confirmPassword}
              aria-describedby={fieldErrors.confirmPassword ? 'register-confirm-err' : undefined}
            />
            <label htmlFor="register_confirm" className="login-glass-label">
              <FaLock className="login-glass-label-icon" aria-hidden="true" />
              <span>تأكيد كلمة المرور</span>
            </label>
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              disabled={isSubmitting}
              className="login-glass-toggle"
              aria-label={showConfirm ? 'إخفاء تأكيد كلمة المرور' : 'إظهار تأكيد كلمة المرور'}
              aria-pressed={showConfirm}
              tabIndex={0}
            >
              {showConfirm ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {fieldErrors.confirmPassword && (
            <span id="register-confirm-err" className="login-glass-field-err" role="alert">
              {fieldErrors.confirmPassword}
            </span>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="login-glass-submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span>جارٍ إنشاء الحساب...</span>
              <span className="login-glass-spinner" aria-hidden="true" />
            </>
          ) : (
            <>
              <span>إنشاء حساب</span>
              <FaArrowLeft className="login-glass-submit-icon" aria-hidden="true" />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="login-glass-divider" aria-hidden="true">
          <span className="login-glass-divider-line" />
          <span className="login-glass-divider-text">أو</span>
          <span className="login-glass-divider-line" />
        </div>

        {/* Google ONLY — same design as Login */}
        {onGoogleLogin && (
          <button
            type="button"
            className="login-glass-google"
            onClick={onGoogleLogin}
            disabled={isSubmitting}
          >
            <GoogleIcon className="login-glass-google-icon" />
            <span>التسجيل باستخدام Google</span>
          </button>
        )}

        {/* Back to login (real routing) */}
        <p className="login-glass-alt">
          لديك حساب بالفعل؟{' '}
          <button type="button" className="login-glass-alt-link" onClick={onSwitchToLogin}>
            تسجيل الدخول
          </button>
        </p>
      </form>
    </div>
  )
}

export default RegisterForm
