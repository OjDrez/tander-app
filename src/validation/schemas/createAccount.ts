import * as Yup from "yup";

export const createAccountSchema = Yup.object({
  identifier: Yup.string()
    .trim()
    .required("Email or username is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .matches(/[A-Z]/, "Include at least one uppercase letter")
    .matches(/[0-9]/, "Include at least one number")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password"), null], "Passwords must match")
    .required("Please confirm your password"),
});
