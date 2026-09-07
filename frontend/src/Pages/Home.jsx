/**
 * الصفحة الرئيسية - تجمع كل الأقسام
 */
import Hero from '../Components/Hero'
import CarGrid from '../Components/CarGrid'
import FeaturesSection from '../Components/FeaturesSection'
import StatsSection from '../Components/StatsSection'
import { Link } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa'
import { useAuth } from '../Auth/AuthContext'
import './Home.css'

function Home({ cars }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const featuredCars = cars.slice(0, 3)

  return (
    <div className="home-page">
      {/* Hero Section */}
      <Hero />

      {/* السيارات المميزة */}
      <section className="featured-section">
        <div className="container">
          <CarGrid 
            cars={featuredCars}
            title="السيارات المميزة"
            subtitle="اختياراتنا الأكثر تميزاً هذا الشهر"
          />
          <div className="view-all-wrapper">
            <Link to="/inventory" className="btn btn-secondary">
              عرض جميع السيارات
              <FaArrowLeft />
            </Link>
          </div>
        </div>
      </section>

      {/* قسم الإحصائيات */}
      <StatsSection />

      {/* قسم المميزات */}
      <FeaturesSection />

      {/* Call To Action */}
      <section className="cta-section">
        <div className="cta-overlay"></div>
        <div className="container">
          <div className="cta-content">
            <h2>هل تبحث عن سيارة أحلامك؟</h2>
            <p>تصفح معرضنا واحصل على أفضل العروض</p>
            <div className="cta-buttons">
              <Link to="/inventory" className="btn btn-primary btn-lg">
                اكتشف المعرض الآن
              </Link>
              {isAdmin && (
                <Link to="/add-car" className="btn btn-secondary btn-lg">
                  بيع سيارتك
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home