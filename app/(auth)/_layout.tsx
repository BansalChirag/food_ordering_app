import {
  View,
  Text,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ImageBackground,
  Image,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, Slot } from "expo-router";
import { images } from "@/constants/imageAssets";
import CustomButton from "@/components/CustomButton";
import CustomInput from "@/components/CustomInput";
import useAuthStore from "@/store/auth.store";

const AuthLayout = () => {
  const { isAuthenticated, isLoading } = useAuthStore();

  // Wait for loading to complete before redirecting
  if (isLoading) return null; // or a loading spinner

  if (isAuthenticated) return <Redirect href="/" />;

  if (isAuthenticated) return <Redirect href="/" />;
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView
        className="bg-white h-full"
        keyboardShouldPersistTaps="handled"
      >
        <View
          className="w-full relative"
          style={{ height: Dimensions.get("screen").height / 2.25 }}
        >
          <ImageBackground
            source={images.loginGraphic}
            className="size-full rounder-b-lg"
            resizeMode="stretch"
          />
          <Image
            source={images.logo}
            className="self-center size-48 absolute -bottom-16  z-10"
          />
        </View>
        <Slot />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AuthLayout;
