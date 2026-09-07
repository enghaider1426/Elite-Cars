/**
 * قسم المميزات - يعرض مزايا المعرض
 */
import { FaShieldAlt, FaHandshake, FaAward, FaClock, FaHeadset, FaTools } from 'react-icons/fa'
import './FeaturesSection.css'

const features = [
  {
    icon: <FaShieldAlt />,
    title: 'ضمان الجودة',
    description: 'جميع سياراتنا تخضع لفحص شامل من 150 نقطة'
  },
  {
    icon: <FaHandshake />,
    title: 'أسعار عادلة',
    description: 'نقدم أفضل الأسعار في السوق مع شفافية كاملة'
  },
  {
    icon: <FaAward />,
    title: 'خبرة 20 عاماً',
    description: 'نخبة من الخبراء في مجال السيارات الفاخرة'
  },
  {
    icon: <FaClock />,
    title: 'تسليم سريع',
    description: 'إجراءات سريعة ومبسطة للحصول على سيارتك'
  },
  {
    icon: <FaHeadset />,
    title: 'دعم 24/7',
    description: 'فريق خدمة عملاء متاح على مدار الساعة'
  },
  {
    icon: <FaTools />,
    title: 'صيانة مجانية',
    description: 'خدمة صيانة مجانية للسنة الأولى'
  }
]

function FeaturesSection() {
  return (
    <section className="features-section">
      <div className="container">
        <h2 className="section-title">لماذا تختارنا؟</h2>
        <p className="section-subtitle">نقدم لك تجربة فريدة في شراء السيارات الفاخرة</p>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="feature-card glass-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="feature-icon-wrapper">
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FeaturesSection