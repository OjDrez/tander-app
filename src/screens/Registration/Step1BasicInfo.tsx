// import ProgressBar from "@/src/components/ui/ProgressBar";
// import { getErrorString } from "@/src/utility/helpers";
// import { useFormikContext } from "formik";
// import {
//   ScrollView,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   View,
// } from "react-native";
// import SelectField from "../../components/forms/SelectField";
// import TextInputField from "../../components/forms/TextInputField";

// // Typed navigation for Step1
// import { Step1Nav } from "@/src/navigation/NavigationTypes";

// interface Props {
//   navigation: Step1Nav;
// }

// export default function Step1BasicInfo({ navigation }: Props) {
//   const {
//     values,
//     errors,
//     touched,
//     setFieldValue,
//     setFieldTouched,
//     validateForm,
//     setTouched,
//   } = useFormikContext<any>();

//   // -------------------------------
//   // VALIDATION-AWARE NEXT BUTTON
//   // -------------------------------
//   const handleNext = async () => {
//     const validationErrors = await validateForm();

//     if (Object.keys(validationErrors).length === 0) {
//       return navigation.navigate("Step2");
//     }

//     // Mark all fields touched so errors become visible
//     setTouched({
//       firstName: true,
//       lastName: true,
//       nickName: true,
//       birthday: true,
//       age: true,
//       country: true,
//     });
//   };

//   return (
//     <ScrollView
//       style={styles.container}
//       contentContainerStyle={{ paddingBottom: 40 }}
//     >
//       <ProgressBar step={1} total={3} />

//       <Text style={styles.title}>Welcome to Tander</Text>
//       <Text style={styles.subtitle}>
//         Please complete this registration to join Tander, Social, Connect,
//         Companionship & Dating.
//       </Text>

//       {/* FORM CARD */}
//       <View style={styles.card}>
//         {/* FIRST NAME */}
//         <TextInputField
//           label="First Name"
//           value={values.firstName}
//           touched={touched.firstName === true}
//           error={getErrorString(errors.firstName)}
//           onChangeText={(t) => setFieldValue("firstName", t)}
//           onBlur={() => setFieldTouched("firstName", true)}
//         />

//         <TextInputField
//           label="Last Name"
//           value={values.lastName}
//           touched={touched.lastName === true}
//           error={getErrorString(errors.lastName)}
//           onChangeText={(t) => setFieldValue("lastName", t)}
//           onBlur={() => setFieldTouched("lastName", true)}
//         />

//         <TextInputField
//           label="Nick Name"
//           value={values.nickName}
//           touched={touched.nickName === true}
//           error={getErrorString(errors.nickName)}
//           onChangeText={(t) => setFieldValue("nickName", t)}
//           onBlur={() => setFieldTouched("nickName", true)}
//         />

//         <TextInputField
//           label="Birthday"
//           value={values.birthday}
//           touched={touched.birthday === true}
//           error={getErrorString(errors.birthday)}
//           onChangeText={(t) => setFieldValue("birthday", t)}
//           onBlur={() => setFieldTouched("birthday", true)}
//         />

//         <TextInputField
//           label="Age"
//           value={values.age}
//           touched={touched.age === true}
//           error={getErrorString(errors.age)}
//           keyboardType="numeric"
//           onChangeText={(t) => setFieldValue("age", t)}
//           onBlur={() => setFieldTouched("age", true)}
//         />

//         {/* COUNTRY DROPDOWN */}
//         <SelectField
//           label="Country"
//           placeholder="Select..."
//           value={values.country}
//           touched={touched.country === true}
//           error={getErrorString(errors.country)}
//           onPress={() => console.log("Open country picker")}
//         />
//       </View>

//       {/* NEXT BUTTON */}
//       <TouchableOpacity style={styles.button} onPress={handleNext}>
//         <Text style={styles.buttonText}>Next</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// }

// const styles = StyleSheet.create({
//   container: { padding: 20 },
//   title: { fontSize: 22, fontWeight: "700", marginBottom: 6 },
//   subtitle: { color: "#666", marginBottom: 20 },
//   card: {
//     backgroundColor: "#FFF",
//     padding: 20,
//     borderRadius: 16,
//     marginBottom: 30,
//     elevation: 4,
//   },
//   button: {
//     backgroundColor: "#F5A14B",
//     padding: 16,
//     borderRadius: 30,
//     alignItems: "center",
//   },
//   buttonText: { color: "#FFF", fontWeight: "700" },
// });

import ProgressBar from "@/src/components/ui/ProgressBar";
import { getErrorString } from "@/src/utility/helpers";
import { useFormikContext } from "formik";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Step1Nav } from "@/src/navigation/NavigationTypes";
import DatePickerInput from "../../components/inputs/DatePickerInput";
import SelectField from "../../components/forms/SelectField";
import TextInputField from "../../components/forms/TextInputField";

interface Props {
  navigation: Step1Nav;
}

