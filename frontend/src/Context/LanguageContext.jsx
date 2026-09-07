import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

const LanguageContext = createContext(null)

const translations = {
  'مرسيدس': 'Mercedes',
  'بي ام دبليو': 'BMW',
  'بورش': 'Porsche',
  'أودي': 'Audi',
  'لكزس': 'Lexus',
  'تيسلا': 'Tesla',
  'سوريا / أدلب / كفرسجنة':
    'Syria / Idlib / Kafr Sijnah',
  'الرئيسية': 'Home',
  'المعرض': 'Inventory',
  'لوحة التحكم': 'Dashboard',
  'إضافة سيارة': 'Add Car',
  'الملف الشخصي': 'Profile',
  'المفضلة': 'Favorites',
  'تسجيل الخروج': 'Log Out',
  'تسجيل الدخول': 'Log In',
  'إنشاء حساب': 'Create Account',
  'تصفح السيارات': 'Browse Cars',
  'تصفح السيارات الآن': 'Browse Cars Now',
  'القائمة': 'Menu',
  'مستخدم': 'User',
  'مسؤول': 'Admin',
  'عضو منذ': 'Member since',
  'تعديل الملف الشخصي': 'Edit Profile',
  'الاسم': 'Name',
  'الاسم الكامل': 'Full Name',
  'أدخل اسمك الكامل': 'Enter your full name',
  'حفظ التغييرات': 'Save Changes',
  'جاري الحفظ...': 'Saving...',
  'تم تحديث الملف الشخصي بنجاح':
    'Profile updated successfully',
  'تغيير كلمة المرور': 'Change Password',
  'كلمة المرور': 'Password',
  'كلمة المرور الحالية': 'Current Password',
  'أدخل كلمة المرور الحالية':
    'Enter your current password',
  'كلمة المرور الجديدة': 'New Password',
  'أدخل كلمة المرور الجديدة':
    'Enter your new password',
  'أدخل كلمة المرور الجديدة (6 أحرف على الأقل)':
    'Enter your new password (at least 6 characters)',
  'تأكيد كلمة المرور': 'Confirm Password',
  'تأكيد كلمة المرور الجديدة':
    'Confirm New Password',
  'أعد إدخال كلمة المرور الجديدة':
    'Re-enter your new password',
  'جاري التغيير...': 'Changing...',
  'إظهار كلمة المرور': 'Show password',
  'إخفاء كلمة المرور': 'Hide password',
  'إظهار تأكيد كلمة المرور':
    'Show password confirmation',
  'إخفاء تأكيد كلمة المرور':
    'Hide password confirmation',
  'كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل':
    'New password must be at least 6 characters',
  'كلمة المرور الجديدة وتأكيدها غير متطابقتين':
    'New password and confirmation do not match',
  'كلمة المرور وتأكيدها غير متطابقتين':
    'Password and confirmation do not match',
  'كلمتا المرور غير متطابقتين':
    'Passwords do not match',
  'كلمة المرور يجب أن تكون 6 أحرف على الأقل':
    'Password must be at least 6 characters',
  'تم تغيير كلمة المرور بنجاح':
    'Password changed successfully',
  'لم تقم بإضافة سيارات للمفضلة بعد':
    'You have not added any cars to favorites yet',
  'لم تقم بتصفح سيارات بعد':
    'You have not browsed any cars yet',
  'إزالة من المفضلة':
    'Remove from Favorites',
  'تمت إزالة السيارة من المفضلة':
    'Car removed from favorites',
  'تمت إضافة السيارة إلى المفضلة':
    'Car added to favorites',
  'إعدادات الموقع': 'Site Settings',
  'اللغة': 'Language',
  'العربية': 'Arabic',
  'الإنجليزية': 'English',
  'المظهر': 'Theme',
  'الوضع الداكن': 'Dark Mode',
  'الوضع الفاتح': 'Light Mode',
  'الحالي': 'Current',
  'مرحبًا بعودتك': 'Welcome Back',
  'سجّل الدخول للمتابعة إلى Elite Cars':
    'Log in to continue to Elite Cars',
  'أنشئ حسابك للمتابعة إلى Elite Cars':
    'Create your account to continue to Elite Cars',
  'البريد الإلكتروني': 'Email',
  'نسيت كلمة المرور؟': 'Forgot your password?',
  'ليس لديك حساب؟': "Don't have an account?",
  'لديك حساب بالفعل؟':
    'Already have an account?',
  'تسجيل الدخول باستخدام Google':
    'Continue with Google',
  'التسجيل باستخدام Google':
    'Continue with Google',
  'جارٍ تسجيل الدخول...': 'Logging in...',
  'جاري تسجيل الدخول...': 'Logging in...',
  'جارٍ إنشاء الحساب...':
    'Creating account...',
  'جاري إنشاء الحساب...':
    'Creating account...',
  'جاري الإرسال...': 'Sending...',
  'جارٍ المعالجة...': 'Processing...',
  'جاري المعالجة...': 'Processing...',
  'جاري التحقق...': 'Verifying...',
  'جاري التحقق من المصادقة...':
    'Verifying authentication...',
  'يرجى إدخال الاسم':
    'Please enter your name',
  'يرجى إدخال البريد الإلكتروني':
    'Please enter your email',
  'يرجى إدخال كلمة المرور':
    'Please enter your password',
  'يرجى تأكيد كلمة المرور':
    'Please confirm your password',
  'الاسم يجب أن يكون حرفين على الأقل':
    'Name must be at least 2 characters',
  'الاسم يجب أن يكون أقل من 50 حرف':
    'Name must be less than 50 characters',
  'صيغة البريد الإلكتروني غير صحيحة':
    'Invalid email format',
  'البريد الإلكتروني مسجل مسبقاً':
    'Email is already registered',
  'تم تسجيل الدخول بنجاح':
    'Logged in successfully',
  'فشل تسجيل الدخول':
    'Login failed',
  'تم إنشاء الحساب بنجاح':
    'Account created successfully',
  'فشل إنشاء الحساب':
    'Failed to create account',
  'استعادة كلمة المرور':
    'Password Recovery',
  'إعادة تعيين كلمة المرور':
    'Reset Password',
  'أدخل بريدك الإلكتروني وسنرسل لك رابط الاستعادة':
    'Enter your email and we will send you a recovery link',
  'أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور.':
    'Enter your email and we will send you a password reset link.',
  'إرسال رابط الاستعادة':
    'Send Recovery Link',
  'إعادة تعيين':
    'Reset Password',
  'تم إرسال رابط الاستعادة إلى بريدك الإلكتروني':
    'A recovery link has been sent to your email',
  'فشل إرسال رابط الاستعادة':
    'Failed to send recovery link',
  'فشل إعادة تعيين كلمة المرور':
    'Failed to reset password',
  'تم إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.':
    'Password reset successfully. You can now log in.',
  'العودة لتسجيل الدخول':
    'Back to Login',
  'معرض السيارات الفاخرة #1 في المنطقة':
    'The #1 Luxury Car Showroom in the Region',
  'اكتشف عالم':
    'Discover the World of',
  'السيارات الفاخرة':
    'Luxury Cars',
  'نقدم لك مجموعة مختارة من أرقى السيارات العالمية بأفضل الأسعار':
    'We offer a carefully selected collection of the finest global cars at the best prices',
  'وضمان الجودة والخدمة المتميزة':
    'with guaranteed quality and exceptional service',
  'السعر يبدأ من':
    'Starting From',
  'ماركة عالمية':
    'Global Brands',
  'عميل سعيد':
    'Happy Customers',
  'عميل راضي':
    'Satisfied Customers',
  'سنة خبرة':
    'Years of Experience',
  'سيارة فاخرة':
    'Luxury Car',
  'سيارات فاخرة':
    'Luxury Cars',
  'اكتشف المعرض الآن':
    'Explore Inventory Now',
  'استكشف المعرض':
    'Explore Inventory',
  'استكشف المعرض الآن':
    'Explore Inventory Now',
  'اسحب للأسفل':
    'Scroll Down',
  'السيارات المميزة':
    'Featured Cars',
  'اختياراتنا الأكثر تميزاً هذا الشهر':
    'Our finest selections this month',
  'عرض جميع السيارات':
    'View All Cars',
  'هل تبحث عن سيارة أحلامك؟':
    'Looking for your dream car?',
  'تصفح معرضنا واحصل على أفضل العروض':
    'Browse our showroom and get the best deals',
  'لماذا تختارنا؟':
    'Why Choose Us?',
  'نقدم لك تجربة فريدة في شراء السيارات الفاخرة':
    'We offer you a unique luxury car buying experience',
  'ضمان الجودة':
    'Quality Guarantee',
  'جميع سياراتنا تخضع لفحص شامل من 150 نقطة':
    'All our cars undergo a comprehensive 150-point inspection',
  'أسعار عادلة':
    'Fair Prices',
  'نقدم أفضل الأسعار في السوق مع شفافية كاملة':
    'We offer the best market prices with complete transparency',
  'خبرة 20 عاماً':
    '20 Years of Experience',
  'نخبة من الخبراء في مجال السيارات الفاخرة':
    'A team of experts in the luxury automotive industry',
  'تسليم سريع':
    'Fast Delivery',
  'إجراءات سريعة ومبسطة للحصول على سيارتك':
    'Fast and simple procedures to get your car',
  'دعم 24/7':
    '24/7 Support',
  'فريق خدمة عملاء متاح على مدار الساعة':
    'A customer service team available around the clock',
  'صيانة مجانية':
    'Free Maintenance',
  'خدمة صيانة مجانية للسنة الأولى':
    'Free maintenance service for the first year',
  'بيع سيارتك':
    'Sell Your Car',
  'ابحث عن سيارتك المفضلة...':
    'Search for your favorite car...',
  'فلتر':
    'Filter',
  'نطاق السعر':
    'Price Range',
  'الماركة':
    'Brand',
  'الماركات':
    'Brands',
  'نوع الوقود':
    'Fuel Type',
  'ناقل الحركة':
    'Transmission',
  'سنة الصنع':
    'Year',
  'نوع الهيكل':
    'Body Type',
  'جميع الأسعار':
    'All Prices',
  'جميع الماركات':
    'All Brands',
  'جميع الأنواع':
    'All Types',
  'جميع السنوات':
    'All Years',
  'أكثر من $':
    'More than $',
  'لا توجد سيارات':
    'No Cars Found',
  'لا توجد سيارات بعد':
    'No Cars Yet',
  'لم نجد سيارات تطابق بحثك':
    'No cars match your search',
  'عرض':
    'View',
  'عرض التفاصيل':
    'View Details',
  'العودة للمعرض':
    'Back to Inventory',
  'أضف للمفضلة':
    'Add to Favorites',
  'اتصل الآن':
    'Call Now',
  'واتساب':
    'WhatsApp',
  'مشاركة':
    'Share',
  'تم النسخ!':
    'Copied!',
  'متاح':
    'Available',
  'متاحة':
    'Available',
  'مباع':
    'Sold',
  'مباعة':
    'Sold',
  'محجوز':
    'Reserved',
  'محجوزة':
    'Reserved',
  'غير محدد':
    'Not Specified',
  'المعلومات':
    'Information',
  'معلومات السيارة':
    'Car Information',
  'المواصفات':
    'Specifications',
  'المميزات':
    'Features',
  'الوصف':
    'Description',
  'السعر':
    'Price',
  'المسافة':
    'Mileage',
  'اللون':
    'Color',
  'الشركة':
    'Manufacturer',
  'الشركة المصنعة':
    'Manufacturer',
  'الموديل':
    'Model',
  'كم':
    'km',
  'إضافة سيارة جديدة':
    'Add New Car',
  'إضافة السيارة':
    'Add Car',
  'أدخل بيانات السيارة لإضافتها إلى المعرض':
    'Enter the car details to add it to the showroom',
  'أضف سيارتك إلى معرضنا بسهولة':
    'Add your car to our showroom easily',
  'اسم السيارة':
    'Car Name',
  'السعر (دولار)':
    'Price (USD)',
  'المسافة المقطوعة (كم)':
    'Mileage (km)',
  'رابط الصورة':
    'Image URL',
  'مثال: مرسيدس S-Class':
    'Example: Mercedes S-Class',
  'مثال: مرسيدس بنز':
    'Example: Mercedes-Benz',
  'مثال: S500':
    'Example: S500',
  'مثال: شاشة، كاميرا خلفية، نظام صوتي':
    'Example: Screen, Rear Camera, Audio System',
  'اكتب وصفاً تفصيلياً للسيارة...':
    'Write a detailed description of the car...',
  'معاينة':
    'Preview',
  'إلغاء':
    'Cancel',
  'حفظ':
    'Save',
  'حذف':
    'Delete',
  'تعديل':
    'Edit',
  'تحديث':
    'Update',
  'إعادة المحاولة':
    'Retry',
  'اسم السيارة مطلوب':
    'Car name is required',
  'الشركة المصنعة مطلوبة':
    'Manufacturer is required',
  'الموديل مطلوب':
    'Model is required',
  'السعر مطلوب':
    'Price is required',
  'السعر يجب أن يكون أكبر من صفر':
    'Price must be greater than zero',
  'المسافة المقطوعة مطلوبة':
    'Mileage is required',
  'رابط الصورة مطلوب':
    'Image URL is required',
  'الوصف مطلوب':
    'Description is required',
  'سنة الصنع مطلوبة':
    'Year is required',
  'سنة غير صحيحة':
    'Invalid year',
  'تمت الإضافة بنجاح!':
    'Added Successfully!',
  'تمت إضافة السيارة إلى المعرض':
    'The car has been added to the showroom',
  'لوحة تحكم المسؤول':
    'Admin Dashboard',
  'إدارة السيارات والمستخدمين والعمليات':
    'Manage cars, users, and operations',
  'إجمالي السيارات':
    'Total Cars',
  'السيارات المتاحة':
    'Available Cars',
  'السيارات المباعة':
    'Sold Cars',
  'السيارات الأخيرة':
    'Recent Cars',
  'المستخدمين':
    'Users',
  'لا يوجد مستخدمين بعد':
    'No Users Yet',
  'البريد':
    'Email',
  'الدور':
    'Role',
  'تاريخ التسجيل':
    'Registration Date',
  'الحالة':
    'Status',
  'الإجراءات':
    'Actions',
  'الصورة':
    'Image',
  'ترقية لمسؤول':
    'Promote to Admin',
  'إزالة الإدارة':
    'Remove Admin',
  'تأكيد الحذف':
    'Confirm Deletion',
  'هل أنت متأكد من حذف هذه السيارة؟':
    'Are you sure you want to delete this car?',
  'هل أنت متأكد من حذف هذه السيارة؟ لا يمكن التراجع عن هذا الإجراء.':
    'Are you sure you want to delete this car? This action cannot be undone.',
  'تم حذف السيارة بنجاح':
    'Car deleted successfully',
  'تم تغيير الدور بنجاح':
    'Role changed successfully',
  'فشل تحميل الإحصائيات':
    'Failed to load statistics',
  'فشل تحميل السيارات':
    'Failed to load cars',
  'فشل تحميل المستخدمين':
    'Failed to load users',
  'فشل حذف السيارة':
    'Failed to delete car',
  'فشل تغيير الدور':
    'Failed to change role',
  'فشل تغيير كلمة المرور':
    'Failed to change password',
  'فشل تحديث الملف الشخصي':
    'Failed to update profile',
  'فشل تحديث المفضلة':
    'Failed to update favorites',
  'حدث خطأ':
    'An error occurred',
  'حدث خطأ أثناء تحديث المفضلة':
    'An error occurred while updating favorites',
  'تعذر الاتصال بالخادم':
    'Unable to connect to the server',
  'فشل في المصادقة':
    'Authentication failed',
  'لم يتم استلام رمز المصادقة':
    'Authentication token was not received',
  'يجب تسجيل الدخول أولاً':
    'You must log in first',
  'يجب تسجيل الدخول أولاً لإضافة السيارة إلى المفضلة':
    'You must log in first to add the car to favorites',
  'معرف السيارة غير موجود':
    'Car ID is missing',
  'معرّف السيارة غير موجود':
    'Car ID is missing',
  'الصفحة غير موجودة':
    'Page Not Found',
  'عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.':
    'Sorry, the page you are looking for does not exist or has been moved.',
  'العودة للرئيسية':
    'Back to Home',
  'روابط سريعة':
    'Quick Links',
  'العلامات':
    'Brands',
  'العلامات التجارية':
    'Brands',
  'تواصل معنا':
    'Contact Us',
  'وجهتك الأولى للسيارات الفاخرة. نقدم أفضل الماركات العالمية':
    'Your first destination for luxury cars. We offer the finest global brands',
  'بأسعار تنافسية وخدمة متميزة.':
    'at competitive prices with exceptional service.',
  'جميع الحقوق محفوظة.':
    'All rights reserved.',
  'وجهتك الأولى للسيارات الفاخرة. نقدم أفضل الماركات العالمية بأسعار تنافسية وخدمة متميزة.':
    'Your first destination for luxury cars. We offer the finest global brands at competitive prices with exceptional service.',
  'تصميم وتطوير':
    'Designed and Developed by',
  'بوجاتي':
    'Bugatti',
  'رولز رويس':
    'Rolls-Royce',
  'لامبورغيني':
    'Lamborghini',
  'مرسيدس S-Class':
    'Mercedes S-Class',
  'مرسيدس بنز':
    'Mercedes-Benz',
  'أودي R8':
    'Audi R8',
  'بوجاتي شيرون':
    'Bugatti Chiron',
  'لامبورغيني هوراكان':
    'Lamborghini Huracán',
  'رولز رويس فانتوم':
    'Rolls-Royce Phantom',
  'تصميم خارق':
    'Supercar Design',
  'أو':
    'or',
  'تعذر تأكيد البريد الإلكتروني':
    'Unable to verify email',
  'جاري تأكيد البريد الإلكتروني...':
    'Verifying email...',
  'رابط التحقق غير صالح':
    'Invalid verification link',
  'تمت إضافة السيارة إلى المفضلة ❤️':
    'Car added to favorites ❤️',
  'جديد':
    'New',
  'تفاصيل':
    'Details',
  'بنزين':
    'Gasoline',
  'كهربائي':
    'Electric',
  'هجين':
    'Hybrid',
  'سيدان':
    'Sedan',
  'سيدان فاخرة':
    'Luxury Sedan',
  'سيدان رياضية':
    'Sports Sedan',
  'كوبيه':
    'Coupe',
  'كوبيه رياضية':
    'Sports Coupe',
  'كوبيه رياضية قوية':
    'Powerful Sports Coupe',
  'أوتوماتيك':
    'Automatic',
  'أبيض':
    'White',
  'أسود':
    'Black',
  'أسود أوبسيديان':
    'Obsidian Black',
  'أزرق':
    'Blue',
  'أزرق مارينا':
    'Marina Blue',
  'رمادي':
    'Gray',
  'رمادي ناري':
    'Fire Gray',
  'أخضر':
    'Green',
  'أخضر مانتين':
    'Mantis Green',
  'أبيض لؤلؤي':
    'Pearl White',
  'أزرق فرنسي':
    'French Blue',
  'شاشة MBUX':
    'MBUX Screen',
  'مقاعد جلدية':
    'Leather Seats',
  'نظام صوتي Burmester':
    'Burmester Sound System',
  'قيادة شبه ذاتية':
    'Semi-Autonomous Driving',
  'نظام quattro':
    'quattro System',
  'مقاعد رياضية':
    'Sport Seats',
  'نظام صوتي ممتاز':
    'Premium Sound System',
  'مقصورة فاخرة':
    'Luxury Cabin',
  'سقف نجومي':
    'Starlight Headliner',
  'جلد طبيعي فاخر':
    'Premium Natural Leather',
  'تصميم إيروديناميكي':
    'Aerodynamic Design',
  'نظام تحكم ديناميكي LDVI':
    'LDVI Dynamic Control System',
  'نظام هروب':
    'Escape System',
  'محرك V10':
    'V10 Engine',
  'محرك W16':
    'W16 Engine',
  'محرك W16 رباعي توربو':
    'Quad-Turbo W16 Engine',
  'أربعة شواحن توربينية':
    'Four Turbochargers',
  'دفع رباعي':
    'All-Wheel Drive',
  'نظام ديناميكا هوائية متطور':
    'Advanced Aerodynamic System',
  'سرعة قصوى 420 كم/س':
    'Top Speed 420 km/h',
  'مقصورة جلدية بالكامل':
    'Full Leather Interior',
  'Twin Turbo':
    'Twin Turbo',
  'xDrive':
    'xDrive',
  'مقاعد M Sport':
    'M Sport Seats',
  'نظام M Drive Professional':
    'M Drive Professional System',
  'شاشة Audi Virtual Cockpit':
    'Audi Virtual Cockpit Display',
  'حذف السيارة':
    'Delete Car',
  'معلومات الشركة':
    'Company Information',
  'الصفحة الرئيسية':
    'Home Page',
  'سيارات قد تعجبك':
    'Cars You May Like',
  'خطأ في الاتصال':
    'Connection error',
  'تم تأكيد بريدك الإلكتروني بنجاح':
    'Your email has been verified successfully',
  'سيارة سيدان فاخرة تجمع بين الأداء العالي والرفاهية المطلقة. تتميز بمقصورة هادئة ومريحة مع أحدث تقنيات القيادة الذكية وشاشة MBUX العملاقة.':
    'A luxury sedan combining high performance and absolute comfort, featuring a quiet, comfortable cabin with the latest intelligent driving technology and a large MBUX display.',
  'سيارة':
    'car',
  'سيارات':
    'cars',
  'التفاصيل':
    'Details',
  'جاري التحميل':
    'Loading',
  'حذف المستخدم':
    'Delete User',
  'فشل حذف المستخدم':
    'Failed to delete user',
  'تم حذف المستخدم بنجاح':
    'User deleted successfully',
  'لم يتم العثور على سيارات':
    'No cars found',
  'لديك حساب بالفعل؟ تسجيل الدخول':
    'Already have an account? Log In',
  'فشل إرسال طلب استعادة كلمة المرور':
    'Failed to send password recovery request',
  'جاري التحقق من بريدك الإلكتروني...':
    'Verifying your email...',
  'رابط التحقق غير صالح أو منتهي الصلاحية':
    'The verification link is invalid or has expired',
  'جاري التحقق من رابط البريد الإلكتروني...':
    'Verifying the email link...',
  'لم نتمكن من العثور على سيارات تطابق بحثك':
    'We could not find cars matching your search',
  'اكتشف مجموعتنا المختارة من السيارات الفاخرة':
    'Discover our curated collection of luxury cars',
  'تعذر التحقق من البريد الإلكتروني. يرجى المحاولة مرة أخرى.':
    'Unable to verify your email. Please try again.',
  'تم التحقق من بريدك الإلكتروني بنجاح. مرحبًا بك في Elite Cars.':
    'Your email has been verified successfully. Welcome to Elite Cars.',
  'تم إنشاء حسابك بنجاح. يرجى فتح رسالة التحقق المرسلة إلى بريدك الإلكتروني والضغط على رابط التحقق.':
    'Your account was created successfully. Please open the verification email sent to your email address and click the verification link.',
  'قمة الفخامة والهدوء في كل رحلة. تتميز بمقصورة صامتة بالكامل وأفضل أنواع الجلد والخشب الطبيعي.':
    'The pinnacle of luxury and serenity on every journey, featuring an exceptionally quiet cabin with premium leather and natural wood.',
  'سوبر سيارة فاخرة بأداء متفوق وتصميم حاد. مزودة بمحرك V10 طبيعي الشفط ونظام quattro للدفع الرباعي.':
    'A luxury supercar with outstanding performance and a sharp design, equipped with a naturally aspirated V10 engine and quattro all-wheel drive.',
  'رمز السرعة والترف. محرك W16 رباعي التوربو ينتج 1500 حصان مع تصميم خارق يجمع بين الفخامة والأداء المذهل.':
    'A symbol of speed and luxury, powered by a quad-turbo W16 producing 1,500 horsepower, with an extraordinary design combining luxury and breathtaking performance.',
  'كوبيه رياضية قوية بمحرك Twin Turbo سداسي الأسطوانات. توفر تجربة قيادة مثالية مع نظام xDrive للدفع الرباعي.':
    'A powerful sports coupe with a twin-turbo six-cylinder engine, delivering an exceptional driving experience with xDrive all-wheel drive.',
  'سيارة خارقة بتصميم إيروديناميكي جرئ ومحرك V10 قوي. نظام التحكم الديناميكي LDVI يوفر أداءً استثنائياً على كل الطرق.':
    'A supercar with a bold aerodynamic design and a powerful V10 engine. The LDVI dynamic control system delivers exceptional performance on every road.',
}

