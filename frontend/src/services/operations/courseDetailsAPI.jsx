import { toast } from "react-hot-toast"

import {
  setCompletedLectures,
  updateCompletedLectures,
} from "../../slices/viewCourseSlice"
// import { setLoading } from "../../slices/profileSlice";
import { apiConnector } from "../apiconnector"
import { courseEndpoints } from "../apis"

const{
    CREATE_COURSE_API,
    GET_ALL_COURSE_API,
    COURSE_DETAILS_API,
    COURSE_CATEGORIES_API,
    EDIT_COURSE_API,
    DELETE_COURSE_API,

    GET_ALL_INSTRUCTOR_COURSES_API,
    GET_FULL_COURSE_DETAILS_AUTHENTICATED,

    CREATE_SECTION_API,
    UPDATE_SECTION_API,
    DELETE_SECTION_API,

    CREATE_SUBSECTION_API,
    UPDATE_SUBSECTION_API,
    DELETE_SUBSECTION_API,

    LECTURE_COMPLETION_API,
    CREATE_RATING_API,

} = courseEndpoints

//Add a New Course
export const addCourseDetails = async (data, token) => {
    let result = null
    const toastId = toast.loading("Loading...")
    try {
        const response = await apiConnector("POST", CREATE_COURSE_API, data, {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
        })

        console.log("CREATE COURSE API RESPONSE............", response)

        if (!response?.data?.success) {
        throw new Error("Could Not Add Course Details")
        }

        toast.success("Course Details Added Successfully")
        result = response?.data?.data
    } catch (error) {
        console.log("CREATE COURSE API ERROR............", error)
        toast.error(error.message)
    }
    toast.dismiss(toastId)
    return result
}

//Get All Courses
export const getAllCourses = async () => {
    const toastId = toast.loading("Loading...")
    let result = []
    try {
        const response = await apiConnector("GET", GET_ALL_COURSE_API)
        if (!response?.data?.success) {
            throw new Error("Could Not Fetch Course Categories")
        }
        result = response?.data?.data
    } catch (error) {
      console.log("GET_ALL_COURSE_API API ERROR............", error)
      toast.error(error.message)
    }
    toast.dismiss(toastId)
    return result
}

//Fetch Course Details
export const fetchCourseDetails = async (courseId) => {
    const toastId = toast.loading("Loading...")
    //   dispatch(setLoading(true));
    let result = null
    try {
        const response = await apiConnector("POST", COURSE_DETAILS_API, {
            courseId,
        })
        console.log("COURSE_DETAILS_API API RESPONSE............", response)
  
        if (!response.data.success) {
            throw new Error(response.data.message)
        }
        result = response.data
    } catch (error) {
        console.log("COURSE_DETAILS_API API ERROR............", error)
        result = error.response.data
        // toast.error(error.response.data.message);
    }
    toast.dismiss(toastId)
    //   dispatch(setLoading(false));
    return result
}

//Fetch Course Categories
export const fetchCourseCategories = async () => {
    let result = []
    try {
        const response = await apiConnector("GET", COURSE_CATEGORIES_API)
        console.log("COURSE_CATEGORIES_API API RESPONSE............", response)
        if (!response?.data?.success) {
            throw new Error("Could Not Fetch Course Categories")
        }
        result = response?.data?.data
    } catch (error) {
        console.log("COURSE_CATEGORY_API API ERROR............", error)
        toast.error(error.message)
    }
    return result
}

// Edit Course Details
export const editCourseDetails = async (data, token) => {
    let result = null
    const toastId = toast.loading("Loading...")
    try {
        const response = await apiConnector("POST", EDIT_COURSE_API, data, {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
        })
        console.log("EDIT COURSE API RESPONSE............", response)
        if (!response?.data?.success) {
            throw new Error("Could Not Update Course Details")
        }
        toast.success("Course Details Updated Successfully")
        result = response?.data?.data
    } catch (error) {
        console.log("EDIT COURSE API ERROR............", error)
        toast.error(error.message)
    }
    toast.dismiss(toastId)
    return result
}

