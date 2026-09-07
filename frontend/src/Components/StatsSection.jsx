/**
 * قسم الإحصائيات - أرقام احترافية ثابتة
 */
import { useEffect, useRef, useState } from 'react'
import { useLanguage } from '../Context/LanguageContext'
import './StatsSection.css'

const stats = [
  { number: 150, suffix: '+', label: 'سيارة فاخرة' },
  { number: 25, suffix: '+', label: 'ماركة عالمية' },
  { number: 1200, suffix: '+', label: 'عميل راضي' },
  { number: 15, suffix: '+', label: 'سنة خبرة' }
]

function StatsSection() {
  const { language } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.3 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section className="stats-section" ref={sectionRef}>
      <div className="stats-overlay"></div>
      <div className="container">
        <div className="stats-grid">
          {stats.map((stat, index) => (
            <div key={index} className="stat-item">
              <div className="stat-number">
                {isVisible ? (
                  <CounterAnimation 
                    target={stat.number} 
                    suffix={stat.suffix}
                    duration={2000}
                    language={language}
                  />
                ) : (
                  <span>0{stat.suffix}</span>
                )}
              </div>
              <div className="stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CounterAnimation({ target, suffix, duration, language }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime
    let animationFrame

    const animate = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const easeOutQuart = 1 - Math.pow(1 - progress, 4)
      setCount(Math.floor(easeOutQuart * target))

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate)
      }
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [target, duration])

  return (
    <span>
      {count.toLocaleString(language === 'en' ? 'en-US' : 'ar-SA')}{suffix}
    </span>
  )
}

export default StatsSection
