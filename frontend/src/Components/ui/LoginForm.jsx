/**
 * LoginForm — SmokeyBackground + LoginForm
 *
 * Original: TypeScript + Tailwind + lucide-react (shadcn/ui pattern)
 * Adapted: JSX + plain CSS + react-icons for the Elite Cars project
 *
 * Component contract:
 *   - <SmokeyBackground color="#b8945a" className="..." />
 *       Renders an interactive WebGL shader (luxury champagne glow).
 *   - <LoginForm onSubmit={async (email, password) => ...} />
 *       Renders the glassmorphism form. Receives an onSubmit handler
 *       that returns { success, message } — matching AuthContext.login().
 */

import { useEffect, useRef, useState } from 'react'

import { FaUser, FaLock, FaArrowLeft, FaEye, FaEyeSlash } from 'react-icons/fa'

import GoogleIcon from './GoogleIcon'

import './login-form.css'

/* ============================================================
   WebGL Smokey Background
   ============================================================ */

// Vertex shader — just passes the position through
const vertexSmokeySource = `
  attribute vec4 a_position;

  void main() {
    gl_Position = a_position;
  }
`

// Fragment shader — animated smokey wave with mouse-driven ripple
const fragmentSmokeySource = `
precision mediump float;

uniform vec2 iResolution;
uniform float iTime;
uniform vec2 iMouse;
uniform vec3 u_color;

void mainImage(out vec4 fragColor, in vec2 fragCoord){
    vec2 uv = fragCoord / iResolution;

    vec2 centeredUV =
        (2.0 * fragCoord - iResolution.xy) /
        min(iResolution.x, iResolution.y);

    float time = iTime * 0.5;

    // Normalize mouse input (0.0 - 1.0) and remap to -1.0 ~ 1.0
    vec2 mouse = iMouse / iResolution;
    vec2 rippleCenter = 2.0 * mouse - 1.0;

    vec2 distortion = centeredUV;

    // Apply distortion for a wavy, smokey effect
    for (float i = 1.0; i < 8.0; i++) {
        distortion.x +=
            0.5 / i *
            cos(
                i * 2.0 * distortion.y +
                time +
                rippleCenter.x * 3.1415
            );

        distortion.y +=
            0.5 / i *
            cos(
                i * 2.0 * distortion.x +
                time +
                rippleCenter.y * 3.1415
            );
    }

    // Create a glowing wave pattern
    float wave = abs(sin(distortion.x + distortion.y + time));
    float glow = smoothstep(0.9, 0.2, wave);

    fragColor = vec4(u_color * glow, 1.0);
}

void main() {
    mainImage(gl_FragColor, gl_FragCoord.xy);
}
`

// Helper: hex color → [r, g, b] in 0-1 range
function hexToRgb(hex) {
  const r = parseInt(hex.substring(1, 3), 16) / 255
  const g = parseInt(hex.substring(3, 5), 16) / 255
  const b = parseInt(hex.substring(5, 7), 16) / 255

  return [r, g, b]
}

/**
 * SmokeyBackground — interactive WebGL shader.
 *
 * Props:
 *   - color: hex string, default "#b8945a" (champagne gold for Elite Cars)
 *   - className: extra classes for the wrapper
 */
