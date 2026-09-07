/**
 * Inventory page - Display all cars with search and filtering
 */
import { useState, useMemo } from 'react'
import SearchBar from '../Components/SearchBar'
import CarGrid from '../Components/CarGrid'
import { useLanguage } from '../Context/LanguageContext'
import './Inventory.css'

function Inventory({ cars }) {
  const { language } = useLanguage()

  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    brand: 'all',
    price: 'all',
    fuelType: 'all',
    transmission: 'all',
    year: 'all'
  })

  const isEnglish = language === 'en'

  // Filter and search cars
  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      const name = isEnglish
        ? (car.nameEn || car.name || '')
        : (car.name || '')

      const manufacturer = isEnglish
        ? (car.manufacturerEn || car.manufacturer || '')
        : (car.manufacturer || '')

      const model = isEnglish
        ? (car.modelEn || car.model || '')
        : (car.model || '')

      const fuelType = isEnglish
        ? (car.fuelTypeEn || car.fuelType || '')
        : (car.fuelType || '')

      const transmission = isEnglish
        ? (car.transmissionEn || car.transmission || '')
        : (car.transmission || '')

      // Text search
      const normalizedSearch = searchTerm.trim().toLowerCase()

      const matchesSearch =
        normalizedSearch === '' ||
        name.toLowerCase().includes(normalizedSearch) ||
        manufacturer.toLowerCase().includes(normalizedSearch) ||
        model.toLowerCase().includes(normalizedSearch)

      // Brand filter
      const matchesBrand =
        filters.brand === 'all' ||
        manufacturer === filters.brand

      // Price filter
      let matchesPrice = true

      if (filters.price !== 'all') {
        const rangeStr = filters.price.replace('+', '')
        const parts = rangeStr.split('-')

        if (parts.length === 2) {
          const min = parseInt(parts[0], 10)
          const max = parseInt(parts[1], 10)

          matchesPrice =
            Number(car.price) >= min &&
            Number(car.price) <= max
        } else {
          matchesPrice =
            Number(car.price) >= parseInt(parts[0], 10)
        }
      }

      // Fuel type filter
      const matchesFuel =
        filters.fuelType === 'all' ||
        fuelType === filters.fuelType

      // Transmission filter
      const matchesTransmission =
        filters.transmission === 'all' ||
        transmission === filters.transmission

      // Year filter
      let matchesYear = true

      if (filters.year !== 'all') {
        const yearRange = filters.year.split('-')

        if (yearRange.length === 2) {
          const minY = parseInt(yearRange[0], 10)
          const maxY = parseInt(yearRange[1], 10)

          matchesYear =
            Number(car.year) >= minY &&
            Number(car.year) <= maxY
        } else {
          matchesYear =
            String(car.year) === filters.year
        }
      }

      return (
        matchesSearch &&
        matchesBrand &&
        matchesPrice &&
        matchesFuel &&
        matchesTransmission &&
        matchesYear
      )
    })
  }, [cars, searchTerm, filters, isEnglish])

  const handleSearch = (term) => {
    setSearchTerm(term)
  }

  const handleFilter = (newFilters) => {
    setFilters(newFilters)
  }

  return (
    <div className="inventory-page">
      {/* Header */}
      <section className="page-header">
        <div className="container">
          <h1 className="page-title">
            {isEnglish ? 'Inventory' : 'المعرض'}
          </h1>

          <p className="page-subtitle">
            {isEnglish
              ? 'Discover our curated collection of luxury cars'
              : 'اكتشف مجموعتنا المختارة من السيارات الفاخرة'}
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="inventory-content">
        <div className="container">
          <SearchBar
            cars={cars}
            onSearch={handleSearch}
            onFilter={handleFilter}
          />

          {/* Results count */}
          <div className="results-count">
            <span>
              {isEnglish
                ? `Showing ${filteredCars.length} ${
                    filteredCars.length === 1 ? 'car' : 'cars'
                  }`
                : `عرض ${filteredCars.length} ${
                    filteredCars.length === 1 ? 'سيارة' : 'سيارات'
                  }`}
            </span>

            {searchTerm && (
              <span>
                {isEnglish
                  ? `Search result: "${searchTerm}"`
                  : `نتيجة البحث: "${searchTerm}"`}
              </span>
            )}
          </div>

          <CarGrid cars={filteredCars} />
        </div>
      </section>
    </div>
  )
}

export default Inventory