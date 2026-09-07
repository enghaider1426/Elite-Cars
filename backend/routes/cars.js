/**
 * Car Routes - CRUD operations for car listings
 */

const express = require('express');
const router = express.Router();

const Car = require('../models/Car');

const { protect, admin } = require('../middleware/auth');

const { asyncHandler, ErrorResponse } = require('../middleware/errorHandler');

// Translation service
const { translateCarData } = require('../services/carTranslation');

/**
 * Allowlist of fields that can be set when creating/updating a car.
 *
 * IMPORTANT:
 * English translation fields are intentionally NOT included here.
 * They are generated automatically by the backend.
 *
 * This keeps the English translation controlled by the backend
 * and prevents the frontend from manually injecting translation data.
 */
const CAR_ALLOWED_FIELDS = [
  'name',
  'manufacturer',
  'model',
  'year',
  'price',
  'mileage',
  'image',
  'description',
  'features',
  'color',
  'fuelType',
  'transmission',
  'bodyType',
  'status',
];

/**
 * Fields that require a new English translation
 * whenever they are created or changed.
 */
const TRANSLATABLE_FIELDS = [
  'name',
  'manufacturer',
  'model',
  'description',
  'features',
  'color',
  'fuelType',
  'transmission',
  'bodyType',
];

/**
 * Escape regex special characters to prevent NoSQL regex injection.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Pick only allowed fields from an object.
 *
 * This prevents mass assignment attacks.
 */
function pickAllowedFields(body) {
  const filtered = {};

  for (const key of CAR_ALLOWED_FIELDS) {
    if (body[key] !== undefined) {
      filtered[key] = body[key];
    }
  }

  return filtered;
}

/**
 * Check whether the request contains any field
 * that requires English translation.
 */
function needsTranslation(data) {
  return TRANSLATABLE_FIELDS.some(
    (field) => data[field] !== undefined
  );
}

/**
 * Build the complete data that will be sent
 * to the translation service.
 *
 * For POST:
 *   data comes directly from the submitted car.
 *
 * For PUT:
 *   existing MongoDB values are used for fields
 *   that were not changed.
 */
function buildTranslationInput(data, existingCar = null) {
  return {
    name:
      data.name !== undefined
        ? data.name
        : existingCar?.name || '',

    manufacturer:
      data.manufacturer !== undefined
        ? data.manufacturer
        : existingCar?.manufacturer || '',

    model:
      data.model !== undefined
        ? data.model
        : existingCar?.model || '',

    description:
      data.description !== undefined
        ? data.description
        : existingCar?.description || '',

    features:
      data.features !== undefined
        ? data.features
        : existingCar?.features || [],

    color:
      data.color !== undefined
        ? data.color
        : existingCar?.color || '',

    fuelType:
      data.fuelType !== undefined
        ? data.fuelType
        : existingCar?.fuelType || '',

    transmission:
      data.transmission !== undefined
        ? data.transmission
        : existingCar?.transmission || '',

    bodyType:
      data.bodyType !== undefined
        ? data.bodyType
        : existingCar?.bodyType || '',
  };
}

/**
 * @route   GET /api/cars
 * @desc    Get all cars with optional filters, search, sorting, and pagination
 * @access  Public
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = {};

    /**
     * Search by text
     *
     * Existing Arabic search behavior is preserved.
     */
    if (req.query.search) {
      const searchStr = req.query.search.trim().slice(0, 200);

      if (searchStr.length > 0) {
        query.$text = { $search: searchStr };
      }
    }

    /**
     * Filter by manufacturer
     */
    if (req.query.manufacturer) {
      const safe = escapeRegex(
        req.query.manufacturer.trim().slice(0, 100)
      );

      query.manufacturer = {
        $regex: safe,
        $options: 'i',
      };
    }

    /**
     * Filter by body type
     */
    if (req.query.bodyType) {
      const safe = escapeRegex(
        req.query.bodyType.trim().slice(0, 100)
      );

      query.bodyType = {
        $regex: safe,
        $options: 'i',
      };
    }

    /**
     * Filter by fuel type
     */
    if (req.query.fuelType) {
      query.fuelType = req.query.fuelType;
    }

    /**
     * Filter by transmission
     */
    if (req.query.transmission) {
      query.transmission = req.query.transmission;
    }

    /**
     * Price range
     */
    if (req.query.minPrice) {
      query.price = {
        ...query.price,
        $gte: Number(req.query.minPrice),
      };
    }

    if (req.query.maxPrice) {
      query.price = {
        ...query.price,
        $lte: Number(req.query.maxPrice),
      };
    }

    /**
     * Year range
     */
    if (req.query.minYear) {
      query.year = {
        ...query.year,
        $gte: Number(req.query.minYear),
      };
    }

    if (req.query.maxYear) {
      query.year = {
        ...query.year,
        $lte: Number(req.query.maxYear),
      };
    }

    /**
     * Max mileage
     */
    if (req.query.maxMileage) {
      query.mileage = {
        $lte: Number(req.query.maxMileage),
      };
    }

    /**
     * Sorting
     */
    let sort = {
      createdAt: -1,
    };

    if (req.query.sort) {
      const sortMap = {
        price_asc: { price: 1 },
        price_desc: { price: -1 },
        year_asc: { year: 1 },
        year_desc: { year: -1 },
        mileage_asc: { mileage: 1 },
        mileage_desc: { mileage: -1 },
        name_asc: { name: 1 },
        name_desc: { name: -1 },
        oldest: { createdAt: 1 },
        newest: { createdAt: -1 },
      };

      sort = sortMap[req.query.sort] || sort;
    }

    /**
     * Pagination
     */
    let page = parseInt(req.query.page, 10);
    let limit = parseInt(req.query.limit, 10);

    if (isNaN(page) || page < 1) {
      page = 1;
    }

    if (isNaN(limit) || limit < 1) {
      limit = 20;
    }

    if (limit > 100) {
      limit = 100;
    }

    const skip = (page - 1) * limit;

    /**
     * Execute query
     */
    const [cars, total] = await Promise.all([
      Car.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),

      Car.countDocuments(query),
    ]);

    res.json({
      success: true,
      count: cars.length,
      total,

      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },

      data: cars,
    });
  })
);

