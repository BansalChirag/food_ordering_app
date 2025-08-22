import { View, Text, Button as ButtonReact } from "react-native";
import React from "react";
import { router } from "expo-router";
import { Button } from "@react-navigation/elements";

const Signup = () => {
  return (
    <View>
      <Text>Signup</Text>
      <ButtonReact
        title="Sign In"
        onPress={() => {
          router.replace("/sign-in");
        }}
      />

      {/* Using the Button component from @react-navigation/elements */}
      <Button
        onPress={() => {
          router.replace("/sign-in");
        }}
      >
        Sign IN
      </Button>
    </View>
  );
};

export default Signup;