const reverseTranslations = Object.fromEntries(
  Object.entries(translations).map(
    ([ar, en]) => [en, ar]
  )
)

const translationEntries = Object.entries(
  translations
).sort(
  (a, b) => b[0].length - a[0].length
)

const originalTextNodes = new WeakMap()
const originalAttributes = new WeakMap()

const normalizeText = (value) =>
  String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const isArabicText = (value) =>
  typeof value === 'string' &&
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
    value
  )

const isInsideProtectedElement = (node) => {
  let element = null

  if (node?.nodeType === Node.ELEMENT_NODE) {
    element = node
  } else {
    element = node?.parentElement
  }

  while (element) {
    if (
      element.hasAttribute(
        'data-no-auto-translate'
      )
    ) {
      return true
    }

    element = element.parentElement
  }

  return false
}

const translateValue = (value, language) => {
  if (!value || typeof value !== 'string') {
    return value
  }

  const normalized = normalizeText(value)

  if (!normalized) {
    return value
  }

  if (language === 'en') {
    if (translations[normalized]) {
      return value.replace(
        normalized,
        translations[normalized]
      )
    }

    let match = normalized.match(
      /^عرض\s+(\d+)\s+سيارة$/
    )

    if (match) {
      return value.replace(
        normalized,
        `Showing ${match[1]} ${
          Number(match[1]) === 1
            ? 'car'
            : 'cars'
        }`
      )
    }

    match = normalized.match(
      /^عرض\s+(\d+)\s+سيارات$/
    )

    if (match) {
      return value.replace(
        normalized,
        `Showing ${match[1]} cars`
      )
    }

    match = normalized.match(
      /^عضو منذ\s+(.+)$/
    )

    if (match) {
      return value.replace(
        normalized,
        `Member since ${match[1]}`
      )
    }

    match = normalized.match(
      /^نتيجة البحث:\s*"(.+)"$/
    )

    if (match) {
      return value.replace(
        normalized,
        `Search result: "${match[1]}"`
      )
    }

    match = normalized.match(
      /^خطأ في الاتصال:\s*(.+)$/
    )

    if (match) {
      return value.replace(
        normalized,
        `Connection error: ${match[1]}`
      )
    }

    match = normalized.match(
      /^خطأ في تحديث المفضلة:\s*(.+)$/
    )

    if (match) {
      return value.replace(
        normalized,
        `Error updating favorites: ${match[1]}`
      )
    }

    let translated = value

    for (const [ar, en] of translationEntries) {
      if (translated.includes(ar)) {
        translated = translated
          .split(ar)
          .join(en)
      }
    }

    return translated
  }

  if (reverseTranslations[normalized]) {
    return value.replace(
      normalized,
      reverseTranslations[normalized]
    )
  }

  let match = normalized.match(
    /^Showing\s+(\d+)\s+(car|cars)$/
  )

  if (match) {
    return value.replace(
      normalized,
      `عرض ${match[1]} ${
        match[2] === 'car'
          ? 'سيارة'
          : 'سيارات'
      }`
    )
  }

  match = normalized.match(
    /^Member since\s+(.+)$/
  )

  if (match) {
    return value.replace(
      normalized,
      `عضو منذ ${match[1]}`
    )
  }

  match = normalized.match(
    /^Search result:\s*"(.+)"$/
  )

  if (match) {
    return value.replace(
      normalized,
      `نتيجة البحث: "${match[1]}"`
    )
  }

  return value
}

