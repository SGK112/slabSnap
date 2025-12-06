import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "../utils/colors";
import { useAuthStore } from "../state/authStore";
import { QuoteResponse } from "../types/subscriptions";

interface LineItem {
  id: string;
  description: string;
  category: "materials" | "fabrication" | "labor" | "install" | "delivery" | "other";
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

const CATEGORY_OPTIONS = [
  { id: "materials", label: "Materials", icon: "cube-outline" },
  { id: "fabrication", label: "Fabrication", icon: "construct-outline" },
  { id: "labor", label: "Labor", icon: "person-outline" },
  { id: "install", label: "Installation", icon: "hammer-outline" },
  { id: "delivery", label: "Delivery", icon: "car-outline" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal-outline" },
];

const UNIT_OPTIONS = ["ea", "sq ft", "linear ft", "hours", "days", "slabs", "tiles", "boxes"];

export default function CreateQuoteScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuthStore();

  // Pre-filled from quote request or manual entry
  const quoteRequest = route.params?.quoteRequest;
  const recipientInfo = route.params?.recipient;

  // Customer Info
  const [customerName, setCustomerName] = useState(quoteRequest?.requesterName || recipientInfo?.name || "");
  const [customerEmail, setCustomerEmail] = useState(quoteRequest?.requesterEmail || recipientInfo?.email || "");
  const [customerPhone, setCustomerPhone] = useState(quoteRequest?.requesterPhone || recipientInfo?.phone || "");
  const [projectAddress, setProjectAddress] = useState(quoteRequest?.projectAddress || "");

  // Quote Details
  const [title, setTitle] = useState(quoteRequest?.title || "");
  const [description, setDescription] = useState(quoteRequest?.projectDescription || "");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);

  // Terms
  const [validDays, setValidDays] = useState("30");
  const [leadTime, setLeadTime] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("50% deposit, 50% on completion");
  const [notes, setNotes] = useState("");

  // Tax
  const [taxRate, setTaxRate] = useState("8.25"); // Default Arizona tax
  const [applyTax, setApplyTax] = useState(true);

  // Discount
  const [discount, setDiscount] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("fixed");

  const [isLoading, setIsLoading] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  // New line item state
  const [newDescription, setNewDescription] = useState("");
  const [newCategory, setNewCategory] = useState<LineItem["category"]>("materials");
  const [newQuantity, setNewQuantity] = useState("");
  const [newUnit, setNewUnit] = useState("ea");
  const [newUnitPrice, setNewUnitPrice] = useState("");

  // Calculations
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const discountAmount = discount
    ? discountType === "percentage"
      ? subtotal * (parseFloat(discount) / 100)
      : parseFloat(discount)
    : 0;
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = applyTax ? taxableAmount * (parseFloat(taxRate) / 100) : 0;
  const total = taxableAmount + taxAmount;