// Delete a Course
export const deleteCourse = async (data, token) => {
    const toastId = toast.loading("Loading...")
    try {
        const response = await apiConnector("DELETE", DELETE_COURSE_API, data, {
            Authorization: `Bearer ${token}`,
        })
        console.log("DELETE COURSE API RESPONSE............", response)
        if (!response?.data?.success) {
            throw new Error("Could Not Delete Course")
        }
        toast.success("Course Deleted")
    } catch (error) {
        console.log("DELETE COURSE API ERROR............", error)
        toast.error(error.message)
    }
    toast.dismiss(toastId)
}

//fetching all courses under a specific instructor
export const fetchInstructorCourses = async (token) => {
    let result = []
    const toastId = toast.loading("Loading...")
    try {
        const response = await apiConnector(
            "GET",
            GET_ALL_INSTRUCTOR_COURSES_API,
            null,
            {
                Authorization: `Bearer ${token}`,
            }
        )
        console.log("INSTRUCTOR COURSES API RESPONSE............", response)
        if (!response?.data?.success) {
            throw new Error("Could Not Fetch Instructor Courses")
        }
        result = response?.data?.data
    } catch (error) {
        console.log("INSTRUCTOR COURSES API ERROR............", error)
        toast.error(error.message)
    }
    toast.dismiss(toastId)
    return result
}

// get full details of a course
export const getFullDetailsOfCourse = async (courseId, token) => {
  const toastId = toast.loading("Loading...")
  let result = null

  try {
    const response = await apiConnector(
      "POST",
      GET_FULL_COURSE_DETAILS_AUTHENTICATED,
      { courseId },
      {
        Authorization: `Bearer ${token}`,
      }
    )

    console.log("COURSE_FULL_DETAILS_API RESPONSE:", response)

    if (!response?.data?.success) {
      throw new Error(response?.data?.message || "Failed to fetch course details")
    }

    result = response.data.data
  } catch (error) {
    console.log("COURSE_FULL_DETAILS_API ERROR:", error)
    toast.error(error?.response?.data?.message || "Error fetching course details")
  }

  toast.dismiss(toastId)
  return result
}


// create a section
export const createSection = async (data, token) => {
    let result = null;
    const toastId = toast.loading("Loading...");
    try {
        const response = await apiConnector("POST", CREATE_SECTION_API, data, {
            Authorization: `Bearer ${token}`,
        });

        console.log("CREATE SECTION API RESPONSE............", response);

        if (!response?.data?.success) {
            throw new Error("Could Not Create Section");
        }

        toast.success("Course Section Created");

        // ✅ FIXED: read from response.data.data
        result = response?.data?.data;
    } catch (error) {
        console.log("CREATE SECTION API ERROR............", error);
        toast.error(error.message);
    }
    toast.dismiss(toastId);
    return result;
};


//Update Section
export const updateSection = async (data, token) => {
    let result = null
    const toastId = toast.loading("Loading...")
    try {
        const response = await apiConnector("POST", UPDATE_SECTION_API, data, {
            Authorization: `Bearer ${token}`,
        })

        console.log("UPDATE SECTION API RESPONSE............", response)
        if (!response?.data?.success) {
            throw new Error("Could Not Update Section")
        }
        toast.success("Course Section Updated")
        result = response?.data?.data
    } catch (error) {
        console.log("UPDATE SECTION API ERROR............", error)
        toast.error(error.message)
    }
    toast.dismiss(toastId)
    return result
}

//delete section
export const deleteSection = async (data, token) => {
    let result = null;
    const toastId = toast.loading("Loading...");
    try {
        const response = await apiConnector(
            "POST", // ✅ Changed from DELETE to POST
            DELETE_SECTION_API,
            data,
            {
                Authorization: `Bearer ${token}`,
            }
        );

        console.log("DELETE SECTION API RESPONSE............", response);
        if (!response?.data?.success) {
            throw new Error("Could Not Delete Section");
        }

        toast.success("Course Section Deleted");
        result = response?.data?.data;
    } catch (error) {
        console.log("DELETE SECTION API ERROR............", error);
        toast.error(error.message);
    }
    toast.dismiss(toastId);
    return result;
};


// create a subsection
export const createSubSection = async (data, token) => {
    let result = null
    const toastId = toast.loading("Loading...")
    try {
        const response = await apiConnector("POST", CREATE_SUBSECTION_API, data, {
            Authorization: `Bearer ${token}`,
        })

        console.log("CREATE SUB-SECTION API RESPONSE............", response)
        if (!response?.data?.success) {
            throw new Error("Could Not Add Lecture")
        }
        toast.success("Lecture Added")
        result = response?.data?.data
    } catch (error) {
        console.log("CREATE SUB-SECTION API ERROR............", error)
        toast.error(error.message)
    }
    toast.dismiss(toastId)
    return result
}

