/**
 * صفحة تفاصيل السيارة - عرض كامل المعلومات
 */
import { useState, useEffect } from 'react'
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom'
import {
  FaCalendarAlt, FaTachometerAlt, FaGasPump, FaCog,
  FaPalette, FaCar, FaArrowRight, FaPhone, FaWhatsapp,
  FaShareAlt, FaHeart, FaCheck, FaTrash, FaRegHeart
} from 'react-icons/fa'
import { useAuth } from '../Auth/AuthContext'
import useFavorites from '../Auth/useFavorites'
import { useLanguage } from '../Context/LanguageContext'
import './CarDetails.css'

function CarDetails({ cars, onDeleteCar, onView }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const { language, t } = useLanguage()

  const { user } = useAuth()
  const { isFavorite, toggleFavorite } = useFavorites()

  const [shareMessage, setShareMessage] = useState(false)

  const car = cars.find(
    (c) => c.id?.toString() === id || c._id?.toString() === id
  )

  const carId = car
    ? String(car._id || car.id)
    : ''

  const favorited = car
    ? isFavorite(carId)
    : false

  // تتبع المشاهدة الأخيرة
  useEffect(() => {
    if (carId && onView) {
      onView(carId)
    }
  }, [carId, onView])

  // إذا لم يتم العثور على السيارة
  if (!car) {
    return <Navigate to="/inventory" replace />
  }

  // =========================================================
  // اختيار بيانات السيارة حسب اللغة
  // =========================================================

  const isEnglish = language === 'en'

  const carName = isEnglish
    ? (car.nameEn || car.name)
    : car.name

  const manufacturer = isEnglish
    ? (car.manufacturerEn || car.manufacturer)
    : car.manufacturer

  const model = isEnglish
    ? (car.modelEn || car.model)
    : car.model

  const description = isEnglish
    ? (car.descriptionEn || car.description)
    : car.description

  const features = isEnglish
    ? (
        car.featuresEn?.length
          ? car.featuresEn
          : car.features
      )
    : car.features

  const bodyType = isEnglish
    ? (car.bodyTypeEn || car.bodyType || 'Sedan')
    : (car.bodyType || 'سيدان')

  const fuelType = isEnglish
    ? (car.fuelTypeEn || car.fuelType || 'Gasoline')
    : (car.fuelType || 'بنزين')

  const transmission = isEnglish
    ? (
        car.transmissionEn ||
        car.transmission ||
        'Automatic'
      )
    : (
        car.transmission ||
        'أوتوماتيك'
      )

  const carColor = isEnglish
    ? (car.colorEn || car.color || 'White')
    : (car.color || 'أبيض')

  // تنسيق السعر
  const formatPrice = (price) => {
    return new Intl.NumberFormat(
      language === 'en' ? 'en-US' : 'ar-SA'
    ).format(price) + ' $'
  }

  // مشاركة الرابط
  const handleShare = async () => {
    const shareData = {
      title: carName,
      text: `${carName} - ${formatPrice(car.price)}`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(
          window.location.href
        )

        setShareMessage(true)

        setTimeout(
          () => setShareMessage(false),
          2000
        )
      }
    } catch {
      // المستخدم ألغى المشاركة
    }
  }

  // إضافة / إزالة السيارة من المفضلة
  const handleFavorite = async () => {
    if (!user) {
      alert(
        t('يجب تسجيل الدخول أولاً لإضافة السيارة إلى المفضلة')
      )
      return
    }

    try {
      await toggleFavorite(carId)

      if (favorited) {
        alert(
          t('تمت إزالة السيارة من المفضلة')
        )
      } else {
        alert(
          `${t('تمت إضافة السيارة إلى المفضلة')} ❤️`
        )
      }
    } catch (error) {
      console.error('Favorite error:', error)

      alert(
        t(error.message || 'حدث خطأ أثناء تحديث المفضلة')
      )
    }
  }

  // حذف السيارة - فقط للمسؤولين
  const handleDelete = async () => {
    if (
      window.confirm(
        t('هل أنت متأكد من حذف هذه السيارة؟')
      )
    ) {
      await onDeleteCar(car.id || car._id)
      setTimeout(() => navigate('/inventory'), 500)
    }
  }

  // شارة الحالة
  const statusConfig = {
    available: {
      label: t('متاح'),
      className: 'status-badge status-available'
    },
    sold: {
      label: t('مباع'),
      className: 'status-badge status-sold'
    },
    reserved: {
      label: t('محجوز'),
      className: 'status-badge status-reserved'
    }
  }

  const statusInfo = car.status
    ? statusConfig[car.status]
    : null

  const specifications = [
    {
      icon: <FaCalendarAlt />,
      label: t('سنة الصنع'),
      value: car.year
    },
    {
      icon: <FaTachometerAlt />,
      label: t('المسافة'),
      value: `${new Intl.NumberFormat(
        language === 'en' ? 'en-US' : 'ar-SA'
      ).format(car.mileage)} ${language === 'en' ? 'km' : 'كم'}`
    },
    {
      icon: <FaGasPump />,
      label: t('نوع الوقود'),
      value: fuelType
    },
    {
      icon: <FaCog />,
      label: t('ناقل الحركة'),
      value: transmission
    },
    {
      icon: <FaPalette />,
      label: t('اللون'),
      value: carColor
    },
    {
      icon: <FaCar />,
      label: t('نوع الهيكل'),
      value: bodyType
    }
  ]

  // سيارات ذات صلة (نفس الشركة المصنعة)
  const relatedCars = (() => {
    const sameManufacturer = cars.filter(
      c =>
        c.manufacturer === car.manufacturer &&
        String(c._id || c.id) !== carId
    )

    if (sameManufacturer.length >= 3) {
      return sameManufacturer.slice(0, 3)
    }

    if (sameManufacturer.length > 0) {
      const others = cars.filter(
        c =>
          c.manufacturer !== car.manufacturer &&
          String(c._id || c.id) !== carId
      )

      return [
        ...sameManufacturer,
        ...others
      ].slice(0, 3)
    }

    return cars
      .filter(
        c => String(c._id || c.id) !== carId
      )
      .slice(0, 3)
  })()

  return (
    <div className="car-details-page">

      {/* Header */}
      <section className="details-header">
        <div className="container">

          <Link
            to="/inventory"
            className="back-link"
          >
            <FaArrowRight />
            {t('العودة للمعرض')}
          </Link>

          <div className="header-info">

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                flexWrap: 'wrap'
              }}
              data-no-auto-translate
            >
              <span className="car-brand-tag">
                {manufacturer}
              </span>

              {statusInfo && (
                <span className={statusInfo.className}>
                  {statusInfo.label}
                </span>
              )}
            </div>

            <h1
              className="car-details-title"
              data-no-auto-translate
            >
              {carName}
            </h1>

            <span
              className="car-model"
              data-no-auto-translate
            >
              {model}
            </span>

          </div>
        </div>
      </section>

      {/* المحتوى الرئيسي */}
      <section className="details-content">
        <div className="container">

          <div className="details-grid">

            {/* الصورة */}
            <div className="details-image-section">

              <div className="main-image-wrapper glass-card">

                <img
                  src={car.image}
                  alt={carName}
                  className="main-car-image"
                  loading="lazy"
                  decoding="async"
                />

                <div className="image-actions">

                  <button
                    className={`image-action-btn ${
                      shareMessage ? 'shared' : ''
                    }`}
                    onClick={handleShare}
                    aria-label={t('مشاركة')}
                    title={
                      shareMessage
                        ? t('تم النسخ!')
                        : t('مشاركة')
                    }
                  >
                    <FaShareAlt />
                  </button>

                  <button
                    className={`image-action-btn favorite ${
                      favorited ? 'active' : ''
                    }`}
                    onClick={handleFavorite}
                    aria-label={
                      favorited
                        ? t('إزالة من المفضلة')
                        : t('أضف للمفضلة')
                    }
                    title={
                      favorited
                        ? t('إزالة من المفضلة')
                        : t('أضف للمفضلة')
                    }
                  >
                    {favorited
                      ? <FaHeart />
                      : <FaRegHeart />}
                  </button>

                </div>
              </div>

              {/* السعر الكبير */}
              <div className="details-price-card glass-card">

                <span className="price-label">
                  {t('السعر')}
                </span>

                <span className="price-big">
                  {formatPrice(car.price)}
                </span>

                <div className="price-actions">

                  <a
                    href="tel:+994406787168"
                    className="btn btn-primary"
                  >
                    <FaPhone />
                    {t('اتصل الآن')}
                  </a>

                  <a
                    href="https://wa.me/994406787168"
                    className="btn whatsapp-btn"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaWhatsapp />
                    {t('واتساب')}
                  </a>

                  {user?.role === 'admin' && (
                    <button
                      onClick={handleDelete}
                      className="btn btn-danger"
                      aria-label={t('حذف السيارة')}
                    >
                      <FaTrash />
                      {t('حذف')}
                    </button>
                  )}

                </div>
              </div>
            </div>

            {/* المعلومات */}
            <div className="details-info-section">

              {/* المواصفات */}
              <div className="specs-card glass-card">

                <h3 className="card-heading">
                  {t('المواصفات')}
                </h3>

                <div
                  className="specs-grid"
                  data-no-auto-translate
                >

                  {specifications.map((spec, i) => (
                    <div
                      key={i}
                      className="spec-detail"
                    >

                      <span className="spec-detail-icon">
                        {spec.icon}
                      </span>

                      <div className="spec-detail-info">

                        <span className="spec-detail-label">
                          {spec.label}
                        </span>

                        <span className="spec-detail-value">
                          {spec.value}
                        </span>

                      </div>
                    </div>
                  ))}

                </div>
              </div>

              {/* الوصف */}
              <div className="description-card glass-card">

                <h3 className="card-heading">
                  {t('الوصف')}
                </h3>

                <p
                  className="description-text"
                  data-no-auto-translate
                >
                  {description}
                </p>

              </div>

              {/* المميزات */}
              {features?.length > 0 && (
                <div className="features-card glass-card">

                  <h3 className="card-heading">
                    {t('المميزات')}
                  </h3>

                  <ul
                    className="features-list"
                    data-no-auto-translate
                  >

                    {features.map((feature, i) => (
                      <li key={i}>
                        <FaCheck className="check-icon" />
                        {feature}
                      </li>
                    ))}

                  </ul>

                </div>
              )}

            </div>
          </div>

          {/* سيارات ذات صلة */}
          {relatedCars.length > 0 && (
            <section className="related-cars-section">

              <h3
                className="card-heading"
                style={{
                  marginTop: '50px',
                  fontSize: '1.4rem',
                  textAlign: 'center'
                }}
              >
                {t('سيارات قد تعجبك')}
              </h3>

              <div
                className="related-cars-grid"
                data-no-auto-translate
              >

                {relatedCars.map(rc => {
                  const relatedName = isEnglish
                    ? (rc.nameEn || rc.name)
                    : rc.name

                  const relatedManufacturer = isEnglish
                    ? (rc.manufacturerEn || rc.manufacturer)
                    : rc.manufacturer

                  return (
                    <Link
                      key={rc._id || rc.id}
                      to={`/car/${rc._id || rc.id}`}
                      className="related-car-card glass-card"
                    >

                      <img
                        src={rc.image}
                        alt={relatedName}
                        className="related-car-image"
                        loading="lazy"
                        decoding="async"
                      />

                      <div className="related-car-info">

                        <span className="related-car-brand">
                          {relatedManufacturer}
                        </span>

                        <span className="related-car-name">
                          {relatedName}
                        </span>

                        <span className="related-car-price">
                          {formatPrice(rc.price)}
                        </span>

                      </div>

                    </Link>
                  )
                })}

              </div>
            </section>
          )}

        </div>
      </section>
    </div>
  )
}

export default CarDetails