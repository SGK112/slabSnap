import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Modal,
  Alert,
  Dimensions,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import * as Haptics from "expo-haptics";
import { useVendorCatalogStore } from "../state/vendorCatalogStore";
import { useAuthStore } from "../state/authStore";
import { VendorProduct, MaterialCategory, StoneType } from "../types/marketplace";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { width } = Dimensions.get("window");

// Filter options
const stoneTypes: StoneType[] = ["Granite", "Marble", "Quartz", "Quartzite", "Soapstone", "Porcelain", "Other"];
const colorFamilies = ["White", "Black", "Grey", "Beige", "Brown", "Blue", "Green", "Gold", "Nickel", "Bronze", "Stainless", "Multi"];
const productCategories = ["All", "Kitchen", "Bath", "Flooring", "Stone & Tile", "Lighting & Electrical", "Plumbing"];

// Product Card Component
const ProductCard = ({
  product,
  onPress,
  isPro,
}: {
  product: VendorProduct;
  onPress: () => void;
  isPro: boolean;
}) => {
  const displayPrice = isPro && product.pricing.proPrice
    ? product.pricing.proPrice
    : product.pricing.retailPrice;

  const availabilityColors: Record<string, { bg: string; text: string }> = {
    in_stock: { bg: "#dcfce7", text: "#10b981" },
    low_stock: { bg: "#fef3c7", text: "#f59e0b" },
    out_of_stock: { bg: "#fee2e2", text: "#ef4444" },
    special_order: { bg: "#dbeafe", text: "#3b82f6" },
  };

  const availability = availabilityColors[product.availability] || availabilityColors.in_stock;

  return (
    <Pressable
      className="bg-white rounded-xl mb-3 overflow-hidden"
      style={{ width: (width - 48) / 2 }}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      {/* Image */}
      <View className="relative">
        <Image
          source={{ uri: product.images[0] || "https://via.placeholder.com/200" }}
          style={{ width: "100%", height: 140 }}
          resizeMode="cover"
        />
        {/* Badges */}
        <View className="absolute top-2 left-2 flex-row">
          {product.featured && (
            <View className="bg-amber-500 px-2 py-1 rounded mr-1">
              <Text style={{ fontSize: 10, fontWeight: "700", color: "white" }}>FEATURED</Text>
            </View>
          )}
          {product.newArrival && (
            <View className="bg-blue-500 px-2 py-1 rounded">
              <Text style={{ fontSize: 10, fontWeight: "700", color: "white" }}>NEW</Text>
            </View>
          )}
        </View>
        {product.onSale && (
          <View className="absolute top-2 right-2 bg-red-500 px-2 py-1 rounded">
            <Text style={{ fontSize: 10, fontWeight: "700", color: "white" }}>SALE</Text>
          </View>
        )}
      </View>

      {/* Content */}
      <View className="p-3">
        <Text style={{ fontSize: 12, color: "#6b7280" }} numberOfLines={1}>
          {product.vendorName}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f172a", marginTop: 2 }} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Stone type & Color */}
        <View className="flex-row items-center mt-2">
          {product.stoneType && (
            <View className="bg-gray-100 px-2 py-0.5 rounded mr-1">
              <Text style={{ fontSize: 10, color: "#6b7280" }}>{product.stoneType}</Text>
            </View>
          )}
          {product.colorFamily && (
            <View className="bg-gray-100 px-2 py-0.5 rounded">
              <Text style={{ fontSize: 10, color: "#6b7280" }}>{product.colorFamily}</Text>
            </View>
          )}
        </View>

        {/* Pricing */}
        <View className="flex-row items-end justify-between mt-3">
          <View>
            {product.onSale && product.salePrice ? (
              <View className="flex-row items-center">
                <Text style={{ fontSize: 16, fontWeight: "700", color: "#ef4444" }}>
                  ${product.salePrice}
                </Text>
                <Text style={{ fontSize: 12, color: "#9ca3af", textDecorationLine: "line-through", marginLeft: 4 }}>
                  ${displayPrice}
                </Text>
              </View>
            ) : (
              <Text style={{ fontSize: 16, fontWeight: "700", color: colors.primary[600] }}>
                ${displayPrice}
                <Text style={{ fontSize: 12, fontWeight: "400", color: "#6b7280" }}>
                  /{product.pricing.priceUnit}
                </Text>
              </Text>
            )}
            {isPro && product.pricing.proPrice && (
              <Text style={{ fontSize: 10, color: "#10b981", fontWeight: "600" }}>PRO PRICE</Text>
            )}
          </View>
          <View
            className="px-2 py-1 rounded"
            style={{ backgroundColor: availability.bg }}
          >
            <Text style={{ fontSize: 10, fontWeight: "600", color: availability.text }}>
              {product.availability.replace("_", " ").toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

// Product Detail Modal
const ProductDetailModal = ({
  product,
  visible,
  onClose,
  isPro,
  onRequestSample,
  onAddToQuote,
}: {
  product: VendorProduct | null;
  visible: boolean;
  onClose: () => void;
  isPro: boolean;
  onRequestSample: () => void;
  onAddToQuote: () => void;
}) => {
  if (!product) return null;

  const displayPrice = isPro && product.pricing.proPrice
    ? product.pricing.proPrice
    : product.pricing.retailPrice;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={28} color="#6b7280" />
          </Pressable>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#0f172a" }}>
            Product Details
          </Text>
          <Pressable onPress={() => {/* Share */}}>
            <Ionicons name="share-outline" size={24} color="#6b7280" />
          </Pressable>
        </View>

        <ScrollView className="flex-1">
          {/* Image Gallery */}
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {product.images.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: img }}
                style={{ width, height: 300 }}
                resizeMode="cover"
              />
            ))}
          </ScrollView>

          {/* Product Info */}
          <View className="px-5 py-4 bg-white">
            <Text style={{ fontSize: 14, color: colors.primary[600], fontWeight: "600" }}>
              {product.vendorName}
            </Text>
            <Text style={{ fontSize: 24, fontWeight: "700", color: "#0f172a", marginTop: 4 }}>
              {product.name}
            </Text>
            {product.brand && (
              <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 2 }}>
                by {product.brand}
              </Text>
            )}

            {/* Tags */}
            <View className="flex-row flex-wrap mt-3">
              {product.stoneType && (
                <View className="bg-gray-100 px-3 py-1 rounded-full mr-2 mb-2">
                  <Text style={{ fontSize: 12, color: "#374151" }}>{product.stoneType}</Text>
                </View>
              )}
              {product.colorFamily && (
                <View className="bg-gray-100 px-3 py-1 rounded-full mr-2 mb-2">
                  <Text style={{ fontSize: 12, color: "#374151" }}>{product.colorFamily}</Text>
                </View>
              )}
              {product.finish && (
                <View className="bg-gray-100 px-3 py-1 rounded-full mr-2 mb-2">
                  <Text style={{ fontSize: 12, color: "#374151" }}>{product.finish}</Text>
                </View>
              )}
              {product.origin && (
                <View className="bg-gray-100 px-3 py-1 rounded-full mr-2 mb-2">
                  <Text style={{ fontSize: 12, color: "#374151" }}>{product.origin}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Pricing Section */}
          <View className="px-5 py-4 bg-white mt-3">
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 }}>
              Pricing
            </Text>

            <View className="flex-row items-center justify-between py-3 border-b border-gray-100">
              <View>
                <Text style={{ fontSize: 32, fontWeight: "800", color: colors.primary[600] }}>
                  ${displayPrice}
                  <Text style={{ fontSize: 16, fontWeight: "400", color: "#6b7280" }}>
                    /{product.pricing.priceUnit}
                  </Text>
                </Text>
                {isPro && product.pricing.proPrice && (
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                    <Text style={{ fontSize: 12, color: "#10b981", marginLeft: 4, fontWeight: "600" }}>
                      Pro Pricing Applied
                    </Text>
                  </View>
                )}
              </View>

              {product.onSale && (
                <View className="bg-red-100 px-3 py-2 rounded-lg">
                  <Text style={{ fontSize: 12, color: "#ef4444", fontWeight: "700" }}>
                    SAVE ${((displayPrice || 0) - (product.salePrice || 0)).toFixed(0)}/sqft
                  </Text>
                </View>
              )}
            </View>

            {/* Stock Info */}
            <View className="flex-row items-center justify-between py-3">
              <Text style={{ fontSize: 14, color: "#6b7280" }}>Availability</Text>
              <View className="flex-row items-center">
                <View
                  className="w-2 h-2 rounded-full mr-2"
                  style={{
                    backgroundColor:
                      product.availability === "in_stock" ? "#10b981" :
                      product.availability === "low_stock" ? "#f59e0b" : "#ef4444"
                  }}
                />
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }}>
                  {product.availability === "in_stock" ? "In Stock" :
                   product.availability === "low_stock" ? "Low Stock" :
                   product.availability === "out_of_stock" ? "Out of Stock" : "Special Order"}
                  {product.stockQty && ` (${product.stockQty} slabs)`}
                </Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {product.description && (
            <View className="px-5 py-4 bg-white mt-3">
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
                Description
              </Text>
              <Text style={{ fontSize: 14, color: "#6b7280", lineHeight: 22 }}>
                {product.description}
              </Text>
            </View>
          )}

          {/* Dimensions */}
          {product.dimensions && (
            <View className="px-5 py-4 bg-white mt-3">
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
                Slab Dimensions
              </Text>
              <View className="flex-row">
                <View className="flex-1 items-center py-3 bg-gray-50 rounded-lg mr-2">
                  <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>
                    {product.dimensions.length}"
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>Length</Text>
                </View>
                <View className="flex-1 items-center py-3 bg-gray-50 rounded-lg mr-2">
                  <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>
                    {product.dimensions.width}"
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>Width</Text>
                </View>
                <View className="flex-1 items-center py-3 bg-gray-50 rounded-lg">
                  <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>
                    {product.dimensions.thickness}cm
                  </Text>
                  <Text style={{ fontSize: 12, color: "#6b7280" }}>Thickness</Text>
                </View>
              </View>
            </View>
          )}

          {/* Alternate Names */}
          {product.alternateNames && product.alternateNames.length > 0 && (
            <View className="px-5 py-4 bg-white mt-3 mb-24">
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
                Also Known As
              </Text>
              <View className="flex-row flex-wrap">
                {product.alternateNames.map((name, idx) => (
                  <View key={idx} className="bg-blue-50 px-3 py-1 rounded-full mr-2 mb-2">
                    <Text style={{ fontSize: 12, color: "#3b82f6" }}>{name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Actions */}
        <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4">
          <View className="flex-row">
            {product.samplesAvailable && (
              <Pressable
                className="flex-1 mr-2 py-4 rounded-xl border-2 items-center"
                style={{ borderColor: colors.primary[600] }}
                onPress={onRequestSample}
              >
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary[600] }}>
                  Request Sample
                </Text>
              </Pressable>
            )}
            <Pressable
              className="flex-1 py-4 rounded-xl items-center"
              style={{ backgroundColor: colors.accent[500] }}
              onPress={onAddToQuote}
            >
              <Text style={{ fontSize: 14, fontWeight: "700", color: "white" }}>
                Add to Quote
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default function MaterialCatalogScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { products, catalogs, getPublishedProducts, loadSampleData } = useVendorCatalogStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStoneType, setSelectedStoneType] = useState<StoneType | "All">("All");
  const [selectedColor, setSelectedColor] = useState<string>("All");
  const [selectedVendor, setSelectedVendor] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<VendorProduct | null>(null);

  const isPro = user && ["vendor", "fabricator", "contractor", "designer", "supplier", "installer"].includes(user.userType);

  useEffect(() => {
    if (products.length === 0) {
      loadSampleData();
    }
  }, []);

  const publishedProducts = getPublishedProducts();

  // Filter products
  const filteredProducts = useMemo(() => {
    return publishedProducts.filter((p) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          p.name.toLowerCase().includes(q) ||
          p.brand?.toLowerCase().includes(q) ||
          p.vendorName.toLowerCase().includes(q) ||
          p.colorFamily?.toLowerCase().includes(q) ||
          p.tags?.some(t => t.toLowerCase().includes(q)) ||
          p.alternateNames?.some(n => n.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }

      // Category
      if (selectedCategory !== "All" && p.category !== selectedCategory) return false;

      // Stone type (only for Stone & Tile category)
      if (selectedStoneType !== "All" && p.stoneType !== selectedStoneType) return false;

      // Color
      if (selectedColor !== "All" && p.colorFamily !== selectedColor) return false;

      // Vendor
      if (selectedVendor !== "All" && p.vendorId !== selectedVendor) return false;

      return true;
    });
  }, [publishedProducts, searchQuery, selectedCategory, selectedStoneType, selectedColor, selectedVendor]);

  const handleRequestSample = () => {
    Alert.alert(
      "Sample Requested",
      `We'll notify ${selectedProduct?.vendorName} about your sample request.`,
      [{ text: "OK", onPress: () => setSelectedProduct(null) }]
    );
  };

  const handleAddToQuote = () => {
    Alert.alert(
      "Added to Quote",
      `${selectedProduct?.name} has been added to your current quote.`,
      [{ text: "OK", onPress: () => setSelectedProduct(null) }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <View className="px-5 py-4 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="mr-4">
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </Pressable>
          <View className="flex-1">
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#0f172a" }}>
              Material Catalog
            </Text>
            <Text style={{ fontSize: 12, color: "#6b7280" }}>
              {filteredProducts.length} products from {catalogs.length} vendors
            </Text>
          </View>
          {isPro && (
            <View className="bg-green-100 px-3 py-1 rounded-full">
              <Text style={{ fontSize: 12, fontWeight: "600", color: "#10b981" }}>PRO</Text>
            </View>
          )}
        </View>

        {/* Search */}
        <View className="flex-row items-center mt-4">
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-3 mr-2">
            <Ionicons name="search" size={20} color="#6b7280" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search materials..."
              className="flex-1 ml-2"
              style={{ fontSize: 16 }}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </Pressable>
            )}
          </View>
          <Pressable
            className="p-3 rounded-xl"
            style={{ backgroundColor: showFilters ? colors.primary[600] : "#f3f4f6" }}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Ionicons name="options" size={24} color={showFilters ? "white" : "#6b7280"} />
          </Pressable>
        </View>

        {/* Filters */}
        {showFilters && (
          <View className="mt-4">
            {/* Category */}
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 8 }}>
              Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              {productCategories.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  className="mr-2 px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: selectedCategory === cat ? colors.primary[600] : "white",
                    borderWidth: 1,
                    borderColor: selectedCategory === cat ? colors.primary[600] : "#e5e7eb",
                  }}
                >
                  <Text style={{ fontSize: 14, color: selectedCategory === cat ? "white" : "#374151" }}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Stone Type - only show for Stone & Tile */}
            {(selectedCategory === "All" || selectedCategory === "Stone & Tile") && (
              <>
                <Text style={{ fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 8 }}>
                  Stone Type
                </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
              <Pressable
                onPress={() => setSelectedStoneType("All")}
                className="mr-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: selectedStoneType === "All" ? colors.primary[600] : "white",
                  borderWidth: 1,
                  borderColor: selectedStoneType === "All" ? colors.primary[600] : "#e5e7eb",
                }}
              >
                <Text style={{ fontSize: 14, color: selectedStoneType === "All" ? "white" : "#374151" }}>
                  All Types
                </Text>
              </Pressable>
              {stoneTypes.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setSelectedStoneType(type)}
                  className="mr-2 px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: selectedStoneType === type ? colors.primary[600] : "white",
                    borderWidth: 1,
                    borderColor: selectedStoneType === type ? colors.primary[600] : "#e5e7eb",
                  }}
                >
                  <Text style={{ fontSize: 14, color: selectedStoneType === type ? "white" : "#374151" }}>
                    {type}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
              </>
            )}

            {/* Color Family */}
            <Text style={{ fontSize: 12, fontWeight: "600", color: "#6b7280", marginBottom: 8 }}>
              Color
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <Pressable
                onPress={() => setSelectedColor("All")}
                className="mr-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: selectedColor === "All" ? colors.primary[600] : "white",
                  borderWidth: 1,
                  borderColor: selectedColor === "All" ? colors.primary[600] : "#e5e7eb",
                }}
              >
                <Text style={{ fontSize: 14, color: selectedColor === "All" ? "white" : "#374151" }}>
                  All Colors
                </Text>
              </Pressable>
              {colorFamilies.map((color) => (
                <Pressable
                  key={color}
                  onPress={() => setSelectedColor(color)}
                  className="mr-2 px-4 py-2 rounded-full"
                  style={{
                    backgroundColor: selectedColor === color ? colors.primary[600] : "white",
                    borderWidth: 1,
                    borderColor: selectedColor === color ? colors.primary[600] : "#e5e7eb",
                  }}
                >
                  <Text style={{ fontSize: 14, color: selectedColor === color ? "white" : "#374151" }}>
                    {color}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ padding: 16 }}
          columnWrapperStyle={{ justifyContent: "space-between" }}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              isPro={isPro || false}
              onPress={() => setSelectedProduct(item)}
            />
          )}
        />
      ) : (
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="cube-outline" size={64} color="#d1d5db" />
          <Text style={{ fontSize: 18, fontWeight: "600", color: "#374151", marginTop: 16, textAlign: "center" }}>
            No products found
          </Text>
          <Text style={{ fontSize: 14, color: "#6b7280", marginTop: 8, textAlign: "center" }}>
            Try adjusting your search or filters
          </Text>
          <Pressable
            className="mt-6 px-6 py-3 rounded-xl"
            style={{ backgroundColor: colors.primary[600] }}
            onPress={() => {
              setSearchQuery("");
              setSelectedCategory("All");
              setSelectedStoneType("All");
              setSelectedColor("All");
              setSelectedVendor("All");
            }}
          >
            <Text style={{ fontSize: 14, fontWeight: "600", color: "white" }}>Clear Filters</Text>
          </Pressable>
        </View>
      )}

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        visible={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        isPro={isPro || false}
        onRequestSample={handleRequestSample}
        onAddToQuote={handleAddToQuote}
      />
    </SafeAreaView>
  );
}
