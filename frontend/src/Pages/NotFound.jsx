/**
 * صفحة 404 - الصفحة غير موجودة
 */
import { Link } from 'react-router-dom'
import { FaArrowRight } from 'react-icons/fa'

function NotFound() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      textAlign: 'center',
      padding: '40px 20px',
      gap: '20px'
    }}>
      <span style={{
        fontSize: 'clamp(6rem, 15vw, 12rem)',
        fontWeight: 900,
        background: 'linear-gradient(135deg, #D4AF37 0%, #F4E4BC 50%, #D4AF37 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        lineHeight: 1
      }}>404</span>
      <h2 style={{
        fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
        fontWeight: 700,
        color: '#ffffff',
        margin: 0
      }}>الصفحة غير موجودة</h2>
      <p style={{
        color: '#a0a0a0',
        fontSize: '1.1rem',
        maxWidth: '500px',
        lineHeight: 1.8
      }}>عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
      <Link to="/" className="btn btn-primary btn-lg" style={{ marginTop: '10px' }}>
        <FaArrowRight />
        العودة للرئيسية
      </Link>
    </div>
  )
}

export default NotFound
