const Category = require("../models/Category");
function getRandomInt(max) {
    return Math.floor(Math.random() * max)
}

//create Tag ka handler function
exports.createCategory = async (req, res) => {
    try{

        //fetch data
        const {name, description} = req.body;
        //validation
        if(!name || !description)
        {
            return res.status(400).json({
                success: false,
                message: "All fields are required.",
            })
        }

        //create an entry in db
        const categoryDetails = await Category.create({
            name: name,
            description: description,
        });
        console.log("Category Details: ", categoryDetails);

        //return response
        return res.status(200).json({
            success: true, 
            message: "Category Created Successfully.",
        });

    }
    catch(err){
        return res.status(500).json({
            success: false,
            message: "Error While creating Category",
        });
    }
}

//get All category handler function
exports.showAllCategory = async (req,res) => {
    try {
        console.log("INSIDE SHOW ALL CATEGORIES");
		const allCategorys = await Category.find({});
		res.status(200).json({
			success: true,
			data: allCategorys,
		});
	}
    catch(err){
        return res.status(500).json({
            success: false,
            message: "Error While getting all Category",
        });
    }
}


//get category Page Details
exports.categoryPageDetails = async (req, res) => {
    try {
        const { categoryId } = req.body;
        console.log("PRINTING CATEGORY ID: ", categoryId);

        // Get courses for the specified category
        const selectedCategory = await Category.findById(categoryId)
        .populate({
            path: "course",
            match: { status: "Published" },
            populate: "ratingAndReviews",
        })
        .exec()
  
        console.log("SELECTED COURSE", selectedCategory)
        // Handle the case when the category is not found
        if (!selectedCategory) {
            console.log("Category not found.")
            return res.status(404).json({ 
                success: false, 
                message: "Category not found" 
            });
        }

        // Handle the case when there are no courses
        if (selectedCategory.course.length === 0) {
            console.log("No courses found for the selected category.")
            return res.status(404).json({
                success: false,
                message: "No courses found for the selected category.",
            });
        }
  
        // Get courses for other categories
        const categoriesExceptSelected = await Category.find({
                                    _id: { $ne: categoryId },
        })
        let differentCategory = await Category.findOne(
                categoriesExceptSelected[getRandomInt(categoriesExceptSelected.length)]._id
        )
        .populate({
            path: "course",
            match: { status: "Published" },
            populate: "ratingAndReviews",
        })
        .exec()
        console.log("Different COURSE", differentCategory)

        // Get top-selling courses across all categories
        const allCategories = await Category.find()
            .populate({
                path: "courses",
                match: { status: "Published" },
                populate: {
                    path: "instructor",
                },
            })
            .exec()
        const allCourses = allCategories.flatMap((category) => category.course)
        const mostSellingCourses = allCourses
                                    .sort((a, b) => b.sold - a.sold)
                                    .slice(0, 10)
        console.log("mostSellingCourses COURSE", mostSellingCourses);

        //return response
        res.status(200).json({
            success: true,
            message: "Category Page Details Successful.",
            data: {
                selectedCategory,
                differentCategory,
                mostSellingCourses,
            },
        })
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Internal server error while fetching Category Page Details",
        error: error.message,
      })
    }
}