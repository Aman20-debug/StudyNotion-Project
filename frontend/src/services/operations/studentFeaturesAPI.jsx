import { toast } from "react-hot-toast";
import { studentEndpoints } from "../apis";
import { apiConnector } from "../apiconnector";
import rzpLogo from "../../assets/Logo/rzp_logo.png"
import { setPaymentLoading } from "../../slices/courseSlice";
import { resetCart } from "../../slices/cartSlice";


const {COURSE_PAYMENT_API, COURSE_VERIFY_API, SEND_PAYMENT_SUCCESS_EMAIL_API} = studentEndpoints;

// loadScript Function: Loads Razorpay SDK-> Dynamically loads the Razorpay checkout.js script.
function loadScript(src) {
    return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;

        script.onload = () => resolve(true);     // Successfully loaded
        script.onerror = () => resolve(false);   // Failed to load

        document.body.appendChild(script);      //Adds the script tag to <body>.
    });
}


//buyCourse Function: Main Payment Function
export async function buyCourse(token, courses, userDetails, navigate, dispatch) {
  const toastId = toast.loading("Loading...");

  try {
    // Step 1: Load Razorpay SDK
    const res = await loadScript("https://checkout.razorpay.com/v1/checkout.js");
    if (!res) {
      toast.error("RazorPay SDK failed to load");
      return;
    }

    // Step 2: Create Razorpay Order
    const orderResponse = await apiConnector("POST", COURSE_PAYMENT_API, { courses }, {
      Authorization: `Bearer ${token}`,
    });

    if (!orderResponse?.data?.success || !orderResponse?.data?.data?.id) {
      throw new Error("Invalid payment response from server");
    }

    const paymentDetails = orderResponse.data.data;
    console.log("Razorpay Key:", import.meta.env.VITE_RAZORPAY_KEY);

    // Step 3: Razorpay Payment Options
    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY,  // Use your Razorpay public key here
      currency: paymentDetails.currency,
      amount: `${paymentDetails.amount}`,
      order_id: paymentDetails.id,
      name: "StudyNotion",
      description: "Thank You for Purchasing the Course",
      image: rzpLogo,
      prefill: {
        name: `${userDetails.firstName}`,
        email: userDetails.email,
      },
      handler: function (response) {
        sendPaymentSuccessEmail(response, paymentDetails.amount, token);
        verifyPayment({ ...response, courses }, token, navigate, dispatch);
      },
    };

    // Step 4: Open Razorpay Popup
    const paymentObject = new window.Razorpay(options);
    paymentObject.open();

    paymentObject.on("payment.failed", function (response) {
      toast.error("Oops, payment failed");
      console.log("Payment failed:", response.error);
    });

  } catch (error) {
    console.log("PAYMENT API ERROR.....", error);
    toast.error("Could not make Payment");
  }

  toast.dismiss(toastId);
}

//sendPaymentSuccessEmail function
async function sendPaymentSuccessEmail(response, amount, token) {
    try{
        await apiConnector("POST", SEND_PAYMENT_SUCCESS_EMAIL_API, {
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            amount,
        },{
            Authorization: `Bearer ${token}`
        })
    }
    catch(error) {
        console.log("PAYMENT SUCCESS EMAIL ERROR....", error);
    }
}


//verify payment
async function verifyPayment(bodyData, token, navigate, dispatch) {
    const toastId = toast.loading("Verifying Payment....");
    dispatch(setPaymentLoading(true));
    try{
        const response  = await apiConnector("POST", COURSE_VERIFY_API, bodyData, {
            Authorization:`Bearer ${token}`,
        })

        if(!response.data.success) {
            throw new Error(response.data.message);
        }
        toast.success("payment Successful, ypou are addded to the course");
        navigate("/dashboard/enrolled-courses");
        dispatch(resetCart());
    }   
    catch(error) {
        console.log("PAYMENT VERIFY ERROR....", error);
        toast.error("Could not verify Payment");
    }
    toast.dismiss(toastId);
    dispatch(setPaymentLoading(false));
}