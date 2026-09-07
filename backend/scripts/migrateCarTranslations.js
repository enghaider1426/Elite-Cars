/**
 * ============================================================
 * Elite Cars - Car Translation Migration
 * ============================================================
 *
 * الهدف:
 *   التأكد من أن جميع السيارات الموجودة حاليًا في MongoDB
 *   لديها ترجمة إنجليزية صحيحة ونظيفة في حقول En.
 *
 * IMPORTANT:
 *   - لا يتم تعديل أي حقل عربي.
 *   - يتم تحديث حقول En فقط.
 *   - لا يتم إعادة ترجمة السيارة إذا كانت ترجمتها الإنجليزية
 *     موجودة وصحيحة.
 *   - إذا كانت الترجمة ناقصة أو غير صالحة يتم طلب ترجمة جديدة.
 *   - ترجمة السيارات تستخدم OpenAI عبر خدمة الترجمة المركزية.
 *   - لا يتم حذف أي سيارة.
 *
 * تشغيل:
 *   node scripts/migrateCarTranslations.js
 *
 * ============================================================
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const mongoose = require('mongoose');

const Car = require('../models/Car');

const { translateCarData } = require('../services/carTranslation');

const MONGODB_URI = process.env.MONGODB_URI;

const DELAY_BETWEEN_CARS_MS = 1200;

const MAX_RETRIES = 2;

/**
 * الحقول الإنجليزية التي يجب أن تكون موجودة.
 */
const ENGLISH_FIELDS = [
  'nameEn',
  'manufacturerEn',
  'modelEn',
  'descriptionEn',
  'featuresEn',
  'colorEn',
  'fuelTypeEn',
  'transmissionEn',
  'bodyTypeEn',
];

/**
 * الحقول النصية الإنجليزية.
 */
const ENGLISH_TEXT_FIELDS = [
  'nameEn',
  'manufacturerEn',
  'modelEn',
  'descriptionEn',
  'colorEn',
  'fuelTypeEn',
  'transmissionEn',
  'bodyTypeEn',
];

/**
 * Delay helper.
 */
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * ------------------------------------------------------------
 * Helpers
 * ------------------------------------------------------------
 */

/**
 * التأكد من أن القيمة موجودة فعليًا.
 */
function hasValue(value) {
  if (Array.isArray(value)) {
    return value.length > 0;
  }

  return (
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ''
  );
}

/**
 * التأكد من وجود جميع حقول الترجمة.
 */
function hasAllEnglishFields(car) {
  return ENGLISH_FIELDS.every((field) =>
    Object.prototype.hasOwnProperty.call(car, field)
  );
}

/**
 * التأكد من عدم وجود أحرف عربية داخل الترجمة الإنجليزية.
 */
function containsArabic(value) {
  if (value === undefined || value === null) {
    return false;
  }

  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(
    String(value)
  );
}

/**
 * اكتشاف صياغات غير مرغوبة في الترجمة.
 *
 * أمثلة نريد منعها:
 *   Carrera (or Carrera)
 *   translated as ...
 *   Arabic: ...
 *   also known as ...
 */