function translateTextNode(
  textNode,
  language
) {
  if (!textNode) return

  const parent = textNode.parentElement

  if (
    !parent ||
    ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(
      parent.tagName
    )
  ) {
    return
  }

  if (
    !originalTextNodes.has(textNode)
  ) {
    originalTextNodes.set(
      textNode,
      textNode.textContent
    )
  }

  const original =
    originalTextNodes.get(textNode)

  if (!original) return

  const translated = translateValue(
    original,
    language
  )

  if (
    textNode.textContent !== translated
  ) {
    textNode.textContent = translated
  }
}

function translateElementAttributes(
  element,
  language
) {
  if (!element) return

  const attributes = [
    'placeholder',
    'title',
    'aria-label',
    'alt',
  ]

  attributes.forEach((attribute) => {
    const value =
      element.getAttribute(attribute)

    if (!value) return

    let saved =
      originalAttributes.get(element)

    if (!saved) {
      saved = {}
      originalAttributes.set(
        element,
        saved
      )
    }

    if (
      typeof saved[attribute] ===
      'undefined'
    ) {
      saved[attribute] = value
    }

    const original =
      saved[attribute]

    const translated =
      translateValue(
        original,
        language
      )

    if (value !== translated) {
      element.setAttribute(
        attribute,
        translated
      )
    }
  })
}

