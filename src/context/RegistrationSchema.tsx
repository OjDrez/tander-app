import * as Yup from "yup";

// Helper to validate date format (MM/DD/YYYY)
const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false;

  const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  if (!dateRegex.test(dateString)) return false;

  const [month, day, year] = dateString.split("/").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

// Helper to calculate age from date string
const calculateAgeFromDate = (dateString: string): number | null => {
  if (!isValidDate(dateString)) return null;

  const [month, day, year] = dateString.split("/").map(Number);
  const birthDate = new Date(year, month - 1, day);
  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age >= 0 ? age : null;
};

// Helper to validate minimum age (60+ for Tander senior citizens app)
const isMinimumAge = (dateString: string, minAge: number = 60): boolean => {
  const age = calculateAgeFromDate(dateString);
  return age !== null && age >= minAge;
};

// Helper to validate maximum age (120 years - oldest possible person)
const isMaximumAge = (dateString: string, maxAge: number = 120): boolean => {
  const age = calculateAgeFromDate(dateString);
  return age !== null && age <= maxAge;
};

export default Yup.object().shape({
  // Step 1: Basic Info
  firstName: Yup.string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .matches(/^[a-zA-Z\s\-']+$/, "First name can only contain letters, spaces, hyphens, and apostrophes"),

  lastName: Yup.string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .matches(/^[a-zA-Z\s\-']+$/, "Last name can only contain letters, spaces, hyphens, and apostrophes"),

  middleName: Yup.string()
    .max(50, "Middle name must be less than 50 characters")
    .matches(/^[a-zA-Z\s\-']*$/, "Middle name can only contain letters, spaces, hyphens, and apostrophes"),

  nickName: Yup.string()
    .required("Nickname is required")
    .min(2, "Nickname must be at least 2 characters")
    .max(20, "Nickname must be less than 20 characters")
    .matches(/^[a-zA-Z0-9_\s]+$/, "Nickname can only contain letters, numbers, underscores, and spaces"),

  // Email is optional here - already collected in AccountIntroScreen
  email: Yup.string()
    .email("Please enter a valid email address"),

  phone: Yup.string()
    .matches(/^[\d\s\-+()]*$/, "Please enter a valid phone number"),

  address: Yup.string()
    .max(200, "Address must be less than 200 characters"),

  birthday: Yup.string()
    .required("Birthday is required")
    .test("valid-date", "Please enter a valid date (MM/DD/YYYY)", isValidDate)
    .test("minimum-age", "You must be at least 60 years old to join Tander", (value) =>
      value ? isMinimumAge(value, 60) : false
    )
    .test("maximum-age", "Please enter a valid birth date", (value) =>
      value ? isMaximumAge(value, 120) : false
    ),

  age: Yup.string()
    .required("Age is required")
    .test("valid-age", "You must be at least 60 years old", (value) => {
      if (!value) return false;
      const age = parseInt(value, 10);
      return !isNaN(age) && age >= 60;
    })
    .test("max-age", "Please enter a valid age", (value) => {
      if (!value) return false;
      const age = parseInt(value, 10);
      return !isNaN(age) && age <= 120;
    }),

  // Country is auto-set to Philippines (PH-only app)
  country: Yup.string(),

  // Civil status moved to Step 4 (About You) - optional in schema, validated in Step4
  civilStatus: Yup.string(),

  city: Yup.string().required("City/Province is required"),

  // Hobby removed - replaced by interests in Step 4
  hobby: Yup.string(),

  // Step 2: ID Verification (optional - verified separately)
  idPhotoFront: Yup.string(),
  idPhotoBack: Yup.string(),

  // Step 3: Photos (optional)
  photos: Yup.array(),
  profilePhoto: Yup.string(),

  // Step 4: About You (optional)
  bio: Yup.string()
    .max(500, "Bio must be less than 500 characters"),
  interests: Yup.array(),
  lookingFor: Yup.array(),
});
