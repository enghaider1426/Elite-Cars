/**
 * صفحة إضافة سيارة جديدة
 */
import AddCarForm from '../Components/AddCarForm'
import { useNavigate } from 'react-router-dom'
import './AddCarPage.css'

function AddCar({ onAddCar }) {
  const navigate = useNavigate()

  const handleSubmit = async (carData) => {
    const success = await onAddCar(carData)

    if (success) {
      // الانتقال فقط بعد نجاح الحفظ الفعلي في الخادم
      setTimeout(() => navigate('/inventory'), 3200)
    }

    return success
  }

  return (
    <div className="add-car-page">
      {/* Header */}
      <section className="page-header add-header">
        <div className="container">
          <h1 className="page-title">إضافة سيارة جديدة</h1>
          <p className="page-subtitle">أضف سيارتك إلى معرضنا بسهولة</p>
        </div>
      </section>

      {/* النموذج */}
      <section className="add-car-content">
        <AddCarForm onSubmit={handleSubmit} />
      </section>
    </div>
  )
}

export default AddCar