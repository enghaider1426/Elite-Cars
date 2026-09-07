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
const OPENAI_MODEL =
  process.env.OPENAI_TRANSLATION_MODEL || 'gpt-5.6-luna';

/*
 * This endpoint is used by both:
 * - LanguageContext
 * - Dynamic car descriptions
 *
 * 30 requests/minute was too restrictive because several UI
 * translation requests can happen during one page load.
 */
const translationLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message:
      'عدد كبير جداً من طلبات الترجمة - يرجى المحاولة لاحقاً',
  },
});

function containsArabic(value) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
    String(value || '')
  );
}

function extractOutputText(result) {
  if (
    typeof result?.output_text === 'string' &&
    result.output_text.trim()
  ) {
    return result.output_text.trim();
  }

  const output = Array.isArray(result?.output)
    ? result.output
    : [];

  const text = output
    .flatMap((item) =>
      Array.isArray(item?.content)
        ? item.content
        : []
    )
    .map((content) => {
      if (typeof content?.text === 'string') {
        return content.text;
      }

      if (
        typeof content?.text?.value === 'string'
      ) {
        return content.text.value;
      }

      return '';
    })
    .filter(Boolean)
    .join('');

  return text.trim();
}

function stripJsonFence(text) {
  return String(text || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
}

/*
 * Normalizes different possible OpenAI JSON response shapes.
 */
function normalizeTranslations(parsed) {
  const result = {};

  if (!parsed || typeof parsed !== 'object') {
    return result;
  }

  const rawTranslations =
    parsed.translations ||
    parsed.translation ||
    parsed.result;

  /*
   * Shape:
   * {
   *   "translations": {
   *      "Arabic text": "English text"
   *   }
   * }
   */
  if (
    rawTranslations &&
    typeof rawTranslations === 'object' &&
    !Array.isArray(rawTranslations)
  ) {
    for (const [source, translation] of Object.entries(
      rawTranslations
    )) {
      if (typeof translation === 'string') {
        result[source] = translation.trim();
      }
    }

    return result;
  }

  /*
   * Shape:
   * {
   *   "translations": [
   *      {
   *        "source": "...",
   *        "translation": "..."
   *      }
   *   ]
   * }
   */
  if (Array.isArray(rawTranslations)) {
    for (const item of rawTranslations) {
      if (!item || typeof item !== 'object') {
        continue;
      }

      const source =
        item.source ||
        item.original ||
        item.input;

      const translation =
        item.translation ||
        item.translated ||
        item.output;

      if (
        typeof source === 'string' &&
        typeof translation === 'string'
      ) {
        result[source.trim()] =
          translation.trim();
      }
    }
  }

  return result;
}

router.post(
  '/batch',
  translationLimiter,
  async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(503).json({
          success: false,
          message:
            'OpenAI translation is not configured',
        });
      }

      const values = Array.isArray(
        req.body?.values
      )
        ? req.body.values
            .filter(
              (value) =>
                typeof value === 'string'
            )
            .map((value) => value.trim())
            .filter(Boolean)
        : [];

      const uniqueValues = [
        ...new Set(values),
      ];

      if (!uniqueValues.length) {
        return res.json({
          success: true,
          translations: {},
        });
      }

      if (uniqueValues.length > 40) {
        return res.status(400).json({
          success: false,
          message:
            'Too many translation values in one request',
        });
      }

      if (
        uniqueValues.some(
          (value) => value.length > 500
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            'A translation value is too long',
        });
      }

      const arabicValues =
        uniqueValues.filter(containsArabic);

      if (!arabicValues.length) {
        return res.json({
          success: true,
          translations: {},
        });
      }

      const prompt = `
Translate every supplied Arabic string into natural, professional English.

IMPORTANT:
- Return JSON only.
- The JSON must contain a top-level "translations" object.
- Use each original input string as the exact JSON key.
- The value must be its English translation.
- Return exactly one translation for every supplied string.
- Preserve numbers, punctuation, URLs, product/model names, brand names, and placeholders.
- Do not explain anything.
- Do not transliterate Arabic when a natural English meaning exists.
- Do not add information.
- Do not leave Arabic characters in translated values.

Input strings:
${JSON.stringify(
  arabicValues,
  null,
  2
)}
`.trim();

      const response = await fetch(
        OPENAI_URL,
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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

      const responseText =
        await response.text();

      if (!response.ok) {
        console.error(
          'OpenAI translation request failed:',
          {
            status: response.status,
            body:
              process.env.NODE_ENV ===
              'development'
                ? responseText
                : undefined,
          }
        );

        return res
          .status(
            response.status === 429
              ? 429
              : 502
          )
          .json({
            success: false,
            message:
              'OpenAI translation request failed',
          });
      }

      let result;

      try {
        result = JSON.parse(
          responseText
        );
      } catch (error) {
        console.error(
          'OpenAI translation response JSON parse failed:',
          error.message
        );

        return res.status(502).json({
          success: false,
          message:
            'Invalid OpenAI translation response',
        });
      }

      const outputText =
        extractOutputText(result);

      if (!outputText) {
        console.error(
          'OpenAI translation returned empty output'
        );

        return res.status(502).json({
          success: false,
          message:
            'OpenAI returned an empty translation',
        });
      }

      let parsed;

      try {
        parsed = JSON.parse(
          stripJsonFence(outputText)
        );
      } catch (error) {
        console.error(
          'Translation output is not valid JSON:',
          error.message
        );

        return res.status(502).json({
          success: false,
          message:
            'Invalid translation format',
        });
      }

      const translations =
        normalizeTranslations(parsed);

      const safeTranslations = {};

      for (const source of arabicValues) {
        const translation =
          translations[source];

        if (
          typeof translation === 'string' &&
          translation.trim() &&
          !containsArabic(
            translation
          )
        ) {
          safeTranslations[source] =
            translation.trim();
        }
      }

      /*
       * If OpenAI returned something but failed to map
       * the original string, log only safe diagnostic data.
       * Never log API keys or sensitive values.
       */
      if (
        Object.keys(safeTranslations)
          .length !== arabicValues.length
      ) {
        console.warn(
          'Some translation values could not be mapped:',
          {
            requested: arabicValues.length,
            translated:
              Object.keys(
                safeTranslations
              ).length,
          }
        );
      }

      return res.json({
        success: true,
        translations: safeTranslations,
      });
    } catch (error) {
      console.error(
        'UI translation error:',
        error?.message || error
      );

      return res.status(502).json({
        success: false,
        message:
          'Unable to translate UI text right now',
      });
    }
  }
);

module.exports = router;