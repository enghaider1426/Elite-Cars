/**
 * Elite Cars - Car Translation Service
 *
 * Translates Arabic car data into clean, professional English
 * using the OpenAI Responses API.
 *
 * IMPORTANT:
 * - Arabic/original fields are NEVER modified.
 * - English fields must contain NO Arabic characters.
 * - OpenAI must translate the COMPLETE value.
 * - No mixed Arabic/English output is accepted.
 * - Invalid or suspicious translations are rejected.
 * - Automatic retry with exponential backoff for temporary errors.
 */

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const OPENAI_MODEL =
  process.env.OPENAI_TRANSLATION_MODEL || 'gpt-5.6-luna';

const OPENAI_URL =
  'https://api.openai.com/v1/responses';

/**
 * Retry configuration.
 */
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 2000;
const MAX_RETRY_DELAY = 20000;

/**
 * Sleep helper.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff with jitter.
 */
function getRetryDelay(attempt) {
  const exponentialDelay =
    INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);

  const cappedDelay =
    Math.min(exponentialDelay, MAX_RETRY_DELAY);

  const jitter =
    Math.floor(Math.random() * 1000);

  return cappedDelay + jitter;
}

/**
 * Determine whether an HTTP status is temporary
 * and safe to retry.
 */
function isRetryableStatus(status) {
  return (
    status === 408 ||
    status === 409 ||
    status === 429 ||
    status === 500 ||
    status === 502 ||
    status === 503 ||
    status === 504
  );
}

/**
 * Clean normal text.
 */
function cleanText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .replace(/\s+/g, ' ');
}

/**
 * Normalize features array.
 */
function normalizeFeatures(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === 'string')
    .map((item) => cleanText(item))
    .filter(Boolean);
}

/**
 * Check whether text contains Arabic characters.
 */
function containsArabic(value) {
  if (typeof value !== 'string') {
    return false;
  }

  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
    value
  );
}

/**
 * Clean English text.
 *
 * IMPORTANT:
 * We NEVER remove Arabic characters here.
 * If Arabic exists, validation rejects the translation.
 */
function cleanEnglishText(value) {
  if (typeof value !== 'string') {
    return '';
  }

  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\s*([|;,])\s*/g, '$1 ')
    .replace(/\(\s+/g, '(')
    .replace(/\s+\)/g, ')')
    .replace(/^\s*[-–—,:;|]+\s*/g, '')
    .replace(/\s*[-–—,:;|]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Clean translated features.
 */
function cleanEnglishFeatures(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item) => typeof item === 'string')
    .map((item) => cleanEnglishText(item))
    .filter(Boolean);
}

/**
 * Build the exact input sent to OpenAI.
 *
 * Only original/source fields are sent.
 * English fields are NEVER used as translation input.
 */
function buildTranslationInput(carData) {
  return {
    name: cleanText(carData.name),
    manufacturer: cleanText(carData.manufacturer),
    model: cleanText(carData.model),
    description: cleanText(carData.description),
    features: normalizeFeatures(carData.features),
    color: cleanText(carData.color),
    fuelType: cleanText(carData.fuelType),
    transmission: cleanText(carData.transmission),
    bodyType: cleanText(carData.bodyType),
  };
}

/**
 * Extract generated text from OpenAI Responses API.
 */
function extractOpenAIText(result) {
  if (
    typeof result?.output_text === 'string' &&
    result.output_text.trim()
  ) {
    return result.output_text.trim();
  }

  const output = result?.output;

  if (!Array.isArray(output)) {
    return '';
  }

  const textParts = [];

  for (const item of output) {
    if (!Array.isArray(item?.content)) {
      continue;
    }

    for (const content of item.content) {
      if (typeof content?.text === 'string') {
        textParts.push(content.text);
        continue;
      }

      if (
        typeof content?.text?.value === 'string'
      ) {
        textParts.push(content.text.value);
      }
    }
  }

  return textParts.join('').trim();
}

/**
 * Remove Markdown JSON fences if the model adds them accidentally.
 */
