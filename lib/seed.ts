import { ID } from "react-native-appwrite";
import { appwriteConfig, databases, storage } from "./appwrite";
import dummyData from "./data";

interface Category {
  name: string;
  description: string;
}

interface Customization {
  name: string;
  price: number;
  type: "topping" | "side" | "size" | "crust" | string;
}

interface MenuItem {
  name: string;
  description: string;
  image_url: string;
  price: number;
  rating: number;
  calories: number;
  protein: number;
  category_name: string;
  customizations: string[];
}

interface DummyData {
  categories: Category[];
  customizations: Customization[];
  menu: MenuItem[];
}

// Ensure dummyData has correct shape
const data = dummyData as DummyData;

// Test connection to Appwrite

// Clear all documents from a collection
async function clearAll(collectionId: string): Promise<void> {
  try {
    console.log(`🔄 Clearing collection: ${collectionId}`);
    const list = await databases.listDocuments(
      appwriteConfig.databaseId,
      collectionId
    );

    if (list.documents.length === 0) {
      console.log(`✅ Collection ${collectionId} is already empty`);
      return;
    }

    console.log(
      `🔄 Deleting ${list.documents.length} documents from ${collectionId}`
    );
    await Promise.all(
      list.documents.map((doc) =>
        databases.deleteDocument(
          appwriteConfig.databaseId,
          collectionId,
          doc.$id
        )
      )
    );
    console.log(
      `✅ Cleared ${list.documents.length} documents from ${collectionId}`
    );
  } catch (error) {
    console.error(`❌ Failed to clear collection ${collectionId}:`, error);
    throw error;
  }
}

// Clear all files from storage
async function clearStorage(): Promise<void> {
  try {
    console.log("🔄 Clearing storage bucket...");
    const list = await storage.listFiles(appwriteConfig.bucketId);

    if (list.files.length === 0) {
      console.log("✅ Storage bucket is already empty");
      return;
    }

    console.log(`🔄 Deleting ${list.files.length} files from storage`);
    await Promise.all(
      list.files.map((file) =>
        storage.deleteFile(appwriteConfig.bucketId, file.$id)
      )
    );
    console.log(`✅ Cleared ${list.files.length} files from storage`);
  } catch (error) {
    console.error("❌ Failed to clear storage:", error);
    throw error;
  }
}

// Upload image to Appwrite storage
async function uploadImageToStorage(
  imageUrl: string,
  itemName: string
): Promise<string> {
  try {
    console.log(`🔄 Uploading image for ${itemName}: ${imageUrl}`);

    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
    }

    const blob = await response.blob();
    const fileName =
      imageUrl.split("/").pop() ||
      `${itemName.replace(/\s+/g, "_")}-${Date.now()}.jpg`;

    const fileObj = {
      name: fileName,
      type: blob.type || "image/jpeg",
      size: blob.size,
      uri: imageUrl,
    };

    const file = await storage.createFile(
      appwriteConfig.bucketId,
      ID.unique(),
      fileObj
    );

    const fileUrl = storage.getFileView(appwriteConfig.bucketId, file.$id);
    console.log(`✅ Image uploaded for ${itemName}: ${file.$id}`);
    return fileUrl.toString();
  } catch (error) {
    console.error(`❌ Failed to upload image for ${itemName}:`, error);
    // Return original URL as fallback or throw error based on your preference
    console.log(`⚠️ Using original URL as fallback for ${itemName}`);
    return imageUrl;
  }
}

// Validate data structure
function validateData(data: DummyData): void {
  console.log("🔄 Validating data structure...");

  if (!data.categories || !Array.isArray(data.categories)) {
    throw new Error("Invalid data: categories must be an array");
  }

  if (!data.customizations || !Array.isArray(data.customizations)) {
    throw new Error("Invalid data: customizations must be an array");
  }

  if (!data.menu || !Array.isArray(data.menu)) {
    throw new Error("Invalid data: menu must be an array");
  }

  // Validate that all menu items reference existing categories
  const categoryNames = new Set(data.categories.map((cat) => cat.name));
  const invalidMenuItems = data.menu.filter(
    (item) => !categoryNames.has(item.category_name)
  );
  if (invalidMenuItems.length > 0) {
    console.warn(
      "⚠️ Menu items with invalid categories:",
      invalidMenuItems.map((item) => item.name)
    );
  }

  // Validate that all customizations referenced in menu items exist
  const customizationNames = new Set(
    data.customizations.map((cus) => cus.name)
  );
  const invalidCustomizations = data.menu.flatMap((item) =>
    item.customizations.filter((cusName) => !customizationNames.has(cusName))
  );
  if (invalidCustomizations.length > 0) {
    console.warn("⚠️ Invalid customization references:", [
      ...new Set(invalidCustomizations),
    ]);
  }

  console.log("✅ Data validation completed");
  console.log(`   Categories: ${data.categories.length}`);
  console.log(`   Customizations: ${data.customizations.length}`);
  console.log(`   Menu Items: ${data.menu.length}`);
}