export function SmokeyBackground({
  color = '#b8945a',
  className = '',
}) {
  const canvasRef = useRef(null)

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)

  const stateRef = useRef({
    isHovering,
    mousePosition,
    color,
  })

  // Keep the ref synchronized outside of render.
  useEffect(() => {
    stateRef.current = {
      isHovering,
      mousePosition,
      color,
    }
  }, [isHovering, mousePosition, color])

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) return

    const gl = canvas.getContext('webgl', {
      antialias: true,
      premultipliedAlpha: false,
    })

    if (!gl) {
      console.error('WebGL not supported')
      return
    }

    const compileShader = (type, source) => {
      const shader = gl.createShader(type)

      if (!shader) return null

      gl.shaderSource(shader, source)
      gl.compileShader(shader)

      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(
          'Shader compilation error:',
          gl.getShaderInfoLog(shader)
        )

        gl.deleteShader(shader)

        return null
      }

      return shader
    }

    const vertexShader = compileShader(
      gl.VERTEX_SHADER,
      vertexSmokeySource
    )

    const fragmentShader = compileShader(
      gl.FRAGMENT_SHADER,
      fragmentSmokeySource
    )

    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()

    if (!program) return

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(
        'Program linking error:',
        gl.getProgramInfoLog(program)
      )

      return
    }

    gl.useProgram(program)

    const positionBuffer = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([
        -1, -1,
        1, -1,
        -1, 1,
        -1, 1,
        1, -1,
        1, 1,
      ]),
      gl.STATIC_DRAW
    )

    const positionLocation = gl.getAttribLocation(
      program,
      'a_position'
    )

    gl.enableVertexAttribArray(positionLocation)

    gl.vertexAttribPointer(
      positionLocation,
      2,
      gl.FLOAT,
      false,
      0,
      0
    )

    const iResolutionLocation = gl.getUniformLocation(
      program,
      'iResolution'
    )

    const iTimeLocation = gl.getUniformLocation(
      program,
      'iTime'
    )

    const iMouseLocation = gl.getUniformLocation(
      program,
      'iMouse'
    )

    const uColorLocation = gl.getUniformLocation(
      program,
      'u_color'
    )

    const startTime = Date.now()

    let rafId = 0

    const render = () => {
      const width = canvas.clientWidth
      const height = canvas.clientHeight

      if (
        canvas.width !== width ||
        canvas.height !== height
      ) {
        canvas.width = width
        canvas.height = height

        gl.viewport(0, 0, width, height)
      }

      const currentTime =
        (Date.now() - startTime) / 1000

      const {
        isHovering: hovering,
        mousePosition: mouse,
        color: hex,
      } = stateRef.current

      const [r, g, b] = hexToRgb(hex)

      gl.uniform3f(
        uColorLocation,
        r,
        g,
        b
      )

      gl.uniform2f(
        iResolutionLocation,
        width,
        height
      )

      gl.uniform1f(
        iTimeLocation,
        currentTime
      )

      gl.uniform2f(
        iMouseLocation,
        hovering ? mouse.x : width / 2,
        hovering ? height - mouse.y : height / 2
      )

      gl.drawArrays(
        gl.TRIANGLES,
        0,
        6
      )

      rafId = requestAnimationFrame(render)
    }

    const handleMouseMove = (event) => {
      const rect = canvas.getBoundingClientRect()

      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      })
    }

    const handleMouseEnter = () => {
      setIsHovering(true)
    }

    const handleMouseLeave = () => {
      setIsHovering(false)
    }

    canvas.addEventListener(
      'mousemove',
      handleMouseMove
    )

    canvas.addEventListener(
      'mouseenter',
      handleMouseEnter
    )

    canvas.addEventListener(
      'mouseleave',
      handleMouseLeave
    )

    render()

    return () => {
      cancelAnimationFrame(rafId)

      canvas.removeEventListener(
        'mousemove',
        handleMouseMove
      )

      canvas.removeEventListener(
        'mouseenter',
        handleMouseEnter
      )

      canvas.removeEventListener(
        'mouseleave',
        handleMouseLeave
      )

      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      gl.deleteBuffer(positionBuffer)
    }
  }, [])

  return (
    <div className={`smokey-bg ${className}`}>
      <canvas
        ref={canvasRef}
        className="smokey-canvas"
      />

      <div className="smokey-overlay" />
    </div>
  )
}

/* ============================================================
   LoginForm — glassmorphism card with floating labels
   ============================================================ */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * LoginForm — presentation only.
 *
 * Props:
 *   - onSubmit: async (email, password) => { success: boolean, message: string }
 *   - isSubmitting: external loading flag (controlled by parent)
 *   - serverError: error message from parent
 *   - onCreateAccount: callback for "create account" link (real routing → /register)
 *   - onForgotPassword: callback for "forgot password" link
 *   - onGoogleLogin: callback for the Google button (Google ONLY — no other social)
 */
