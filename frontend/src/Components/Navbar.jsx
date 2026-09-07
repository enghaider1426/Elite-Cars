/**
 * شريط التنقل العلوي - مع روابط حسب الدور
 */
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { HiMenuAlt3, HiX } from 'react-icons/hi'
import {
  FaCar, FaSignOutAlt, FaTachometerAlt, FaUser,
  FaHeart, FaPlus
} from 'react-icons/fa'
import './Navbar.css'

function Navbar({ carsCount, user, onLogout }) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const menuRef = useRef(null)

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)

    window.addEventListener('scroll', handleScroll)

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useLayoutEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileMenuOpen(false)
  }, [location])

  // إغلاق القائمة عند الضغط خارجها
  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClick)

    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isAdmin = user?.role === 'admin'

  // روابط التنقل حسب حالة المستخدم
  const getNavLinks = () => {
    const links = [
      { path: '/', label: 'الرئيسية' },
      { path: '/inventory', label: 'المعرض', badge: carsCount }
    ]

    if (isAdmin) {
      links.push({ path: '/admin', label: 'لوحة التحكم' })
      links.push({ path: '/add-car', label: 'إضافة سيارة' })
    }

    return links
  }

  const navLinks = getNavLinks()

  const handleLogout = () => {
    setIsMobileMenuOpen(false)

    if (onLogout) {
      onLogout()
    }
  }

  return (
    <nav className={`navbar ${isScrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-container">

        <Link to="/" className="navbar-logo">
          <FaCar className="logo-icon" />

          <span className="logo-text">
            Elite <span className="logo-highlight">Cars</span>
          </span>
        </Link>

        <div className="navbar-links">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${
                location.pathname === link.path ? 'active' : ''
              }`}
            >
              {link.label}

              {link.badge && (
                <span className="nav-badge">
                  {link.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          {user ? (
            <>
              <div className="nav-user-menu">
                <Link
                  to="/profile"
                  className={`nav-user-btn ${
                    location.pathname === '/profile' ? 'active' : ''
                  }`}
                >
                  <div className="nav-user-avatar">
                    {user.name?.charAt(0)?.toUpperCase() || 'م'}
                  </div>

                  <span className="nav-user-name">
                    {user.name}
                  </span>
                </Link>

                {/* قائمة منسدلة */}
                <div className="nav-dropdown">
                  <Link
                    to="/profile"
                    className="nav-dropdown-item"
                  >
                    <FaUser /> الملف الشخصي
                  </Link>

                  {!isAdmin && (
                    <Link
                      to="/profile"
                      className="nav-dropdown-item"
                    >
                      <FaHeart /> المفضلة
                    </Link>
                  )}

                  {isAdmin && (
                    <>
                      <Link
                        to="/admin"
                        className="nav-dropdown-item"
                      >
                        <FaTachometerAlt /> لوحة التحكم
                      </Link>

                      <Link
                        to="/add-car"
                        className="nav-dropdown-item"
                      >
                        <FaPlus /> إضافة سيارة
                      </Link>
                    </>
                  )}

                  <button
                    onClick={handleLogout}
                    className="nav-dropdown-item nav-dropdown-logout"
                  >
                    <FaSignOutAlt /> تسجيل الخروج
                  </button>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="nav-logout-btn-mobile"
                aria-label="تسجيل الخروج"
              >
                <FaSignOutAlt />
              </button>
            </>
          ) : (
            <Link
              to="/inventory"
              className="btn btn-primary navbar-cta"
            >
              تصفح السيارات
            </Link>
          )}
        </div>

        <button
          className="mobile-menu-btn"
          onClick={() =>
            setIsMobileMenuOpen(!isMobileMenuOpen)
          }
          aria-label="القائمة"
        >
          {isMobileMenuOpen ? <HiX /> : <HiMenuAlt3 />}
        </button>
      </div>

      {/* القائمة المتنقلة */}
      <div
        ref={menuRef}
        className={`mobile-menu ${
          isMobileMenuOpen ? 'open' : ''
        }`}
      >
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`mobile-nav-link ${
              location.pathname === link.path ? 'active' : ''
            }`}
          >
            {link.label}

            {link.badge && (
              <span className="nav-badge">
                {link.badge}
              </span>
            )}
          </Link>
        ))}

        {user ? (
          <>
            <Link
              to="/profile"
              className={`mobile-nav-link ${
                location.pathname === '/profile' ? 'active' : ''
              }`}
            >
              <FaUser /> الملف الشخصي
            </Link>

            {!isAdmin && (
              <Link
                to="/profile"
                className="mobile-nav-link"
              >
                <FaHeart /> المفضلة
              </Link>
            )}

            <button
              onClick={handleLogout}
              className="mobile-logout-btn"
            >
              <FaSignOutAlt />
              تسجيل الخروج
            </button>
          </>
        ) : (
          <Link
            to="/inventory"
            className="btn btn-primary mobile-cta"
          >
            تصفح السيارات الآن
          </Link>
        )}
      </div>
    </nav>
  )
}

export default Navbar