function translateTree(root, language) {
  if (!root) return

  if (
    root.nodeType === Node.TEXT_NODE
  ) {
    translateTextNode(
      root,
      language
    )
    return
  }

  if (
    root.nodeType !== Node.ELEMENT_NODE &&
    root.nodeType !==
      Node.DOCUMENT_FRAGMENT_NODE
  ) {
    return
  }

  if (
    root.nodeType ===
      Node.ELEMENT_NODE &&
    root.hasAttribute(
      'data-no-auto-translate'
    )
  ) {
    return
  }

  if (
    root.nodeType ===
    Node.ELEMENT_NODE
  ) {
    translateElementAttributes(
      root,
      language
    )
  }

  const walker =
    document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT
    )

  const nodes = []
  let node

  while (
    (node = walker.nextNode())
  ) {
    nodes.push(node)
  }

  nodes.forEach((textNode) => {
    if (
      isInsideProtectedElement(
        textNode
      )
    ) {
      return
    }

    translateTextNode(
      textNode,
      language
    )
  })

  if (root.querySelectorAll) {
    root
      .querySelectorAll(
        '[placeholder], [title], [aria-label], [alt]'
      )
      .forEach((element) => {
        translateElementAttributes(
          element,
          language
        )
      })
  }
}

const UI_TRANSLATION_CACHE_KEY =
  'elite-cars-openai-ui-translations-v1'

