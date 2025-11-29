import * as Yup from "yup";

export default Yup.object().shape({
  firstName: Yup.string().required("Required"),
  lastName: Yup.string().required("Required"),

  birthday: Yup.string().required("Required"),
  age: Yup.number().required("Required"),

  photos: Yup.array().min(2, "At least 2 photos"),
  idFront: Yup.string().required("Front ID required"),

  bio: Yup.string().min(10, "Please write a short bio"),
  interests: Yup.array().min(1, "Select at least 1 interest"),
});
