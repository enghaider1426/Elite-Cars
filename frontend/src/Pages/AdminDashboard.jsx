import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  FaCar,
  FaCheckCircle,
  FaUsers,
  FaDollarSign,
  FaEye,
  FaTrash,
  FaSync
} from 'react-icons/fa'
import './AdminDashboard.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
const authOptions = () => ({ credentials: 'include' })

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    users: 0,
    sold: 0
  })

  const [cars, setCars] = useState([])
  const [users, setUsers] = useState([])

  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingCars, setLoadingCars] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)

  const [error, setError] = useState(null)

  // حذف السيارات
  const [confirmDelete, setConfirmDelete] = useState(null)

  // حذف المستخدمين
  const [confirmDeleteUser, setConfirmDeleteUser] = useState(null)

  const [toast, setToast] = useState({
    show: false,
    message: '',
    type: 'success'
  })

  const showToast = (message, type = 'success') => {
    setToast({
      show: true,
      message,
      type
    })

    setTimeout(() => {
      setToast(prev => ({
        ...prev,
        show: false
      }))
    }, 3000)
  }

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch(
        `${API}/auth/users?page=1&limit=100`,
        authOptions()
      )

      if (!res.ok) {
        throw new Error('فشل تحميل المستخدمين')
      }

      const data = await res.json()
      const firstPage = Array.isArray(data.data) ? data.data : []
      const totalPages = Number(data.pagination?.pages) || 1
      const usersList = [...firstPage]

      for (let page = 2; page <= totalPages; page += 1) {
        const pageRes = await fetch(
          `${API}/auth/users?page=${page}&limit=100`,
          authOptions()
        )
        if (!pageRes.ok) break
        const pageData = await pageRes.json()
        if (Array.isArray(pageData.data)) {
          usersList.push(...pageData.data)
        }
      }

      setUsers(usersList)

      setStats(prev => ({
        ...prev,
        users: Number(data.pagination?.total) || usersList.length
      }))
    } catch (err) {
      console.error('Users error:', err)
    }
  }, [])

  const fetchCars = useCallback(async () => {
    try {
      const res = await fetch(
        `${API}/cars?page=1&limit=100`,
        authOptions()
      )

      if (!res.ok) {
        throw new Error('فشل تحميل السيارات')
      }

      const data = await res.json()
      const firstPage = Array.isArray(data.data) ? data.data : []
      const totalPages = Number(data.pagination?.pages) || 1
      const safeCars = [...firstPage]

      for (let page = 2; page <= totalPages; page += 1) {
        const pageRes = await fetch(
          `${API}/cars?page=${page}&limit=100`,
          authOptions()
        )
        if (!pageRes.ok) break
        const pageData = await pageRes.json()
        if (Array.isArray(pageData.data)) {
          safeCars.push(...pageData.data)
        }
      }

      setCars(safeCars)

      setStats(prev => ({
        ...prev,
        total: Number(data.pagination?.total) || safeCars.length,
        available: safeCars.filter(
          c => c.status === 'available'
        ).length,
        sold: safeCars.filter(
          c => c.status === 'sold'
        ).length
      }))
    } catch (err) {
      setError(err.message)
    }
  }, [])

  useEffect(() => {
    const loadAll = async () => {
      setLoadingStats(true)
      setLoadingCars(true)
      setLoadingUsers(true)
      setError(null)

      await Promise.all([
        fetchCars(),
        fetchUsers()
      ])

      setLoadingStats(false)
      setLoadingCars(false)
      setLoadingUsers(false)
    }

    loadAll()
  }, [fetchCars, fetchUsers])

  // حذف سيارة
  const handleDelete = async () => {
    if (!confirmDelete) return

    try {
      const res = await fetch(
        `${API}/cars/${confirmDelete}`,
        {
          method: 'DELETE',
          ...authOptions()
        }
      )

      if (!res.ok) {
        throw new Error('فشل حذف السيارة')
      }

      setCars(prev =>
        prev.filter(
          c => c._id !== confirmDelete
        )
      )

      showToast('تم حذف السيارة بنجاح')

      fetchCars()
    } catch (err) {
      showToast(err.message, 'error')
    }

    setConfirmDelete(null)
  }

  // حذف مستخدم
  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return

    try {
      const res = await fetch(
        `${API}/auth/users/${confirmDeleteUser}`,
        {
          method: 'DELETE',
          ...authOptions()
        }
      )

      let data = {}

      try {
        data = await res.json()
      } catch {
        data = {}
      }

      if (!res.ok) {
        throw new Error(
          data.message || 'فشل حذف المستخدم'
        )
      }

      setUsers(prev =>
        prev.filter(
          u => (u._id || u.id) !== confirmDeleteUser
        )
      )

      setStats(prev => ({
        ...prev,
        users: Math.max(prev.users - 1, 0)
      }))

      showToast(
        data.message || 'تم حذف المستخدم بنجاح'
      )

      // تحديث القائمة للتأكد من مزامنة البيانات
      fetchUsers()
    } catch (err) {
      showToast(
        err.message || 'فشل حذف المستخدم',
        'error'
      )
    }

    setConfirmDeleteUser(null)
  }

  const handleChangeRole = async (
    userId,
    newRole
  ) => {
    try {
      const res = await fetch(
        `${API}/auth/users/${userId}/role`,
        {
          method: 'PUT',
          ...authOptions(),
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            role: newRole
          })
        }
      )

      if (!res.ok) {
        throw new Error('فشل تغيير الدور')
      }

      setUsers(prev =>
        prev.map(u =>
          u._id === userId
            ? {
                ...u,
                role: newRole
              }
            : u
        )
      )

      showToast('تم تغيير الدور بنجاح')
    } catch (err) {
      showToast(err.message, 'error')
    }
  }

  const handleRefresh = () => {
    setLoadingStats(true)
    setLoadingCars(true)
    setLoadingUsers(true)
    setError(null)

    Promise.all([
      fetchCars(),
      fetchUsers()
    ]).finally(() => {
      setLoadingStats(false)
      setLoadingCars(false)
      setLoadingUsers(false)
    })
  }

  const getStatusText = status => {
    switch (status) {
      case 'available':
        return 'متاحة'

      case 'sold':
        return 'مباعة'

      case 'reserved':
        return 'محجوزة'

      default:
        return status || 'غير محدد'
    }
  }

  const formatDate = dateStr => {
    if (!dateStr) return '-'

    try {
      return new Date(dateStr).toLocaleDateString(
        'ar-AZ'
      )
    } catch {
      return '-'
    }
  }

  const getCarImage = car => {
    if (car.images?.length > 0) {
      return car.images[0]
    }

    if (car.image) {
      return car.image
    }

    return ''
  }

  const getCarName = car =>
    car.name ||
    car.title ||
    `${car.brand || ''} ${car.model || ''}`.trim() ||
    '-'

  const getCarBrand = car =>
    car.brand ||
    car.make ||
    '-'

  const getCarPrice = car => {
    const price =
      car.price ||
      car.priceUSD ||
      0

    return `${Number(price).toLocaleString('ar-AZ')} $`
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-content">

        {/* رأس الصفحة */}
        <div className="dashboard-header">
          <h1>لوحة تحكم المسؤول</h1>
          <p>
            إدارة السيارات والمستخدمين والعمليات
          </p>
        </div>

        {/* بطاقات الإحصائيات */}
        {loadingStats ? (
          <div className="loading-state">
            <div className="loading-spinner" />
          </div>
        ) : (
          <div className="stats-grid animate-fade-in-up">

            <div className="stat-card">
              <div className="stat-icon">
                <FaCar />
              </div>

              <div className="stat-info">
                <span className="stat-number">
                  {stats.total}
                </span>

                <span className="stat-label">
                  إجمالي السيارات
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaCheckCircle />
              </div>

              <div className="stat-info">
                <span className="stat-number">
                  {stats.available}
                </span>

                <span className="stat-label">
                  السيارات المتاحة
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaUsers />
              </div>

              <div className="stat-info">
                <span className="stat-number">
                  {stats.users}
                </span>

                <span className="stat-label">
                  المستخدمين
                </span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">
                <FaDollarSign />
              </div>

              <div className="stat-info">
                <span className="stat-number">
                  {stats.sold}
                </span>

                <span className="stat-label">
                  السيارات المباعة
                </span>
              </div>
            </div>

          </div>
        )}

        {/* جدول السيارات الأخيرة */}
        <div className="dashboard-section animate-fade-in-up">

          <div className="dashboard-section-header">
            <h2>السيارات الأخيرة</h2>

            <button
              className="table-action-btn role-btn"
              onClick={handleRefresh}
              title="تحديث"
            >
              <FaSync />
            </button>
          </div>

          {loadingCars ? (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          ) : error ? (
            <div className="error-state">
              <p>{error}</p>

              <button
                className="retry-btn"
                onClick={handleRefresh}
              >
                إعادة المحاولة
              </button>
            </div>
          ) : cars.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                <FaCar />
              </div>

              <p>لا توجد سيارات بعد</p>
            </div>
          ) : (
            <>
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">

                  <thead>
                    <tr>
                      <th>الصورة</th>
                      <th>اسم السيارة</th>
                      <th>الشركة</th>
                      <th>السعر</th>
                      <th>الحالة</th>
                      <th>الإجراءات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {cars
                      .slice(0, 10)
                      .map(car => (
                        <tr
                          key={
                            car._id ||
                            car.id
                          }
                        >
                          <td>
                            {getCarImage(car) ? (
                              <img
                                src={getCarImage(car)}
                                alt={getCarName(car)}
                                className="table-car-thumb"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div
                                style={{
                                  width: 60,
                                  height: 45,
                                  borderRadius: 8,
                                  background:
                                    'var(--glass-bg)',
                                  display: 'flex',
                                  alignItems:
                                    'center',
                                  justifyContent:
                                    'center'
                                }}
                              >
                                <FaCar
                                  style={{
                                    color:
                                      'var(--text-muted)',
                                    fontSize:
                                      '0.8rem'
                                  }}
                                />
                              </div>
                            )}
                          </td>

                          <td>
                            {getCarName(car)}
                          </td>

                          <td>
                            {getCarBrand(car)}
                          </td>

                          <td
                            style={{
                              fontWeight: 600,
                              color:
                                'var(--primary-gold)'
                            }}
                          >
                            {getCarPrice(car)}
                          </td>

                          <td>
                            <span
                              className={`status-badge ${
                                car.status ||
                                'available'
                              }`}
                            >
                              {getStatusText(
                                car.status
                              )}
                            </span>
                          </td>

                          <td>
                            <div className="table-actions">

                              <Link
                                to={`/car/${
                                  car._id ||
                                  car.id
                                }`}
                                className="table-action-btn"
                                title="عرض"
                              >
                                <FaEye />
                              </Link>

                              <button
                                className="table-action-btn danger"
                                title="حذف"
                                onClick={() =>
                                  setConfirmDelete(
                                    car._id ||
                                    car.id
                                  )
                                }
                              >
                                <FaTrash />
                              </button>

                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>

                </table>
              </div>

              {/* عرض الموبايل */}
              {cars
                .slice(0, 10)
                .map(car => (
                  <div
                    key={
                      car._id ||
                      car.id
                    }
                    className="mobile-car-card"
                  >
                    <div className="mobile-car-card-top">

                      {getCarImage(car) ? (
                        <img
                          src={getCarImage(car)}
                          alt={getCarName(car)}
                          className="table-car-thumb"
                          loading="lazy"
                          decoding="async"
                        />
                      ) : (
                        <div
                          style={{
                            width: 60,
                            height: 45,
                            borderRadius: 8,
                            background:
                              'var(--glass-bg)',
                            display: 'flex',
                            alignItems:
                              'center',
                            justifyContent:
                              'center'
                          }}
                        >
                          <FaCar
                            style={{
                              color:
                                'var(--text-muted)',
                              fontSize:
                                '0.8rem'
                            }}
                          />
                        </div>
                      )}

                      <div className="mobile-car-card-info">
                        <h4>
                          {getCarName(car)}
                        </h4>

                        <span>
                          {getCarBrand(car)}
                        </span>
                      </div>

                    </div>

                    <div className="mobile-car-card-bottom">

                      <div
                        style={{
                          display: 'flex',
                          alignItems:
                            'center',
                          gap: 12
                        }}
                      >
                        <span
                          className={`status-badge ${
                            car.status ||
                            'available'
                          }`}
                        >
                          {getStatusText(
                            car.status
                          )}
                        </span>

                        <span className="price">
                          {getCarPrice(car)}
                        </span>
                      </div>

                      <div className="table-actions">

                        <Link
                          to={`/car/${
                            car._id ||
                            car.id
                          }`}
                          className="table-action-btn"
                          title="عرض"
                        >
                          <FaEye />
                        </Link>

                        <button
                          className="table-action-btn danger"
                          title="حذف"
                          onClick={() =>
                            setConfirmDelete(
                              car._id ||
                              car.id
                            )
                          }
                        >
                          <FaTrash />
                        </button>

                      </div>

                    </div>
                  </div>
                ))}
            </>
          )}
        </div>

        {/* جدول المستخدمين */}
        <div className="dashboard-section animate-fade-in-up">

          <div className="dashboard-section-header">
            <h2>المستخدمين</h2>
          </div>

          {loadingUsers ? (
            <div className="loading-state">
              <div className="loading-spinner" />
            </div>
          ) : users.length === 0 ? (
            <div className="empty-state">

              <div className="empty-state-icon">
                <FaUsers />
              </div>

              <p>لا يوجد مستخدمين بعد</p>
            </div>
          ) : (
            <div
              className="dashboard-table-wrapper"
              style={{ display: 'block' }}
            >
              <table className="dashboard-table">

                <thead>
                  <tr>
                    <th>الاسم</th>
                    <th>البريد</th>
                    <th>الدور</th>
                    <th>تاريخ التسجيل</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {users
                    .slice(0, 20)
                    .map(u => (
                      <tr
                        key={
                          u._id ||
                          u.id
                        }
                      >

                        <td
                          style={{
                            fontWeight: 600
                          }}
                        >
                          {u.name || '-'}
                        </td>

                        <td
                          style={{
                            color:
                              'var(--text-secondary)',
                            direction:
                              'ltr',
                            textAlign:
                              'right'
                          }}
                        >
                          {u.email || '-'}
                        </td>

                        <td>
                          <span
                            className={
                              u.role === 'admin'
                                ? 'role-badge-admin'
                                : 'role-badge-user'
                            }
                          >
                            {u.role === 'admin'
                              ? 'مسؤول'
                              : 'مستخدم'}
                          </span>
                        </td>

                        <td
                          style={{
                            color:
                              'var(--text-secondary)'
                          }}
                        >
                          {formatDate(
                            u.createdAt
                          )}
                        </td>

                        <td>
                          <div className="table-actions">

                            {/* تغيير الدور */}
                            <button
                              className="table-action-btn role-btn"
                              title={
                                u.role === 'admin'
                                  ? 'إزالة الإدارة'
                                  : 'ترقية لمسؤول'
                              }
                              onClick={() =>
                                handleChangeRole(
                                  u._id ||
                                  u.id,
                                  u.role ===
                                    'admin'
                                    ? 'user'
                                    : 'admin'
                                )
                              }
                            >
                              <FaUsers />
                            </button>

                            {/* حذف المستخدم */}
                            <button
                              className="table-action-btn danger"
                              title="حذف المستخدم"
                              onClick={() =>
                                setConfirmDeleteUser(
                                  u._id ||
                                  u.id
                                )
                              }
                            >
                              <FaTrash />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))}
                </tbody>

              </table>
            </div>
          )}
        </div>
      </div>

      {/* حوار تأكيد حذف السيارة */}
      {confirmDelete && (
        <div
          className="confirm-overlay"
          onClick={() =>
            setConfirmDelete(null)
          }
        >
          <div
            className="confirm-dialog"
            onClick={e =>
              e.stopPropagation()
            }
          >
            <h3>تأكيد الحذف</h3>

            <p>
              هل أنت متأكد من حذف هذه السيارة؟
              لا يمكن التراجع عن هذا الإجراء.
            </p>

            <div className="confirm-actions">

              <button
                className="confirm-cancel"
                onClick={() =>
                  setConfirmDelete(null)
                }
              >
                إلغاء
              </button>

              <button
                className="confirm-delete"
                onClick={handleDelete}
              >
                حذف
              </button>

            </div>
          </div>
        </div>
      )}

      {/* حوار تأكيد حذف المستخدم */}
      {confirmDeleteUser && (
        <div
          className="confirm-overlay"
          onClick={() =>
            setConfirmDeleteUser(null)
          }
        >
          <div
            className="confirm-dialog"
            onClick={e =>
              e.stopPropagation()
            }
          >
            <h3>تأكيد حذف المستخدم</h3>

            <p>
              هل أنت متأكد من حذف هذا المستخدم؟
              لا يمكن التراجع عن هذا الإجراء.
            </p>

            <div className="confirm-actions">

              <button
                className="confirm-cancel"
                onClick={() =>
                  setConfirmDeleteUser(null)
                }
              >
                إلغاء
              </button>

              <button
                className="confirm-delete"
                onClick={handleDeleteUser}
              >
                حذف المستخدم
              </button>

            </div>
          </div>
        </div>
      )}

      {/* رسالة منبثقة */}
      <div
        className={`toast-message ${toast.type} ${
          toast.show ? 'show' : ''
        }`}
      >
        {toast.message}
      </div>
    </div>
  )
}