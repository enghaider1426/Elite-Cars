import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FaUser, FaLock, FaHeart, FaEye, FaEyeSlash, FaTimes, FaCar } from 'react-icons/fa'
import { useAuth } from '../Auth/AuthContext'
import { useLanguage } from '../Context/LanguageContext'
import './ProfilePage.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export default function ProfilePage() {
  const { user, updateProfile, changePassword, favorites, checkAuth } = useAuth()
  const { language, theme, setLanguage, setTheme } = useLanguage()

  const [profileForm, setProfileForm] = useState({ name: '' })
  const [profileMsg, setProfileMsg] = useState(null)
  const [profileLoading, setProfileLoading] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ current: '', newPass: '', confirm: '' })
  const [passwordMsg, setPasswordMsg] = useState(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({ current: false, newPass: false, confirm: false })

  const [favoriteCars, setFavoriteCars] = useState([])
  const [recentlyViewed, setRecentlyViewed] = useState([])

  // تعبئة نموذج الملف الشخصي
  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfileForm({ name: user.name || '' })
    }
  }, [user])

  // جلب بيانات السيارات (المفضلة والمعروضة مؤخراً) - مرة واحدة فقط
  useEffect(() => {
    const loadCarsData = async () => {
      let recentIds = []
      try {
        recentIds = JSON.parse(localStorage.getItem('elite-cars-recently-viewed') || '[]')
      } catch {
        recentIds = []
      }

      if ((!favorites || favorites.length === 0) && recentIds.length === 0) {
        setFavoriteCars([])
        setRecentlyViewed([])
        return
      }

      try {
        const res = await fetch(`${API}/cars`)
        if (res.ok) {
          const data = await res.json()
          const allCars = data.data || data.cars || data || []

          // Filter favorite cars
          if (favorites && favorites.length > 0) {
            const favCars = allCars.filter(c => {
              const carId = c._id || c.id
              return favorites.some(favId => String(favId) === String(carId))
            })
            setFavoriteCars(favCars)
          } else {
            setFavoriteCars([])
          }

          // Filter recently viewed cars
          if (recentIds.length > 0) {
            const recentCars = recentIds
              .map(id => allCars.find(c => (c._id || c.id) === id))
              .filter(Boolean)
            setRecentlyViewed(recentCars)
          } else {
            setRecentlyViewed([])
          }
        }
      } catch {
        setFavoriteCars([])
        setRecentlyViewed([])
      }
    }

    loadCarsData()
  }, [favorites])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setProfileMsg(null)
    setProfileLoading(true)
    try {
      await updateProfile({ name: profileForm.name })
      setProfileMsg({ type: 'success', text: 'تم تحديث الملف الشخصي بنجاح' })
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message })
    }
    setProfileLoading(false)
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordMsg(null)

    if (passwordForm.newPass.length < 6) {
      setPasswordMsg({ type: 'error', text: 'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل' })
      return
    }

    if (passwordForm.newPass !== passwordForm.confirm) {
      setPasswordMsg({ type: 'error', text: 'كلمة المرور الجديدة وتأكيدها غير متطابقتين' })
      return
    }

    setPasswordLoading(true)

    try {
      await changePassword(passwordForm.current, passwordForm.newPass)
      setPasswordMsg({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' })
      setPasswordForm({ current: '', newPass: '', confirm: '' })
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message })
    }

    setPasswordLoading(false)
  }

  const getInitials = (name) => {
    if (!name) return 'م'

    const parts = name.trim().split(/\s+/)

    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0]
    }

    return parts[0][0]
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''

    try {
      return new Date(dateStr).toLocaleDateString(language === 'en' ? 'en-US' : 'ar-AZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return ''
    }
  }

  const getCarImage = (car) => {
    if (car.images?.length > 0) return car.images[0]
    if (car.image) return car.image
    return ''
  }

  const getCarName = (car) =>
    car.name ||
    car.title ||
    `${car.brand || ''} ${car.model || ''}`.trim() ||
    '-'

  const getCarPrice = (car) => {
    const price = car.price || car.priceUSD || 0
    return `${Number(price).toLocaleString(language === 'en' ? 'en-US' : 'ar-AZ')} $`
  }

  if (!user) return null

  return (
    <div className="profile-page">
      <div className="profile-content">

        {/* رأس الملف الشخصي */}
        <div className="profile-header">
          <div className="avatar-circle">
            {getInitials(user.name)}
          </div>

          <div className="profile-header-info">
            <h2>{user.name || 'مستخدم'}</h2>

            <span className="profile-email">
              {user.email || ''}
            </span>

            <span className="profile-joined">
              {user.createdAt
                ? `عضو منذ ${formatDate(user.createdAt)}`
                : ''}
            </span>
          </div>

          <span
            className={`role-badge ${
              user.role === 'admin'
                ? 'role-admin'
                : 'role-user'
            }`}
          >
            {user.role === 'admin'
              ? 'مسؤول'
              : 'مستخدم'}
          </span>
        </div>

        <div className="profile-sections">

          {/* إعدادات الموقع */}
          <div
            className="profile-section profile-settings-section"
            style={{ animationDelay: '0.05s' }}
          >
            <h3>
              <FaUser
                style={{
                  marginLeft: 10,
                  WebkitTextFillColor: 'var(--primary-gold)'
                }}
              />
              إعدادات الموقع
            </h3>

            <div className="profile-settings-grid">

              <div className="profile-setting-item">
                <span className="profile-setting-label">
                  اللغة
                </span>

                <div className="profile-setting-actions">
                  <button
                    type="button"
                    className={`profile-setting-btn ${
                      language === 'ar' ? 'active' : ''
                    }`}
                    onClick={() => setLanguage('ar')}
                  >
                    العربية
                  </button>

                  <button
                    type="button"
                    className={`profile-setting-btn ${
                      language === 'en' ? 'active' : ''
                    }`}
                    onClick={() => setLanguage('en')}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="profile-setting-item">
                <span className="profile-setting-label">
                  المظهر
                </span>

                <div className="profile-setting-actions">
                  <button
                    type="button"
                    className={`profile-setting-btn ${
                      theme === 'dark' ? 'active' : ''
                    }`}
                    onClick={() => setTheme('dark')}
                  >
                    الوضع الداكن
                  </button>

                  <button
                    type="button"
                    className={`profile-setting-btn ${
                      theme === 'light' ? 'active' : ''
                    }`}
                    onClick={() => setTheme('light')}
                  >
                    الوضع الفاتح
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* تعديل الملف الشخصي */}
          <div
            className="profile-section"
            style={{ animationDelay: '0.1s' }}
          >
            <h3>
              <FaUser
                style={{
                  marginLeft: 10,
                  WebkitTextFillColor: 'var(--primary-gold)'
                }}
              />
              تعديل الملف الشخصي
            </h3>

            <form
              className="profile-form"
              onSubmit={handleProfileSubmit}
            >
              <div className="profile-field">
                <label htmlFor="profile-name">
                  الاسم الكامل
                </label>

                <input
                  id="profile-name"
                  type="text"
                  value={profileForm.name}
                  onChange={e =>
                    setProfileForm(prev => ({
                      ...prev,
                      name: e.target.value
                    }))
                  }
                  placeholder="أدخل اسمك الكامل"
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary profile-submit-btn"
                disabled={profileLoading}
              >
                {profileLoading
                  ? 'جاري الحفظ...'
                  : 'حفظ التغييرات'}
              </button>

              {profileMsg && (
                <div
                  className={`profile-message ${profileMsg.type}`}
                >
                  {profileMsg.text}
                </div>
              )}
            </form>
          </div>

          {/* تغيير كلمة المرور */}
          <div
            className="profile-section"
            style={{ animationDelay: '0.2s' }}
          >
            <h3>
              <FaLock
                style={{
                  marginLeft: 10,
                  WebkitTextFillColor: 'var(--primary-gold)'
                }}
              />
              تغيير كلمة المرور
            </h3>

            <form
              className="profile-form"
              onSubmit={handlePasswordSubmit}
            >
              <div className="profile-field password-field">
                <label htmlFor="current-pass">
                  كلمة المرور الحالية
                </label>

                <div className="password-input-wrapper">
                  <input
                    id="current-pass"
                    type={
                      showPasswords.current
                        ? 'text'
                        : 'password'
                    }
                    value={passwordForm.current}
                    onChange={e =>
                      setPasswordForm(prev => ({
                        ...prev,
                        current: e.target.value
                      }))
                    }
                    placeholder="أدخل كلمة المرور الحالية"
                  />

                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() =>
                      setShowPasswords(prev => ({
                        ...prev,
                        current: !prev.current
                      }))
                    }
                    title={
                      showPasswords.current
                        ? 'إخفاء كلمة المرور'
                        : 'إظهار كلمة المرور'
                    }
                  >
                    {showPasswords.current
                      ? <FaEyeSlash />
                      : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="profile-field password-field">
                <label htmlFor="new-pass">
                  كلمة المرور الجديدة
                </label>

                <div className="password-input-wrapper">
                  <input
                    id="new-pass"
                    type={
                      showPasswords.newPass
                        ? 'text'
                        : 'password'
                    }
                    value={passwordForm.newPass}
                    onChange={e =>
                      setPasswordForm(prev => ({
                        ...prev,
                        newPass: e.target.value
                      }))
                    }
                    placeholder="أدخل كلمة المرور الجديدة (6 أحرف على الأقل)"
                    minLength={6}
                  />

                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() =>
                      setShowPasswords(prev => ({
                        ...prev,
                        newPass: !prev.newPass
                      }))
                    }
                    title={
                      showPasswords.newPass
                        ? 'إخفاء كلمة المرور'
                        : 'إظهار كلمة المرور'
                    }
                  >
                    {showPasswords.newPass
                      ? <FaEyeSlash />
                      : <FaEye />}
                  </button>
                </div>
              </div>

              <div className="profile-field password-field">
                <label htmlFor="confirm-pass">
                  تأكيد كلمة المرور الجديدة
                </label>

                <div className="password-input-wrapper">
                  <input
                    id="confirm-pass"
                    type={
                      showPasswords.confirm
                        ? 'text'
                        : 'password'
                    }
                    value={passwordForm.confirm}
                    onChange={e =>
                      setPasswordForm(prev => ({
                        ...prev,
                        confirm: e.target.value
                      }))
                    }
                    placeholder="أعد إدخال كلمة المرور الجديدة"
                    minLength={6}
                  />

                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() =>
                      setShowPasswords(prev => ({
                        ...prev,
                        confirm: !prev.confirm
                      }))
                    }
                    title={
                      showPasswords.confirm
                        ? 'إخفاء كلمة المرور'
                        : 'إظهار كلمة المرور'
                    }
                  >
                    {showPasswords.confirm
                      ? <FaEyeSlash />
                      : <FaEye />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary profile-submit-btn"
                disabled={passwordLoading}
              >
                {passwordLoading
                  ? 'جاري التغيير...'
                  : 'تغيير كلمة المرور'}
              </button>

              {passwordMsg && (
                <div
                  className={`profile-message ${passwordMsg.type}`}
                >
                  {passwordMsg.text}
                </div>
              )}
            </form>
          </div>

          {/* المفضلة */}
          <div
            className="profile-section"
            style={{ animationDelay: '0.3s' }}
          >
            <h3>
              <FaHeart
                style={{
                  marginLeft: 10,
                  WebkitTextFillColor: 'var(--primary-gold)'
                }}
              />
              المفضلة ({favoriteCars.length})
            </h3>

            {!favorites ||
            favorites.length === 0 ||
            favoriteCars.length === 0 ? (
              <div className="empty-favorites">
                <p>
                  لم تقم بإضافة سيارات للمفضلة بعد
                </p>
              </div>
            ) : (
              <div className="favorites-grid">
                {favoriteCars.map(car => (
                  <div
                    key={car._id || car.id}
                    className="favorite-card"
                  >
                    {getCarImage(car) ? (
                      <img
                        src={getCarImage(car)}
                        alt={getCarName(car)}
                        className="favorite-card-img"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div
                        className="favorite-card-img"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FaCar
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.7rem'
                          }}
                        />
                      </div>
                    )}

                    <div className="favorite-card-info">
                      <Link
                        to={`/car/${car._id || car.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <h4>
                          {getCarName(car)}
                        </h4>
                      </Link>

                      <span>
                        {getCarPrice(car)}
                      </span>
                    </div>

                    <button
                      className="remove-fav-btn"
                      onClick={async () => {
                        try {
                          const res = await fetch(
                            `${API}/auth/favorites/${car._id || car.id}`,
                            {
                              method: 'POST',
                              credentials: 'include',
                              headers: { 'Content-Type': 'application/json' },
                            }
                          )

                          if (res.ok) {
                            await checkAuth()
                            alert(
                              'تمت إزالة السيارة من المفضلة'
                            )
                          } else {
                            const errData =
                              await res.json().catch(
                                () => ({})
                              )

                            alert(
                              `خطأ: ${
                                errData.message ||
                                res.status
                              }`
                            )
                          }
                        } catch (err) {
                          console.error(
                            'Error removing favorite:',
                            err
                          )

                          alert(
                            `خطأ في الاتصال: ${err.message}`
                          )
                        }
                      }}
                      title="إزالة من المفضلة"
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* تم عرضها مؤخراً */}
          <div
            className="profile-section"
            style={{ animationDelay: '0.4s' }}
          >
            <h3>
              <FaEye
                style={{
                  marginLeft: 10,
                  WebkitTextFillColor: 'var(--primary-gold)'
                }}
              />
              تم عرضها مؤخراً
            </h3>

            {recentlyViewed.length === 0 ? (
              <div className="empty-recently-viewed">
                <p>
                  لم تقم بتصفح سيارات بعد
                </p>
              </div>
            ) : (
              <div className="recently-viewed-grid">
                {recentlyViewed.map(car => (
                  <Link
                    key={car._id || car.id}
                    to={`/car/${car._id || car.id}`}
                    className="recently-viewed-card"
                  >
                    {getCarImage(car) ? (
                      <img
                        src={getCarImage(car)}
                        alt={getCarName(car)}
                        className="recently-viewed-card-img"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div
                        className="recently-viewed-card-img"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <FaCar
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: '0.7rem'
                          }}
                        />
                      </div>
                    )}

                    <div className="recently-viewed-card-info">
                      <h4>
                        {getCarName(car)}
                      </h4>

                      <span>
                        {getCarPrice(car)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}
