/**
 * شريط البحث والفلترة - تصميم عصري مع أيقونات
 */
import { useState, useMemo } from 'react'
import { FaSearch, FaSlidersH } from 'react-icons/fa'
import { useLanguage } from '../Context/LanguageContext'
import './SearchBar.css'

function SearchBar({ onSearch, onFilter, cars }) {
  const { language } = useLanguage()
  const isEnglish = language === 'en'

  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    brand: 'all',
    price: 'all',
    fuelType: 'all',
    transmission: 'all',
    year: 'all'
  })

  const [showFilters, setShowFilters] = useState(false)

  // استخراج القيم المتاحة من بيانات السيارات
  const availableBrands = useMemo(() => {
    if (!cars) return []

    return [
      ...new Set(
        cars
          .map(c =>
            isEnglish
              ? (c.manufacturerEn || c.manufacturer)
              : c.manufacturer
          )
          .filter(Boolean)
      )
    ]
  }, [cars, isEnglish])

  const availableFuelTypes = useMemo(() => {
    if (!cars) return []

    return [
      ...new Set(
        cars
          .map(c =>
            isEnglish
              ? (c.fuelTypeEn || c.fuelType)
              : c.fuelType
          )
          .filter(Boolean)
      )
    ]
  }, [cars, isEnglish])

  const availableTransmissions = useMemo(() => {
    if (!cars) return []

    return [
      ...new Set(
        cars
          .map(c =>
            isEnglish
              ? (c.transmissionEn || c.transmission)
              : c.transmission
          )
          .filter(Boolean)
      )
    ]
  }, [cars, isEnglish])

  const availableYears = useMemo(() => {
    if (!cars) return []

    return [
      ...new Set(
        cars
          .map(c => c.year)
          .filter(Boolean)
      )
    ].sort((a, b) => b - a)
  }, [cars])

  // حساب نطاق الأسعار ديناميكياً
  const getDynamicPriceRanges = () => {
    if (!cars || cars.length === 0) {
      return [
        {
          value: 'all',
          label: isEnglish ? 'All Prices' : 'جميع الأسعار'
        }
      ]
    }

    const prices = cars
      .map(c => Number(c.price))
      .filter(Boolean)

    if (prices.length === 0) {
      return [
        {
          value: 'all',
          label: isEnglish ? 'All Prices' : 'جميع الأسعار'
        }
      ]
    }

    const minPrice = Math.min(...prices)
    const maxPrice = Math.max(...prices)
    const mid = Math.floor((minPrice + maxPrice) / 2)

    return [
      {
        value: 'all',
        label: isEnglish ? 'All Prices' : 'جميع الأسعار'
      },
      {
        value: `${minPrice}-${mid}`,
        label: `${new Intl.NumberFormat('en-US').format(minPrice)} - ${new Intl.NumberFormat('en-US').format(mid)} $`
      },
      {
        value: `${mid + 1}-${maxPrice}`,
        label: `${new Intl.NumberFormat('en-US').format(mid + 1)} - ${new Intl.NumberFormat('en-US').format(maxPrice)} $`
      },
      {
        value: `${maxPrice + 1}+`,
        label: isEnglish
          ? `More than ${new Intl.NumberFormat('en-US').format(maxPrice)} $`
          : `أكثر من ${new Intl.NumberFormat('en-US').format(maxPrice)} $`
      }
    ]
  }

  // بناء نطاقات السنوات
  const getYearRanges = () => {
    if (availableYears.length === 0) {
      return [
        {
          value: 'all',
          label: isEnglish ? 'All Years' : 'جميع السنوات'
        }
      ]
    }

    const ranges = [
      {
        value: 'all',
        label: isEnglish ? 'All Years' : 'جميع السنوات'
      }
    ]

    const recent2024 = availableYears.filter(y => y >= 2024)
    const range2021 = availableYears.filter(
      y => y >= 2021 && y < 2024
    )

    if (recent2024.length > 0) {
      ranges.push({
        value: '2024-2025',
        label: '2024 - 2025'
      })
    }

    if (range2021.length > 0) {
      ranges.push({
        value: '2021-2023',
        label: '2021 - 2023'
      })
    }

    availableYears.forEach(y => {
      if (y >= 2024 || (y >= 2021 && y < 2024)) return

      const exists = ranges.some(
        r => r.value === String(y)
      )

      if (!exists) {
        ranges.push({
          value: String(y),
          label: String(y)
        })
      }
    })

    return ranges
  }

  const brands = ['all', ...availableBrands]
  const priceRanges = getDynamicPriceRanges()
  const fuelTypes = ['all', ...availableFuelTypes]
  const transmissions = ['all', ...availableTransmissions]
  const yearRanges = getYearRanges()

  const handleSearch = (e) => {
    const value = e.target.value

    setSearchTerm(value)

    if (onSearch) {
      onSearch(value)
    }
  }

  const handleFilterChange = (type, value) => {
    const updatedFilters = {
      ...filters,
      [type]: value
    }

    setFilters(updatedFilters)

    if (onFilter) {
      onFilter(updatedFilters)
    }
  }

  return (
    <div className="search-bar-wrapper">
      <div className="search-bar glass-card">

        {/* حقل البحث */}
        <div className="search-input-wrapper">
          <FaSearch className="search-icon" />

          <input
            type="text"
            placeholder={
              isEnglish
                ? 'Search for your favorite car...'
                : 'ابحث عن سيارتك المفضلة...'
            }
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>

        {/* زر الفلاتر */}
        <button
          className={`filter-toggle-btn ${
            showFilters ? 'active' : ''
          }`}
          onClick={() =>
            setShowFilters(!showFilters)
          }
        >
          <FaSlidersH />

          <span>
            {isEnglish ? 'Filter' : 'فلتر'}
          </span>
        </button>
      </div>

      {/* لوحة الفلاتر */}
      <div
        className={`filters-panel ${
          showFilters ? 'open' : ''
        }`}
      >
        <div className="filters-grid">

          {/* فلتر الماركة */}
          <div className="filter-group">
            <label className="filter-label">
              {isEnglish ? 'Brand' : 'الماركة'}
            </label>

            <select
              value={filters.brand}
              onChange={(e) =>
                handleFilterChange(
                  'brand',
                  e.target.value
                )
              }
              className="filter-select"
            >
              {brands.map(brand => (
                <option
                  key={brand}
                  value={brand}
                >
                  {brand === 'all'
                    ? (
                        isEnglish
                          ? 'All Brands'
                          : 'جميع الماركات'
                      )
                    : brand}
                </option>
              ))}
            </select>
          </div>

          {/* فلتر السعر */}
          <div className="filter-group">
            <label className="filter-label">
              {isEnglish
                ? 'Price Range'
                : 'نطاق السعر'}
            </label>

            <select
              value={filters.price}
              onChange={(e) =>
                handleFilterChange(
                  'price',
                  e.target.value
                )
              }
              className="filter-select"
            >
              {priceRanges.map(range => (
                <option
                  key={range.value}
                  value={range.value}
                >
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* فلتر نوع الوقود */}
          <div className="filter-group">
            <label className="filter-label">
              {isEnglish
                ? 'Fuel Type'
                : 'نوع الوقود'}
            </label>

            <select
              value={filters.fuelType}
              onChange={(e) =>
                handleFilterChange(
                  'fuelType',
                  e.target.value
                )
              }
              className="filter-select"
            >
              {fuelTypes.map(ft => (
                <option
                  key={ft}
                  value={ft}
                >
                  {ft === 'all'
                    ? (
                        isEnglish
                          ? 'All Types'
                          : 'جميع الأنواع'
                      )
                    : ft}
                </option>
              ))}
            </select>
          </div>

          {/* فلتر ناقل الحركة */}
          <div className="filter-group">
            <label className="filter-label">
              {isEnglish
                ? 'Transmission'
                : 'ناقل الحركة'}
            </label>

            <select
              value={filters.transmission}
              onChange={(e) =>
                handleFilterChange(
                  'transmission',
                  e.target.value
                )
              }
              className="filter-select"
            >
              {transmissions.map(tr => (
                <option
                  key={tr}
                  value={tr}
                >
                  {tr === 'all'
                    ? (
                        isEnglish
                          ? 'All Types'
                          : 'جميع الأنواع'
                      )
                    : tr}
                </option>
              ))}
            </select>
          </div>

          {/* فلتر سنة الصنع */}
          <div className="filter-group">
            <label className="filter-label">
              {isEnglish
                ? 'Year'
                : 'سنة الصنع'}
            </label>

            <select
              value={filters.year}
              onChange={(e) =>
                handleFilterChange(
                  'year',
                  e.target.value
                )
              }
              className="filter-select"
            >
              {yearRanges.map(yr => (
                <option
                  key={yr.value}
                  value={yr.value}
                >
                  {yr.label}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>
    </div>
  )
}

export default SearchBar