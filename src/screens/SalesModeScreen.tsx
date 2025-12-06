import React, { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  Share,
  Animated,
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
import { VendorProduct } from "../types/marketplace";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
const { width, height } = Dimensions.get("window");

// Presentation card for full-screen product display
const PresentationCard = ({
  product,
  showPrice,
  customPrice,
  onNext,
  onPrev,
  isFirst,
  isLast,
}: {
  product: VendorProduct;
  showPrice: boolean;
  customPrice?: number;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const displayPrice = customPrice || product.pricing.retailPrice || 0;

  return (
    <View style={{ width, height: height - 180 }}>
      {/* Image Gallery */}
      <View className="flex-1 relative">
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => {
            const index = Math.round(e.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
        >
          {product.images.map((img, idx) => (
            <Image
              key={idx}
              source={{ uri: img }}
              style={{ width, height: "100%" }}
              resizeMode="cover"
            />
          ))}
        </ScrollView>

        {/* Image indicators */}
        {product.images.length > 1 && (
          <View className="absolute bottom-4 left-0 right-0 flex-row justify-center">
            {product.images.map((_, idx) => (
              <View
                key={idx}
                className="w-2 h-2 rounded-full mx-1"
                style={{
                  backgroundColor: idx === currentImageIndex ? "white" : "rgba(255,255,255,0.5)",
                }}
              />
            ))}
          </View>
        )}

        {/* Navigation arrows */}
        {!isFirst && (
          <Pressable
            className="absolute left-4 top-1/2 -mt-6 w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            onPress={onPrev}
          >
            <Ionicons name="chevron-back" size={28} color="white" />
          </Pressable>
        )}
        {!isLast && (
          <Pressable
            className="absolute right-4 top-1/2 -mt-6 w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            onPress={onNext}
          >
            <Ionicons name="chevron-forward" size={28} color="white" />
          </Pressable>
        )}

        {/* Badges */}
        <View className="absolute top-4 left-4 flex-row">
          {product.featured && (
            <View className="bg-amber-500 px-3 py-1 rounded-full mr-2">
              <Text style={{ fontSize: 12, fontWeight: "700", color: "white" }}>FEATURED</Text>
            </View>
          )}
          {product.samplesAvailable && (
            <View className="bg-green-500 px-3 py-1 rounded-full">
              <Text style={{ fontSize: 12, fontWeight: "700", color: "white" }}>SAMPLES</Text>
            </View>
          )}
        </View>
      </View>

      {/* Product Info Overlay */}
      <View
        className="absolute bottom-0 left-0 right-0 p-6"
        style={{
          backgroundColor: "rgba(0,0,0,0.85)",
        }}
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 mr-4">
            <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
              {product.vendorName}
            </Text>
            <Text style={{ fontSize: 28, fontWeight: "800", color: "white", marginTop: 4 }}>
              {product.name}
            </Text>
            <View className="flex-row items-center mt-2">
              {product.stoneType && (
                <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
                  <Text style={{ fontSize: 12, color: "white" }}>{product.stoneType}</Text>
                </View>
              )}
              {product.colorFamily && (
                <View className="bg-white/20 px-3 py-1 rounded-full mr-2">
                  <Text style={{ fontSize: 12, color: "white" }}>{product.colorFamily}</Text>
                </View>
              )}
              {product.finish && (
                <View className="bg-white/20 px-3 py-1 rounded-full">
                  <Text style={{ fontSize: 12, color: "white" }}>{product.finish}</Text>
                </View>
              )}
            </View>
          </View>

          {showPrice && (
            <View className="items-end">
              <Text style={{ fontSize: 32, fontWeight: "800", color: "#10b981" }}>
                ${displayPrice}
              </Text>
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                per {product.pricing.priceUnit}
              </Text>
            </View>
          )}
        </View>

        {product.description && (
          <Text
            style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", marginTop: 12, lineHeight: 20 }}
            numberOfLines={2}
          >
            {product.description}
          </Text>
        )}
      </View>
    </View>
  );
};

// Product selection modal
const ProductSelectorModal = ({
  visible,
  onClose,
  products,
  selectedIds,
  onToggleProduct,
}: {
  visible: boolean;
  onClose: () => void;
  products: VendorProduct[];
  selectedIds: string[];
  onToggleProduct: (id: string) => void;
}) => (
  <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
        <Pressable onPress={onClose}>
          <Text style={{ fontSize: 16, color: "#6b7280" }}>Cancel</Text>
        </Pressable>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#0f172a" }}>
          Select Products ({selectedIds.length})
        </Text>
        <Pressable onPress={onClose}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: colors.primary[600] }}>Done</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1 px-5 py-4">
        {products.map((product) => {
          const isSelected = selectedIds.includes(product.id);
          return (
            <Pressable
              key={product.id}
              className="flex-row items-center bg-white rounded-xl p-3 mb-3"
              style={{ borderWidth: 2, borderColor: isSelected ? colors.primary[600] : "transparent" }}
              onPress={() => onToggleProduct(product.id)}
            >
              <Image
                source={{ uri: product.images[0] }}
                style={{ width: 60, height: 60, borderRadius: 8 }}
              />
              <View className="flex-1 ml-3">
                <Text style={{ fontSize: 14, color: "#6b7280" }}>{product.vendorName}</Text>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#0f172a" }}>
                  {product.name}
                </Text>
                <View className="flex-row items-center mt-1">
                  {product.stoneType && (
                    <Text style={{ fontSize: 12, color: "#6b7280" }}>{product.stoneType}</Text>
                  )}
                  {product.colorFamily && (
                    <Text style={{ fontSize: 12, color: "#6b7280" }}> • {product.colorFamily}</Text>
                  )}
                </View>
              </View>
              <View
                className="w-6 h-6 rounded-full items-center justify-center"
                style={{
                  backgroundColor: isSelected ? colors.primary[600] : "#e5e7eb",
                }}
              >
                {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  </Modal>
);

export default function SalesModeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { getPublishedProducts, loadSampleData, products } = useVendorCatalogStore();

  const [showProductSelector, setShowProductSelector] = useState(true);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPrices, setShowPrices] = useState(true);
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // Load sample data if needed
  React.useEffect(() => {
    if (products.length === 0) {
      loadSampleData();
    }
  }, []);

  const publishedProducts = getPublishedProducts();
  const selectedProducts = publishedProducts.filter((p) => selectedProductIds.includes(p.id));

  const handleToggleProduct = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (currentIndex < selectedProducts.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSharePresentation = async () => {
    const productList = selectedProducts
      .map((p) => `• ${p.name} (${p.stoneType}) - $${p.pricing.retailPrice}/${p.pricing.priceUnit}`)
      .join("\n");

    try {
      await Share.share({
        message: `Material Selection from ${user?.businessName || user?.name}\n\n${productList}\n\nPowered by REMODELY.AI`,
        title: "Material Selection",
      });
    } catch (error) {
      Alert.alert("Error", "Could not share presentation");
    }
  };

  const startPresentation = () => {
    if (selectedProductIds.length === 0) {
      Alert.alert("No Products Selected", "Please select at least one product to present.");
      return;
    }
    setShowProductSelector(false);
    setIsPresentationMode(true);
    setCurrentIndex(0);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isPresentationMode ? "#000" : "#f8f9fa" }}>
      {!isPresentationMode ? (
        <>
          {/* Setup Mode Header */}
          <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
            <Pressable onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
            </Pressable>
            <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>
              Sales Mode
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView className="flex-1 px-5 py-4">
            {/* Instructions */}
            <View className="bg-blue-50 p-4 rounded-xl mb-6">
              <View className="flex-row items-center mb-2">
                <Ionicons name="information-circle" size={24} color="#3b82f6" />
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#1e40af", marginLeft: 8 }}>
                  Present to Customers
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: "#3b82f6", lineHeight: 20 }}>
                Select products from the catalog to create a full-screen presentation for your customers. Perfect for in-home consultations!
              </Text>
            </View>

            {/* Settings */}
            <View className="bg-white rounded-xl p-4 mb-6">
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 }}>
                Presentation Settings
              </Text>

              <Pressable
                className="flex-row items-center justify-between py-3 border-b border-gray-100"
                onPress={() => setShowPrices(!showPrices)}
              >
                <View className="flex-row items-center">
                  <Ionicons name="pricetag-outline" size={20} color="#6b7280" />
                  <Text style={{ fontSize: 16, color: "#0f172a", marginLeft: 12 }}>Show Prices</Text>
                </View>
                <View
                  className="w-12 h-7 rounded-full justify-center px-1"
                  style={{ backgroundColor: showPrices ? colors.primary[600] : "#e5e7eb" }}
                >
                  <View
                    className="w-5 h-5 rounded-full bg-white"
                    style={{
                      alignSelf: showPrices ? "flex-end" : "flex-start",
                    }}
                  />
                </View>
              </Pressable>

              <Pressable
                className="flex-row items-center justify-between py-3"
                onPress={() => setShowProductSelector(true)}
              >
                <View className="flex-row items-center">
                  <Ionicons name="grid-outline" size={20} color="#6b7280" />
                  <Text style={{ fontSize: 16, color: "#0f172a", marginLeft: 12 }}>
                    Selected Products
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <View className="bg-blue-100 px-3 py-1 rounded-full mr-2">
                    <Text style={{ fontSize: 14, fontWeight: "600", color: colors.primary[600] }}>
                      {selectedProductIds.length}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                </View>
              </Pressable>
            </View>

            {/* Selected Products Preview */}
            {selectedProducts.length > 0 && (
              <View className="mb-6">
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 }}>
                  Presentation Order
                </Text>
                {selectedProducts.map((product, idx) => (
                  <View
                    key={product.id}
                    className="flex-row items-center bg-white rounded-xl p-3 mb-2"
                  >
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: colors.primary[100] }}
                    >
                      <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary[600] }}>
                        {idx + 1}
                      </Text>
                    </View>
                    <Image
                      source={{ uri: product.images[0] }}
                      style={{ width: 50, height: 50, borderRadius: 8 }}
                    />
                    <View className="flex-1 ml-3">
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#0f172a" }}>
                        {product.name}
                      </Text>
                      <Text style={{ fontSize: 12, color: "#6b7280" }}>
                        {product.stoneType} • {product.vendorName}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Start Presentation Button */}
          <View className="px-5 py-4 bg-white border-t border-gray-200">
            <Pressable
              className="py-4 rounded-xl items-center"
              style={{
                backgroundColor: selectedProductIds.length > 0 ? colors.accent[500] : "#e5e7eb",
              }}
              onPress={startPresentation}
              disabled={selectedProductIds.length === 0}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name="play"
                  size={20}
                  color={selectedProductIds.length > 0 ? "white" : "#9ca3af"}
                />
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: selectedProductIds.length > 0 ? "white" : "#9ca3af",
                    marginLeft: 8,
                  }}
                >
                  Start Presentation
                </Text>
              </View>
            </Pressable>
          </View>
        </>
      ) : (
        <>
          {/* Presentation Mode */}
          <View style={{ flex: 1 }}>
            {selectedProducts[currentIndex] && (
              <PresentationCard
                product={selectedProducts[currentIndex]}
                showPrice={showPrices}
                onNext={handleNext}
                onPrev={handlePrev}
                isFirst={currentIndex === 0}
                isLast={currentIndex === selectedProducts.length - 1}
              />
            )}
          </View>

          {/* Presentation Controls */}
          <View
            className="flex-row items-center justify-between px-5 py-4"
            style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
          >
            <Pressable
              onPress={() => {
                setIsPresentationMode(false);
              }}
            >
              <Ionicons name="close" size={28} color="white" />
            </Pressable>

            <View className="flex-row items-center">
              {selectedProducts.map((_, idx) => (
                <Pressable
                  key={idx}
                  className="mx-1"
                  onPress={() => setCurrentIndex(idx)}
                >
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: idx === currentIndex ? colors.accent[500] : "rgba(255,255,255,0.3)",
                    }}
                  />
                </Pressable>
              ))}
            </View>

            <Pressable onPress={handleSharePresentation}>
              <Ionicons name="share-outline" size={28} color="white" />
            </Pressable>
          </View>
        </>
      )}

      {/* Product Selector Modal */}
      <ProductSelectorModal
        visible={showProductSelector && !isPresentationMode}
        onClose={() => setShowProductSelector(false)}
        products={publishedProducts}
        selectedIds={selectedProductIds}
        onToggleProduct={handleToggleProduct}
      />
    </SafeAreaView>
  );
}
