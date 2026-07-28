/**
 * Reusable Auth Validation Utility
 */

export function validateRegistrationForm({ name, email, password, confirmPassword }) {
  const errors = {};

  // 1. Full name required
  if (!name || !name.trim()) {
    errors.name = "Full name is required";
  }

  // 2. Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !email.trim()) {
    errors.email = "Email address is required";
  } else if (!emailRegex.test(email.trim())) {
    errors.email = "Please enter a valid email address (e.g. name@company.com)";
  }

  // 3. Password strength validation (minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  if (!password) {
    errors.password = "Password is required";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters long";
  } else if (!passwordRegex.test(password)) {
    errors.password = "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (e.g. @$!%*?&#)";
  }

  // 4. Password confirmation must match
  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password";
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