const UI_TRANSLATION_CACHE =
  new Map()

let uiTranslationRequest = null

// Prevent repeated requests for the same source
// when React/MutationObserver updates the DOM.
const UI_TRANSLATION_RETRY_DELAY = 30000
const UI_TRANSLATION_RETRY_AFTER =
  new Map()

function loadUITranslationCache() {
  if (UI_TRANSLATION_CACHE.size) {
    return
  }

  try {
    const saved =
      localStorage.getItem(
        UI_TRANSLATION_CACHE_KEY
      )

    if (!saved) return

    const parsed = JSON.parse(saved)

    if (
      !parsed ||
      typeof parsed !== 'object'
    ) {
      return
    }

    Object.entries(parsed).forEach(
      ([source, translation]) => {
        if (
          typeof source === 'string' &&
          typeof translation ===
            'string'
        ) {
          UI_TRANSLATION_CACHE.set(
            source,
            translation
          )
        }
      }
    )
  } catch {
    // Ignore malformed cache.
  }
}

function saveUITranslationCache() {
  try {
    const serialized =
      Object.fromEntries(
        UI_TRANSLATION_CACHE
      )

    localStorage.setItem(
      UI_TRANSLATION_CACHE_KEY,
      JSON.stringify(serialized)
    )
  } catch {
    // Ignore storage errors.
  }
}

