import { View, Text, Alert, Image } from "react-native";
import React, { useState } from "react";
import CustomButton from "./CustomButton";
import { PaymentSheetError, useStripe } from "@stripe/stripe-react-native";
import { fetchAPI } from "@/lib/fetch";
import { createOrder } from "@/lib/appwrite";
import { CartItemType } from "@/types";
import { useCartStore } from "@/store/cart.store";
import { ReactNativeModal } from "react-native-modal";
import { images } from "@/constants/imageAssets";
import { router } from "expo-router";

const Payments = ({
  user,
  amount,
  cartItems,
}: {
  user: any;
  amount: number;
  cartItems: any;
}) => {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const [success, setSuccess] = useState<boolean>(false);
  console.log("🚀 ~ Payments ~ success:", success);
  const { clearCart } = useCartStore();

  const createOrderRecord = async (
    paymentIntentId: string,
    customerId: string
  ) => {
    try {
      const orderData = {
        payment_id: paymentIntentId,
        total_amount: amount + 5 - 0.5, // Including delivery fee and discount
        total_items: cartItems.reduce(
          (sum: number, item: CartItemType) => sum + item.quantity,
          0
        ),
        items: JSON.stringify(cartItems), // Store cart items as JSON string
        status: "completed", // or whatever your enum values are
        delivery_fee: 5.0,
        discount: 0.5,
        users: user.$id, // Use Appwrite document ID
        cust_name: user.name,
        cust_email: user.email,
        order_number: `ORDER-${Date.now()}`, // Generate unique order number
        payment_method: "stripe", // or get from payment method
        payment_status: "completed", // Enum value
        order_status: "pending", // Enum value
        customer_phone: user.phone ?? 1234567890, // If available
        delivery_address: user.address ?? "India", // If available
      };

      const order = await createOrder(orderData);
      return order;
    } catch (error) {
      console.error("Failed to create order:", error);
      throw error;
    }
  };

  const initializePaymentSheet = async () => {
    const { error } = await initPaymentSheet({
      merchantDisplayName: "Example, Inc.",
      intentConfiguration: {
        mode: {
          amount: Math.round((amount + 5 - 0.5) * 100), // Convert to cents and include fees
          currencyCode: "USD",
        },
        confirmHandler: async (
          paymentMethod,
          shouldSavePaymentMethod,
          intentCreationCallback
        ) => {
          console.log("🚀 ~ confirmHandler ~ paymentMethod:", paymentMethod.id);

          try {
            console.log("Starting payment process...");

            // Create payment intent
            const { paymentIntent, customer } = await fetchAPI(
              "/(api)/stripe/create",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  name: user?.name,
                  email: user?.email,
                  amount: amount + 5 - 0.5, // Include fees in the amount
                  paymentMethodId: paymentMethod.id,
                }),
              }
            );
            console.log(
              "🚀 ~ initializePaymentSheet ~ paymentInten:",
              paymentIntent
            );

            if (paymentIntent?.client_secret) {
              console.log("Confirming payment...");

              // Confirm the payment
              const { result } = await fetchAPI("/(api)/stripe/pay", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  payment_method_id: paymentMethod.id,
                  payment_intent_id: paymentIntent.id,
                  customer_id: customer,
                  client_secret: paymentIntent.client_secret,
                }),
              });

              console.log("Pay response:", result);

              if (result?.client_secret) {
                try {
                  // Create order after successful payment
                  const order = await createOrderRecord(
                    paymentIntent.id,
                    customer
                  );
                  console.log("Order created successfully:", order);

                  // Call the callback to complete the payment
                  await intentCreationCallback({
                    clientSecret: result.client_secret,
                  });

                  // Set success state and clear cart
                  setSuccess(true);
                  clearCart();

                  // Show success message
                  Alert.alert(
                    "Success",
                    "Payment completed and order created successfully!"
                  );
                } catch (orderError) {
                  console.error(
                    "Payment succeeded but order creation failed:",
                    orderError
                  );

                  // Still complete the payment even if order creation failed
                  await intentCreationCallback({
                    clientSecret: result.client_secret,
                  });

                  Alert.alert(
                    "Warning",
                    "Payment was successful, but there was an issue creating your order. Please contact support."
                  );
                }
              } else {
                // Handle payment failure
                await intentCreationCallback({
                  error: {
                    code: "payment_failed",
                    message: "Payment confirmation failed",
                  },
                });
              }
            } else {
              // Handle payment intent creation failure
              await intentCreationCallback({
                error: {
                  code: "payment_intent_failed",
                  message: "Failed to create payment intent",
                },
              });
            }
          } catch (error: any) {
            // Handle any errors during the process
            console.error("Payment error:", error);
            await intentCreationCallback({
              error: {
                code: "payment_error",
                message: error.message || "An unexpected error occurred",
              },
            });
          }
        },
      },
    });

    if (error) {
      console.error("Payment sheet initialization failed:", error);
      Alert.alert("Error", "Failed to initialize payment sheet");
    }
  };

  const openPaymentSheet = async () => {
    await initializePaymentSheet();

    const { error } = await presentPaymentSheet();

    if (error) {
      if (error.code === PaymentSheetError.Canceled) {
        Alert.alert("Payment Cancelled", "You cancelled the payment");
      } else {
        Alert.alert("Payment Error", error.message);
      }
    } else {
      // Payment completed successfully
      console.log("Payment completed successfully");
    }
  };

  return (
    <>
      <CustomButton title="Proceed to Checkout" onPress={openPaymentSheet} />

      <ReactNativeModal
        isVisible={success}
        onBackdropPress={() => setSuccess(false)}
      >
        <View className="flex flex-col items-center justify-center bg-white p-7 rounded-2xl">
          <Image source={images.cheese} className="w-28 h-28 mt-5" />

          <Text className="text-2xl text-center font-JakartaBold mt-5">
            Order placed successfully
          </Text>

          <Text className="text-md text-general-200 font-JakartaRegular text-center mt-3">
            Thank you for your order. Your payment has been successfully
            processed and your order is being prepared.
          </Text>

          <CustomButton
            title="Back Home"
            onPress={() => {
              setSuccess(false);
              router.push("/");
            }}
          />
        </View>
      </ReactNativeModal>
    </>
  );
};

export default Payments;
