// ===========================================================================
// LOGIN POPUP - ALL TEXT
// ---------------------------------------------------------------------------
// The popup has three steps:
//   1. phone  -> enter the mobile number and ask for an OTP
//   2. otp    -> enter the 6 digit code
//   3. email  -> the "Login with Email" route instead
//
// It is FRONTEND ONLY right now. Nothing is sent anywhere. Every place that
// needs a backend call is marked "BACKEND CALL GOES HERE" in the step files.
// ===========================================================================

export const CONTENT = {
  title: "Login to Galla",

  phone: {
    label: "Phone Number",
    placeholder: "Enter phone number",
    cta: "Send OTP",
    or: "or",
    emailCta: "Login with Email",
    error: "Please enter a valid 10 digit mobile number",
    terms: "By continuing you agree to our Terms and Privacy Policy.",
  },

  otp: {
    title: "Enter the OTP",
    sub: "We sent a 6 digit code to",
    change: "Change number",
    cta: "Verify and continue",
    resend: "Resend OTP",
    resendIn: "Resend OTP in",
    error: "That code does not look right. Please check and try again.",
    seconds: 30,
  },

  email: {
    title: "Login with Email",
    label: "Email address",
    placeholder: "you@company.com",
    cta: "Send login link",
    back: "Use phone number instead",
    error: "Please enter a valid email address",
    done: "Check your inbox - we have sent you a login link.",
  },

  // The country list for the little selector next to the phone field.
  // Add more here if you need them.
  countries: [
    { id: "in", dial: "+91", name: "India", digits: 10 },
    { id: "ae", dial: "+971", name: "United Arab Emirates", digits: 9 },
    { id: "gb", dial: "+44", name: "United Kingdom", digits: 10 },
    { id: "us", dial: "+1", name: "United States", digits: 10 },
  ],
};