const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000'
)
  .replace(/\/+$/, '')
  .replace(/\/api$/, '')

function collectMissingEnglishTranslations(
  root
) {
  const sources = new Set()

  const addTextNode = (textNode) => {
    if (!textNode) return

    const original =
      originalTextNodes.get(
        textNode
      )

    if (
      !original ||
      !isArabicText(original)
    ) {
      return
    }

    const translated =
      translateValue(
        original,
        'en'
      )

    if (
      translated === original ||
      isArabicText(translated)
    ) {
      const source =
        normalizeText(original)

      if (source) {
        sources.add(source)
      }
    }
  }

  if (
    root?.nodeType ===
    Node.TEXT_NODE
  ) {
    addTextNode(root)
  } else if (root) {
    const walker =
      document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT
      )

    let node

    while (
      (node = walker.nextNode())
    ) {
      /*
       * Do not ignore protected elements here.
       *
       * Car Details may contain dynamic
       * specifications that are intentionally
       * protected from direct DOM replacement,
       * but they still need OpenAI translation
       * when no local dictionary entry exists.
       */
      addTextNode(node)
    }
  }

  const elements = []

  if (
    root?.nodeType ===
    Node.ELEMENT_NODE
  ) {
    elements.push(root)
  }

  if (root?.querySelectorAll) {
    root
      .querySelectorAll(
        '[placeholder], [title], [aria-label], [alt]'
      )
      .forEach((element) =>
        elements.push(element)
      )
  }

  elements.forEach((element) => {
    const saved =
      originalAttributes.get(element)

    if (!saved) return

    ;[
      'placeholder',
      'title',
      'aria-label',
      'alt',
    ].forEach((attribute) => {
      const original =
        saved[attribute]

      if (
        !original ||
        !isArabicText(original)
      ) {
        return
      }

      const translated =
        translateValue(
          original,
          'en'
        )

      if (
        translated === original ||
        isArabicText(translated)
      ) {
        const source =
          normalizeText(original)

        if (source) {
          sources.add(source)
        }
      }
    })
  })

  return [...sources]
}

