import { showToast } from "../components/toastService";

/**
 * Validates if the email is in a proper format and shows toast if invalid.
 * @param {string} email
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  const valid =
    typeof email === "string" &&
    email.includes("@") &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!valid) {
    showToast({
      title: "Invalid Email",
      description: "Make sure it contains @ and a valid domain (e.g. user@example.com).",
      status: "error",
    });
  }

  return valid;
};

/**
 * Validates if the mobile number is exactly 10 digits and shows toast if invalid.
 * @param {string} mobile
 * @returns {boolean}
 */
export const isValidMobile = (mobile) => {
  const valid = /^[6-9]\d{9}$/.test(mobile);
  let description = "";
  if (mobile.length !== 10) {
    description = `Entered number has ${mobile.length} digits. It must be exactly 10 digits.`;
  } else {
    description = "Mobile number must start with digits 6-9.";
  }

  if (!valid) {
    showToast({
      title: "Invalid Mobile Number",
      description: description,
      status: "error",
    });
  }

  return valid;
};

export const isValidFormData = (formData, optionalFields) => {
  // Helper function to convert camelCase to human-readable string
  const camelCaseToReadable = (str) => {
    return str
      .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space between camelCase words
      .replace(/^([a-z])/, (match) => match.toUpperCase()); // Capitalize the first letter
  };
  
  for (const key in formData) {
    if (!optionalFields.includes(key) && (formData[key] === "" || formData[key] === null || formData[key] === false)) {
      showToast({
        title: `Please Enter valid ${camelCaseToReadable(key)}`,
        status: 'error',
      });
      return false;
    }
  }
  
  return true;
}