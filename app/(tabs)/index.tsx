import { offers } from "@/constants";
import { icons } from "@/constants/imageAssets";
import { Fragment, useEffect, useState } from "react";
import {
  Alert,
  Button,
  FlatList,
  Image,
  Linking,
  Pressable,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import cn from "clsx";
import CartButton from "@/components/CartButton";
import * as Sentry from "@sentry/react-native";
import * as Location from "expo-location";
import useAuthStore from "@/store/auth.store";

interface LocationState {
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean;
}

export default function Index() {
  const { user } = useAuthStore();

  const [location, setLocation] = useState<LocationState>({
    address: "", // Default fallback
    coordinates: null,
    isLoading: false,
    error: null,
    hasPermission: false,
  });

  const [pulseAnim] = useState(new Animated.Value(1));

  // Pulse animation for loading state
  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  // Request location permissions
  const requestLocationPermission = async (): Promise<boolean> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setLocation((prev) => ({
          ...prev,
          error: "Location permission denied",
          hasPermission: false,
        }));

        // Show permission dialog
        Alert.alert(
          "Location Permission Required",
          "We need access to your location to provide accurate delivery estimates and nearby offers.",
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        return false;
      }

      setLocation((prev) => ({ ...prev, hasPermission: true, error: null }));
      return true;
    } catch (error) {
      console.error("Permission error:", error);
      Sentry.captureException(error);
      setLocation((prev) => ({
        ...prev,
        error: "Failed to request location permission",
        hasPermission: false,
      }));
      return false;
    }
  };

  // Get current location
  const getCurrentLocation = async () => {
    setLocation((prev) => ({ ...prev, isLoading: true, error: null }));
    startPulseAnimation();

    try {
      // Check if permission is granted
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setLocation((prev) => ({ ...prev, isLoading: false }));
        stopPulseAnimation();
        return;
      }

      // Get current position with high accuracy
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode to get address
      const addressResponse = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addressResponse.length > 0) {
        const addr = addressResponse[0];
        const formattedAddress = [
          addr.name,
          addr.street,
          addr.city,
          addr.region,
          addr.country,
        ]
          .filter(Boolean)
          .join(", ")
          .slice(0, 50); // Limit length for UI

        setLocation((prev) => ({
          ...prev,
          address: formattedAddress || "Current Location",
          coordinates: { latitude, longitude },
          isLoading: false,
          error: null,
        }));
      } else {
        setLocation((prev) => ({
          ...prev,
          address: "Current Location",
          coordinates: { latitude, longitude },
          isLoading: false,
          error: null,
        }));
      }
    } catch (error) {
      console.error("Location error:", error);
      Sentry.captureException(error);

      let errorMessage = "Failed to get location";
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof (error as { code?: unknown }).code === "string"
      ) {
        if (
          (error as { code: string }).code === "E_LOCATION_SERVICES_DISABLED"
        ) {
          errorMessage = "Location services are disabled";
        } else if (
          (error as { code: string }).code === "E_LOCATION_UNAVAILABLE"
        ) {
          errorMessage = "Location temporarily unavailable";
        }
      }

      setLocation((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      Alert.alert(
        "Location Error",
        errorMessage + ". Please check your settings and try again.",
        [{ text: "OK" }]
      );
    } finally {
      stopPulseAnimation();
    }
  };

  // Auto-fetch location on mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  // Handle location retry
  const handleLocationRetry = () => {
    getCurrentLocation();
  };

  // Render location header with all states
  const renderLocationHeader = () => (
    <View className="flex-between flex-row w-full my-5">
      <View className="flex-start flex-1 mr-4">
        <Text className="small-bold text-primary">DELIVER TO</Text>

        <TouchableOpacity
          className="flex-center flex-row gap-x-1 mt-0.5"
          onPress={getCurrentLocation}
          disabled={location.isLoading}
        >
          {location.isLoading ? (
            <View className="flex-center flex-row gap-x-2">
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Image
                  source={icons.location || icons.arrowDown}
                  className="size-3"
                  resizeMode="contain"
                  tintColor="#666"
                />
              </Animated.View>
              <ActivityIndicator size="small" color="#666" />
              <Text className="paragraph-bold text-gray-600">
                Getting location...
              </Text>
            </View>
          ) : location.error ? (
            <View className="flex-center flex-row gap-x-2">
              <Image
                source={icons.warning || icons.arrowDown}
                className="size-3"
                resizeMode="contain"
                tintColor="#ef4444"
              />
              <Text className="paragraph-bold text-red-500">
                Location Error
              </Text>
              <TouchableOpacity
                onPress={handleLocationRetry}
                className="ml-2 px-2 py-1 bg-red-100 rounded"
              >
                <Text className="text-xs text-red-600 font-medium">Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="flex-center flex-row gap-x-1">
              <Text
                className="paragraph-bold text-dark-100 flex-1"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {location.address}
              </Text>
              <Image
                source={icons.arrowDown}
                className="size-3"
                resizeMode="contain"
              />
              {location.coordinates && (
                <View className="ml-1 size-2 bg-green-500 rounded-full" />
              )}
            </View>
          )}
        </TouchableOpacity>

        {/* Coordinates for debugging (remove in production) */}
        {/* {__DEV__ && location.coordinates && (
          <Text className="text-xs text-gray-400 mt-1">
            {location.coordinates.latitude.toFixed(4)},{" "}
            {location.coordinates.longitude.toFixed(4)}
          </Text>
        )} */}
      </View>

      <CartButton />
    </View>
  );

  return (
    <SafeAreaView className="flex-1">
      <FlatList
        data={offers}
        renderItem={({ item, index }) => {
          const isEven = index % 2 === 0;
          return (
            <View>
              <Pressable
                className={cn(
                  "offer-card",
                  isEven ? "flex-row-reverse" : "flex-row"
                )}
                style={{ backgroundColor: item.color }}
                android_ripple={{ color: "#fffff22" }}
              >
                {({ pressed }) => (
                  <Fragment>
                    <View className="h-full w-1/2">
                      <Image
                        source={item.image}
                        className="size-full"
                        resizeMode="contain"
                      />
                    </View>

                    <View
                      className={cn(
                        "offer-card__info",
                        isEven ? "pl-10" : "pr-10"
                      )}
                    >
                      <Text className="h1-bold text-white leading-tight">
                        {item.title}
                      </Text>
                      <Image
                        source={icons.arrowRight}
                        className="size-10"
                        resizeMode="contain"
                        tintColor="#ffffff"
                      />
                    </View>
                  </Fragment>
                )}
              </Pressable>
            </View>
          );
        }}
        contentContainerClassName="pb-28 px-5"
        ListHeaderComponent={renderLocationHeader}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
