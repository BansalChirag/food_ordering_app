import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
// import {images} from "@/constants";
// import {useCartStore} from "@/store/cart.store";
import { router } from "expo-router";
import { icons } from "@/constants/imageAssets";

const CartButton = () => {
  // const { getTotalItems } = useCartStore();
  // const totalItems = getTotalItems();
  const totalItems = 10;
  return (
    <TouchableOpacity className="cart-btn">
      <Image source={icons.bag} className="size-5" resizeMode="contain" />

      {totalItems > 0 && (
        <View className="cart-badge">
          <Text className="small-bold text-white">{totalItems}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
export default CartButton;
