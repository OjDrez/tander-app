import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Formik } from "formik";
import React from "react";

import RegistrationComplete from "../screens/Registration/RegistrationComplete";
import Step1BasicInfo from "../screens/Registration/Step1BasicInfo";
import Step2IdVerification from "../screens/Registration/Step2IdVerification";
import Step3Upload from "../screens/Registration/Step3Upload";
import Step4AboutYou from "../screens/Registration/Step4AboutYou";

import RegistrationSchema from "../context/RegistrationSchema";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import NavigationService from "./NavigationService";

import { RegistrationStackParamList } from "./NavigationTypes";

const Stack = createNativeStackNavigator<RegistrationStackParamList>();

export default function RegistrationNavigator() {
  const { completeProfile, phase1Data, registrationFlow } = useAuth();
  const toast = useToast();

  const handleRegistration = async (values: any) => {
    try {
      // Check if Phase 1 data exists
      const username = phase1Data?.username || registrationFlow?.username;

      if (!username) {
        toast.showToast({
          type: 'error',
          message: 'Session expired. Please start registration again.',
          duration: 5000,
          action: {
            label: 'Start Over',
            onPress: () => NavigationService.navigate('Auth', { screen: 'AccountIntroScreen' }),
          },
        });
        return;
      }

      // Phase 2: Complete profile with all details
      await completeProfile(username, {
        firstName: values.firstName,
        lastName: values.lastName,
        middleName: values.middleName || '',
        nickName: values.nickName,
        address: values.address || '',
        phone: values.phone || '',
        email: phase1Data?.email || values.email,
        birthDate: values.birthday,
        age: parseInt(values.age) || 0,
        country: values.country,
        city: values.city,
        civilStatus: values.civilStatus,
        hobby: values.hobby || '',
      });

      toast.showToast({
        type: 'success',
        message: 'Registration completed! Please login with your credentials.',
        duration: 5000,
        action: {
          label: 'Login',
          onPress: () => NavigationService.navigate('Auth', { screen: 'LoginScreen' }),
        },
      });

      // Navigate to completion screen
      NavigationService.navigate('Auth', {
        screen: 'Register',
        params: { screen: 'RegistrationComplete' }
      });
    } catch (error: any) {
      toast.error(error.message || 'Registration failed. Please try again.');
      console.error('Registration error:', error);
    }
  };

  return (
    <Formik
      initialValues={{
        // Step 1 - Basic Info
        firstName: "",
        lastName: "",
        middleName: "",
        nickName: "",
        birthday: "",
        age: "",
        country: "",
        civilStatus: "",
        city: "",
        hobby: "",
        email: "",
        phone: "",
        address: "",
        // Step 2 - ID Verification
        idPhotoFront: "",
        idPhotoBack: "",
        // Step 3 - Photos
        photos: [],
        profilePhoto: "",
        // Step 4 - About You
        bio: "",
        interests: [],
        lookingFor: [],
      }}
      validationSchema={RegistrationSchema}
      onSubmit={handleRegistration}
      validateOnChange={true}
      validateOnBlur={true}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          animationDuration: 350,
          animationTypeForReplace: "push",
        }}
      >
        <Stack.Screen
          name="Step1"
          component={Step1BasicInfo}
          options={{
            animation: "fade",
            animationDuration: 400,
          }}
        />
        <Stack.Screen
          name="Step2"
          component={Step2IdVerification}
          options={{
            animation: "slide_from_right",
            animationDuration: 350,
          }}
        />
        <Stack.Screen
          name="Step3"
          component={Step3Upload}
          options={{
            animation: "slide_from_right",
            animationDuration: 350,
          }}
        />
        <Stack.Screen
          name="Step4"
          component={Step4AboutYou}
          options={{
            animation: "slide_from_right",
            animationDuration: 350,
          }}
        />
        <Stack.Screen
          name="RegistrationComplete"
          component={RegistrationComplete}
          options={{
            animation: "fade_from_bottom",
            animationDuration: 400,
          }}
        />
      </Stack.Navigator>
    </Formik>
  );
}
