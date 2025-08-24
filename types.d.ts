import { Models } from "react-native-appwrite";

interface CustomInputProps {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  label: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
}

interface User extends Models.Document {
  name: string;
  email: string;
  avatar: string;
}

interface CustomButtonProps {
  onPress?: () => void;
  title?: string;
  style?: string;
  leftIcon?: React.ReactNode;
  textStyle?: string;
  isLoading?: boolean;
}

interface AuthParams {
  email: string;
  password: string;
  name?: string;
}

interface TabBarIconProps {
  focused: boolean;
  icon: ImageSourcePropType;
  title: string;
}

interface GetMenuParams {
  category: string;
  query: string;
}

interface MenuItem extends Models.Document {
  name: string;
  price: number;
  image_url: string;
  description: string;
  calories: number;
  protein: number;
  rating: number;
  type: string;
}

interface CartCustomization {
  id: string;
  name: string;
  price: number;
  type: string;
}

interface CartItemType {
  id: string; // menu item id
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  customizations?: CartCustomization[];
}

interface CartStore {
  items: CartItemType[];
  addItem: (item: Omit<CartItemType, "quantity">) => void;
  removeItem: (id: string, customizations: CartCustomization[]) => void;
  increaseQty: (id: string, customizations: CartCustomization[]) => void;
  decreaseQty: (id: string, customizations: CartCustomization[]) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

interface PaymentInfoStripeProps {
  label: string;
  value: string;
  labelStyle?: string;
  valueStyle?: string;
}
interface Category extends Models.Document {
  name: string;
  description: string;
}
