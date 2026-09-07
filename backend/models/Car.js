/**
 * Car Model - Mongoose schema for car listings
 */

const mongoose = require('mongoose');

const carSchema = new mongoose.Schema(
  {
    // =========================
    // Arabic / Original fields
    // =========================

    name: {
      type: String,
      required: [true, 'اسم السيارة مطلوب'],
      trim: true,
      maxlength: [100, 'اسم السيارة لا يمكن أن يتجاوز 100 حرف'],
    },

    manufacturer: {
      type: String,
      required: [true, 'الشركة المصنعة مطلوبة'],
      trim: true,
      index: true,
    },

    model: {
      type: String,
      required: [true, 'الموديل مطلوب'],
      trim: true,
    },

    year: {
      type: Number,
      required: [true, 'سنة الصنع مطلوبة'],
      min: [1990, 'أقل سنة مسموحة هي 1990'],
      max: [2035, 'أكبر سنة مسموحة هي 2035'],
    },

    price: {
      type: Number,
      required: [true, 'السعر مطلوب'],
      min: [0, 'السعر يجب أن يكون أكبر من صفر'],
    },

    mileage: {
      type: Number,
      required: [true, 'المسافة المقطوعة مطلوبة'],
      min: [0, 'المسافة المقطوعة لا يمكن أن تكون سالبة'],
      default: 0,
    },

    image: {
      type: String,
      required: [true, 'رابط الصورة مطلوب'],
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'الوصف مطلوب'],
      trim: true,
      maxlength: [2000, 'الوصف لا يمكن أن يتجاوز 2000 حرف'],
    },

    features: {
      type: [String],
      default: [],
    },

    color: {
      type: String,
      trim: true,
      default: '',
    },

    fuelType: {
      type: String,
      enum: ['بنزين', 'ديزل', 'كهربائي', 'هجين', ''],
      default: 'بنزين',
    },

    transmission: {
      type: String,
      enum: ['أوتوماتيك', 'يدوي', ''],
      default: 'أوتوماتيك',
    },

    bodyType: {
      type: String,
      trim: true,
      default: '',
    },

    // =========================
    // English translation fields
    // =========================

    nameEn: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'English car name cannot exceed 100 characters'],
    },

    manufacturerEn: {
      type: String,
      trim: true,
      default: '',
    },

    modelEn: {
      type: String,
      trim: true,
      default: '',
    },

    descriptionEn: {
      type: String,
      trim: true,
      default: '',
      maxlength: [2000, 'English description cannot exceed 2000 characters'],
    },

    featuresEn: {
      type: [String],
      default: [],
    },

    colorEn: {
      type: String,
      trim: true,
      default: '',
    },

    fuelTypeEn: {
      type: String,
      trim: true,
      default: '',
    },

    transmissionEn: {
      type: String,
      trim: true,
      default: '',
    },

    bodyTypeEn: {
      type: String,
      trim: true,
      default: '',
    },

    // =========================
    // Existing fields
    // =========================

    status: {
      type: String,
      enum: ['available', 'sold', 'reserved'],
      default: 'available',
    },

    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Index for search performance
carSchema.index({
  name: 'text',
  manufacturer: 'text',
  model: 'text',
  description: 'text',
});

carSchema.index({ price: 1 });
carSchema.index({ year: -1 });
carSchema.index({ createdAt: -1 });
carSchema.index({ status: 1 });

module.exports = mongoose.model('Car', carSchema);