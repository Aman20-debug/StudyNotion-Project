const Category = require("../models/Category");

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// Create a new Category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const categoryDetails = await Category.create({
      name,
      description,
    });

    console.log("Category Details: ", categoryDetails);

    return res.status(200).json({
      success: true,
      message: "Category Created Successfully.",
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error While creating Category",
    });
  }
};

// Show all Categories
exports.showAllCategory = async (req, res) => {
  try {
    console.log("INSIDE SHOW ALL CATEGORIES");

    const allCategories = await Category.find({})
      .populate({
        path: "course", // ✅ Matches schema
        match: { status: "Published" },
        select: "courseName thumbnail price _id",
      })
      .exec();

    res.status(200).json({
      success: true,
      data: allCategories,
    });
  } catch (err) {
    console.error("Error while getting categories:", err);
    return res.status(500).json({
      success: false,
      message: "Error while getting all categories",
    });
  }
};

// Get Category Page Details
exports.categoryPageDetails = async (req, res) => {
    console.log("CATEGORY PAGE ROUTE HIT");
  try {
    const { categoryId } = req.body;
    console.log("PRINTING CATEGORY ID: ", categoryId);

    // Validate categoryId
    if (!categoryId || categoryId.length !== 24) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing categoryId.",
      });
    }

    // 1. Fetch selected category with its published courses
    const selectedCategory = await Category.findById(categoryId)
      .populate({
        path: "course", // ✅ Matches your schema
        match: { status: "Published" },
        populate: "ratingAndReviews",
      })
      .exec();

    console.log("SELECTED CATEGORY:", selectedCategory);

    if (!selectedCategory) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (!selectedCategory.course || selectedCategory.course.length === 0) {
        return res.status(200).json({
            success: true,
            message: "No courses found for the selected category.",
            data: {
            selectedCategory: {
                ...selectedCategory.toObject(),
                course: [],
            },
            differentCategory: null,
            mostSellingCourses: [],
            },
        });
    }


    // 2. Get a different random category with published courses
    const categoriesExceptSelected = await Category.find({
      _id: { $ne: categoryId },
    });

    let differentCategory = null;
    if (categoriesExceptSelected.length > 0) {
      const randomCategory =
        categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)];

      differentCategory = await Category.findById(randomCategory._id)
        .populate({
          path: "course",
          match: { status: "Published" },
          populate: "ratingAndReviews",
        })
        .exec();
    }

    console.log("DIFFERENT CATEGORY:", differentCategory);

    // 3. Get top-selling courses across all categories
    const allCategories = await Category.find()
      .populate({
        path: "course",
        match: { status: "Published" },
        populate: {
          path: "instructor",
        },
      })
      .exec();

    const allCourses = allCategories.flatMap((cat) => cat.course || []);

    const mostSellingCourses = allCourses
      .filter((c) => c && typeof c.sold === "number")
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 10);

    console.log("MOST SELLING COURSES:", mostSellingCourses);

    return res.status(200).json({
      success: true,
      message: "Category Page Details Successful.",
      data: {
        selectedCategory,
        differentCategory,
        mostSellingCourses,
      },
    });
  } catch (error) {
    console.error("Error in categoryPageDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching Category Page Details",
      error: error.message,
    });
  }
};

