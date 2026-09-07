/**
 * قسم البطل الرئيسي - Hero Section مع خلفية متحركة
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaArrowLeft, FaStar } from 'react-icons/fa'
import './Hero.css'

function CounterAnimation({ target, duration = 2000 }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime = null
    let animationFrame = null

    const animate = (timestamp) => {
      if (startTime === null) {
        startTime = timestamp
      }

      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOut = 1 - Math.pow(1 - progress, 4)
      const nextCount = Math.floor(easeOut * target)

      setCount(nextCount)

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [target, duration])

  return (
    <span className="counter-value" translate="no">
      {count}
      <span className="counter-suffix">+</span>
    </span>
  )
}

function Hero() {
  return (
    <section className="hero">
      {/* الخلفية مع Overlay */}
      <div className="hero-background">
        <img 
          src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920&q=80" 
          alt="سيارة فاخرة"
          className="hero-bg-image" decoding="async" fetchPriority="high"
        />
        <div className="hero-overlay"></div>
      </div>

      {/* المحتوى */}
      <div className="hero-container">
        <div className="hero-content"> 
          {/* الشارة */}
          <div className="hero-badge animate-fade-in-up">
            <FaStar className="badge-icon" />
            <span>معرض السيارات الفاخرة #1 في المنطقة</span>
          </div>

          {/* العنوان الرئيسي */}
          <h1 className="hero-title animate-fade-in-up" style={{animationDelay: '0.1s'}}>
            اكتشف عالم
            <span className="title-highlight"> السيارات الفاخرة</span>
          </h1>

          {/* الوصف */}
          <p className="hero-description animate-fade-in-up" style={{animationDelay: '0.2s'}}>
            نقدم لك مجموعة مختارة من أرقى السيارات العالمية بأفضل الأسعار 
            وضمان الجودة والخدمة المتميزة
          </p>

          {/* الأزرار */}
          <div className="hero-buttons animate-fade-in-up" style={{animationDelay: '0.3s'}}>
            <Link to="/inventory" className="btn btn-primary btn-lg">
              <FaArrowLeft />
              استكشف المعرض
            </Link>
          </div>

          {/* الإحصائيات السريعة */}
          <div className="hero-stats animate-fade-in-up" style={{animationDelay: '0.4s'}}>
            <div className="hero-stat">
              <span className="stat-number">
                <CounterAnimation target={150} />
              </span>
              <span className="stat-label">سيارة فاخرة</span>
            </div>

            <div className="stat-divider"></div>

            <div className="hero-stat">
              <span className="stat-number">
                <CounterAnimation target={25} />
              </span>
              <span className="stat-label">ماركة عالمية</span>
            </div>

            <div className="stat-divider"></div>

            <div className="hero-stat">
              <span className="stat-number">
                <CounterAnimation target={1200} />
              </span>
              <span className="stat-label">عميل سعيد</span>
            </div>
          </div>
        </div>

        {/* صورة السيارة البارزة */}
        <div className="hero-image-wrapper animate-slide-in-right" style={{animationDelay: '0.3s'}}>
          <div className="hero-image-container">
            <img 
              src="https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80" 
              alt="BMW M4"
              className="hero-car-image" loading="lazy" decoding="async"
            />
            <div className="image-glow"></div>
          </div>
          
          {/* بطاقة السعر العائمة */}
          <div className="floating-price-card glass-card">
            <span className="price-label">السعر يبدأ من</span>
            <span className="price-value">62,000 $</span>
            <span className="price-car">BMW M4 Competition</span>
          </div>
        </div>
      </div>

      {/* مؤشر التمرير */}
      <div className="scroll-indicator">
        <div className="scroll-line"></div>
        <span>اسحب للأسفل</span>
      </div>
    </section>
  )
}

export default Hero