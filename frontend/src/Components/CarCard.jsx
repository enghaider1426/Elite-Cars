/**
 * بطاقة السيارة - تصميم أنيق مع دعم العربية والإنجليزية
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FaHeart,
  FaRegHeart,
  FaEye,
  FaGasPump,
  FaTachometerAlt,
  FaCalendarAlt
} from 'react-icons/fa'
import { useAuth } from '../Auth/AuthContext'
import { useLanguage } from '../Context/LanguageContext'
import './CarCard.css'

const API =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function CarCard({ car }) {
  const { user, favorites, checkAuth } = useAuth()
  const { language } = useLanguage()

  const [isLoading, setIsLoading] = useState(false)

  const carId = String(car?._id || car?.id || '')

  // تحديد النص حسب اللغة الحالية
  const isEnglish = language === 'en'

  const carName =
    isEnglish && car.nameEn
      ? car.nameEn
      : car.name

  const manufacturer =
    isEnglish && car.manufacturerEn
      ? car.manufacturerEn
      : car.manufacturer

  const mileageUnit =
    isEnglish
      ? 'km'
      : 'كم'

  const newLabel =
    isEnglish
      ? 'New'
      : 'جديد'

  const viewDetailsLabel =
    isEnglish
      ? 'View Details'
      : 'عرض التفاصيل'

  const detailsLabel =
    isEnglish
      ? 'Details'
      : 'التفاصيل'

  const addFavoriteLabel =
    isEnglish
      ? 'Add to favorites'
      : 'أضف للمفضلة'

  const removeFavoriteLabel =
    isEnglish
      ? 'Remove from favorites'
      : 'إزالة من المفضلة'

  // تحديد حالة المفضلة مباشرة من بيانات المفضلة الحالية
  const isFavorited =
    Boolean(user) &&
    Boolean(carId) &&
    (favorites || []).some((favId) => {
      return (
        String(favId) === carId ||
        String(favId?._id || favId) === carId
      )
    })

  const handleToggleFavorite = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      window.location.href = '/login'
      return
    }

    if (!carId) {
      console.error('Car ID is missing:', car)

      alert(
        isEnglish
          ? 'Car ID is missing'
          : 'معرف السيارة غير موجود'
      )

      return
    }

    if (isLoading) return

    setIsLoading(true)

    try {
      const res = await fetch(
        `${API}/auth/favorites/${encodeURIComponent(carId)}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        console.error(
          'Error updating favorite:',
          res.status,
          data
        )

        alert(
          isEnglish
            ? `Error updating favorites: ${
                data.message || `HTTP ${res.status}`
              }`
            : `خطأ في تحديث المفضلة: ${
                data.message || `HTTP ${res.status}`
              }`
        )

        return
      }

      const returnedFavorites =
        data?.data?.favorites || data?.favorites

      const newFavoritedState = Array.isArray(returnedFavorites)
        ? returnedFavorites.some((favorite) =>
            String(
              favorite?._id ||
                favorite?.id ||
                favorite
            ) === carId
          )
        : !isFavorited

      if (checkAuth) {
        await checkAuth()
      }

      if (newFavoritedState) {
        alert(
          isEnglish
            ? 'Car added to favorites'
            : 'تمت إضافة السيارة إلى المفضلة'
        )
      } else {
        alert(
          isEnglish
            ? 'Car removed from favorites'
            : 'تمت إزالة السيارة من المفضلة'
        )
      }
    } catch (err) {
      console.error(
        'Favorite request error:',
        err
      )

      alert(
        isEnglish
          ? `Connection error: ${
              err.message ||
              'Unable to connect to the server'
            }`
          : `خطأ في الاتصال: ${
              err.message ||
              'تعذر الاتصال بالخادم'
            }`
      )
    } finally {
      setIsLoading(false)
    }
  }

  // تنسيق السعر
  const formatPrice = (price) => {
    const formattedPrice =
      new Intl.NumberFormat(
        isEnglish
          ? 'en-US'
          : 'ar-SA'
      ).format(price)

    return isEnglish
      ? `$${formattedPrice}`
      : `${formattedPrice} $`
  }

  // تحديد نوع الوقود حسب اللغة
  const getFuelType = () => {
    // اللغة الإنجليزية
    if (isEnglish && car.fuelTypeEn) {
      return car.fuelTypeEn
    }

    // اللغة العربية
    if (car.fuelType) {
      return car.fuelType
    }

    // Fallback للبيانات القديمة
    if (
      car.features?.some(
        (feature) =>
          feature.includes('هجين') ||
          feature.includes('كهربائي')
      )
    ) {
      return isEnglish
        ? 'Hybrid'
        : 'هجين'
    }

    return isEnglish
      ? 'Gasoline'
      : 'بنزين'
  }

  return (
    <div className="car-card glass-card">

      {/* صورة السيارة */}
      <div className="car-card-image-wrapper">
        <img
          src={car.image}
          alt={carName}
          className="car-card-image"
          loading="lazy"
        />

        {/* Overlay عند Hover */}
        <div className="image-overlay">
          <Link
            to={`/car/${carId}`}
            className="overlay-btn view-btn"
          >
            <FaEye />
            {viewDetailsLabel}
          </Link>
        </div>

        {/* شارة جديدة */}
        {car.year >= 2023 && (
          <span className="car-badge new-badge">
            {newLabel}
          </span>
        )}
      </div>

      {/* معلومات السيارة */}
      <div className="car-card-content">

        {/* الشركة */}
        <div className="car-brand">
          {manufacturer}
        </div>

        {/* اسم السيارة */}
        <h3 className="car-name">
          <Link to={`/car/${carId}`}>
            {carName}
          </Link>
        </h3>

        {/* المواصفات السريعة */}
        <div className="car-specs">

          <div className="spec-item">
            <FaCalendarAlt className="spec-icon" />
            <span>
              {car.year}
            </span>
          </div>

          <div className="spec-item">
            <FaTachometerAlt className="spec-icon" />

            <span>
              {new Intl.NumberFormat(
                isEnglish
                  ? 'en-US'
                  : 'ar-SA'
              ).format(car.mileage)}
              {' '}
              {mileageUnit}
            </span>
          </div>

          <div className="spec-item">
            <FaGasPump className="spec-icon" />

            <span>
              {getFuelType()}
            </span>
          </div>

        </div>

        {/* السعر والأزرار */}
        <div className="car-card-footer">

          <div className="car-price">
            <span className="price-amount">
              {formatPrice(car.price)}
            </span>
          </div>

          <div className="card-actions">

            {/* المفضلة */}
            <button
              type="button"
              className={`action-btn favorite-btn ${
                isFavorited
                  ? 'active'
                  : ''
              }`}
              onClick={handleToggleFavorite}
              disabled={isLoading}
              aria-label={
                isFavorited
                  ? removeFavoriteLabel
                  : addFavoriteLabel
              }
              title={
                !user
                  ? (
                    isEnglish
                      ? 'Please login first'
                      : 'يجب تسجيل الدخول أولاً'
                  )
                  : (
                    isFavorited
                      ? removeFavoriteLabel
                      : addFavoriteLabel
                  )
              }
            >
              {isFavorited ? (
                <FaHeart
                  style={{
                    color: '#e74c3c'
                  }}
                />
              ) : (
                <FaRegHeart />
              )}
            </button>

            {/* التفاصيل */}
            <Link
              to={`/car/${carId}`}
              className="action-btn details-btn"
            >
              {detailsLabel}
            </Link>

          </div>
        </div>

      </div>
    </div>
  )
}

export default CarCard
