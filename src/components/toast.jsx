import { toast } from "react-hot-toast";

const Toastify = (type = "info", message = "") => {
  if (type === "success") {
    toast.success(message,{ icon: '✖'});
  } else if (type === "info") {
    toast.error(message, {
      style: { background: "#8AB5FF", color: "#0D0D15" },
       icon: '✖'
    });
  } else {
    toast.error(message, {
      style: { background: "#F59693", color: "#0D0D15" },
       icon: '✖'
    });
  }
};

const Index = (type, error) => {
  // console.log(error.error && error.reason)
  // console.log(error.message)
  // MetaMask errors
  if (error.code === 4001) {
    return Toastify("error", "Transaction rejected by user.");
  } else if (error.reason) {
    return Toastify("error", error.reason);
  } else if (error.error && error.error.message) {
    return Toastify("error", error.error.message);
  } else if (error.data && (error.data.message || error.data.reason)) {
    return Toastify("error", error.data.message || error.data.reason);
  }

  if (error.response) {
    const status = error.response.status;
    const msg =
      error.response.data?.message ||
      (status >= 500
        ? "Server error, please try again later."
        : "Something went wrong.");

    return Toastify("error", msg);
  }

  // Generic fallback
  Toastify(type, error.message || "Unexpected error occurred.");
};

export default Index;