async function requestOpenAIUITranslations(
  sources
) {
  loadUITranslationCache()

  const now = Date.now()

  const missing = sources.filter(
    (source) => {
      if (
        UI_TRANSLATION_CACHE.has(
          source
        )
      ) {
        return false
      }

      const retryAfter =
        UI_TRANSLATION_RETRY_AFTER.get(
          source
        ) || 0

      return now >= retryAfter
    }
  )

  if (!missing.length) {
    return
  }

  /*
   * If a request is already running, wait for it.
   * The current request already contains its own
   * batch. The retry cooldown prevents immediate
   * repeated requests from MutationObserver.
   */
  if (uiTranslationRequest) {
    await uiTranslationRequest
    return
  }

  const batch =
    missing.slice(0, 40)

  // Mark these sources as temporarily handled
  // before starting the request. This prevents
  // duplicate calls caused by rapid DOM mutations.
  const retryAt =
    Date.now() +
    UI_TRANSLATION_RETRY_DELAY

  batch.forEach((source) => {
    UI_TRANSLATION_RETRY_AFTER.set(
      source,
      retryAt
    )
  })

  uiTranslationRequest =
    (async () => {
      try {
        const response =
          await fetch(
            `${API_BASE_URL}/api/translation/batch`,
            {
              method: 'POST',
              headers: {
                'Content-Type':
                  'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                values: batch,
              }),
            }
          )

        if (!response.ok) {
          throw new Error(
            `UI translation request failed: ${response.status}`
          )
        }

        const data =
          await response
            .json()
            .catch(() => ({}))

        Object.entries(
          data?.translations || {}
        ).forEach(
          ([source, translation]) => {
            if (
              typeof translation ===
                'string' &&
              translation.trim() &&
              !isArabicText(
                translation
              )
            ) {
              UI_TRANSLATION_CACHE.set(
                source,
                translation.trim()
              )

              // Successful translations
              // no longer need a retry cooldown.
              UI_TRANSLATION_RETRY_AFTER.delete(
                source
              )
            }
          }
        )

        saveUITranslationCache()
      } catch (error) {
        /*
         * Keep the retry cooldown on failure.
         * This is important because MutationObserver
         * can otherwise create a request storm.
         */
        throw error
      }
    })().finally(() => {
      uiTranslationRequest = null
    })

  await uiTranslationRequest
}

function applyOpenAIUITranslations(
  root
) {
  loadUITranslationCache()

  const applyTextNode = (textNode) => {
    if (!textNode) return

    const original =
      originalTextNodes.get(
        textNode
      )

    if (!original) return

    const translation =
      UI_TRANSLATION_CACHE.get(
        normalizeText(original)
      )

    if (
      translation &&
      !isArabicText(translation)
    ) {
      textNode.textContent =
        translation
    }
  }

  if (
    root?.nodeType ===
    Node.TEXT_NODE
  ) {
    applyTextNode(root)
  } else if (root) {
    const walker =
      document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT
      )

    let node

    while (
      (node = walker.nextNode())
    ) {
      applyTextNode(node)
    }
  }

  const elements = []

  if (
    root?.nodeType ===
    Node.ELEMENT_NODE
  ) {
    elements.push(root)
  }

  if (root?.querySelectorAll) {
    root
      .querySelectorAll(
        '[placeholder], [title], [aria-label], [alt]'
      )
      .forEach((element) =>
        elements.push(element)
      )
  }

  elements.forEach((element) => {
    const saved =
      originalAttributes.get(
        element
      )

    if (!saved) return

    ;[
      'placeholder',
      'title',
      'aria-label',
      'alt',
    ].forEach((attribute) => {
      const original =
        saved[attribute]

      if (!original) return

      const translation =
        UI_TRANSLATION_CACHE.get(
          normalizeText(original)
        )

      if (
        translation &&
        !isArabicText(translation)
      ) {
        element.setAttribute(
          attribute,
          translation
        )
      }
    })
  })
}

async function translateDomWithOpenAIFallback(
  root,
  language
) {
  if (
    language !== 'en' ||
    typeof document === 'undefined'
  ) {
    return
  }

  /*
   * First apply the local dictionary.
   */
  translateTree(
    root,
    language
  )

  /*
   * Then find Arabic strings that the
   * local dictionary does not know.
   */
  const sources =
    collectMissingEnglishTranslations(
      root
    )

  if (!sources.length) {
    return
  }

  try {
    await requestOpenAIUITranslations(
      sources
    )

    /*
     * Apply cached OpenAI translations.
     * This also works for protected car
     * specification text.
     */
    applyOpenAIUITranslations(
      root
    )
  } catch (error) {
    console.warn(
      'OpenAI UI translation fallback unavailable:',
      error?.message || error
    )
  }
}

function translateDom(language) {
  if (
    typeof document === 'undefined' ||
    !document.body
  ) {
    return
  }

  translateTree(
    document.body,
    language
  )
}