function containsBadTranslationPattern(value) {
  if (value === undefined || value === null) {
    return false;
  }

  const text = String(value).trim();

  const badPatterns = [
    /\(\s*or\s+/i,
    /\balso known as\b/i,
    /\btranslated as\b/i,
    /\bArabic\s*:/i,
    /\bEnglish\s*:/i,
  ];

  return badPatterns.some((pattern) => pattern.test(text));
}

/**
 * اكتشاف التصاق كلمات إنجليزية بشكل مشبوه.
 *
 * مثال:
 *   naturalLeather
 *   M Sportseats
 *   systemAvailable
 */
function containsSuspiciousEnglishConcatenation(value) {
  if (value === undefined || value === null) {
    return false;
  }

  const text = String(value).trim();

  /**
   * CamelCase / كلمات ملتصقة تبدأ بحرف كبير.
   *
   * نستثني بعض الحالات الشائعة الخاصة بالسيارات:
   *   BMW
   *   MBUX
   *   LDVI
   *   V10
   *   S500
   */
  if (/\b[a-z]{4,}[A-Z][a-z]+\b/.test(text)) {
    return true;
  }

  /**
   * التصاق كلمة إنجليزية بكلمة أخرى معروفة شكليًا.
   */
  if (
    /\b(?:M|S|RS|AMG|V10|V8)\s*[A-Z]?[a-z]{3,}[A-Z][a-z]+\b/.test(
      text
    )
  ) {
    return true;
  }

  return false;
}

/**
 * التأكد من تنسيق الفواصل |.
 *
 * نقبل:
 *   A | B
 *
 * ونرفض:
 *   A|B
 *   A |B
 *   A| B
 *   A|
 *   |B
 */
function hasInvalidSeparatorSpacing(value) {
  if (value === undefined || value === null) {
    return false;
  }

  const text = String(value);

  /**
   * الفاصل الصحيح يجب أن يكون:
   *
   *   مسافة | مسافة
   *
   * مثل:
   *   A | B
   *
   * هذه القاعدة ترفض:
   *   A|B
   *   A |B
   *   A| B
   */
  return /(?<!\s)\||\|(?!\s)/.test(text);
}

/**
 * تنظيف تنسيق | في الترجمات الموجودة مسبقًا.
 *
 * أمثلة:
 *
 *   Leather seats |Burmester
 *   Leather seats| Burmester
 *   Leather seats|Burmester
 *
 * تصبح:
 *
 *   Leather seats | Burmester
 *
 * هذا التعديل محلي ولا يستخدم OpenAI.
 */
function normalizeEnglishSpacing(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace(/\s*\|\s*/g, ' | ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * تنظيف Array الخاصة بالمميزات.
 */
function normalizeFeatures(features) {
  if (!Array.isArray(features)) {
    return features;
  }

  return features
    .map((feature) => normalizeEnglishSpacing(String(feature)))
    .filter((feature) => feature.trim() !== '');
}

/**
 * فحص قيمة إنجليزية واحدة.
 */
function isValidEnglishValue(value) {
  if (value === undefined || value === null) {
    return false;
  }

  const text = String(value).trim();

  if (!text) {
    return false;
  }

  /**
   * ممنوع وجود عربي داخل English field.
   */
  if (containsArabic(text)) {
    return false;
  }

  /**
   * ممنوع صيغ الترجمة التفسيرية.
   */
  if (containsBadTranslationPattern(text)) {
    return false;
  }

  /**
   * ممنوع الالتصاق المشبوه للكلمات.
   */
  if (containsSuspiciousEnglishConcatenation(text)) {
    return false;
  }

  /**
   * الفاصل | يجب أن يكون منسقًا.
   */
  if (hasInvalidSeparatorSpacing(text)) {
    return false;
  }

  return true;
}

/**
 * التأكد من أن الترجمة الإنجليزية الموجودة حاليًا صالحة.
 *
 * مهم:
 *   هذه الدالة لا تطلب OpenAI.
 */
function isExistingTranslationValid(car) {
  /**
   * أولًا يجب أن تكون جميع الحقول موجودة.
   */
  if (!hasAllEnglishFields(car)) {
    return false;
  }

  /**
   * الحقول النصية الأساسية.
   */
  for (const field of ENGLISH_TEXT_FIELDS) {
    if (!isValidEnglishValue(car[field])) {
      return false;
    }
  }

  /**
   * featuresEn يجب أن تكون Array.
   */
  if (!Array.isArray(car.featuresEn)) {
    return false;
  }

  /**
   * فحص كل feature.
   */
  for (const feature of car.featuresEn) {
    if (!isValidEnglishValue(feature)) {
      return false;
    }
  }

  return true;
}

/**
 * فحص الترجمة القادمة من OpenAI.
 */
function validateTranslatedData(translated) {
  if (!translated || typeof translated !== 'object') {
    throw new Error(
      'Invalid translation response: expected an object'
    );
  }

  for (const field of ENGLISH_FIELDS) {
    if (
      !Object.prototype.hasOwnProperty.call(
        translated,
        field
      )
    ) {
      throw new Error(
        `Missing translation field: ${field}`
      );
    }
  }

  /**
   * featuresEn يجب أن تكون Array.
   */
  if (!Array.isArray(translated.featuresEn)) {
    throw new Error(
      'featuresEn must be an array'
    );
  }

  /**
   * فحص الحقول النصية.
   */
  for (const field of ENGLISH_TEXT_FIELDS) {
    if (!isValidEnglishValue(translated[field])) {
      throw new Error(
        `Invalid English translation in field: ${field}`
      );
    }
  }

  /**
   * فحص featuresEn.
   */
  for (const feature of translated.featuresEn) {
    if (!isValidEnglishValue(feature)) {
      throw new Error(
        `Invalid English feature translation: ${feature}`
      );
    }
  }
}

/**
 * ------------------------------------------------------------
 * Local cleanup
 * ------------------------------------------------------------
 *
 * إذا كانت الترجمة موجودة لكن فيها مشكلة spacing
 * بسيطة في |، نقوم بإصلاحها محليًا بدون OpenAI.
 */
async function normalizeExistingTranslation(car) {
  let changed = false;

  for (const field of ENGLISH_TEXT_FIELDS) {
    if (typeof car[field] === 'string') {
      const normalized = normalizeEnglishSpacing(
        car[field]
      );

      if (normalized !== car[field]) {
        car[field] = normalized;
        changed = true;
      }
    }
  }

  if (Array.isArray(car.featuresEn)) {
    const normalizedFeatures = normalizeFeatures(
      car.featuresEn
    );

    if (
      JSON.stringify(normalizedFeatures) !==
      JSON.stringify(car.featuresEn)
    ) {
      car.featuresEn = normalizedFeatures;
      changed = true;
    }
  }

  /**
   * لا نحفظ هنا إلا إذا أصبحت الترجمة كاملة وصالحة
   * بعد التنظيف المحلي.
   *
   * إذا كانت ناقصة أو تحتوي على عربي أو ترجمة سيئة،
   * ستعود الدالة false ويُسمح للسكريبت باستخدام OpenAI.
   */
  if (!isExistingTranslationValid(car)) {
    return false;
  }

  if (changed) {
    await car.save();
  }

  return changed;
}

/**
 * ------------------------------------------------------------
 * OpenAI translation
 * ------------------------------------------------------------
 */

/**
 * معرفة ما إذا كان الخطأ 429 / quota.
 *
 * لا نعيد المحاولة في هذه الحالة.
 */
function isQuotaError(error) {
  const message = String(
    error?.message || error || ''
  ).toLowerCase();

  return (
    message.includes('429') ||
    message.includes('resource_exhausted') ||
    message.includes('quota exceeded') ||
    message.includes('generate_content_free_tier_requests')
  );
}

/**
 * إعادة محاولة الترجمة.
 *
 * مهم:
 *   429 = توقف فوري.
 *   لا نكرر الطلب لأن ذلك يهدر quota.
 */
async function translateWithRetry(car) {
  let lastError = null;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      console.log(
        `   🔄 Translation attempt ${attempt}/${MAX_RETRIES}`
      );

      const translated =
        await translateCarData({
          name: car.name,
          manufacturer: car.manufacturer,
          model: car.model,
          description: car.description,
          features: car.features,
          color: car.color,
          fuelType: car.fuelType,
          transmission: car.transmission,
          bodyType: car.bodyType,
        });

      /**
       * التحقق قبل إرجاع النتيجة.
       */
      validateTranslatedData(translated);

      return translated;
    } catch (error) {
      lastError = error;

      console.error(
        `   ❌ Translation attempt ${attempt} failed: ${error.message}`
      );

      /**
       * إذا كان 429:
       * لا نعيد المحاولة.
       */
      if (isQuotaError(error)) {
        console.error(
          '   🛑 OpenAI quota/rate limit detected.'
        );

        console.error(
          '   🛑 Stopping translation attempts immediately.'
        );

        throw error;
      }

      /**
       * إعادة المحاولة فقط للأخطاء الأخرى.
       */
      if (attempt < MAX_RETRIES) {
        await sleep(1500);
      }
    }
  }

  throw lastError;
}

/**
 * ------------------------------------------------------------
 * Save
 * ------------------------------------------------------------
 */

/**
 * تحديث حقول En فقط.
 *
 * لا يتم تعديل أي حقل عربي.
 */
async function saveTranslation(car, translated) {
  validateTranslatedData(translated);

  car.nameEn =
    normalizeEnglishSpacing(
      translated.nameEn
    );

  car.manufacturerEn =
    normalizeEnglishSpacing(
      translated.manufacturerEn
    );

  car.modelEn =
    normalizeEnglishSpacing(
      translated.modelEn
    );

  car.descriptionEn =
    normalizeEnglishSpacing(
      translated.descriptionEn
    );

  car.featuresEn =
    normalizeFeatures(
      translated.featuresEn
    );

  car.colorEn =
    normalizeEnglishSpacing(
      translated.colorEn
    );

  car.fuelTypeEn =
    normalizeEnglishSpacing(
      translated.fuelTypeEn
    );

  car.transmissionEn =
    normalizeEnglishSpacing(
      translated.transmissionEn
    );

  car.bodyTypeEn =
    normalizeEnglishSpacing(
      translated.bodyTypeEn
    );

  /**
   * تأكيد نهائي قبل الحفظ.
   */
  validateTranslatedData({
    nameEn: car.nameEn,
    manufacturerEn: car.manufacturerEn,
    modelEn: car.modelEn,
    descriptionEn: car.descriptionEn,
    featuresEn: car.featuresEn,
    colorEn: car.colorEn,
    fuelTypeEn: car.fuelTypeEn,
    transmissionEn: car.transmissionEn,
    bodyTypeEn: car.bodyTypeEn,
  });

  /**
   * حفظ حقول En فقط.
   *
   * الحقول العربية لا يتم لمسها.
   */
  await car.save();
}

/**
 * ------------------------------------------------------------
 * Main migration
 * ------------------------------------------------------------
 */

async function migrate() {
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI غير موجود في ملف .env الخاص بالـ Backend'
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY غير موجود في ملف .env الخاص بالـ Backend'
    );
  }

  console.log('');

  console.log(
    '=============================================='
  );

  console.log(
    '🚗 Elite Cars - Car Translation Migration'
  );

  console.log(
    '=============================================='
  );

  console.log('');

  console.log(
    '🔌 Connecting to MongoDB...'
  );

  await mongoose.connect(MONGODB_URI);

  console.log(
    '✅ MongoDB connected'
  );

  console.log('');

  /**
   * جلب جميع السيارات.
   */
  const cars = await Car.find({}).sort({
    createdAt: 1,
  });

  console.log(
    `📦 Total cars found: ${cars.length}`
  );

  console.log('');

  console.log(
    '🇸🇦 Arabic/original fields will NOT be modified.'
  );

  console.log(
    '🇬🇧 Only English translation fields will be updated.'
  );

  console.log(
    '♻️ Existing valid translations will NOT be regenerated.'
  );

  console.log(
    '🤖 OpenAI will be used for missing or invalid English translations.'
  );

  console.log('');

  if (cars.length === 0) {
    console.log(
      'ℹ️ No cars found. Nothing to migrate.'
    );

    await mongoose.disconnect();

    return;
  }

  let successCount = 0;

  let skippedCount = 0;

  let normalizedCount = 0;

  let failedCount = 0;

  const failedCars = [];

  /**
   * متغير لمعرفة إذا وصلنا إلى quota.
   *
   * إذا حدث 429:
   * لا نكمل بإرسال طلبات OpenAI لبقية السيارات.
   */
  let quotaExceeded = false;

  /**
   * معالجة السيارات واحدة واحدة.
   */
  for (
    let index = 0;
    index < cars.length;
    index++
  ) {
    const car = cars[index];

    console.log('');

    console.log(
      '----------------------------------------------'
    );

    console.log(
      `🚘 Car ${index + 1}/${cars.length}`
    );

    console.log(
      `   ID: ${car._id}`
    );

    console.log(
      `   Arabic name: ${car.name || '(empty)'}`
    );

    console.log(
      `   Arabic manufacturer: ${
        car.manufacturer || '(empty)'
      }`
    );

    console.log(
      `   Arabic model: ${
        car.model || '(empty)'
      }`
    );

    /**
     * إذا وصلنا quota من سيارة سابقة:
     * لا نرسل أي طلبات جديدة.
     */
    if (quotaExceeded) {
      failedCount++;

      failedCars.push({
        id: String(car._id),
        name: car.name,
        manufacturer: car.manufacturer,
        model: car.model,
        error:
          'Skipped because OpenAI quota was already exceeded earlier in this migration.',
      });

      console.log(
        '   🛑 Skipped: OpenAI quota already exceeded.'
      );

      continue;
    }

    try {
      /**
       * ------------------------------------------------------
       * STEP 1
       * ------------------------------------------------------
       *
       * أولًا نحاول تنظيف الترجمة الموجودة محليًا.
       *
       * هذا يصلح مشاكل spacing مثل:
       *
       *   A|B
       *   A |B
       *   A| B
       *
       * بدون OpenAI.
       */
      const normalized =
        await normalizeExistingTranslation(car);

      if (normalized) {
        normalizedCount++;

        console.log(
          '   🧹 Existing English translation normalized locally.'
        );

        continue;
      }

      /**
       * بعد التنظيف المحلي:
       * إذا كانت الترجمة صالحة ولم يحدث تعديل،
       * لا نطلب OpenAI.
       */
      if (isExistingTranslationValid(car)) {
        skippedCount++;

        console.log(
          '   ⏭️ Existing English translation is valid. Skipping OpenAI.'
        );

        continue;
      }

      /**
       * ------------------------------------------------------
       * STEP 2
       * ------------------------------------------------------
       *
       * الترجمة ناقصة أو غير صالحة.
       */
      console.log(
        '   ⚠️ Existing English translation is missing or invalid.'
      );

      console.log(
        '   🔄 Requesting a new translation from OpenAI...'
      );

      /**
       * مهم جدًا:
       *
       * المصدر الوحيد للترجمة هو الحقول العربية الأصلية.
       *
       * لا نرسل En كمصدر.
       */
      const translated =
        await translateWithRetry(car);

      /**
       * ------------------------------------------------------
       * STEP 3
       * ------------------------------------------------------
       *
       * حفظ En فقط.
       */
      await saveTranslation(
        car,
        translated
      );

      successCount++;

      console.log(
        '   ✅ Translation saved successfully.'
      );

      console.log(
        `   🇬🇧 Name: ${car.nameEn}`
      );

      console.log(
        `   🇬🇧 Manufacturer: ${car.manufacturerEn}`
      );

      console.log(
        `   🇬🇧 Model: ${car.modelEn}`
      );

      if (
        Array.isArray(car.featuresEn) &&
        car.featuresEn.length > 0
      ) {
        console.log(
          `   🇬🇧 Features: ${car.featuresEn.join(' | ')}`
        );
      }

      /**
       * انتظار قبل السيارة التالية.
       */
      if (index < cars.length - 1) {
        await sleep(
          DELAY_BETWEEN_CARS_MS
        );
      }
    } catch (error) {
      /**
       * إذا كان 429:
       * نوقف أي استدعاءات OpenAI لبقية السيارات.
       */
      if (isQuotaError(error)) {
        quotaExceeded = true;
      }

      failedCount++;

      failedCars.push({
        id: String(car._id),
        name: car.name,
        manufacturer: car.manufacturer,
        model: car.model,
        error: error.message,
      });

      console.error(
        `   ❌ FAILED: ${error.message}`
      );

      if (quotaExceeded) {
        console.error('');

        console.error(
          '🛑 OpenAI quota exceeded.'
        );

        console.error(
          '🛑 No more OpenAI requests will be sent in this run.'
        );

        console.error(
          '🛡️ Arabic/original data remains untouched.'
        );

        console.error('');
      }

      /**
       * نكمل فقط إذا لم يكن الخطأ quota.
       */
      continue;
    }
  }

  /**
   * ----------------------------------------------------------
   * Summary
   * ----------------------------------------------------------
   */

  console.log('');

  console.log('');

  console.log(
    '=============================================='
  );

  console.log(
    '📊 Migration Summary'
  );

  console.log(
    '=============================================='
  );

  console.log(
    `📦 Total cars: ${cars.length}`
  );

  console.log(
    `🔄 Newly translated: ${successCount}`
  );

  console.log(
    `⏭️ Already valid / skipped: ${skippedCount}`
  );

  console.log(
    `🧹 Fixed locally without OpenAI: ${normalizedCount}`
  );

  console.log(
    `❌ Failed: ${failedCount}`
  );

  /**
   * ----------------------------------------------------------
   * Failed cars
   * ----------------------------------------------------------
   */

  if (failedCars.length > 0) {
    console.log('');

    console.log(
      '=============================================='
    );

    console.log(
      '❌ Failed / Pending Cars'
    );

    console.log(
      '=============================================='
    );

    for (const failed of failedCars) {
      console.log('');

      console.log(
        `ID: ${failed.id}`
      );

      console.log(
        `Name: ${failed.name || '(empty)'}`
      );

      console.log(
        `Manufacturer: ${
          failed.manufacturer || '(empty)'
        }`
      );

      console.log(
        `Model: ${failed.model || '(empty)'}`
      );

      console.log(
        `Error: ${failed.error}`
      );
    }
  }

  console.log('');

  console.log(
    '=============================================='
  );

  /**
   * النتيجة النهائية.
   */
  if (failedCount === 0) {
    console.log(
      '🎉 Migration completed successfully!'
    );

    console.log(
      '🇬🇧 All required English translations are valid.'
    );

    console.log(
      '🇸🇦 Arabic/original fields were preserved.'
    );
  } else if (quotaExceeded) {
    console.log(
      '⚠️ Migration stopped safely because OpenAI quota was exceeded.'
    );

    console.log(
      '🛡️ No Arabic/original fields were modified.'
    );

    console.log(
      '💡 Run the migration again after the OpenAI quota resets.'
    );
  } else {
    console.log(
      '⚠️ Migration completed with some failures.'
    );

    console.log(
      '🛡️ Arabic/original fields were preserved.'
    );
  }

  console.log(
    '=============================================='
  );

  console.log('');
}

/**
 * ------------------------------------------------------------
 * Start migration
 * ------------------------------------------------------------
 */

migrate()
  .catch((error) => {
    console.error('');

    console.error(
      '=============================================='
    );

    console.error(
      '❌ Migration failed'
    );

    console.error(
      '=============================================='
    );

    console.error(
      error.message
    );

    console.error('');
  })
  .finally(async () => {
    /**
     * التأكد من إغلاق اتصال MongoDB.
     */
    if (
      mongoose.connection.readyState !== 0
    ) {
      await mongoose.disconnect();

      console.log(
        '🔌 MongoDB connection closed.'
      );
    }
  });