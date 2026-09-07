/**
 * Seed Script - Populates the database with initial car data
 * Run with: node utils/seedCars.js
 *
 * NOTE: Default passwords below are for DEVELOPMENT ONLY.
 * In production, use strong unique passwords and change them immediately.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const Car = require('../models/Car');
const User = require('../models/User');

const seedCars = [
  {
    name: 'مرسيدس S-Class',
    manufacturer: 'مرسيدس بنز',
    model: 'S500',
    year: 2023,
    price: 85000,
    mileage: 15000,
    image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&q=80',
    description: 'سيارة سيدان فاخرة تجمع بين الأداء العالي والرفاهية المطلقة. تتميز بمقصورة هادئة ومريحة مع أحدث تقنيات القيادة الذكية وشاشة MBUX العملاقة.',
    features: ['شاشة MBUX', 'مقاعد جلدية', 'نظام صوتي Burmester', 'قيادة شبه ذاتية'],
    color: 'أسود أوبسيديان',
    fuelType: 'بنزين',
    transmission: 'أوتوماتيك',
    bodyType: 'سيدان فاخرة',
    status: 'available',
  },
  {
    name: 'BMW M4',
    manufacturer: 'بي ام دبليو',
    model: 'M4 Competition',
    year: 2023,
    price: 62000,
    mileage: 8000,
    image: 'https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&q=80',
    description: 'كوبيه رياضية قوية بمحرك Twin Turbo سداسي الأسطوانات. توفر تجربة قيادة مثالية مع نظام xDrive للدفع الرباعي.',
    features: ['Twin Turbo', 'xDrive', 'مقاعد M Sport', 'نظام M Drive Professional'],
    color: 'أزرق مارينا',
    fuelType: 'بنزين',
    transmission: 'أوتوماتيك',
    bodyType: 'كوبيه',
    status: 'available',
  },
  {
    name: 'أودي R8',
    manufacturer: 'أودي',
    model: 'R8 V10',
    year: 2022,
    price: 72000,
    mileage: 12500,
    image: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=800&q=80',
    description: 'سوبر كار فاخرة بأداء متفوق وتصميم حاد. مزودة بمحرك V10 طبيعي الشفط ونظام quattro للدفع الرباعي.',
    features: ['محرك V10', 'نظام quattro', 'شاشة Audi Virtual Cockpit', 'مقاعد رياضية'],
    color: 'رمادي نارني',
    fuelType: 'بنزين',
    transmission: 'أوتوماتيك',
    bodyType: 'كوبيه',
    status: 'available',
  },
  {
    name: 'لامبورغيني هوراكان',
    manufacturer: 'لامبورغيني',
    model: 'Huracán EVO',
    year: 2022,
    price: 98000,
    mileage: 9000,
    image: 'https://images.unsplash.com/photo-1549924231-f129b911e442?w=800&q=80',
    description: 'سيارة خارقة بتصميم أيروديناميكي جريء ومحرك V10 قوي. نظام التحكم الديناميكي LDVI يوفر أداءً استثنائياً على كل الطرقات.',
    features: ['تصميم أيروديناميكي', 'نظام تحكم ديناميكي LDVI', 'محرك V10', 'نظام هروب'],
    color: 'أخضر مانتن',
    fuelType: 'بنزين',
    transmission: 'أوتوماتيك',
    bodyType: 'كوبيه',
    status: 'available',
  },
  {
    name: 'رولز رويس فانتوم',
    manufacturer: 'رولز رويس',
    model: 'Phantom',
    year: 2023,
    price: 155000,
    mileage: 5000,
    image: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&q=80',
    description: 'قمة الفخامة والهدوء في كل رحلة. تتميز بمقصورة صامتة بالكامل وأفضل أنواع الجلد والخشب الطبيعي.',
    features: ['مقصورة فاخرة', 'نظام صوتي ممتاز', 'سقف نجومي', 'جلد طبيعي فاخر'],
    color: 'أبيض لؤلؤي',
    fuelType: 'بنزين',
    transmission: 'أوتوماتيك',
    bodyType: 'سيدان فاخرة',
    status: 'available',
  },
  {
    name: 'بوجاتي شيرون',
    manufacturer: 'بوجاتي',
    model: 'Chiron',
    year: 2021,
    price: 420000,
    mileage: 3000,
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&q=80',
    description: 'رمز السرعة والترف. محرك W16 رباعي التوربو ينتج 1500 حصان مع تصميم خارق يجمع بين الفخامة والأداء المذهل.',
    features: ['محرك W16 رباعي توربو', 'سرعة قصوى 420 كم/س', 'تصميم خارق', 'مقصورة جلدية بالكامل'],
    color: 'أزرق فرنسي',
    fuelType: 'بنزين',
    transmission: 'أوتوماتيك',
    bodyType: 'سيدان رياضية',
    status: 'available',
  },

  // السيارة السابعة - تمت إضافتها فقط دون تعديل السيارات الأصلية
  {
    name: 'Porsche 911 Turbo S',
    manufacturer: 'بورشه',
    model: '911 Turbo S',
    year: 2024,
    price: 210000,
    mileage: 2500,
    image: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=800&q=80',
    description: 'سيارة رياضية فاخرة تجمع بين الأداء الاستثنائي والتكنولوجيا المتقدمة. تتميز بمحرك قوي وتسارع مذهل مع نظام دفع رباعي متطور.',
    features: [
      'محرك Twin Turbo',
      'دفع رباعي',
      'نظام Porsche Communication Management',
      'مقاعد رياضية فاخرة'
    ],
    color: 'رمادي معدني',
    fuelType: 'بنزين',
    transmission: 'أوتوماتيك',
    bodyType: 'كوبيه رياضية',
    status: 'available',
  },
];

const seedUsers = [
  {
    name: 'مدير النظام',
    email: process.env.SEED_ADMIN_EMAIL,
    password: process.env.SEED_ADMIN_PASSWORD,
    role: 'admin',
    emailVerified: true,
  },
  {
    name: 'مستخدم تجريبي',
    email: process.env.SEED_USER_EMAIL,
    password: process.env.SEED_USER_PASSWORD,
    role: 'user',
    emailVerified: true,
  },
];

const seed = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database seed is disabled in production');
    }

    if (!process.env.SEED_ADMIN_EMAIL || !process.env.SEED_ADMIN_PASSWORD) {
      throw new Error('Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before running the seed');
    }

    console.log('Starting database seed...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if cars already exist
    const existingCars = await Car.countDocuments();

    if (existingCars === 0) {
      // Only clear and seed if database is empty
      console.log('Database is empty, seeding cars...');
      await Car.insertMany(seedCars);
      console.log(`Seeded ${seedCars.length} cars`);
    } else {
      console.log(`Database already contains ${existingCars} cars. Skipping car seed to avoid duplicates.`);
    }

    // Ensure the configured admin account exists even if other users are already present.
    const adminEmail = process.env.SEED_ADMIN_EMAIL.toLowerCase().trim();
    let admin = await User.findOne({ email: adminEmail }).select('+password');

    if (!admin) {
      admin = await User.create({
        name: 'مدير النظام',
        email: adminEmail,
        password: process.env.SEED_ADMIN_PASSWORD,
        role: 'admin',
        emailVerified: true,
      });

      console.log(`Created admin user: ${admin.email}`);
    } else {
      admin.role = 'admin';
      admin.emailVerified = true;
      await admin.save();

      console.log(`Admin user already exists and was ensured: ${admin.email}`);
    }

    // Optional demo user. It is only created when both values are configured.
    if (process.env.SEED_USER_EMAIL && process.env.SEED_USER_PASSWORD) {
      const userEmail = process.env.SEED_USER_EMAIL.toLowerCase().trim();
      const existingUser = await User.findOne({ email: userEmail });

      if (!existingUser) {
        await User.create({
          name: 'مستخدم تجريبي',
          email: userEmail,
          password: process.env.SEED_USER_PASSWORD,
          role: 'user',
          emailVerified: true,
        });

        console.log(`Created demo user: ${userEmail}`);
      } else {
        console.log(`Demo user already exists: ${userEmail}`);
      }
    }

    console.log('');
    console.log('Seed completed!');
    console.log(`Admin login: ${admin.email}`);
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
};

seed();