export function LanguageProvider({
  children,
}) {
  const [language, setLanguageState] =
    useState(() => {
      const saved =
        localStorage.getItem(
          'elite-cars-language'
        )

      return saved === 'en'
        ? 'en'
        : 'ar'
    })

  const [theme, setThemeState] =
    useState(() => {
      const saved =
        localStorage.getItem(
          'elite-cars-theme'
        )

      return saved === 'dark'
        ? 'dark'
        : 'light'
    })

  const setLanguage = (value) => {
    const next =
      value === 'en'
        ? 'en'
        : 'ar'

    setLanguageState(next)

    localStorage.setItem(
      'elite-cars-language',
      next
    )
  }

  const setTheme = (value) => {
    const next =
      value === 'dark'
        ? 'dark'
        : 'light'

    setThemeState(next)

    localStorage.setItem(
      'elite-cars-theme',
      next
    )
  }

  useEffect(() => {
    if (
      typeof document === 'undefined'
    ) {
      return
    }

    document.documentElement.lang =
      language

    document.documentElement.dir =
      language === 'ar'
        ? 'rtl'
        : 'ltr'

    document.documentElement.dataset.language =
      language

    document.documentElement.dataset.theme =
      theme

    document.body.dataset.language =
      language

    document.body.dataset.theme =
      theme

    document.title =
      language === 'en'
        ? 'Elite Cars | Luxury Car Showroom'
        : 'Elite Cars | معرض السيارات الفاخرة'

    const description =
      language === 'en'
        ? 'Elite Cars - Luxury car showroom. Discover a curated collection of premium global cars at competitive prices with quality assurance.'
        : 'Elite Cars - معرض السيارات الفاخرة في أدلب. اكتشف مجموعة مختارة من أرقى السيارات العالمية بأفضل الأسعار وضمان الجودة.'

    document
      .querySelector(
        'meta[name="description"]'
      )
      ?.setAttribute(
        'content',
        description
      )

    document
      .querySelector(
        'meta[property="og:title"]'
      )
      ?.setAttribute(
        'content',
        language === 'en'
          ? 'Elite Cars | Luxury Car Showroom'
          : 'Elite Cars | معرض السيارات الفاخرة'
      )

    document
      .querySelector(
        'meta[property="og:description"]'
      )
      ?.setAttribute(
        'content',
        description
      )

    document
      .querySelector(
        'meta[property="og:locale"]'
      )
      ?.setAttribute(
        'content',
        language === 'en'
          ? 'en_US'
          : 'ar_SY'
      )

    translateDom(language)

    void translateDomWithOpenAIFallback(
      document.body,
      language
    )

    let frameId = null
    let pendingNodes = new Set()

    const processChangedTextNode = (
      textNode
    ) => {
      if (
        !textNode ||
        textNode.nodeType !==
          Node.TEXT_NODE
      ) {
        return
      }

      const parent =
        textNode.parentElement

      if (
        !parent ||
        ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(
          parent.tagName
        )
      ) {
        return
      }

      const currentText =
        textNode.textContent

      const storedOriginal =
        originalTextNodes.get(
          textNode
        )

      /*
       * React can reuse the same text node
       * when asynchronous car data arrives.
       *
       * Always refresh the source when React
       * replaces Arabic content.
       */
      if (
        language === 'en' &&
        isArabicText(currentText) &&
        currentText !==
          storedOriginal
      ) {
        originalTextNodes.set(
          textNode,
          currentText
        )
      } else if (
        language === 'ar' &&
        !isArabicText(currentText) &&
        currentText !==
          storedOriginal
      ) {
        originalTextNodes.set(
          textNode,
          currentText
        )
      }

      translateTextNode(
        textNode,
        language
      )

      if (language === 'en') {
        void translateDomWithOpenAIFallback(
          textNode,
          language
        )
      }
    }

    const flush = () => {
      frameId = null

      const nodes =
        pendingNodes

      pendingNodes = new Set()

      nodes.forEach((node) => {
        if (
          node?.nodeType ===
          Node.TEXT_NODE
        ) {
          processChangedTextNode(
            node
          )
          return
        }

        translateTree(
          node,
          language
        )

        if (language === 'en') {
          void translateDomWithOpenAIFallback(
            node,
            language
          )
        }
      })
    }

    const observer =
      new MutationObserver(
        (mutations) => {
          for (
            const mutation of mutations
          ) {
            mutation.addedNodes.forEach(
              (node) => {
                pendingNodes.add(node)
              }
            )

            if (
              mutation.type ===
                'characterData' &&
              mutation.target
            ) {
              pendingNodes.add(
                mutation.target
              )
            }
          }

          if (
            pendingNodes.size &&
            frameId === null
          ) {
            frameId =
              window.requestAnimationFrame(
                flush
              )
          }
        }
      )

    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true,
        characterData: true,
      }
    )

    return () => {
      observer.disconnect()

      pendingNodes.clear()

      if (frameId !== null) {
        window.cancelAnimationFrame(
          frameId
        )
      }
    }
  }, [language, theme])

  const t = useCallback(
    (value) => {
      if (
        !value ||
        typeof value !== 'string'
      ) {
        return value
      }

      return translateValue(
        value,
        language
      )
    },
    [language]
  )

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      theme,
      setTheme,
      t,
    }),
    [
      language,
      theme,
      t,
    ]
  )

  return (
    <LanguageContext.Provider
      value={value}
    >
      {children}
    </LanguageContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLanguage() {
  const context =
    useContext(LanguageContext)

  if (!context) {
    throw new Error(
      'useLanguage must be used inside LanguageProvider'
    )
  }

  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export const getNumberLocale = (
  language
) =>
  language === 'en'
    ? 'en-US'
    : 'ar-SA'