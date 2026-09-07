/**
 * Elite Cars - UI Translation API
 *
 * Keeps the OpenAI API key on the backend and provides batched
 * Arabic -> English translation for UI strings that are not part
 * of the curated local dictionary.
 */

const express = require('express');
const rateLimit = require('express-rate-limit');

const router = express.Router();

const OPENAI_URL = 'https://api.openai.com/v1/responses';
const OPENAI_MODEL = process.env.OPENAI_TRANSLATION_MODEL || 'gpt-5.6-luna';

const translationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'عدد كبير جداً من طلبات الترجمة - يرجى المحاولة لاحقاً',
  },
});

function containsArabic(value) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(value);
}

function extractOutputText(result) {
  if (typeof result?.output_text === 'string' && result.output_text.trim()) {
    return result.output_text.trim();
  }

  return (result?.output || [])
    .flatMap((item) => Array.isArray(item?.content) ? item.content : [])
    .map((content) => typeof content?.text === 'string' ? content.text : '')
    .filter(Boolean)
    .join('')
    .trim();
}

function stripJsonFence(text) {
  return String(text || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

router.post('/batch', translationLimiter, async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'OpenAI translation is not configured',
      });
    }

    const values = Array.isArray(req.body?.values)
      ? req.body.values
          .filter((value) => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean)
      : [];

    const uniqueValues = [...new Set(values)];

    if (!uniqueValues.length) {
      return res.json({ success: true, translations: {} });
    }

    if (uniqueValues.length > 40) {
      return res.status(400).json({
        success: false,
        message: 'Too many translation values in one request',
      });
    }

    if (uniqueValues.some((value) => value.length > 500)) {
      return res.status(400).json({
        success: false,
        message: 'A translation value is too long',
      });
    }

    const arabicValues = uniqueValues.filter(containsArabic);

    if (!arabicValues.length) {
      return res.json({ success: true, translations: {} });
    }

    const prompt = `Translate every supplied Arabic UI string into natural, professional English.

Rules:
- Return JSON only.
- Return exactly one translation for every supplied string.
- Preserve numbers, punctuation, URLs, product/model names, brand names, and placeholders.
- Do not explain the translations.
- Do not transliterate Arabic when a natural English meaning exists.
- Do not add information.
- Do not leave Arabic characters in the translated values.

Input strings:
${JSON.stringify(arabicValues, null, 2)}`;

    const response = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        input: [
          {
            role: 'user',
            content: [{ type: 'input_text', text: prompt }],
          },
        ],
        text: { format: { type: 'json_object' } },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status === 429 ? 429 : 502).json({
        success: false,
        message: 'OpenAI translation request failed',
        ...(process.env.NODE_ENV === 'development' ? { detail: errorText } : {}),
      });
    }

    const result = await response.json();
    const parsed = JSON.parse(stripJsonFence(extractOutputText(result)));
    const rawTranslations = parsed?.translations;
    const translations = {};

    if (Array.isArray(rawTranslations)) {
      for (const item of rawTranslations) {
        if (item && typeof item.source === 'string' && typeof item.translation === 'string') {
          translations[item.source] = item.translation.trim();
        }
      }
    } else if (rawTranslations && typeof rawTranslations === 'object') {
      Object.entries(rawTranslations).forEach(([source, translation]) => {
        if (typeof translation === 'string') {
          translations[source] = translation.trim();
        }
      });
    }

    const safeTranslations = {};
    for (const source of arabicValues) {
      const translation = translations[source];
      if (typeof translation === 'string' && translation && !containsArabic(translation)) {
        safeTranslations[source] = translation;
      }
    }

    return res.json({
      success: true,
      translations: safeTranslations,
    });
  } catch (error) {
    console.error('UI translation error:', error.message);
    return res.status(502).json({
      success: false,
      message: 'Unable to translate UI text right now',
    });
  }
});

module.exports = router;
