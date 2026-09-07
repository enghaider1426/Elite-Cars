
/**
 * الملف الرئيسي للتطبيق - Router + Auth + Protected Routes
 */
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './Auth/AuthContext'

// مسارات صحيحة (حساسة لحالة الأحرف على Linux)
const Home = lazy(() => import('./Pages/Home'))
const Inventory = lazy(() => import('./Pages/Inventory'))
const AddCar = lazy(() => import('./Pages/AddCar'))
const CarDetails = lazy(() => import('./Pages/CarDetails'))
const NotFound = lazy(() => import('./Pages/NotFound'))
const AdminDashboard = lazy(() => import('./Pages/AdminDashboard'))
const ProfilePage = lazy(() => import('./Pages/ProfilePage'))

// Auth
const RegisterPage = lazy(() => import('./Auth/RegisterPage'))
const NewLoginPage = lazy(() => import('./Pages/LoginPage'))
const OAuthCallback = lazy(() => import('./Pages/OAuthCallback'))
const VerifyEmail = lazy(() => import('./Pages/VerifyEmail'))
const ResetPasswordPage = lazy(() => import('./Pages/ResetPasswordPage'))

// صفحة التحقق الجديدة
const Email = lazy(() => import('./Auth/Email'))

import { ProtectedRoute, AdminRoute } from './Auth/ProtectedRoute'

// Components
import Navbar from './Components/Navbar'
import Footer from './Components/Footer'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Reference car data for MongoDB seeding
 * To use: Run `node server/utils/seedCars.js`
 * These cars will be populated in MongoDB with their actual ObjectIds
 */
const REFERENCE_CARS = [
  {
    name: 'مرسيدس S-Class',
    manufacturer: 'مرسيدس بنز',
    model: 'S500',
    year: 2023, price: 85000, mileage: 15000,
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
    description: 'سيارة سيدان فاخرة تجمع بين الأداء العالي والرفاهية المطلقة. تتميز بمقصورة هادئة ومريحة مع أحدث تقنيات القيادة الذكية وشاشة MBUX العملاقة.',
    features: ['شاشة MBUX', 'مقاعد جلدية', 'نظام صوتي Burmester', 'قيادة شبه ذاتية'],
    color: 'أسود أوبسيديان', fuelType: 'بنزين', transmission: 'أوتوماتيك', bodyType: 'سيدان فاخرة',
    status: 'available'
  },
  {
    name: 'BMW M4',
    manufacturer: 'بي ام دبليو',
    model: 'M4 Competition',
    year: 2023, price: 62000, mileage: 8000,
    image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80',
    description: 'كوبيه رياضية قوية بمحرك Twin Turbo سداسي الأسطوانات. توفر تجربة قيادة مثالية مع نظام xDrive للدفع الرباعي.',
    features: ['Twin Turbo', 'xDrive', 'مقاعد M Sport', 'نظام M Drive Professional'],
    color: 'أزرق مارينا', fuelType: 'بنزين', transmission: 'أوتوماتيك', bodyType: 'كوبيه',
    status: 'available'
  },
  {
    name: 'أودي R8',
    manufacturer: 'أودي',
    model: 'R8 V10',
    year: 2022, price: 72000, mileage: 12500,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
    description: 'سوبر سيارة فاخرة بأداء متفوق وتصميم حاد. مزودة بمحرك V10 طبيعي الشفط ونظام quattro للدفع الرباعي.',
    features: ['محرك V10', 'نظام quattro', 'شاشة Audi Virtual Cockpit', 'مقاعد رياضية'],
    color: 'رمادي ناري', fuelType: 'بنزين', transmission: 'أوتوماتيك', bodyType: 'كوبيه',
    status: 'available'
  },
  {
    name: 'لامبورغيني هوراكان',
    manufacturer: 'لامبورغيني',
    model: 'Huracán EVO',
    year: 2022, price: 98000, mileage: 9000,
    image: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=800&q=80',
    description: 'سيارة خارقة بتصميم إيروديناميكي جرئ ومحرك V10 قوي. نظام التحكم الديناميكي LDVI يوفر أداءً استثنائياً على كل الطرق.',
    features: ['تصميم إيروديناميكي', 'نظام تحكم ديناميكي LDVI', 'محرك V10', 'نظام هروب'],
    color: 'أخضر مانتين', fuelType: 'بنزين', transmission: 'أوتوماتيك', bodyType: 'كوبيه',
    status: 'available'
  },
  {
    name: 'رولز رويس فانتوم',
    manufacturer: 'رولز رويس',
    model: 'Phantom',
    year: 2023, price: 155000, mileage: 5000,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
    description: 'قمة الفخامة والهدوء في كل رحلة. تتميز بمقصورة صامتة بالكامل وأفضل أنواع الجلد والخشب الطبيعي.',
    features: ['مقصورة فاخرة', 'نظام صوتي ممتاز', 'سقف نجومي', 'جلد طبيعي فاخر'],
    color: 'أبيض لؤلؤي', fuelType: 'بنزين', transmission: 'أوتوماتيك', bodyType: 'سيدان فاخرة',
    status: 'available'
  },
  {
    name: 'بوجاتي شيرون',
    manufacturer: 'بوجاتي',
    model: 'Chiron',
    year: 2021, price: 420000, mileage: 3000,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    description: 'رمز السرعة والترف. محرك W16 رباعي التوربو ينتج 1500 حصان مع تصميم خارق يجمع بين الفخامة والأداء المذهل.',
    features: ['محرك W16 رباعي توربو', 'سرعة قصوى 420 كم/س', 'تصميم خارق', 'مقصورة جلدية بالكامل'],
    color: 'أزرق فرنسي', fuelType: 'بنزين', transmission: 'أوتوماتيك', bodyType: 'سيدان رياضية',
    status: 'available'
  }
]

