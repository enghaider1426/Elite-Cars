import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const AuthContext = createContext(null)

const API = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '')

const request = (url, options = {}) =>
  fetch(url, {
    ...options,
    credentials: 'include'
  })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [favorites, setFavorites] = useState([])

  const loadFavorites = useCallback(async () => {
    try {
      const res = await request(`${API}/api/auth/favorites`)

      if (!res.ok) return

      const data = await res.json()

      const favoriteItems = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.favorites)
          ? data.favorites
          : []

      const favoriteIds = favoriteItems
        .map((favorite) => {
          if (
            typeof favorite === 'object' &&
            favorite !== null
          ) {
            return String(
              favorite._id ||
              favorite.id ||
              ''
            )
          }

          return String(favorite)
        })
        .filter(Boolean)

      setFavorites(favoriteIds)
    } catch (err) {
      console.warn(
        'Failed to load favorites:',
        err.message
      )
    }
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const res = await request(`${API}/api/auth/me`)

      if (res.ok) {
        const data = await res.json()

        setUser(
          data.data?.user ||
          data.data ||
          data.user ||
          data
        )

        await loadFavorites()
      } else if (
        res.status === 401 ||
        res.status === 403
      ) {
        setUser(null)
        setFavorites([])
      }
    } catch (err) {
      console.warn(
        'Auth check failed:',
        err.message
      )
    } finally {
      setLoading(false)
    }
  }, [loadFavorites])

  const toggleFavorite = async (carId) => {
    if (!user) {
      throw new Error('يجب تسجيل الدخول أولاً')
    }

    if (!carId) {
      throw new Error('معرّف السيارة غير موجود')
    }

    const res = await request(
      `${API}/api/auth/favorites/${encodeURIComponent(carId)}`,
      {
        method: 'POST'
      }
    )

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(
        data.message || 'فشل تحديث المفضلة'
      )
    }

    const returnedFavorites =
      Array.isArray(data.data?.favorites)
        ? data.data.favorites
        : Array.isArray(data.favorites)
          ? data.favorites
          : []

    const favoriteIds = returnedFavorites
      .map((favorite) => {
        if (
          typeof favorite === 'object' &&
          favorite !== null
        ) {
          return String(
            favorite._id ||
            favorite.id ||
            ''
          )
        }

        return String(favorite)
      })
      .filter(Boolean)

    setFavorites(favoriteIds)

    return data
  }

  const login = async (email, password) => {
    const res = await request(`${API}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email,
        password
      })
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(
        data.message || 'فشل تسجيل الدخول'
      )
    }

    const loggedUser =
      data.data?.user ||
      data.data ||
      data.user ||
      data

    setUser(loggedUser)

    await loadFavorites()

    return data
  }

  const register = async (userData) => {
    const res = await request(`${API}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(
        data.message || 'فشل إنشاء الحساب'
      )
    }

    return data
  }

  const logout = async () => {
    try {
      await request(`${API}/api/auth/logout`, {
        method: 'POST'
      })
    } catch (err) {
      console.warn(
        'Logout request failed:',
        err.message
      )
    }

    setUser(null)
    setFavorites([])
  }

  const updateProfile = async (profileData) => {
    const res = await request(`${API}/api/auth/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(profileData)
    })

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(
        data.message || 'فشل تحديث الملف الشخصي'
      )
    }

    const updatedUser =
      data.data?.user ||
      data.data ||
      data.user

    if (updatedUser) {
      setUser(updatedUser)
    }

    return data
  }

  const changePassword = async (
    currentPassword,
    newPassword
  ) => {
    const res = await request(
      `${API}/api/auth/password`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword,
          newPassword
        })
      }
    )

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(
        data.message || 'فشل تغيير كلمة المرور'
      )
    }

    return data
  }

  const forgotPassword = async (email) => {
    const res = await request(
      `${API}/api/auth/forgot-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email
        })
      }
    )

    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      throw new Error(
        data.message || 'فشل إرسال طلب استعادة كلمة المرور'
      )
    }

    return data
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    checkAuth()
  }, [checkAuth])

  const value = {
    user,
    setUser,
    loading,
    favorites,
    setFavorites,
    loadFavorites,
    checkAuth,
    toggleFavorite,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider'
    )
  }

  return context
}

export default AuthContext