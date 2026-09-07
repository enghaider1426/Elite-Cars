/**
 * نموذج إضافة سيارة جديد - مع تحقق من الحقول
 */
import { useState } from 'react'
import { FaPlus, FaImage, FaCheckCircle } from 'react-icons/fa'
import './AddCarForm.css'

function AddCarForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    model: '',
    year: '',
    price: '',
    mileage: '',
    image: '',
    description: '',
    features: ''
  })

  const [errors, setErrors] = useState({})
  const [isSubmitted, setIsSubmitted] = useState(false)

  // تحديث الحقول
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    // مسح الخطأ عند الكتابة
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  // التحقق من النموذج
  const validate = () => {
    const newErrors = {}
    
    if (!formData.name.trim()) newErrors.name = 'اسم السيارة مطلوب'
    if (!formData.manufacturer.trim()) newErrors.manufacturer = 'الشركة المصنعة مطلوبة'
    if (!formData.model.trim()) newErrors.model = 'الموديل مطلوب'
    if (!formData.year) newErrors.year = 'سنة الصنع مطلوبة'
    else if (formData.year < 1990 || formData.year > 2030) newErrors.year = 'سنة غير صحيحة'
    if (!formData.price) newErrors.price = 'السعر مطلوب'
    else if (formData.price <= 0) newErrors.price = 'السعر يجب أن يكون أكبر من صفر'
    if (!formData.mileage && formData.mileage !== 0) newErrors.mileage = 'المسافة المقطوعة مطلوبة'
    if (!formData.image.trim()) newErrors.image = 'رابط الصورة مطلوب'
    if (!formData.description.trim()) newErrors.description = 'الوصف مطلوب'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // إرسال النموذج
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (validate()) {
      const success = await onSubmit({
        ...formData,
        year: parseInt(formData.year),
        price: parseFloat(formData.price),
        mileage: parseInt(formData.mileage)
      })

      if (!success) return

      setIsSubmitted(true)
      
      // إعادة تعيين النموذج بعد 3 ثواني
      setTimeout(() => {
        setFormData({
          name: '', manufacturer: '', model: '', year: '',
          price: '', mileage: '', image: '', description: '', features: ''
        })
        setIsSubmitted(false)
      }, 3000)
    }
  }

  // حقول النموذج
  const formFields = [
    { name: 'name', label: 'اسم السيارة', type: 'text', placeholder: 'مثال: مرسيدس S-Class', required: true },
    { name: 'manufacturer', label: 'الشركة المصنعة', type: 'text', placeholder: 'مثال: مرسيدس بنز', required: true },
    { name: 'model', label: 'الموديل', type: 'text', placeholder: 'مثال: S500', required: true },
    { name: 'year', label: 'سنة الصنع', type: 'number', placeholder: '2024', required: true, min: 1990, max: 2030 },
    { name: 'price', label: 'السعر (دولار)', type: 'number', placeholder: '50000 $', required: true, min: 0 },
    { name: 'mileage', label: 'المسافة المقطوعة (كم)', type: 'number', placeholder: '15000', required: true, min: 0 },
    { name: 'image', label: 'رابط الصورة', type: 'url', placeholder: 'https://example.com/image.jpg', required: true },
    { name: 'features', label: 'المميزات', type: 'text', placeholder: 'مثال: شاشة، كاميرا خلفية، نظام صوتي', required: false },
  ]

  return (
    <div className="add-car-form-wrapper">
      {isSubmitted ? (
        <div className="success-message glass-card">
          <FaCheckCircle className="success-icon" />
          <h3>تمت الإضافة بنجاح!</h3>
          <p>تمت إضافة السيارة إلى المعرض</p>
        </div>
      ) : (
        <form className="add-car-form glass-card" onSubmit={handleSubmit}>
          <div className="form-header">
            <FaPlus className="form-icon" />
            <h2>إضافة سيارة جديدة</h2>
            <p>أدخل بيانات السيارة لإضافتها إلى المعرض</p>
          </div>

          <div className="form-grid">
            {formFields.map((field) => (
              <div key={field.name} className={`form-group ${errors[field.name] ? 'has-error' : ''}`}>
                <label htmlFor={field.name}>{field.label}</label>
                <input
                  type={field.type}
                  id={field.name}
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  min={field.min}
                  max={field.max}
                  className="form-input"
                />
                {errors[field.name] && (
                  <span className="error-message">{errors[field.name]}</span>
                )}
              </div>
            ))}

            {/* حقل الوصف - يأخذ صف كامل */}
            <div className={`form-group full-width ${errors.description ? 'has-error' : ''}`}>
              <label htmlFor="description">الوصف</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="اكتب وصفاً تفصيلياً للسيارة..."
                rows="4"
                className="form-input form-textarea"
              ></textarea>
              {errors.description && (
                <span className="error-message">{errors.description}</span>
              )}
            </div>
          </div>

          {/* معاينة الصورة */}
          {formData.image && (
            <div className="image-preview">
              <FaImage className="preview-icon" />
              <img src={formData.image} alt="معاينة" onError={(e) => { e.target.style.display = 'none' }} loading="lazy" decoding="async" />
            </div>
          )}

          <button type="submit" className="btn btn-primary submit-btn">
            <FaPlus />
            إضافة السيارة
          </button>
        </form>
      )}
    </div>
  )
}

export default AddCarForm