/**
 * حفظ سيارة في قائمة مشاهدة مؤخراً
 */
function saveRecentlyViewed(carId) {
  try {
    let list = JSON.parse(localStorage.getItem('elite-cars-recently-viewed') || '[]')
    list = list.filter(id => id !== carId)
    list.unshift(carId)
    list = list.slice(0, 20)
    localStorage.setItem('elite-cars-recently-viewed', JSON.stringify(list))
  } catch { /* ignore */ }
}

/**
 * Root Index Route - Show Home for authenticated, redirect to login for unauthenticated
 */
function RootRoute(props) {
  const { user, loading } = useAuth()

  if (loading) {
    return <RouteLoader />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Authenticated users see the Home page
  return <Home cars={props.cars} />
}

/**
 * محمّل بسيط أثناء تحميل الصفحات المؤجّلة (lazy) — يمنع الشاشة الفارغة
 * بدون أي تأثير على الهوية البصرية للموقع.
 */
function RouteLoader() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="جاري التحميل"
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          border: '3px solid rgba(0,0,0,0.12)',
          borderTopColor: '#b8945a',
          display: 'inline-block',
          animation: 'elite-route-spin 0.7s linear infinite',
        }}
      />
      <style>{`@keyframes elite-route-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

function AppContent() {
  const { user, logout } = useAuth()
  const [cars, setCars] = useState([])
  const location = useLocation()

  // صفحات المصادقة مستقلة تمامًا: بدون Header / Navbar / Footer
  // (تتضمن صفحات استعادة/إعادة تعيين كلمة المرور والتحقق من البريد)
  const AUTH_ROUTES = ['/login', '/register', '/reset-password', '/forgot-password', '/verify-email']
  const isAuthPage = AUTH_ROUTES.includes(location.pathname)

  // جلب السيارات من MongoDB فقط (استخدم seedCars.js لإضافة السيارات)
  useEffect(() => {
    const fetchCars = async () => {
      try {
        const allCars = []
        let page = 1
        let pages = 1

        do {
          const response = await fetch(`${API_BASE_URL}/cars?page=${page}&limit=100`, {
            credentials: 'include'
          })
          if (!response.ok) return

          const carsFromDb = await response.json()
          const carsList = carsFromDb.data || carsFromDb.cars || carsFromDb

          if (Array.isArray(carsList)) {
            allCars.push(...carsList)
          }

          pages = Number(carsFromDb.pagination?.pages) || page
          page += 1
        } while (page <= pages)

        if (allCars.length > 0) {
          const mapped = allCars.map((car) => ({
            ...car,
            status: car.status || 'available'
          }))
          setCars(mapped)
        }
      } catch { /* API غير متاح */ }
    }
    fetchCars()
  }, [])

  const addCar = useCallback(async (newCar) => {
    try {
      const headers = { 'Content-Type': 'application/json' }

      const allowedFields = ['name', 'manufacturer', 'model', 'year', 'price', 'mileage', 'image', 'description', 'features', 'color', 'fuelType', 'transmission', 'bodyType', 'status']
      const sanitized = {}
      for (const key of allowedFields) {
        if (newCar[key] !== undefined) {
          sanitized[key] = key === 'features' && typeof newCar[key] === 'string'
            ? newCar[key].split(',').map((f) => f.trim()).filter(Boolean)
            : newCar[key]
        }
      }
      if (typeof sanitized.features === 'string') {
        sanitized.features = sanitized.features.split(',').map(f => f.trim()).filter(Boolean)
      }

      const response = await fetch(`${API_BASE_URL}/cars`, {
        method: 'POST',
        headers,
        body: JSON.stringify(sanitized),
        credentials: 'include',
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'حدث خطأ')
      
      // MongoDB returns car with _id
      const savedCar = data.car || data.data?.car || data
      setCars((prev) => [...prev, {
        ...savedCar,
        status: savedCar.status || 'available'
      }])

      return true
    } catch (err) {
      // Show error to user - don't add car locally if API fails
      alert(`فشل إضافة السيارة: ${err.message}`)
      return false
    }
  }, [])

  const deleteCar = useCallback(async (carId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/cars/${carId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || 'فشل حذف السيارة')
      }
    } catch (err) {
      alert(`فشل حذف السيارة: ${err.message || 'تعذر الاتصال بالخادم'}`)
      return false
    }

    setCars((prev) => prev.filter((car) =>
      String(car.id) !== String(carId) && String(car._id) !== String(carId)
    ))

    return true
  }, [])

  // تمرير لأعلى عند تغيير الصفحة
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [location.pathname])

  // === MAIN APP ===
  return (
    <div className="app">
      {!isAuthPage && <Navbar carsCount={cars.length} user={user} onLogout={logout} />}
      <main className="main-content">
        <Suspense fallback={<RouteLoader />}>
          <Routes>
            <Route path='/' element={<RootRoute cars={cars} />} />
            <Route path='/inventory' element={<Inventory cars={cars} />} />
            <Route path='/car/:id' element={<CarDetails cars={cars} onDeleteCar={deleteCar} onView={saveRecentlyViewed} />} />
            <Route path='/login' element={<NewLoginPage />} />
            <Route path='/register' element={<RegisterPage />} />
            {/* تدفق استعادة كلمة المرور: الرابط من البريد يصل هنا */}
            <Route path='/reset-password' element={<ResetPasswordPage />} />
            <Route path='/forgot-password' element={<ResetPasswordPage />} />
            <Route path='/add-car' element={<AdminRoute><AddCar onAddCar={addCar} /></AdminRoute>} />
            <Route path='/admin' element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path='/profile' element={<ProtectedRoute><ProfilePage cars={cars} /></ProtectedRoute>} />
            <Route path='*' element={<NotFound />} />
            <Route path='/auth/callback' element={<OAuthCallback />} />

            {/* صفحة التحقق الجديدة */}
            <Route path='/verify-email' element={<Email />} />
          </Routes>
        </Suspense>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}
