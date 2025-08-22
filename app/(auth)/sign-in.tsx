import { View, Text, Button as ButtonReact } from "react-native";
import React from "react";
import { Button } from "@react-navigation/elements";
import { router } from "expo-router";

const Signin = () => {
  return (
    <View>
      <Text>Signin</Text>
      <ButtonReact
        title="Sign up"
        onPress={() => {
          router.replace("/sign-up");
        }}
      />

      {/* Using the Button component from @react-navigation/elements */}
      <Button
        onPress={() => {
          router.replace("/sign-up");
        }}
      >
        Sign up
      </Button>
    </View>
  );
};

export default Signin;
