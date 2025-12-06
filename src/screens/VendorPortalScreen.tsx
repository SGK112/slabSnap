import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Alert,
  Image,
  FlatList,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { useAuthStore } from "../state/authStore";
import { useVendorCatalogStore } from "../state/vendorCatalogStore";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import {
  VendorProduct,
  VendorCatalog,
  MaterialCategory,
  StoneType,
  ProductAvailability,
  PricingVisibility,
  CATEGORY_CONFIG,
} from "../types/marketplace";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Quick Stats Card
const StatCard = ({
  icon,
  value,
  label,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
}) => (
  <View className="flex-1 bg-white rounded-xl p-4 mx-1">
    <View
      className="w-10 h-10 rounded-full items-center justify-center mb-2"
      style={{ backgroundColor: color + "20" }}
    >
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <Text style={{ fontSize: 24, fontWeight: "800", color: "#0f172a" }}>{value}</Text>
    <Text style={{ fontSize: 12, color: "#6b7280" }}>{label}</Text>
  </View>
);

// Product Card for vendor's catalog
const ProductCard = ({
  product,
  onEdit,
  onTogglePublish,
}: {
  product: VendorProduct;
  onEdit: () => void;
  onTogglePublish: () => void;
}) => {
  const availabilityColors: Record<ProductAvailability, { bg: string; text: string }> = {
    in_stock: { bg: "#dcfce7", text: "#10b981" },
    low_stock: { bg: "#fef3c7", text: "#f59e0b" },
    out_of_stock: { bg: "#fee2e2", text: "#ef4444" },
    special_order: { bg: "#e0e7ff", text: "#6366f1" },
    discontinued: { bg: "#f3f4f6", text: "#6b7280" },
  };

  const statusColors = availabilityColors[product.availability];

  return (
    <Pressable
      className="bg-white rounded-xl mb-3 overflow-hidden"
      style={{ shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}
      onPress={onEdit}
    >
      <View className="flex-row">
        {/* Image */}
        {product.images[0] ? (
          <Image
            source={{ uri: product.images[0] }}
            className="w-24 h-24"
            resizeMode="cover"
          />
        ) : (
          <View className="w-24 h-24 bg-gray-100 items-center justify-center">
            <Ionicons name="image-outline" size={32} color="#9ca3af" />
          </View>
        )}

        {/* Info */}
        <View className="flex-1 p-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 mr-2">
              <Text style={{ fontSize: 15, fontWeight: "600", color: "#0f172a" }} numberOfLines={1}>
                {product.name}
              </Text>
              {product.sku && (
                <Text style={{ fontSize: 11, color: "#9ca3af", marginTop: 1 }}>
                  SKU: {product.sku}
                </Text>
              )}
            </View>
            <View
              className="px-2 py-1 rounded"
              style={{ backgroundColor: product.status === "published" ? "#dcfce7" : "#f3f4f6" }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "600",
                  color: product.status === "published" ? "#10b981" : "#6b7280",
                }}
              >
                {product.status.toUpperCase()}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center mt-2">
            <View
              className="px-2 py-0.5 rounded mr-2"
              style={{ backgroundColor: statusColors.bg }}
            >
              <Text style={{ fontSize: 10, fontWeight: "500", color: statusColors.text }}>
                {product.availability.replace("_", " ")}
              </Text>
            </View>
            {product.stockQty !== undefined && (
              <Text style={{ fontSize: 11, color: "#6b7280" }}>
                {product.stockQty} in stock
              </Text>
            )}
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <View>
              {product.pricing.proPrice && (
                <Text style={{ fontSize: 14, fontWeight: "700", color: colors.primary[600] }}>
                  ${product.pricing.proPrice}/{product.pricing.priceUnit}
                </Text>
              )}
              {product.pricing.retailPrice && product.pricing.retailPrice !== product.pricing.proPrice && (
                <Text style={{ fontSize: 11, color: "#9ca3af" }}>
                  Retail: ${product.pricing.retailPrice}
                </Text>
              )}
            </View>
            <View className="flex-row">
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onTogglePublish();
                }}
                className="p-2"
              >
                <Ionicons
                  name={product.status === "published" ? "eye" : "eye-off"}
                  size={20}
                  color={product.status === "published" ? colors.primary[600] : "#9ca3af"}
                />
              </Pressable>
              <Pressable onPress={onEdit} className="p-2">
                <Ionicons name="create-outline" size={20} color="#6b7280" />
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