export function LoginForm({
  onSubmit,
  isSubmitting = false,
  serverError = '',
  onCreateAccount,
  onForgotPassword,
  onGoogleLogin,
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [fieldErrors, setFieldErrors] = useState({
    email: '',
    password: '',
  })

  const [localError, setLocalError] = useState('')

  const clearFieldError = (field) => {
    setFieldErrors((prev) =>
      prev[field]
        ? { ...prev, [field]: '' }
        : prev
    )

    if (localError) {
      setLocalError('')
    }
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    clearFieldError('email')
  }

  const handlePasswordChange = (e) => {
    setPassword(e.target.value)
    clearFieldError('password')
  }

  function validate() {
    const errors = {
      email: '',
      password: '',
    }

    let isValid = true

    if (!email.trim()) {
      errors.email = 'يرجى إدخال البريد الإلكتروني'
      isValid = false
    } else if (!EMAIL_REGEX.test(email.trim())) {
      errors.email = 'صيغة البريد الإلكتروني غير صحيحة'
      isValid = false
    }

    if (!password) {
      errors.password = 'يرجى إدخال كلمة المرور'
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

    await onSubmit(
      email.trim(),
      password
    )
  }

  function handlePasswordKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const displayError = serverError || localError

  return (
    <div
      className="login-card-glass"
      dir="rtl"
    >
      <div className="login-glass-header">
        <h2 className="login-glass-title">
          مرحبًا بعودتك
        </h2>

        <p className="login-glass-subtitle">
          سجّل الدخول للمتابعة إلى Elite Cars
        </p>
      </div>

      <form
        className="login-glass-form"
        onSubmit={handleSubmit}
        noValidate
      >
        {displayError && (
          <div
            className="login-glass-error"
            role="alert"
            aria-live="assertive"
          >
            <span>{displayError}</span>
          </div>
        )}

        <div className="login-glass-field">
          <input
            type="email"
            id="floating_email"
            className={`login-glass-input ${
              fieldErrors.email ? 'has-error' : ''
            } ${email ? 'has-value' : ''}`}
            placeholder=" "
            value={email}
            onChange={handleEmailChange}
            disabled={isSubmitting}
            autoComplete="email"
            inputMode="email"
            aria-invalid={!!fieldErrors.email}
            aria-describedby={
              fieldErrors.email
                ? 'email-err'
                : undefined
            }
          />

          <label
            htmlFor="floating_email"
            className="login-glass-label"
          >
            <FaUser
              className="login-glass-label-icon"
              aria-hidden="true"
            />

            <span>البريد الإلكتروني</span>
          </label>

          {fieldErrors.email && (
            <span
              id="email-err"
              className="login-glass-field-err"
              role="alert"
            >
              {fieldErrors.email}
            </span>
          )}
        </div>

        <div className="login-glass-field">
          <div className="login-glass-input-row">
            <input
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }
              id="floating_password"
              className={`login-glass-input with-toggle ${
                fieldErrors.password
                  ? 'has-error'
                  : ''
              } ${password ? 'has-value' : ''}`}
              placeholder=" "
              value={password}
              onChange={handlePasswordChange}
              onKeyDown={handlePasswordKeyDown}
              disabled={isSubmitting}
              autoComplete="current-password"
              aria-invalid={
                !!fieldErrors.password
              }
              aria-describedby={
                fieldErrors.password
                  ? 'password-err'
                  : undefined
              }
            />

            <label
              htmlFor="floating_password"
              className="login-glass-label"
            >
              <FaLock
                className="login-glass-label-icon"
                aria-hidden="true"
              />

              <span>كلمة المرور</span>
            </label>

            <button
              type="button"
              onClick={() =>
                setShowPassword((v) => !v)
              }
              disabled={isSubmitting}
              className="login-glass-toggle"
              aria-label={
                showPassword
                  ? 'إخفاء كلمة المرور'
                  : 'إظهار كلمة المرور'
              }
              aria-pressed={showPassword}
              tabIndex={0}
            >
              {showPassword ? (
                <FaEyeSlash />
              ) : (
                <FaEye />
              )}
            </button>
          </div>

          {fieldErrors.password && (
            <span
              id="password-err"
              className="login-glass-field-err"
              role="alert"
            >
              {fieldErrors.password}
            </span>
          )}
        </div>

        <div className="login-glass-options">
          <button
            type="button"
            className="login-glass-forgot"
            onClick={onForgotPassword}
          >
            نسيت كلمة المرور؟
          </button>
        </div>

        <button
          type="submit"
          className="login-glass-submit"
          disabled={isSubmitting}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <span>جارٍ تسجيل الدخول...</span>

              <span
                className="login-glass-spinner"
                aria-hidden="true"
              />
            </>
          ) : (
            <>
              <span>تسجيل الدخول</span>

              <FaArrowLeft
                className="login-glass-submit-icon"
                aria-hidden="true"
              />
            </>
          )}
        </button>

        <div
          className="login-glass-divider"
          aria-hidden="true"
        >
          <span className="login-glass-divider-line" />

          <span className="login-glass-divider-text">
            أو
          </span>

          <span className="login-glass-divider-line" />
        </div>

        {/* Google ONLY — same design in Login & Register */}
        {onGoogleLogin && (
          <button
            type="button"
            className="login-glass-google"
            onClick={onGoogleLogin}
            disabled={isSubmitting}
          >
            <GoogleIcon className="login-glass-google-icon" />

            <span>
              تسجيل الدخول باستخدام Google
            </span>
          </button>
        )}

        <p className="login-glass-alt">
          ليس لديك حساب؟{' '}

          <button
            type="button"
            className="login-glass-alt-link"
            onClick={onCreateAccount}
          >
            إنشاء حساب
          </button>
        </p>
      </form>
    </div>
  )
}

export default LoginForm