// update a subsection
export const updateSubSection = async (data, token) => {
    let result = null
    const toastId = toast.loading("Loading...")
    try {
        const response = await apiConnector("POST", UPDATE_SUBSECTION_API, data, {
            Authorization: `Bearer ${token}`,
        })
        console.log("UPDATE SUB-SECTION API RESPONSE............", response)
        if (!response?.data?.success) {
            throw new Error("Could Not Update Lecture")
        }
        toast.success("Lecture Updated")
        result = response?.data?.data
    } catch (error) {
        console.log("UPDATE SUB-SECTION API ERROR............", error)
        toast.error(error.message)
    }
    toast.dismiss(toastId)
    return result
}

// delete a subsection
export const deleteSubSection = async (data, token) => {
    let result = null
    const toastId = toast.loading("Loading...")
    try {
        const response = await apiConnector("POST", DELETE_SUBSECTION_API, data, {
            Authorization: `Bearer ${token}`,
        })
        
        console.log("DELETE SUB-SECTION API RESPONSE............", response)
        
        if (!response?.data?.success) {
            throw new Error("Could Not Delete Lecture")
        }
        toast.success("Lecture Deleted")
        result = response?.data?.data
    } catch (error) {
        console.log("DELETE SUB-SECTION API ERROR............", error)
        toast.error(error.message)
    }
    toast.dismiss(toastId)
    return result
}

// mark a lecture as complete
// export const markLectureAsComplete = async (data, token) => {
//     let result = null
//     console.log("mark complete data", data)
//     const toastId = toast.loading("Loading...")
//     try {
//       const response = await apiConnector("POST", LECTURE_COMPLETION_API, data, {
//         Authorization: `Bearer ${token}`,
//       })
//       console.log(
//         "MARK_LECTURE_AS_COMPLETE_API API RESPONSE............",
//         response
//       )
  
//       if (!response.data.message) {
//         throw new Error(response.data.error)
//       }
//       toast.success("Lecture Completed")
//       result = true
//     } catch (error) {
//       console.log("MARK_LECTURE_AS_COMPLETE_API API ERROR............", error)
//       toast.error(error.message)
//       result = false
//     }
//     toast.dismiss(toastId)
//     return result
// }


export const markLectureAsComplete = async (data, token, dispatch) => {
  const toastId = toast.loading("Loading...");
  let result = null;

  try {
    console.log("mark complete data", data);

    const response = await apiConnector("POST", LECTURE_COMPLETION_API, data, {
      Authorization: `Bearer ${token}`,
    });

    console.log("Aman");
    console.log("MARK_LECTURE_AS_COMPLETE_API RESPONSE............", response);
    console.log("Marl Completed API 1: ", response.data);

    if (!response.data?.message) {
      throw new Error(response.data?.error || "Something went wrong");
    }

    toast.success("Lecture Completed");
    result = true;

    console.log("Marl Completed API 2: ", response.data.data);

    // 👇 Update the completed lectures in Redux
    if (response.data?.data) {
      dispatch(setCompletedLectures(response.data.data));
    } else {
      dispatch(updateCompletedLectures(data.subsectionId));
    }

  } catch (error) {
    console.error("MARK_LECTURE_AS_COMPLETE_API ERROR............", error);
    toast.error(error.message || "Could not mark lecture complete");
    result = false;
  }

  toast.dismiss(toastId);
  return result;
};

// create a rating for course
export const createRating = async (data, token) => {
    const toastId = toast.loading("Loading...")
    let success = false
    try {
        const response = await apiConnector("POST", CREATE_RATING_API, data, {
            Authorization: `Bearer ${token}`,
        })
        console.log("CREATE RATING API RESPONSE............", response)
        if (!response?.data?.success) {
            throw new Error("Could Not Create Rating")
        }
        toast.success("Rating Created")
        success = true
    } catch (error) {
        success = false
        console.log("CREATE RATING API ERROR............", error)
        toast.error(error.message)
    }
    toast.dismiss(toastId)
    return success
}