  const addLineItem = () => {
    if (!newDescription || !newQuantity || !newUnitPrice) {
      Alert.alert("Missing Info", "Please fill in all fields for the line item");
      return;
    }

    const qty = parseFloat(newQuantity);
    const price = parseFloat(newUnitPrice);

    const newItem: LineItem = {
      id: `item_${Date.now()}`,
      description: newDescription,
      category: newCategory,
      quantity: qty,
      unit: newUnit,
      unitPrice: price,
      total: qty * price,
    };

    setLineItems([...lineItems, newItem]);

    // Reset new item fields
    setNewDescription("");
    setNewQuantity("");
    setNewUnitPrice("");
    setShowAddItem(false);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const handleSend = async () => {
    if (!customerName) {
      Alert.alert("Missing Info", "Please enter customer name");
      return;
    }

    if (lineItems.length === 0) {
      Alert.alert("No Items", "Please add at least one line item");
      return;
    }

    if (!customerEmail && !customerPhone) {
      Alert.alert("Missing Contact", "Please enter customer email or phone");
      return;
    }

    setIsLoading(true);
    try {
      const quote: Partial<QuoteResponse> = {
        responderId: user?.id || "",
        responderName: user?.name || "",
        responderBusiness: user?.businessName,
        responderType: user?.userType === "vendor" ? "vendor" : "contractor",
        lineItems: lineItems.map((item) => ({
          ...item,
          notes: undefined,
        })),
        subtotal,
        taxRate: applyTax ? parseFloat(taxRate) : undefined,
        tax: applyTax ? taxAmount : undefined,
        discount: discountAmount || undefined,
        discountReason: discount ? "Quote discount" : undefined,
        total,
        validDays: parseInt(validDays),
        validUntil: Date.now() + parseInt(validDays) * 24 * 60 * 60 * 1000,
        paymentTerms,
        leadTime,
        notes,
        status: "sent",
        createdAt: Date.now(),
        sentAt: Date.now(),
      };

      // In production, send to backend and email/SMS to customer
      // await sendQuote(quote);

      Alert.alert(
        "Quote Sent!",
        `Your quote for $${total.toFixed(2)} has been sent to ${customerName}.`,
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send quote");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = () => {
    // Save to local storage/state
    Alert.alert("Draft Saved", "Your quote has been saved as a draft.");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Quote</Text>
          <TouchableOpacity onPress={handleSaveDraft}>
            <Text style={styles.draftButton}>Save Draft</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Customer Info */}
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Customer name"
              placeholderTextColor={colors.text.quaternary}
              value={customerName}
              onChangeText={setCustomerName}
            />
          </View>
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={colors.text.quaternary}
                value={customerEmail}
                onChangeText={setCustomerEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Phone</Text>
              <TextInput
                style={styles.input}
                placeholder="Phone"
                placeholderTextColor={colors.text.quaternary}
                value={customerPhone}
                onChangeText={setCustomerPhone}
                keyboardType="phone-pad"
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Project Address</Text>
            <TextInput
              style={styles.input}
              placeholder="Project address"
              placeholderTextColor={colors.text.quaternary}
              value={projectAddress}
              onChangeText={setProjectAddress}
            />
          </View>

          {/* Quote Details */}
          <Text style={styles.sectionTitle}>Quote Details</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Kitchen Countertop Installation"
              placeholderTextColor={colors.text.quaternary}
              value={title}
              onChangeText={setTitle}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Project description and scope of work..."
              placeholderTextColor={colors.text.quaternary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Line Items */}
          <View style={styles.lineItemsHeader}>
            <Text style={styles.sectionTitle}>Line Items</Text>
            <TouchableOpacity
              style={styles.addItemButton}
              onPress={() => setShowAddItem(true)}
            >
              <Ionicons name="add" size={20} color={colors.primary[600]} />
              <Text style={styles.addItemText}>Add Item</Text>
            </TouchableOpacity>
          </View>

          {lineItems.length === 0 ? (
            <View style={styles.emptyItems}>
              <Ionicons name="receipt-outline" size={48} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>No items added yet</Text>
              <TouchableOpacity
                style={styles.addFirstButton}
                onPress={() => setShowAddItem(true)}
              >
                <Text style={styles.addFirstButtonText}>Add First Item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.itemsList}>
              {lineItems.map((item, index) => (
                <View key={item.id} style={styles.lineItem}>
                  <View style={styles.lineItemHeader}>
                    <View style={styles.lineItemCategory}>
                      <Text style={styles.lineItemCategoryText}>
                        {item.category.toUpperCase()}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeLineItem(item.id)}>
                      <Ionicons name="trash-outline" size={18} color={colors.red[500]} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.lineItemDescription}>{item.description}</Text>
                  <View style={styles.lineItemDetails}>
                    <Text style={styles.lineItemQty}>
                      {item.quantity} {item.unit} x ${item.unitPrice.toFixed(2)}
                    </Text>
                    <Text style={styles.lineItemTotal}>${item.total.toFixed(2)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Add Item Modal inline */}
          {showAddItem && (
            <View style={styles.addItemForm}>
              <View style={styles.addItemHeader}>
                <Text style={styles.addItemTitle}>Add Line Item</Text>
                <TouchableOpacity onPress={() => setShowAddItem(false)}>
                  <Ionicons name="close" size={24} color={colors.text.tertiary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      newCategory === cat.id && styles.categoryOptionActive,
                    ]}
                    onPress={() => setNewCategory(cat.id as LineItem["category"])}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={18}
                      color={
                        newCategory === cat.id
                          ? colors.primary[600]
                          : colors.text.tertiary
                      }
                    />
                    <Text
                      style={[
                        styles.categoryOptionText,
                        newCategory === cat.id && styles.categoryOptionTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.inputLabel}>Description *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Calacatta Gold Marble - 3cm"
                placeholderTextColor={colors.text.quaternary}
                value={newDescription}
                onChangeText={setNewDescription}
              />

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Quantity *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={colors.text.quaternary}
                    value={newQuantity}
                    onChangeText={setNewQuantity}
                    keyboardType="numeric"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <View style={styles.unitPicker}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {UNIT_OPTIONS.map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[
                            styles.unitOption,
                            newUnit === unit && styles.unitOptionActive,
                          ]}
                          onPress={() => setNewUnit(unit)}
                        >
                          <Text
                            style={[
                              styles.unitOptionText,
                              newUnit === unit && styles.unitOptionTextActive,
                            ]}
                          >
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.inputLabel}>Unit Price *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="$0.00"
                    placeholderTextColor={colors.text.quaternary}
                    value={newUnitPrice}
                    onChangeText={setNewUnitPrice}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.addItemSubmit} onPress={addLineItem}>
                <Text style={styles.addItemSubmitText}>Add to Quote</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Totals */}
          {lineItems.length > 0 && (
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal</Text>
                <Text style={styles.totalValue}>${subtotal.toFixed(2)}</Text>
              </View>

              {/* Discount */}
              <View style={styles.discountRow}>
                <Text style={styles.totalLabel}>Discount</Text>
                <View style={styles.discountInputs}>
                  <TextInput
                    style={styles.discountInput}
                    placeholder="0"
                    placeholderTextColor={colors.text.quaternary}
                    value={discount}
                    onChangeText={setDiscount}
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={[
                      styles.discountTypeBtn,
                      discountType === "fixed" && styles.discountTypeBtnActive,
                    ]}
                    onPress={() => setDiscountType("fixed")}
                  >
                    <Text
                      style={[
                        styles.discountTypeBtnText,
                        discountType === "fixed" && styles.discountTypeBtnTextActive,
                      ]}
                    >
                      $
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.discountTypeBtn,
                      discountType === "percentage" && styles.discountTypeBtnActive,
                    ]}
                    onPress={() => setDiscountType("percentage")}
                  >
                    <Text
                      style={[
                        styles.discountTypeBtnText,
                        discountType === "percentage" &&
                          styles.discountTypeBtnTextActive,
                      ]}
                    >
                      %
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              {discountAmount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}></Text>
                  <Text style={styles.discountValue}>-${discountAmount.toFixed(2)}</Text>
                </View>
              )}

              {/* Tax */}
              <View style={styles.taxRow}>
                <TouchableOpacity
                  style={styles.taxCheckbox}
                  onPress={() => setApplyTax(!applyTax)}
                >
                  <View
                    style={[styles.checkbox, applyTax && styles.checkboxActive]}
                  >
                    {applyTax && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                  <Text style={styles.totalLabel}>Tax</Text>
                </TouchableOpacity>
                <View style={styles.taxInputs}>
                  <TextInput
                    style={styles.taxInput}
                    value={taxRate}
                    onChangeText={setTaxRate}
                    keyboardType="numeric"
                    editable={applyTax}
                  />
                  <Text style={styles.taxPercent}>%</Text>
                  <Text style={styles.taxValue}>
                    ${applyTax ? taxAmount.toFixed(2) : "0.00"}
                  </Text>
                </View>
              </View>

              <View style={styles.totalRowFinal}>
                <Text style={styles.totalLabelFinal}>Total</Text>
                <Text style={styles.totalValueFinal}>${total.toFixed(2)}</Text>
              </View>
            </View>
          )}

          {/* Terms */}
          <Text style={styles.sectionTitle}>Terms</Text>
          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Valid For (Days)</Text>
              <TextInput
                style={styles.input}
                value={validDays}
                onChangeText={setValidDays}
                keyboardType="numeric"
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Lead Time</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., 2-3 weeks"
                placeholderTextColor={colors.text.quaternary}
                value={leadTime}
                onChangeText={setLeadTime}
              />
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment Terms</Text>
            <TextInput
              style={styles.input}
              value={paymentTerms}
              onChangeText={setPaymentTerms}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Additional Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Any additional notes for the customer..."
              placeholderTextColor={colors.text.quaternary}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Spacer */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.bottomTotal}>
            <Text style={styles.bottomTotalLabel}>Quote Total</Text>
            <Text style={styles.bottomTotalValue}>${total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              (isLoading || lineItems.length === 0) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={isLoading || lineItems.length === 0}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="white" />
                <Text style={styles.sendButtonText}>Send Quote</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
  },
  draftButton: {
    color: colors.primary[600],
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 12,
    marginTop: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.secondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.neutral[100],
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  inputRow: {
    flexDirection: "row",
  },
  lineItemsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  addItemButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addItemText: {
    color: colors.primary[600],
    fontWeight: "600",
    marginLeft: 4,
    fontSize: 14,
  },
  emptyItems: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
  },
  emptyText: {
    color: colors.text.tertiary,
    marginTop: 12,
    marginBottom: 16,
  },
  addFirstButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: "white",
    fontWeight: "600",
  },
  itemsList: {
    gap: 10,
  },
  lineItem: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  lineItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  lineItemCategory: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lineItemCategoryText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.primary[600],
  },
  lineItemDescription: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text.primary,
    marginBottom: 6,
  },
  lineItemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  lineItemQty: {
    fontSize: 13,
    color: colors.text.tertiary,
  },
  lineItemTotal: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
  },
  addItemForm: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  addItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colors.neutral[100],
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  categoryOptionActive: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[600],
  },
  categoryOptionText: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginLeft: 6,
  },
  categoryOptionTextActive: {
    color: colors.primary[600],
    fontWeight: "600",
  },
  unitPicker: {
    backgroundColor: colors.neutral[100],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  unitOption: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 4,
  },
  unitOptionActive: {
    backgroundColor: colors.primary[600],
  },
  unitOptionText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  unitOptionTextActive: {
    color: "white",
    fontWeight: "600",
  },
  addItemSubmit: {
    backgroundColor: colors.primary[600],
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 12,
  },
  addItemSubmitText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  totalsSection: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  totalValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: "500",
  },
  discountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  discountInputs: {
    flexDirection: "row",
    alignItems: "center",
  },
  discountInput: {
    width: 60,
    backgroundColor: "white",
    borderRadius: 6,
    padding: 8,
    textAlign: "center",
    borderWidth: 1,
    borderColor: colors.border.light,
    marginRight: 8,
  },
  discountTypeBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: colors.neutral[200],
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
  },
  discountTypeBtnActive: {
    backgroundColor: colors.primary[600],
  },
  discountTypeBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.tertiary,
  },
  discountTypeBtnTextActive: {
    color: "white",
  },
  discountValue: {
    fontSize: 14,
    color: colors.success.main,
    fontWeight: "500",
  },
  taxRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  taxCheckbox: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.neutral[300],
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxActive: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  taxInputs: {
    flexDirection: "row",
    alignItems: "center",
  },
  taxInput: {
    width: 50,
    backgroundColor: "white",
    borderRadius: 6,
    padding: 8,
    textAlign: "center",
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  taxPercent: {
    marginLeft: 4,
    marginRight: 12,
    color: colors.text.tertiary,
  },
  taxValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: "500",
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: colors.text.primary,
  },
  totalLabelFinal: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text.primary,
  },
  totalValueFinal: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary[600],
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  bottomTotal: {},
  bottomTotalLabel: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  bottomTotalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  sendButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
});
