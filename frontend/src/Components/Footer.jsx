/**
 * تذييل الصفحة - Footer احترافي
 */
import { Link } from 'react-router-dom'
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube, FaLinkedin, FaCar, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCode } from 'react-icons/fa'
import { useAuth } from '../Auth/AuthContext'
import './Footer.css'

function Footer() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const currentYear = new Date().getFullYear()

  const quickLinks = [
    { path: '/', label: 'الرئيسية' },
    { path: '/inventory', label: 'المعرض' },
    ...(isAdmin ? [{ path: '/add-car', label: 'بيع سيارتك' }] : [])
  ]

  const brands = ['مرسيدس', 'بي ام دبليو', 'بورش', 'أودي', 'لكزس', 'تيسلا']

  return (
    <footer className="footer">
      <div className="footer-wave">
        <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" fill="currentColor"/>
        </svg>
      </div>

      <div className="footer-content">
        <div className="container-wide">
          <div className="footer-grid">
            {/* معلومات الشركة */}
            <div className="footer-col footer-about">
              <Link to="/" className="footer-logo">
                <FaCar />
                <span>Elite <strong>Cars</strong></span>
              </Link>
              <p className="about-text">
                وجهتك الأولى للسيارات الفاخرة. نقدم أفضل الماركات العالمية 
                بأسعار تنافسية وخدمة متميزة.
              </p>
              <div className="social-links">
                <a href="https://www.facebook.com/share/1BPuKrAiS5/" className="social-link" target="_blank" rel="noreferrer">
                  <FaFacebookF />
                </a>
                <a href="https://x.com/Haider0fficial" className="social-link" target="_blank" rel="noreferrer">
                  <FaTwitter />
                </a>
                <a href="https://www.instagram.com/eng.haider1426" className="social-link" target="_blank" rel="noreferrer">
                  <FaInstagram />
                </a>
                <a href="https://youtube.com/@haydarhassoun-i4q?si=Y6RlyHzHRrwJafnO" className="social-link" target="_blank" rel="noreferrer">
                  <FaYoutube />
                </a>
                <a href="https://www.linkedin.com/in/haider-alhassoun" className="social-link" target="_blank" rel="noreferrer">
                  <FaLinkedin />
                </a>
              </div>
            </div>

            {/* روابط سريعة */}
            <div className="footer-col">
              <h4 className="footer-title">روابط سريعة</h4>
              <ul className="footer-links">
                {quickLinks.map((link, i) => (
                  <li key={i}><Link to={link.path}>{link.label}</Link></li>
                ))}
              </ul>
            </div>

            {/* الماركات */}
            <div className="footer-col">
              <h4 className="footer-title">الماركات</h4>
              <ul className="footer-links brand-tags">
                {brands.map((brand, i) => (
                  <li key={i}><Link to="/inventory">{brand}</Link></li>
                ))}
              </ul>
            </div>

            {/* معلومات التواصل */}
            <div className="footer-col">
              <h4 className="footer-title">تواصل معنا</h4>
              <ul className="contact-list">
                <li>
                  <FaMapMarkerAlt />
                  <span>سوريا / أدلب / كفرسجنة</span>
                </li>
                <li>
                  <FaPhone />
                  <a href="tel:+994406787168" dir="ltr">+994 40 678 71 68</a>
                </li>
                <li>
                  <FaEnvelope />
                  <a href="mailto:h77edar@gmail.com">h77edar@gmail.com</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* حقوق النشر + شارة المطور */}
      <div className="footer-bottom">
        <div className="container-wide">
          <div className="footer-bottom-content">
            <p>&copy; {currentYear} Elite Cars. جميع الحقوق محفوظة.</p>
            <a 
              href="https://www.linkedin.com/in/haider-alhassoun" 
              target="_blank" 
              rel="noreferrer"
              className="developer-credit"
            >
              <FaCode />
              <span>تصميم وتطوير <strong>Haider Hassoun</strong></span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer