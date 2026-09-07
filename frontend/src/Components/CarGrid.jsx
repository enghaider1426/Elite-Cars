/**
* Car grid - Responsive Grid
*/
import CarCard from './CarCard'
import { useLanguage } from '../Context/LanguageContext'
import './CarGrid.css'

function CarGrid({ cars, title, subtitle }) {
  const { language } = useLanguage()
  const isEnglish = language === 'en'

  if (!cars || cars.length === 0) {
    return (
      <div className="no-results">
        <div className="no-results-icon">🚗</div>
        <h3>{isEnglish ? 'No cars found' : 'لم يتم العثور على سيارات'}</h3>
        <p>{isEnglish ? "We couldn't find any cars matching your search" : 'لم نتمكن من العثور على سيارات تطابق بحثك'}</p>
      </div>
    )
  }

  return (
    <section className="car-grid-section">
      {(title || subtitle) && (
        <div className="section-header">
          {title && <h2 className="section-title">{title}</h2>}
          {subtitle && <p className="section-subtitle">{subtitle}</p>}
        </div>
      )}
      
      <div className="car-grid">
        {cars.map((car) => (
          <CarCard key={car._id || car.id} car={car} />
        ))}
      </div>
    </section>
  )
}

export default CarGrid