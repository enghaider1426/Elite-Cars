/**
 * @route   GET /api/auth/favorites
 * @desc    Get current user's favorite cars
 * @access  Private
 */
router.get(
  '/favorites',
  protect,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ErrorResponse('المستخدم غير موجود', 404);
    }

    res.json({
      success: true,
      data: user.favorites || [],
    });
  })
);

/**
 * @route   POST /api/auth/favorites/:carId
 * @desc    Add/remove a car from favorites
 * @access  Private
 */
router.post(
  '/favorites/:carId',
  protect,
  asyncHandler(async (req, res) => {
    const { carId } = req.params;

    if (!carId) {
      throw new ErrorResponse('معرّف السيارة مطلوب', 400);
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      throw new ErrorResponse('المستخدم غير موجود', 404);
    }

    if (!Array.isArray(user.favorites)) {
      user.favorites = [];
    }

    // مقارنة المعرفات كنص حتى تعمل سواء كانت ObjectId أو String
    const isFavorited = user.favorites.some(
      (id) => id.toString() === carId.toString()
    );

    if (isFavorited) {
      // إزالة السيارة من المفضلة
      user.favorites = user.favorites.filter(
        (id) => id.toString() !== carId.toString()
      );
    } else {
      // إضافة السيارة إلى المفضلة
      user.favorites.push(carId);
    }

    await user.save();

    res.json({
      success: true,
      message: isFavorited
        ? 'تم إزالة السيارة من المفضلة'
        : 'تم إضافة السيارة إلى المفضلة',
      data: {
        favorites: user.favorites,
        isFavorited: !isFavorited,
      },
    });
  })
);