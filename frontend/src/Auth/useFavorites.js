import { useAuth } from './AuthContext'

function useFavorites() {
  const { favorites, toggleFavorite } = useAuth()

  const isFavorite = (carId) => {
    return favorites.some(
      (id) => String(id) === String(carId)
    )
  }

  return {
    favorites,
    toggleFavorite,
    isFavorite
  }
}

export default useFavorites