export default function Step1BasicInfo({ navigation }: Props) {
  const {
    values,
    errors,
    touched,
    setFieldValue,
    setFieldTouched,
    validateForm,
    setTouched,
  } = useFormikContext<any>();

  // Auto-calculate age from birthday
  React.useEffect(() => {
    if (values.birthday) {
      const age = calculateAge(values.birthday);
      if (age !== null && age !== values.age) {
        setFieldValue("age", age.toString());
      }
    }
  }, [values.birthday]);

  const calculateAge = (dateString: string): number | null => {
    if (!dateString) return null;

    // Date format: MM/DD/YYYY
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
    if (!dateRegex.test(dateString)) return null;

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

  const handleNext = async () => {
    const validationErrors = await validateForm();

    if (Object.keys(validationErrors).length === 0) {
      return navigation.navigate("Step2");
    }

    setTouched({
      firstName: true,
      lastName: true,
      nickName: true,
      birthday: true,
      age: true,
      country: true,
      civilStatus: true,
      city: true,
      hobby: true,
    });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      <ProgressBar step={1} total={3} />

      {/* HEADER & LOGO */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/icons/tander-logo.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Welcome to Tander</Text>
        <Text style={styles.subtitle}>
          Please complete this registration to join Tander, Social, Connect,
          Companionship & Dating.
        </Text>
      </View>

      {/* BASIC INFO CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Basic Info</Text>

        {/* FIRST NAME */}
        <TextInputField
          label="First Name"
          placeholder="Enter your name"
          value={values.firstName}
          touched={!!touched.firstName}
          error={getErrorString(errors.firstName)}
          onChangeText={(t) => setFieldValue("firstName", t)}
          onBlur={() => setFieldTouched("firstName", true)}
        />

        {/* LAST NAME */}
        <TextInputField
          label="Last Name"
          placeholder="Enter your name"
          value={values.lastName}
          touched={!!touched.lastName}
          error={getErrorString(errors.lastName)}
          onChangeText={(t) => setFieldValue("lastName", t)}
          onBlur={() => setFieldTouched("lastName", true)}
        />

        {/* NICKNAME */}
        <TextInputField
          label="Nick Name"
          placeholder="Enter your name"
          value={values.nickName}
          touched={!!touched.nickName}
          error={getErrorString(errors.nickName)}
          onChangeText={(t) => setFieldValue("nickName", t)}
          onBlur={() => setFieldTouched("nickName", true)}
        />

        {/* BIRTHDAY + AGE (2-column layout) */}
        <View style={styles.row}>
          <View style={styles.col}>
            <DatePickerInput
              label="Birthday"
              placeholder="mm/dd/yyyy"
              value={values.birthday}
              touched={!!touched.birthday}
              error={getErrorString(errors.birthday)}
              onChangeText={(date) => setFieldValue("birthday", date)}
              onBlur={() => setFieldTouched("birthday", true)}
            />
          </View>

          <View style={styles.col}>
            <View style={styles.ageContainer}>
              <Text style={styles.label}>Age</Text>
              <View style={styles.ageDisplay}>
                <Text style={styles.ageText}>
                  {values.age || ""}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* COUNTRY + CIVIL STATUS */}
        <View style={styles.row}>
          <View style={styles.col}>
            <SelectField
              label="Country"
              placeholder="Phil"
              value={values.country}
              touched={!!touched.country}
              error={getErrorString(errors.country)}
              onPress={() => console.log("Open Country Picker")}
            />
          </View>

          <View style={styles.col}>
            <SelectField
              label="Civil Status"
              placeholder="Select status"
              value={values.civilStatus}
              touched={!!touched.civilStatus}
              error={getErrorString(errors.civilStatus)}
              onPress={() => console.log("Open Civil Status Picker")}
            />
          </View>
        </View>

        {/* CITY + HOBBY */}
        <View style={styles.row}>
          <View style={styles.col}>
            <SelectField
              label="City/Province"
              placeholder=""
              value={values.city}
              touched={!!touched.city}
              error={getErrorString(errors.city)}
              onPress={() => console.log("Open City Picker")}
            />
          </View>

          <View style={styles.col}>
            <SelectField
              label="Hobby"
              placeholder="Select hobby"
              value={values.hobby}
              touched={!!touched.hobby}
              error={getErrorString(errors.hobby)}
              onPress={() => console.log("Open Hobby Picker")}
            />
          </View>
        </View>
      </View>

      {/* NEXT BUTTON */}
      <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
        <Text style={styles.nextText}>Next  ›</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#F9F9F9" },

  header: { alignItems: "center", marginBottom: 20 },
  logo: { width: 56, height: 56, marginBottom: 10 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 6 },
  subtitle: {
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    width: "90%",
  },

  card: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    marginBottom: 30,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },

  col: {
    flex: 1,
  },

  // Age display styles
  ageContainer: {
    marginBottom: 18,
  },
  label: {
    fontWeight: "600",
    marginBottom: 6,
    fontSize: 14,
    color: "#333",
  },
  ageDisplay: {
    backgroundColor: "#F5F5F5",
    borderWidth: 1.5,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 14,
    justifyContent: "center",
  },
  ageText: {
    fontSize: 16,
    color: "#333",
  },

  nextBtn: {
    backgroundColor: "#F5A14B",
    padding: 18,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },

  nextText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
});
