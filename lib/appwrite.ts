import { AuthParams, GetMenuParams } from "@/types";
import {
  Account,
  Avatars,
  Client,
  Databases,
  Functions,
  ID,
  Query,
  Storage,
} from "react-native-appwrite";

export const appwriteConfig = {
  endpoint: process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID!,
  platform: "com.food.ordering",
  databaseId: "68a858380028aa2b3fee",
  bucketId: "68a9cd69000d326472f9",
  userCollectionId: "68aaba4500083f4d2250",
  categoriesCollectionId: "68a9ac2d000b871ab34b",
  menuCollectionId: "68a9ac9e0030f6824572",
  customizationsCollectionId: "68a9cb71000da079da08",
  menuCustomizationsCollectionId: "68a9cc4c001a4d017a43",
  orderCollectionId: "68ab13a000320cfeeda6",
};

export const client = new Client();

client
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

export const account = new Account(client);

export const databases = new Databases(client);

const avatars = new Avatars(client);

export const functions = new Functions(client);

export const storage = new Storage(client);

export const createUser = async ({ email, password, name }: AuthParams) => {
  try {
    const newAccount = await account.create(ID.unique(), email, password, name);
    if (!newAccount) throw Error;

    await signIn({ email, password });

    const avatarUrl = avatars.getInitialsURL(name);

    return await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      { email, name, accountId: newAccount.$id, avatar: avatarUrl }
    );
  } catch (e) {
    throw new Error(e as string);
  }
};

export const signIn = async ({ email, password }: AuthParams) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
  } catch (e) {
    throw new Error(e as string);
  }
};

export const signOut = async () => {
  try {
    await account.deleteSession("current");
  } catch (e) {
    throw new Error(e as string);
  }
};

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal("accountId", currentAccount.$id)]
    );

    if (!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (e) {
    console.log(e);
    throw new Error(e as string);
  }
};

export const getMenu = async ({ category, query }: GetMenuParams) => {
  try {
    const queries: string[] = [];

    if (category) queries.push(Query.equal("categories", category));
    if (query) queries.push(Query.search("name", query));

    const menus = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.menuCollectionId,
      queries
    );

    return menus.documents;
  } catch (e) {
    throw new Error(e as string);
  }
};

export const getCategories = async () => {
  try {
    const categories = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.categoriesCollectionId
    );

    return categories.documents;
  } catch (e) {
    throw new Error(e as string);
  }
};

// Add order creation function
export const createOrder = async (orderData: {
  payment_id: string;
  total_amount: number;
  total_items: number;
  items: string;
  status?: string;
  delivery_fee?: number;
  discount?: number;
  users: string;
  cust_name: string;
  cust_email: string;
  order_number: string;
  payment_method?: string;
  payment_status?: string;
  order_status?: string;
  customer_phone?: string;
  delivery_address?: string;
}) => {
  try {
    const order = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.orderCollectionId,
      ID.unique(),
      {
        payment_id: orderData.payment_id,
        total_amount: orderData.total_amount,
        total_items: orderData.total_items,
        items: orderData.items,
        status: orderData.status || "confirmed",
        delivery_fee: orderData.delivery_fee || 0,
        discount: orderData.discount || 0,
        users: orderData.users,
        cust_name: orderData.cust_name,
        cust_email: orderData.cust_email,
        order_number: orderData.order_number,
        payment_method: orderData.payment_method || "stripe",
        payment_status: orderData.payment_status || "paid",
        order_status: orderData.order_status || "pending",
        customer_phone: orderData.customer_phone || "",
        delivery_address: orderData.delivery_address || "",
      }
    );

    return order;
  } catch (e) {
    console.error("Failed to create order:", e);
    throw new Error(e as string);
  }
};

// Optional: Get user orders
export const getUserOrders = async (userId: string) => {
  try {
    const orders = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.orderCollectionId,
      [Query.equal("users", userId), Query.orderDesc("$createdAt")]
    );

    return orders.documents;
  } catch (e) {
    console.error("Failed to get user orders:", e);
    throw new Error(e as string);
  }
};

// Optional: Get single order
export const getOrder = async (orderId: string) => {
  try {
    const order = await databases.getDocument(
      appwriteConfig.databaseId,
      appwriteConfig.orderCollectionId,
      orderId
    );

    return order;
  } catch (e) {
    console.error("Failed to get order:", e);
    throw new Error(e as string);
  }
};
