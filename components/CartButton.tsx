import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
// import {images} from "@/constants";
// import {useCartStore} from "@/store/cart.store";
import { router } from "expo-router";
import { icons } from "@/constants/imageAssets";
import { useCartStore } from "@/store/cart.store";

const CartButton = () => {
  const { getTotalItems } = useCartStore();
  const totalItems = getTotalItems();

  return (
    <TouchableOpacity className="cart-btn" onPress={() => router.push("/cart")}>
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