// Main seed function
async function seed(): Promise<void> {
  const startTime = Date.now();
  console.log("🚀 Starting database seeding process...");

  try {
    // Step 1: Test connection
    // await testConnection();

    // Step 2: Validate data
    validateData(data);

    // Step 3: Clear existing data
    console.log("\n📂 Clearing existing data...");
    await Promise.all([
      clearAll(appwriteConfig.categoriesCollectionId),
      clearAll(appwriteConfig.customizationsCollectionId),
      clearAll(appwriteConfig.menuCollectionId),
      clearAll(appwriteConfig.menuCustomizationsCollectionId),
      clearStorage(),
    ]);
    console.log("✅ All existing data cleared");

    // Step 4: Create Categories
    console.log("\n🏷️ Creating categories...");
    const categoryMap: Record<string, string> = {};
    let categoryCount = 0;

    for (const cat of data.categories) {
      try {
        const doc = await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.categoriesCollectionId,
          ID.unique(),
          {
            name: cat.name,
            description: cat.description,
          }
        );
        categoryMap[cat.name] = doc.$id;
        categoryCount++;
        console.log(`   ✅ Created category: ${cat.name}`);
      } catch (error) {
        console.error(`   ❌ Failed to create category ${cat.name}:`, error);
        throw error;
      }
    }
    console.log(`✅ Created ${categoryCount} categories`);

    // Step 5: Create Customizations
    console.log("\n🎨 Creating customizations...");
    const customizationMap: Record<string, string> = {};
    let customizationCount = 0;

    for (const cus of data.customizations) {
      try {
        const doc = await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.customizationsCollectionId,
          ID.unique(),
          {
            name: cus.name,
            price: cus.price,
            type: cus.type,
          }
        );
        customizationMap[cus.name] = doc.$id;
        customizationCount++;
        console.log(
          `   ✅ Created customization: ${cus.name} (${cus.type}) - $${cus.price}`
        );
      } catch (error) {
        console.error(
          `   ❌ Failed to create customization ${cus.name}:`,
          error
        );
        throw error;
      }
    }
    console.log(`✅ Created ${customizationCount} customizations`);

    // Step 6: Create Menu Items with Images
    console.log("\n🍽️ Creating menu items...");
    const menuMap: Record<string, string> = {};
    let menuCount = 0;

    for (const [index, item] of data.menu.entries()) {
      try {
        console.log(
          `   🔄 Processing menu item ${index + 1}/${data.menu.length}: ${
            item.name
          }`
        );

        // Upload image first
        // const uploadedImageUrl = await uploadImageToStorage(
        //   item.image_url,
        //   item.name
        // );
        // Temporarily skip upload to test the rest of the seeding
        const uploadedImageUrl = item.image_url; // Use original URL directly

        // Create menu item document
        const doc = await databases.createDocument(
          appwriteConfig.databaseId,
          appwriteConfig.menuCollectionId,
          ID.unique(),
          {
            name: item.name,
            description: item.description,
            image_url: uploadedImageUrl,
            price: item.price,
            rating: item.rating,
            calories: item.calories,
            protein: item.protein,
            categories: categoryMap[item.category_name],
          }
        );

        menuMap[item.name] = doc.$id;
        menuCount++;
        console.log(`   ✅ Created menu item: ${item.name} ($${item.price})`);
      } catch (error) {
        console.error(`   ❌ Failed to create menu item ${item.name}:`, error);
        throw error;
      }
    }
    console.log(`✅ Created ${menuCount} menu items`);

    // Step 7: Create Menu-Customization relationships
    console.log("\n🔗 Creating menu-customization relationships...");
    let relationshipCount = 0;

    for (const item of data.menu) {
      if (item.customizations && item.customizations.length > 0) {
        console.log(`   🔄 Processing customizations for: ${item.name}`);

        for (const cusName of item.customizations) {
          try {
            if (!customizationMap[cusName]) {
              console.warn(
                `   ⚠️ Customization '${cusName}' not found, skipping...`
              );
              continue;
            }

            await databases.createDocument(
              appwriteConfig.databaseId,
              appwriteConfig.menuCustomizationsCollectionId,
              ID.unique(),
              {
                menu: menuMap[item.name],
                customizations: customizationMap[cusName],
              }
            );
            relationshipCount++;
            console.log(`      ✅ Linked ${item.name} with ${cusName}`);
          } catch (error) {
            console.error(
              `      ❌ Failed to create relationship ${item.name} -> ${cusName}:`,
              error
            );
            throw error;
          }
        }
      }
    }
    console.log(
      `✅ Created ${relationshipCount} menu-customization relationships`
    );

    // Success summary
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log("\n🎉 Seeding completed successfully!");
    console.log("📊 Summary:");
    console.log(`   Categories: ${categoryCount}`);
    console.log(`   Customizations: ${customizationCount}`);
    console.log(`   Menu Items: ${menuCount}`);
    console.log(`   Relationships: ${relationshipCount}`);
    console.log(`   Total Time: ${duration.toFixed(2)} seconds`);
    console.log("✅ Database is ready for use!");
  } catch (error) {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.error("\n💥 Seeding process failed!");
    console.error(`❌ Error occurred after ${duration.toFixed(2)} seconds`);
    console.error("📋 Error details:", error);

    // Provide helpful debugging information
    console.error("\n🔍 Debugging checklist:");
    console.error("   1. Check your appwriteConfig values");
    console.error("   2. Verify all collection IDs exist in Appwrite console");
    console.error("   3. Ensure your API key has proper permissions");
    console.error("   4. Check network connectivity");
    console.error("   5. Verify bucket permissions for file uploads");

    throw error;
  }
}

export default seed;