function stripJsonCodeFence(text) {
  if (typeof text !== 'string') {
    return '';
  }

  return text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

/**
 * Parse OpenAI JSON response.
 */
function parseTranslationResponse(text) {
  if (!text) {
    throw new Error(
      'OpenAI returned an empty translation response'
    );
  }

  const cleanedText =
    stripJsonCodeFence(text);

  try {
    const parsed =
      JSON.parse(cleanedText);

    if (
      !parsed ||
      typeof parsed !== 'object' ||
      Array.isArray(parsed)
    ) {
      throw new Error(
        'OpenAI response is not a JSON object'
      );
    }

    return parsed;
  } catch (error) {
    throw new Error(
      `OpenAI returned invalid JSON for car translation: ${error.message}`
    );
  }
}

/**
 * Validate that OpenAI returned all required fields.
 */
function validateTranslationStructure(translated) {
  const requiredFields = [
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

  for (const field of requiredFields) {
    if (
      !Object.prototype.hasOwnProperty.call(
        translated,
        field
      )
    ) {
      throw new Error(
        `OpenAI translation is missing required field: ${field}`
      );
    }
  }

  if (!Array.isArray(translated.featuresEn)) {
    throw new Error(
      'OpenAI translation field featuresEn must be an array'
    );
  }

  const stringFields = [
    'nameEn',
    'manufacturerEn',
    'modelEn',
    'descriptionEn',
    'colorEn',
    'fuelTypeEn',
    'transmissionEn',
    'bodyTypeEn',
  ];

  for (const field of stringFields) {
    if (
      translated[field] !== null &&
      typeof translated[field] !== 'string'
    ) {
      throw new Error(
        `OpenAI translation field ${field} must be a string`
      );
    }
  }

  for (const feature of translated.featuresEn) {
    if (typeof feature !== 'string') {
      throw new Error(
        'OpenAI translation featuresEn must contain only strings'
      );
    }
  }
}

/**
 * Validate that NO Arabic exists in ANY English field.
 */
function validateEnglishTranslation(translatedData) {
  const stringFields = [
    'nameEn',
    'manufacturerEn',
    'modelEn',
    'descriptionEn',
    'colorEn',
    'fuelTypeEn',
    'transmissionEn',
    'bodyTypeEn',
  ];

  for (const field of stringFields) {
    if (containsArabic(translatedData[field])) {
      throw new Error(
        `Invalid English translation: Arabic characters detected in ${field}`
      );
    }
  }

  for (const feature of translatedData.featuresEn) {
    if (containsArabic(feature)) {
      throw new Error(
        'Invalid English translation: Arabic characters detected in featuresEn'
      );
    }
  }
}

/**
 * Detect common mixed-language / explanation patterns.
 */
function validateNoMixedTranslationPatterns(translatedData) {
  const allValues = [
    translatedData.nameEn,
    translatedData.manufacturerEn,
    translatedData.modelEn,
    translatedData.descriptionEn,
    translatedData.colorEn,
    translatedData.fuelTypeEn,
    translatedData.transmissionEn,
    translatedData.bodyTypeEn,
    ...translatedData.featuresEn,
  ];

  for (const value of allValues) {
    if (
      typeof value !== 'string' ||
      !value
    ) {
      continue;
    }

    if (containsArabic(value)) {
      throw new Error(
        'Mixed Arabic/English translation detected'
      );
    }

    if (
      /\bArabic\s*:/i.test(value) ||
      /\balso known as\b/i.test(value) ||
      /\btranslated as\b/i.test(value) ||
      /\bmeaning\s*:/i.test(value) ||
      /\btranslation\s*:/i.test(value)
    ) {
      throw new Error(
        'OpenAI returned translation/explanation text instead of a clean translation'
      );
    }

    if (
      /\(\s*or\s+[^)]+\)/i.test(value)
    ) {
      throw new Error(
        'OpenAI returned an alternative instead of a single clean translation'
      );
    }
  }
}

/**
 * Detect suspicious spacing/concatenation.
 */
function validateEnglishSpacing(translatedData) {
  const allValues = [
    translatedData.nameEn,
    translatedData.manufacturerEn,
    translatedData.modelEn,
    translatedData.descriptionEn,
    translatedData.colorEn,
    translatedData.fuelTypeEn,
    translatedData.transmissionEn,
    translatedData.bodyTypeEn,
    ...translatedData.featuresEn,
  ];

  for (const value of allValues) {
    if (
      typeof value !== 'string' ||
      !value
    ) {
      continue;
    }

    /**
     * Detect suspicious concatenations.
     *
     * Examples:
     * naturalLeather
     * M Sportseats
     *
     * Normal technical names such as xDrive or iPhone
     * are intentionally not targeted.
     */
    if (
      /\b[a-z]{4,}[A-Z][a-z]+\b/.test(value)
    ) {
      throw new Error(
        `Suspicious English word concatenation detected: ${value}`
      );
    }

    /**
     * Detect words accidentally attached to separators.
     */
    if (
      /[^\s]\|[^\s]/.test(value)
    ) {
      throw new Error(
        `Invalid spacing around separator detected: ${value}`
      );
    }
  }
}

/**
 * Additional automotive quality validation.
 */
function validateAutomotiveTranslation(
  input,
  translatedData
) {
  const sourceManufacturer =
    cleanText(input.manufacturer);

  const sourceModel =
    cleanText(input.model);

  if (
    !sourceManufacturer &&
    translatedData.manufacturerEn
  ) {
    throw new Error(
      'OpenAI generated manufacturerEn even though manufacturer is empty'
    );
  }

  if (
    !sourceModel &&
    translatedData.modelEn
  ) {
    throw new Error(
      'OpenAI generated modelEn even though model is empty'
    );
  }

  if (
    /\bmanufacturer\b/i.test(
      translatedData.manufacturerEn
    ) ||
    /\bbrand\b/i.test(
      translatedData.manufacturerEn
    )
  ) {
    throw new Error(
      `Invalid manufacturer translation: ${translatedData.manufacturerEn}`
    );
  }
}

/**
 * Build the OpenAI prompt.
 */
function buildPrompt(input) {
  return `
You are a professional automotive translator for a real car dealership.

Your ONLY task is to translate the supplied Arabic/source car data into
clean, natural, professional English.

The result will be stored permanently in MongoDB and displayed directly
to English-speaking customers.

This is NOT a bilingual output.

==================================================
ABSOLUTE RULES
==================================================

1. Return ONLY valid JSON.
2. Do NOT return Markdown.
3. Do NOT return explanations.
4. Do NOT return notes.
5. Do NOT return comments.
6. Do NOT return alternatives.
7. Do NOT return multiple possible translations.
8. Do NOT write "(or ...)".
9. Do NOT write "(Arabic: ...)".
10. Do NOT write "also known as".
11. Do NOT write "translated as".
12. Do NOT write "meaning:".
13. Do NOT write "translation:".
14. NEVER include Arabic characters in ANY English field.
15. Translate the COMPLETE VALUE of every field.
16. NEVER copy an Arabic word into an English field.
17. NEVER mix Arabic and English.
18. NEVER solve the problem by deleting Arabic characters.
19. Actually translate the Arabic meaning into English.
20. Preserve official international automotive brand names.
21. Preserve official international model names when known.
22. Do not invent specifications.
23. Do not add information that is not present.
24. Do not add explanations to names or brands.
25. Do not add the words "Model", "Brand", "Type", or "Manufacturer"
    unless that word is actually part of the original car name.
26. Each field must contain ONLY the translated value of that field.
27. The manufacturer field must contain the manufacturer/brand ONLY.
28. The model field must contain the model ONLY.
29. Never move information from one field into another field.
30. Never add information just to make a sentence sound better.

==================================================
FIELD SEMANTICS
==================================================

name:

The complete car listing/name.

manufacturer:

The automotive manufacturer/brand ONLY.

model:

The vehicle model ONLY.

description:

The complete description.

features:

Individual vehicle features.

color:

Vehicle color.

fuelType:

Fuel type.

transmission:

Transmission type.

bodyType:

Vehicle body type.

Do NOT reinterpret the field names.

==================================================
BRAND RULE
==================================================

Use official international English automotive names.

Examples:

بورشه -> Porsche

مرسيدس -> Mercedes-Benz

بي إم دبليو -> BMW

تويوتا -> Toyota

فورد -> Ford

أودي -> Audi

فولكس فاجن -> Volkswagen

لامبورغيني -> Lamborghini

فيراري -> Ferrari

رولز رويس -> Rolls-Royce

بنتلي -> Bentley

مازيراتي -> Maserati

لكزس -> Lexus

Do not translate a brand into a generic English word.

==================================================
MODEL RULE
==================================================

Known international models must use their official English names.

Examples:

كاريرا -> Carrera

تشيرون -> Chiron

هوراكان -> Huracán

فانتوم -> Phantom

If the source contains:

بورشه كاريرا

the correct English meaning is:

Porsche Carrera

NOT:

Porsche كاريرا

NOT:

Porsche Carrera (كاريرا)

NOT:

Carrera (or Carrera)

==================================================
AUTOMOTIVE DESCRIPTOR RULE
==================================================

Some Arabic data may contain descriptors such as:

طراز

موديل

جيل

نسخة

فئة

Translate these according to their actual meaning ONLY when they
belong inside a description or complete name.

Examples:

جيل 992 -> 992 generation

موديل 2022 -> 2022 model

Do NOT turn these descriptors into the manufacturer value.

==================================================
DESCRIPTION RULE
==================================================

Translate the complete description naturally.

Do NOT leave Arabic words inside the paragraph.

Do NOT translate word-by-word if that produces unnatural English.

==================================================
FEATURES RULE
==================================================

Translate EVERY feature individually.

Example:

[
  "نظام ذكي",
  "مقاعد جلدية",
  "كاميرا خلفية"
]

must become:

[
  "Smart system",
  "Leather seats",
  "Rear camera"
]

Every feature must be complete English.

Never merge words accidentally.

Correct:

"Natural leather"

NOT:

"naturalleather"

Correct:

"M Sport seats"

NOT:

"M Sportseats"

Correct:

"Audi Virtual Cockpit display"

NOT:

"Audi VirtualCockpit display"

==================================================
FUEL
==================================================

بنزين -> Gasoline

ديزل -> Diesel

كهربائي -> Electric

هجين -> Hybrid

==================================================
TRANSMISSION
==================================================

أوتوماتيك -> Automatic

يدوي -> Manual

==================================================
COLOR
==================================================

أبيض -> White

أسود -> Black

أحمر -> Red

أزرق -> Blue

فضي -> Silver

رمادي -> Gray

ذهبي -> Gold

==================================================
BODY TYPE
==================================================

سيدان -> Sedan

كوبيه -> Coupe

SUV -> SUV

دفع رباعي -> SUV / Four-wheel drive depending on context

هاتشباك -> Hatchback

كروس أوفر -> Crossover

بيك أب -> Pickup

==================================================
SPACING
==================================================

English words must be properly separated.

Use:

Natural leather

NOT:

naturalleather

Use:

M Sport seats

NOT:

M Sportseats

Use:

Audi Virtual Cockpit display

NOT:

Audi VirtualCockpit display

Use:

quattro system

NOT:

quattrosystem

==================================================
EMPTY FIELDS
==================================================

If an input string is empty:

Return an empty string.

If features is empty:

Return [].

==================================================
OUTPUT FORMAT
==================================================

Return EXACTLY this JSON structure:

{
  "nameEn": "string",
  "manufacturerEn": "string",
  "modelEn": "string",
  "descriptionEn": "string",
  "featuresEn": ["string"],
  "colorEn": "string",
  "fuelTypeEn": "string",
  "transmissionEn": "string",
  "bodyTypeEn": "string"
}

Do not add any other fields.

==================================================
FINAL CHECK
==================================================

Before returning the JSON, internally verify:

1. Every English field contains zero Arabic characters.
2. Every Arabic word has been translated.
3. No Arabic word was copied.
4. No bilingual output exists.
5. No "(or ...)" exists.
6. No "Arabic:" exists.
7. No "also known as" exists.
8. No "translated as" exists.
9. No explanation exists.
10. Manufacturer contains only manufacturer/brand meaning.
11. Model contains only model meaning.
12. Features are individually translated.
13. English words have proper spaces.
14. No words were accidentally concatenated.
15. No information was invented.
16. No information was deleted merely to hide an Arabic word.
17. JSON contains exactly the required fields.

==================================================
CAR DATA
==================================================

${JSON.stringify(input, null, 2)}
`;
}

/**
 * Call OpenAI with automatic retry.
 */
async function requestOpenAI(prompt) {
  if (!OPENAI_API_KEY) {
    throw new Error(
      'OPENAI_API_KEY is missing from backend .env'
    );
  }

  let lastError = null;

  for (
    let attempt = 1;
    attempt <= MAX_RETRIES;
    attempt++
  ) {
    try {
      console.log(
        `🤖 OpenAI translation attempt ${attempt}/${MAX_RETRIES} using ${OPENAI_MODEL}`
      );

      const response = await fetch(
        OPENAI_URL,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },

          body: JSON.stringify({
            model: OPENAI_MODEL,

            input: [
              {
                role: 'user',

                content: [
                  {
                    type: 'input_text',
                    text: prompt,
                  },
                ],
              },
            ],

            text: {
              format: {
                type: 'json_object',
              },
            },
          }),
        }
      );

      if (response.ok) {
        return await response.json();
      }

      const errorText =
        await response.text();

      lastError = new Error(
        `OpenAI translation failed: ${response.status} ${errorText}`
      );

      if (
        !isRetryableStatus(response.status) ||
        attempt >= MAX_RETRIES
      ) {
        throw lastError;
      }

      const delay =
        getRetryDelay(attempt);

      console.warn(
        `⚠️ OpenAI returned ${response.status}. Retrying in ${delay}ms...`
      );

      await sleep(delay);
    } catch (error) {
      lastError = error;

      /**
       * Errors generated from HTTP responses are already handled above.
       * Other errors are treated as temporary network/runtime errors.
       */
      const isOpenAIHttpError =
        error?.message?.startsWith(
          'OpenAI translation failed:'
        );

      if (isOpenAIHttpError) {
        throw error;
      }

      if (attempt >= MAX_RETRIES) {
        throw error;
      }

      const delay =
        getRetryDelay(attempt);

      console.warn(
        `⚠️ Temporary OpenAI/network error. Retrying in ${delay}ms...`
      );

      await sleep(delay);
    }
  }

  throw (
    lastError ||
    new Error(
      'OpenAI translation failed after retries'
    )
  );
}