/**
 * @route   GET /api/cars/manufacturers
 * @desc    Get list of distinct manufacturers
 * @access  Public
 */
router.get(
  '/manufacturers',
  asyncHandler(async (req, res) => {
    const manufacturers = await Car.distinct(
      'manufacturer'
    ).then((items) => items.sort());

    res.json({
      success: true,
      data: manufacturers,
    });
  })
);

/**
 * @route   GET /api/cars/stats
 * @desc    Get car collection statistics
 * @access  Public
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const stats = await Car.aggregate([
      {
        $group: {
          _id: null,

          totalCars: {
            $sum: 1,
          },

          avgPrice: {
            $avg: '$price',
          },

          minPrice: {
            $min: '$price',
          },

          maxPrice: {
            $max: '$price',
          },

          avgYear: {
            $avg: '$year',
          },

          avgMileage: {
            $avg: '$mileage',
          },
        },
      },
    ]);

    const bodyTypeStats = await Car.aggregate([
      {
        $group: {
          _id: '$bodyType',
          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          count: -1,
        },
      },
    ]);

    const manufacturerStats = await Car.aggregate([
      {
        $group: {
          _id: '$manufacturer',
          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          count: -1,
        },
      },

      {
        $limit: 10,
      },
    ]);

    res.json({
      success: true,

      data: {
        ...stats[0],
        bodyTypes: bodyTypeStats,
        topManufacturers: manufacturerStats,
      },
    });
  })
);

/**
 * @route   GET /api/cars/:id
 * @desc    Get single car by ID
 * @access  Public
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const car = await Car.findById(
      req.params.id
    ).lean();

    if (!car) {
      throw new ErrorResponse(
        'السيارة غير موجودة',
        404
      );
    }

    res.json({
      success: true,
      data: car,
    });
  })
);

/**
 * @route   POST /api/cars
 * @desc    Create a new car listing
 * @access  Private (admin only)
 *
 * The backend automatically generates
 * English translations before saving.
 */
router.post(
  '/',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    /**
     * Mass assignment protection:
     * only original Arabic fields are accepted.
     */
    const safeData = pickAllowedFields(req.body);

    /**
     * Set owner/admin.
     */
    safeData.addedBy = req.user._id;

    /**
     * Default status.
     */
    if (!safeData.status) {
      safeData.status = 'available';
    }

    /**
     * Generate English translation automatically.
     */
    const translationInput =
      buildTranslationInput(safeData);

    const translatedData =
      await translateCarData(translationInput);

    /**
     * Save Arabic + English versions together.
     */
    const car = await Car.create({
      ...safeData,
      ...translatedData,
    });

    res.status(201).json({
      success: true,
      message: 'تمت إضافة السيارة بنجاح',
      car,
    });
  })
);

/**
 * @route   PUT /api/cars/:id
 * @desc    Update a car listing
 * @access  Private (owner or admin)
 *
 * English translation is regenerated ONLY when
 * a translatable field is changed.
 */
router.put(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    /**
     * Find existing car first.
     */
    let car = await Car.findById(
      req.params.id
    );

    if (!car) {
      throw new ErrorResponse(
        'السيارة غير موجودة',
        404
      );
    }

    /**
     * Check ownership or admin.
     */
    const isAdmin = req.user.role === 'admin';
    const isOwner =
      car.addedBy &&
      car.addedBy.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      throw new ErrorResponse(
        'غير مصرح بتعديل هذه السيارة',
        403
      );
    }

    /**
     * Pick only allowed fields.
     */
    const safeData =
      pickAllowedFields(req.body);

    /**
     * Determine whether translation is required.
     */
    const shouldTranslate =
      needsTranslation(safeData);

    let translatedData = {};

    /**
     * Only call OpenAI when a translatable
     * Arabic field was actually changed.
     *
     * This prevents unnecessary OpenAI API usage
     * when changing price, mileage, year, image,
     * or status only.
     */
    if (shouldTranslate) {
      const translationInput =
        buildTranslationInput(
          safeData,
          car
        );

      translatedData =
        await translateCarData(
          translationInput
        );
    }

    /**
     * Update Arabic + English fields.
     *
     * If translation was not required,
     * existing English fields remain unchanged.
     */
    car = await Car.findByIdAndUpdate(
      req.params.id,

      {
        ...safeData,
        ...translatedData,
      },

      {
        new: true,
        runValidators: true,
      }
    );

    res.json({
      success: true,
      message: 'تم تحديث السيارة بنجاح',
      car,
    });
  })
);

/**
 * @route   DELETE /api/cars/:id
 * @desc    Delete a car listing
 * @access  Private (owner or admin)
 */
router.delete(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const car = await Car.findById(
      req.params.id
    );

    if (!car) {
      throw new ErrorResponse(
        'السيارة غير موجودة',
        404
      );
    }

    /**
     * Check ownership or admin.
     */
    const isAdmin = req.user.role === 'admin';
    const isOwner =
      car.addedBy &&
      car.addedBy.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      throw new ErrorResponse(
        'غير مصرح بحذف هذه السيارة',
        403
      );
    }

    await car.deleteOne();

    res.json({
      success: true,
      message: 'تم حذف السيارة بنجاح',
    });
  })
);

module.exports = router;