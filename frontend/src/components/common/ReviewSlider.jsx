import React, { useEffect, useState } from "react";
import ReactStars from "react-rating-stars-component";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/pagination";
import { FaStar } from "react-icons/fa";
import { Autoplay, FreeMode, Pagination } from "swiper";
import { apiConnector } from "../../services/apiconnector";
import { ratingsEndpoints } from "../../services/apis";

function ReviewSlider() {
  const [reviews, setReviews] = useState([]);
  const truncateWords = 20;

  useEffect(() => {
    (async () => {
      const { data } = await apiConnector("GET", ratingsEndpoints.REVIEWS_DETAILS_API);
      if (data?.success) setReviews(data?.data);
    })();
  }, []);

  return (
    <div className="text-white w-full px-4 py-12">
      <h2 className="text-2xl font-semibold text-center mb-8">What Our Students Say</h2>
      <Swiper
        slidesPerView={1}
        breakpoints={{
          640: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        spaceBetween={40}
        loop={true}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
        modules={[FreeMode, Pagination, Autoplay]}
      >
        {reviews.map((review, i) => (
          <SwiperSlide key={i}>
            <div className="flex flex-col h-full gap-4 rounded-xl border border-richblack-700 bg-richblack-800 p-6 shadow-lg transition hover:scale-[1.02]">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <img
                  src={
                    review?.user?.image
                      ? review.user.image
                      : `https://api.dicebear.com/5.x/initials/svg?seed=${review?.user?.firstName} ${review?.user?.lastName}`
                  }
                  alt="Profile"
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div>
                  <h1 className="text-lg font-bold text-richblack-5">{`${review?.user?.firstName} ${review?.user?.lastName}`}</h1>
                  <p className="text-sm text-richblack-400">
                    {review?.course?.courseName}
                  </p>
                </div>
              </div>

              {/* Review Text */}
              <p className="text-[15px] leading-relaxed text-richblack-100">
                {review?.review.split(" ").length > truncateWords
                  ? `${review.review.split(" ").slice(0, truncateWords).join(" ")}...`
                  : review.review}
              </p>

              {/* Rating */}
              <div className="flex items-center gap-2 mt-auto pt-2 border-t border-richblack-700">
                <span className="text-yellow-100 font-semibold">
                  {review.rating.toFixed(1)}
                </span>
                <ReactStars
                  count={5}
                  value={review.rating}
                  size={20}
                  edit={false}
                  activeColor="#ffd700"
                  emptyIcon={<FaStar />}
                  fullIcon={<FaStar />}
                />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default ReviewSlider;