/**
 * Translate car data from Arabic to English.
 */
async function translateCarData(carData) {
  const input =
    buildTranslationInput(carData);

  const prompt =
    buildPrompt(input);

  const result =
    await requestOpenAI(prompt);

  const text =
    extractOpenAIText(result);

  const translated =
    parseTranslationResponse(text);

  /**
   * Validate structure BEFORE using the data.
   */
  validateTranslationStructure(
    translated
  );

  /**
   * Build final English-only object.
   */
  const translatedData = {
    nameEn: cleanEnglishText(
      translated.nameEn
    ),

    manufacturerEn: cleanEnglishText(
      translated.manufacturerEn
    ),

    modelEn: cleanEnglishText(
      translated.modelEn
    ),

    descriptionEn: cleanEnglishText(
      translated.descriptionEn
    ),

    featuresEn: cleanEnglishFeatures(
      translated.featuresEn
    ),

    colorEn: cleanEnglishText(
      translated.colorEn
    ),

    fuelTypeEn: cleanEnglishText(
      translated.fuelTypeEn
    ),

    transmissionEn: cleanEnglishText(
      translated.transmissionEn
    ),

    bodyTypeEn: cleanEnglishText(
      translated.bodyTypeEn
    ),
  };

  /**
   * FINAL SAFETY VALIDATION.
   */
  validateEnglishTranslation(
    translatedData
  );

  validateNoMixedTranslationPatterns(
    translatedData
  );

  validateEnglishSpacing(
    translatedData
  );

  validateAutomotiveTranslation(
    input,
    translatedData
  );

  return translatedData;
}

module.exports = {
  translateCarData,
};