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
  const [deleteLoading, setDeleteLoading] = useState(false)

  // =========================================================
  // ترجمة الوصف الديناميكي
  // =========================================================
  const [translatedDescription, setTranslatedDescription] = useState('')

  // =========================================================
  // حماية البيانات
  // =========================================================
  const safeCars = Array.isArray(cars) ? cars : []

  const car = safeCars.find(
    (c) => c?.id?.toString() === id || c?._id?.toString() === id
  )

  const carId = car
    ? String(car._id || car.id || '')
    : ''

  const favorited = carId
    ? isFavorite(carId)
    : false

  const isEnglish = language === 'en'

  // =========================================================
  // التحقق من وجود حروف عربية
  // =========================================================
  const containsArabic = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return false
    }

    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
      String(value)
    )
  }

  // =========================================================
  // إزالة التكرار المتجاور في النص
  // مثال:
  // Porsche Porsche 911
  // تصبح:
  // Porsche 911
  // =========================================================
  const removeRepeatedWords = (value) => {
    if (
      value === null ||
      value === undefined
    ) {
      return ''
    }

    const text = String(value).trim()

    if (!text) {
      return ''
    }

    const words = text.split(/\s+/)
    const result = []

    for (let i = 0; i < words.length; i++) {
      const current = words[i]
      const previous = result[result.length - 1]

      if (
        previous &&
        current.toLowerCase() === previous.toLowerCase()
      ) {
        continue
      }

      result.push(current)
    }

    return result.join(' ')
  }

  // =========================================================
  // صورة بديلة عند فقدان الصورة
  // =========================================================
  const fallbackImage =
    "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='500' viewBox='0 0 800 500'%3E%3Crect width='800' height='500' fill='%23141414'/%3E%3Cpath d='M160 330h480l-55-100H215z' fill='none' stroke='%23666666' stroke-width='8'/%3E%3Ccircle cx='270' cy='350' r='35' fill='none' stroke='%23666666' stroke-width='8'/%3E%3Ccircle cx='530' cy='350' r='35' fill='none' stroke='%23666666' stroke-width='8'/%3E%3Ctext x='400' y='180' text-anchor='middle' fill='%23888888' font-size='28' font-family='Arial'%3EElite Cars%3C/text%3E%3Ctext x='400' y='430' text-anchor='middle' fill='%23666666' font-size='20' font-family='Arial'%3EImage unavailable%3C/text%3E%3C/svg%3E"

  const handleImageError = (event) => {
    if (
      event.currentTarget.src === fallbackImage
    ) {
      return
    }

    event.currentTarget.src = fallbackImage
  }

  // =========================================================
  // تتبع مشاهدة السيارة
  // =========================================================
  useEffect(() => {
    if (carId && onView) {
      onView(carId)
    }
  }, [carId, onView])

  // =========================================================
  // عرض وصف السيارة
  // =========================================================
  useEffect(() => {
    if (!car) {
      setTranslatedDescription('')
      return
    }

    const sourceDescription =
      car.description !== null &&
      car.description !== undefined
        ? String(car.description).trim()
        : ''

    const existingEnglishDescription =
      car.descriptionEn !== null &&
      car.descriptionEn !== undefined
        ? String(car.descriptionEn).trim()
        : ''

    // العربية:
    // عرض النص الأصلي بدون أي تعديل
    if (!isEnglish) {
      setTranslatedDescription(sourceDescription)
      return
    }

    // الإنجليزية + توجد ترجمة محفوظة مسبقاً
    if (
      existingEnglishDescription &&
      !containsArabic(existingEnglishDescription)
    ) {
      setTranslatedDescription(
        removeRepeatedWords(existingEnglishDescription)
      )
      return
    }

    // الإنجليزية + لا توجد ترجمة
    // نرجع للنص الأصلي بدلاً من إظهار Translation unavailable
    setTranslatedDescription(
      removeRepeatedWords(sourceDescription)
    )
  }, [
    car?.id,
    car?._id,
    car?.description,
    car?.descriptionEn,
    isEnglish
  ])

  // =========================================================
  // إذا لم يتم العثور على السيارة
  // =========================================================
  if (!car) {
    return <Navigate to="/inventory" replace />
  }

  // =========================================================
  // أدوات حماية البيانات والترجمة
  // =========================================================
  const safeText = (value, fallback = '—') => {
    if (
      value === null ||
      value === undefined ||
      String(value).trim() === ''
    ) {
      return fallback
    }

    return String(value)
  }

  const translateCarValue = (
    arabicValue,
    englishValue,
    fallbackEnglish = '—',
    fallbackArabic = '—'
  ) => {
    if (isEnglish) {
      if (
        englishValue !== null &&
        englishValue !== undefined &&
        String(englishValue).trim() !== ''
      ) {
        return String(englishValue)
      }

      if (
        arabicValue !== null &&
        arabicValue !== undefined &&
        String(arabicValue).trim() !== ''
      ) {
        return t(String(arabicValue))
      }

      return fallbackEnglish
    }

    return safeText(arabicValue, fallbackArabic)
  }

  // =========================================================
  // بيانات السيارة
  // =========================================================
  const carName = translateCarValue(
    car.name,
    car.nameEn,
    'Car',
    'سيارة'
  )

  const manufacturer = translateCarValue(
    car.manufacturer,
    car.manufacturerEn,
    '—',
    '—'
  )

  const model = translateCarValue(
    car.model,
    car.modelEn,
    '—',
    '—'
  )

  const description = translateCarValue(
    car.description,
    car.descriptionEn,
    'No description available.',
    'لا يوجد وصف متاح.'
  )

  // =========================================================
  // المميزات
  // =========================================================
  const arabicFeatures = Array.isArray(car.features)
    ? car.features
    : []

  const englishFeatures = Array.isArray(car.featuresEn)
    ? car.featuresEn
    : []

  const features = isEnglish
    ? (
        englishFeatures.length > 0
          ? englishFeatures
          : arabicFeatures
              .filter(
                feature =>
                  feature !== null &&
                  feature !== undefined &&
                  String(feature).trim() !== ''
              )
              .map(feature => t(String(feature)))
      )
    : arabicFeatures.filter(
        feature =>
          feature !== null &&
          feature !== undefined &&
          String(feature).trim() !== ''
      )

  // =========================================================
  // المواصفات
  // =========================================================
  const bodyType = translateCarValue(
    car.bodyType,
    car.bodyTypeEn,
    'Sedan',
    'سيدان'
  )

  const fuelType = translateCarValue(
    car.fuelType,
    car.fuelTypeEn,
    'Gasoline',
    'بنزين'
  )

  const transmission = translateCarValue(
    car.transmission,
    car.transmissionEn,
    'Automatic',
    'أوتوماتيك'
  )

  const carColor = translateCarValue(
    car.color,
    car.colorEn,
    'White',
    'أبيض'
  )

  // =========================================================
  // السعر
  // =========================================================
  const numericPrice = Number(car.price)

  const formatPrice = (price) => {
    const validPrice = Number(price)

    if (!Number.isFinite(validPrice)) {
      return '—'
    }

    return new Intl.NumberFormat(
      language === 'en' ? 'en-US' : 'ar-SA'
    ).format(validPrice) + ' $'
  }

  // =========================================================
  // مشاركة الرابط
  // =========================================================
  const handleShare = async () => {
    const shareData = {
      title: carName,
      text: `${carName} - ${formatPrice(numericPrice)}`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
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
      // المستخدم ألغى المشاركة أو المتصفح منعها
    }
  }

  // =========================================================
  // المفضلة
  // =========================================================
  const handleFavorite = async () => {
    if (!user) {
      alert(
        t('يجب تسجيل الدخول أولاً لإضافة السيارة إلى المفضلة')
      )
      return
    }

    if (!carId) {
      alert(
        t('تعذر تحديد السيارة')
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
        t(
          error?.message ||
          'حدث خطأ أثناء تحديث المفضلة'
        )
      )
    }
  }

  // =========================================================
  // حذف السيارة
  // =========================================================
  const handleDelete = async () => {
    if (deleteLoading) {
      return
    }

    if (user?.role !== 'admin') {
      alert(
        t('ليس لديك صلاحية حذف السيارة')
      )
      return
    }

    if (!carId) {
      alert(
        t('تعذر تحديد السيارة المراد حذفها')
      )
      return
    }

    if (typeof onDeleteCar !== 'function') {
      console.error(
        'Delete error: onDeleteCar is not available'
      )

      alert(
        t('تعذر تنفيذ عملية الحذف حالياً')
      )

      return
    }

    const confirmed = window.confirm(
      t('هل أنت متأكد من حذف هذه السيارة؟')
    )

    if (!confirmed) {
      return
    }

    setDeleteLoading(true)

    try {
      await onDeleteCar(carId)

      alert(
        t('تم حذف السيارة بنجاح')
      )

      navigate('/inventory', { replace: true })
    } catch (error) {
      console.error('Delete car error:', error)

      alert(
        t(
          error?.message ||
          'حدث خطأ أثناء حذف السيارة'
        )
      )
    } finally {
      setDeleteLoading(false)
    }
  }

  // =========================================================
  // الحالة
  // =========================================================
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

  // =========================================================
  // المواصفات
  // =========================================================
  const validMileage = Number(car.mileage)

  const formattedMileage = Number.isFinite(validMileage)
    ? new Intl.NumberFormat(
        language === 'en' ? 'en-US' : 'ar-SA'
      ).format(validMileage)
    : '—'

  const specifications = [
    {
      icon: <FaCalendarAlt />,
      label: t('سنة الصنع'),
      value: car.year || '—'
    },

    {
      icon: <FaTachometerAlt />,
      label: t('المسافة'),
      value: `${formattedMileage} ${
        language === 'en' ? 'km' : 'كم'
      }`
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

  // =========================================================
  // سيارات ذات صلة
  // =========================================================
  const relatedCars = (() => {
    const sameManufacturer = safeCars.filter(
      c =>
        c &&
        c.manufacturer &&
        car.manufacturer &&
        c.manufacturer === car.manufacturer &&
        String(c._id || c.id || '') !== carId
    )

    if (sameManufacturer.length >= 3) {
      return sameManufacturer.slice(0, 3)
    }

    if (sameManufacturer.length > 0) {
      const others = safeCars.filter(
        c =>
          c &&
          c.manufacturer !== car.manufacturer &&
          String(c._id || c.id || '') !== carId
      )

      return [
        ...sameManufacturer,
        ...others
      ].slice(0, 3)
    }

    return safeCars
      .filter(
        c =>
          c &&
          String(c._id || c.id || '') !== carId
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
                  src={car.image || fallbackImage}
                  alt={carName}
                  className="main-car-image"
                  loading="lazy"
                  decoding="async"
                  onError={handleImageError}
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
                  {formatPrice(numericPrice)}
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
                      disabled={deleteLoading}
                    >
                      <FaTrash />

                      {deleteLoading
                        ? t('جاري الحذف...')
                        : t('حذف')}
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
                          {safeText(spec.value)}
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
                  {isEnglish
                    ? (
                        translatedDescription ||
                        description
                      )
                    : description}
                </p>

              </div>

              {/* المميزات */}
              {features.length > 0 && (
                <div className="features-card glass-card">

                  <h3 className="card-heading">
                    {t('المميزات')}
                  </h3>

                  <ul className="features-list">

                    {features.map((feature, i) => (
                      <li key={i}>
                        <FaCheck className="check-icon" />
                        {safeText(feature)}
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

                  const relatedName = translateCarValue(
                    rc.name,
                    rc.nameEn,
                    'Car',
                    'سيارة'
                  )

                  const relatedManufacturer =
                    translateCarValue(
                      rc.manufacturer,
                      rc.manufacturerEn,
                      '—',
                      '—'
                    )

                  return (
                    <Link
                      key={rc._id || rc.id}
                      to={`/car/${rc._id || rc.id}`}
                      className="related-car-card glass-card"
                    >

                      <img
                        src={rc.image || fallbackImage}
                        alt={relatedName}
                        className="related-car-image"
                        loading="lazy"
                        decoding="async"
                        onError={handleImageError}
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