// Add/Edit Product Modal
const ProductFormModal = ({
  visible,
  onClose,
  product,
  onSave,
  vendorId,
  vendorName,
}: {
  visible: boolean;
  onClose: () => void;
  product?: VendorProduct;
  onSave: (product: VendorProduct) => void;
  vendorId: string;
  vendorName: string;
}) => {
  const [name, setName] = useState(product?.name || "");
  const [sku, setSku] = useState(product?.sku || "");
  const [description, setDescription] = useState(product?.description || "");
  const [category, setCategory] = useState<MaterialCategory>(product?.category || "Stone & Tile");
  const [brand, setBrand] = useState(product?.brand || "");
  const [stoneType, setStoneType] = useState<StoneType | undefined>(product?.stoneType);
  const [colorFamily, setColorFamily] = useState(product?.colorFamily || "");
  const [retailPrice, setRetailPrice] = useState(product?.pricing.retailPrice?.toString() || "");
  const [proPrice, setProPrice] = useState(product?.pricing.proPrice?.toString() || "");
  const [availability, setAvailability] = useState<ProductAvailability>(product?.availability || "in_stock");
  const [stockQty, setStockQty] = useState(product?.stockQty?.toString() || "");
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [samplesAvailable, setSamplesAvailable] = useState(product?.samplesAvailable || false);
  const [featured, setFeatured] = useState(product?.featured || false);

  const stoneTypes: StoneType[] = ["Granite", "Marble", "Quartz", "Quartzite", "Soapstone", "Porcelain", "Other"];
  const colorFamilies = ["White", "Black", "Grey", "Brown", "Beige", "Blue", "Green", "Gold", "Multi"];
  const availabilities: ProductAvailability[] = ["in_stock", "low_stock", "out_of_stock", "special_order"];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImages([...images, ...result.assets.map((a) => a.uri)]);
    }
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert("Missing Info", "Product name is required");
      return;
    }

    const newProduct: VendorProduct = {
      id: product?.id || `prod-${Date.now()}`,
      vendorId,
      vendorName,
      sku: sku.trim() || undefined,
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      brand: brand.trim() || undefined,
      stoneType,
      colorFamily: colorFamily || undefined,
      pricing: {
        retailPrice: parseFloat(retailPrice) || undefined,
        proPrice: parseFloat(proPrice) || undefined,
        priceUnit: "sq_ft",
      },
      pricingVisibility: proPrice && !retailPrice ? "pro_only" : "public",
      availability,
      stockQty: parseInt(stockQty) || undefined,
      images,
      samplesAvailable,
      featured,
      tags: [colorFamily, stoneType, brand].filter(Boolean) as string[],
      createdAt: product?.createdAt || Date.now(),
      updatedAt: Date.now(),
      status: product?.status || "draft",
    };

    onSave(newProduct);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
          <Pressable onPress={onClose}>
            <Text style={{ fontSize: 16, color: "#6b7280" }}>Cancel</Text>
          </Pressable>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#0f172a" }}>
            {product ? "Edit Product" : "Add Product"}
          </Text>
          <Pressable onPress={handleSave}>
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.primary[600] }}>Save</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5 py-4" showsVerticalScrollIndicator={false}>
          {/* Images */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
            Product Images
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {images.map((img, idx) => (
              <View key={idx} className="mr-2 relative">
                <Image source={{ uri: img }} className="w-20 h-20 rounded-lg" />
                <Pressable
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full items-center justify-center"
                  onPress={() => setImages(images.filter((_, i) => i !== idx))}
                >
                  <Ionicons name="close" size={14} color="white" />
                </Pressable>
              </View>
            ))}
            <Pressable
              className="w-20 h-20 bg-gray-100 rounded-lg items-center justify-center border-2 border-dashed border-gray-300"
              onPress={pickImage}
            >
              <Ionicons name="camera" size={24} color="#9ca3af" />
              <Text style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>Add</Text>
            </Pressable>
          </ScrollView>

          {/* Basic Info */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
            Product Name *
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g., Calacatta Gold"
            className="bg-white rounded-xl px-4 py-3 mb-4"
            style={{ fontSize: 16 }}
          />

          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
                SKU
              </Text>
              <TextInput
                value={sku}
                onChangeText={setSku}
                placeholder="ABC-123"
                className="bg-white rounded-xl px-4 py-3"
                style={{ fontSize: 16 }}
              />
            </View>
            <View className="flex-1 ml-2">
              <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
                Brand
              </Text>
              <TextInput
                value={brand}
                onChangeText={setBrand}
                placeholder="MSI, Arizona Tile..."
                className="bg-white rounded-xl px-4 py-3"
                style={{ fontSize: 16 }}
              />
            </View>
          </View>

          {/* Stone Type */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
            Stone Type
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {stoneTypes.map((type) => (
              <Pressable
                key={type}
                onPress={() => setStoneType(type)}
                className="mr-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: stoneType === type ? colors.primary[600] : "white",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: stoneType === type ? "white" : "#374151",
                  }}
                >
                  {type}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Color Family */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
            Color Family
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
            {colorFamilies.map((color) => (
              <Pressable
                key={color}
                onPress={() => setColorFamily(color)}
                className="mr-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: colorFamily === color ? colors.primary[600] : "white",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: colorFamily === color ? "white" : "#374151",
                  }}
                >
                  {color}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Pricing */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
            Pricing (per sq ft)
          </Text>
          <View className="flex-row mb-4">
            <View className="flex-1 mr-2">
              <View className="bg-white rounded-xl px-4 py-3 flex-row items-center">
                <Text style={{ color: "#6b7280", marginRight: 4 }}>$</Text>
                <TextInput
                  value={proPrice}
                  onChangeText={setProPrice}
                  placeholder="Pro Price"
                  keyboardType="numeric"
                  className="flex-1"
                  style={{ fontSize: 16 }}
                />
              </View>
              <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 4, marginLeft: 4 }}>
                Contractor price
              </Text>
            </View>
            <View className="flex-1 ml-2">
              <View className="bg-white rounded-xl px-4 py-3 flex-row items-center">
                <Text style={{ color: "#6b7280", marginRight: 4 }}>$</Text>
                <TextInput
                  value={retailPrice}
                  onChangeText={setRetailPrice}
                  placeholder="Retail Price"
                  keyboardType="numeric"
                  className="flex-1"
                  style={{ fontSize: 16 }}
                />
              </View>
              <Text style={{ fontSize: 11, color: "#6b7280", marginTop: 4, marginLeft: 4 }}>
                Public price (optional)
              </Text>
            </View>
          </View>

          {/* Availability */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
            Availability
          </Text>
          <View className="flex-row flex-wrap mb-4">
            {availabilities.map((avail) => (
              <Pressable
                key={avail}
                onPress={() => setAvailability(avail)}
                className="mr-2 mb-2 px-4 py-2 rounded-full"
                style={{
                  backgroundColor: availability === avail ? colors.primary[600] : "white",
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "500",
                    color: availability === avail ? "white" : "#374151",
                  }}
                >
                  {avail.replace("_", " ")}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Stock Quantity */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
            Stock Quantity
          </Text>
          <TextInput
            value={stockQty}
            onChangeText={setStockQty}
            placeholder="Number of slabs/units"
            keyboardType="numeric"
            className="bg-white rounded-xl px-4 py-3 mb-4"
            style={{ fontSize: 16 }}
          />

          {/* Description */}
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 }}>
            Description
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the product..."
            multiline
            numberOfLines={3}
            className="bg-white rounded-xl px-4 py-3 mb-4"
            style={{ fontSize: 16, minHeight: 80 }}
          />

          {/* Toggles */}
          <View className="bg-white rounded-xl p-4 mb-8">
            <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
              <View>
                <Text style={{ fontSize: 15, fontWeight: "500", color: "#0f172a" }}>
                  Samples Available
                </Text>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                  Contractors can request samples
                </Text>
              </View>
              <Switch
                value={samplesAvailable}
                onValueChange={setSamplesAvailable}
                trackColor={{ true: colors.primary[600] }}
              />
            </View>
            <View className="flex-row items-center justify-between py-2">
              <View>
                <Text style={{ fontSize: 15, fontWeight: "500", color: "#0f172a" }}>
                  Featured Product
                </Text>
                <Text style={{ fontSize: 12, color: "#6b7280" }}>
                  Show in featured section
                </Text>
              </View>
              <Switch
                value={featured}
                onValueChange={setFeatured}
                trackColor={{ true: colors.primary[600] }}
              />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Lead Card
const LeadCard = ({
  lead,
  onPress,
}: {
  lead: any;
  onPress: () => void;
}) => (
  <Pressable className="bg-white rounded-xl p-4 mb-3" onPress={onPress}>
    <View className="flex-row items-start justify-between">
      <View className="flex-1">
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#0f172a" }}>
          {lead.customerName}
        </Text>
        <Text style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
          {lead.requestType === "quote" ? "Quote Request" : "Sample Request"}
        </Text>
        {lead.productName && (
          <Text style={{ fontSize: 12, color: colors.primary[600], marginTop: 4 }}>
            {lead.productName}
          </Text>
        )}
      </View>
      <View
        className="px-2 py-1 rounded"
        style={{ backgroundColor: lead.status === "new" ? "#dbeafe" : "#f3f4f6" }}
      >
        <Text
          style={{
            fontSize: 10,
            fontWeight: "600",
            color: lead.status === "new" ? "#2563eb" : "#6b7280",
          }}
        >
          {lead.status.toUpperCase()}
        </Text>
      </View>
    </View>
  </Pressable>
);

export default function VendorPortalScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const {
    catalogs,
    products,
    leads,
    getProductsByVendor,
    getLeadsByVendor,
    getNewLeadsCount,
    addProduct,
    updateProduct,
    publishProduct,
    archiveProduct,
    loadSampleData,
    createCatalog,
    getCatalogByVendorId,
  } = useVendorCatalogStore();

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VendorProduct | undefined>();
  const [activeTab, setActiveTab] = useState<"products" | "leads">("products");
  const [searchQuery, setSearchQuery] = useState("");

  // Get or create vendor catalog
  const vendorId = user?.id || "demo-vendor";
  const vendorName = user?.businessName || user?.name || "Your Store";

  useEffect(() => {
    // Load sample data if empty
    if (catalogs.length === 0) {
      loadSampleData();
    }

    // Create catalog for current user if doesn't exist
    if (!getCatalogByVendorId(vendorId)) {
      createCatalog({
        vendorId,
        vendorName,
        vendorType: "retailer",
        productCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
  }, []);

  const myProducts = getProductsByVendor(vendorId);
  const myLeads = getLeadsByVendor(vendorId);
  const newLeadsCount = getNewLeadsCount(vendorId);
  const publishedCount = myProducts.filter((p) => p.status === "published").length;
  const draftCount = myProducts.filter((p) => p.status === "draft").length;

  const filteredProducts = searchQuery
    ? myProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : myProducts;

  const handleSaveProduct = (product: VendorProduct) => {
    if (editingProduct) {
      updateProduct(product.id, product);
    } else {
      addProduct(product);
    }
    setEditingProduct(undefined);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleTogglePublish = (product: VendorProduct) => {
    if (product.status === "published") {
      archiveProduct(product.id);
    } else {
      publishProduct(product.id);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8f9fa" }}>
      {/* Header */}
      <View className="px-5 pt-4 pb-2">
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#0f172a" />
          </Pressable>
          <Pressable
            onPress={() => {
              setEditingProduct(undefined);
              setShowProductForm(true);
            }}
            className="flex-row items-center px-4 py-2 rounded-full"
            style={{ backgroundColor: colors.primary[600] }}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "white", marginLeft: 4 }}>
              Add Product
            </Text>
          </Pressable>
        </View>
        <Text style={{ fontSize: 28, fontWeight: "800", color: "#0f172a", marginTop: 16 }}>
          Vendor Portal
        </Text>
        <Text style={{ fontSize: 15, color: "#6b7280", marginTop: 4 }}>
          Manage your product catalog
        </Text>
      </View>

      {/* Stats */}
      <View className="flex-row px-4 py-4">
        <StatCard icon="cube" value={myProducts.length} label="Products" color={colors.primary[600]} />
        <StatCard icon="eye" value={publishedCount} label="Published" color="#10b981" />
        <StatCard icon="people" value={newLeadsCount} label="New Leads" color="#f59e0b" />
      </View>

      {/* Tabs */}
      <View className="flex-row px-5 mb-4">
        <Pressable
          onPress={() => setActiveTab("products")}
          className="flex-1 py-3 rounded-l-xl items-center"
          style={{
            backgroundColor: activeTab === "products" ? colors.primary[600] : "white",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: activeTab === "products" ? "white" : "#6b7280",
            }}
          >
            Products ({myProducts.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab("leads")}
          className="flex-1 py-3 rounded-r-xl items-center flex-row justify-center"
          style={{
            backgroundColor: activeTab === "leads" ? colors.primary[600] : "white",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: activeTab === "leads" ? "white" : "#6b7280",
            }}
          >
            Leads
          </Text>
          {newLeadsCount > 0 && (
            <View
              className="ml-2 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: activeTab === "leads" ? "white" : "#ef4444" }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: "700",
                  color: activeTab === "leads" ? colors.primary[600] : "white",
                }}
              >
                {newLeadsCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Search (Products tab only) */}
      {activeTab === "products" && (
        <View className="px-5 mb-4">
          <View className="flex-row items-center bg-white rounded-xl px-4 py-3">
            <Ionicons name="search" size={20} color="#9ca3af" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search products..."
              className="flex-1 ml-3"
              style={{ fontSize: 16 }}
            />
            {searchQuery && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#9ca3af" />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Content */}
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        {activeTab === "products" && (
          <>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={() => {
                    setEditingProduct(product);
                    setShowProductForm(true);
                  }}
                  onTogglePublish={() => handleTogglePublish(product)}
                />
              ))
            ) : (
              <View className="items-center py-12">
                <Ionicons name="cube-outline" size={48} color="#9ca3af" />
                <Text style={{ fontSize: 18, fontWeight: "600", color: "#6b7280", marginTop: 12 }}>
                  {searchQuery ? "No products found" : "No products yet"}
                </Text>
                <Text style={{ fontSize: 14, color: "#9ca3af", marginTop: 4, textAlign: "center" }}>
                  {searchQuery
                    ? "Try a different search term"
                    : "Add your first product to start selling"}
                </Text>
                {!searchQuery && (
                  <Pressable
                    onPress={() => setShowProductForm(true)}
                    className="mt-4 px-6 py-3 rounded-xl"
                    style={{ backgroundColor: colors.primary[600] }}
                  >
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "white" }}>
                      Add First Product
                    </Text>
                  </Pressable>
                )}
              </View>
            )}
          </>
        )}

        {activeTab === "leads" && (
          <>
            {myLeads.length > 0 ? (
              myLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onPress={() => Alert.alert("Lead Details", `Contact: ${lead.customerEmail}`)}
                />
              ))
            ) : (
              <View className="items-center py-12">
                <Ionicons name="people-outline" size={48} color="#9ca3af" />
                <Text style={{ fontSize: 18, fontWeight: "600", color: "#6b7280", marginTop: 12 }}>
                  No leads yet
                </Text>
                <Text style={{ fontSize: 14, color: "#9ca3af", marginTop: 4, textAlign: "center" }}>
                  Leads will appear here when contractors request quotes or samples
                </Text>
              </View>
            )}
          </>
        )}

        {/* Tips */}
        <View className="mt-6 mb-8 p-4 bg-blue-50 rounded-xl">
          <View className="flex-row items-center mb-2">
            <Ionicons name="bulb" size={20} color="#3b82f6" />
            <Text style={{ fontSize: 14, fontWeight: "600", color: "#1e40af", marginLeft: 8 }}>
              Tips for More Sales
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: "#1e40af", lineHeight: 20 }}>
            • Add high-quality photos from multiple angles{"\n"}
            • Include pro pricing to attract contractors{"\n"}
            • Enable samples to generate leads{"\n"}
            • Mark popular items as "Featured"
          </Text>
        </View>
      </ScrollView>

      {/* Product Form Modal */}
      <ProductFormModal
        visible={showProductForm}
        onClose={() => {
          setShowProductForm(false);
          setEditingProduct(undefined);
        }}
        product={editingProduct}
        onSave={handleSaveProduct}
        vendorId={vendorId}
        vendorName={vendorName}
      />
    </SafeAreaView>
  );
}
