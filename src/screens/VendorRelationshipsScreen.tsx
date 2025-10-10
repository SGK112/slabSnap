import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useVendorStore } from "../state/vendorStore";
import { VendorRelationship } from "../types/vendors";

export default function VendorRelationshipsScreen() {
  const navigation = useNavigation();
  const { vendors } = useVendorStore();
  
  // In a real app, this would come from auth store - current user's vendor profile
  const currentVendor = vendors.find(v => v.id === "sg-main"); // Example: Surprise Granite
  
  const [relationships, setRelationships] = useState<VendorRelationship[]>(
    currentVendor?.supplierRelationships || []
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInventoryItem, setNewInventoryItem] = useState("");
  const [selectedRelationship, setSelectedRelationship] = useState<VendorRelationship | null>(null);

  const supplierVendors = vendors.filter(v => v.type === "stone-supplier");

  const handleAddInventoryItem = (relationshipId: string) => {
    if (!newInventoryItem.trim()) return;
    
    setRelationships(prev => prev.map(rel => {
      if (rel.vendorId === relationshipId) {
        return {
          ...rel,
          activeInventory: [...rel.activeInventory, newInventoryItem.trim()],
        };
      }
      return rel;
    }));
    
    setNewInventoryItem("");
    setSelectedRelationship(null);
  };

  const handleRemoveInventoryItem = (relationshipId: string, itemToRemove: string) => {
    setRelationships(prev => prev.map(rel => {
      if (rel.vendorId === relationshipId) {
        return {
          ...rel,
          activeInventory: rel.activeInventory.filter(item => item !== itemToRemove),
        };
      }
      return rel;
    }));
  };

  const handleAddSupplier = (supplierId: string) => {
    const supplier = vendors.find(v => v.id === supplierId);
    if (!supplier) return;
    
    const newRelationship: VendorRelationship = {
      vendorId: supplier.id,
      vendorName: supplier.name,
      relationshipType: "secondary-supplier",
      activeInventory: [],
    };
    
    setRelationships(prev => [...prev, newRelationship]);
    setShowAddModal(false);
  };

  const handleRemoveSupplier = (vendorId: string) => {
    setRelationships(prev => prev.filter(rel => rel.vendorId !== vendorId));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>Supplier Relationships</Text>
          <Text style={styles.subtitle}>
            Manage your supplier relationships and tag the materials you offer from each vendor. 
            This helps customers find your business when searching for specific stones or suppliers.
          </Text>
        </View>

        {/* Add Supplier Button */}
        <Pressable 
          style={styles.addButton}
          onPress={() => setShowAddModal(!showAddModal)}
        >
          <Ionicons name="add-circle" size={24} color={colors.primary[600]} />
          <Text style={styles.addButtonText}>Add Supplier</Text>
        </Pressable>

        {/* Add Supplier Modal */}
        {showAddModal && (
          <View style={styles.addModal}>
            <Text style={styles.modalTitle}>Select Supplier</Text>
            {supplierVendors.map((supplier) => {
              const alreadyAdded = relationships.some(rel => rel.vendorId === supplier.id);
              return (
                <Pressable
                  key={supplier.id}
                  style={[styles.supplierOption, alreadyAdded && styles.supplierOptionDisabled]}
                  onPress={() => !alreadyAdded && handleAddSupplier(supplier.id)}
                  disabled={alreadyAdded}
                >
                  <View>
                    <Text style={styles.supplierName}>{supplier.name}</Text>
                    <Text style={styles.supplierLocation}>
                      {supplier.location.city}, {supplier.location.state}
                    </Text>
                  </View>
                  {alreadyAdded ? (
                    <Ionicons name="checkmark-circle" size={24} color={colors.success.main} />
                  ) : (
                    <Ionicons name="add-circle-outline" size={24} color={colors.primary[600]} />
                  )}
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Current Relationships */}
        <View style={styles.relationshipsSection}>
          <Text style={styles.sectionTitle}>
            Current Suppliers ({relationships.length})
          </Text>
          
          {relationships.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={48} color={colors.neutral[300]} />
              <Text style={styles.emptyText}>No suppliers added yet</Text>
              <Text style={styles.emptySubtext}>
                Add suppliers to help customers find you
              </Text>
            </View>
          ) : (
            relationships.map((relationship) => (
              <View key={relationship.vendorId} style={styles.relationshipCard}>
                {/* Supplier Header */}
                <View style={styles.relationshipHeader}>
                  <View style={styles.relationshipInfo}>
                    <Text style={styles.relationshipName}>
                      {relationship.vendorName}
                    </Text>
                    <View style={styles.typeBadge}>
                      <Text style={styles.typeBadgeText}>
                        {relationship.relationshipType.replace("-", " ")}
                      </Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveSupplier(relationship.vendorId)}
                    style={styles.removeButton}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error.main} />
                  </Pressable>
                </View>

                {/* Active Inventory */}
                <View style={styles.inventorySection}>
                  <Text style={styles.inventoryLabel}>
                    Materials from this supplier:
                  </Text>
                  
                  <View style={styles.inventoryList}>
                    {relationship.activeInventory.map((item, index) => (
                      <View key={index} style={styles.inventoryChip}>
                        <Text style={styles.inventoryChipText}>{item}</Text>
                        <Pressable
                          onPress={() => handleRemoveInventoryItem(relationship.vendorId, item)}
                          hitSlop={8}
                        >
                          <Ionicons name="close-circle" size={18} color={colors.text.tertiary} />
                        </Pressable>
                      </View>
                    ))}
                  </View>

                  {/* Add Inventory Item */}
                  {selectedRelationship?.vendorId === relationship.vendorId ? (
                    <View style={styles.addInventoryForm}>
                      <TextInput
                        style={styles.inventoryInput}
                        placeholder="e.g., Calacatta White, Black Galaxy..."
                        placeholderTextColor={colors.text.quaternary}
                        value={newInventoryItem}
                        onChangeText={setNewInventoryItem}
                        autoFocus
                      />
                      <Pressable
                        style={styles.addInventoryButton}
                        onPress={() => handleAddInventoryItem(relationship.vendorId)}
                      >
                        <Text style={styles.addInventoryButtonText}>Add</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <Pressable
                      style={styles.addInventoryTrigger}
                      onPress={() => setSelectedRelationship(relationship)}
                    >
                      <Ionicons name="add" size={18} color={colors.primary[600]} />
                      <Text style={styles.addInventoryTriggerText}>
                        Add material from {relationship.vendorName}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        {/* Help Section */}
        <View style={styles.helpSection}>
          <View style={styles.helpCard}>
            <Ionicons name="information-circle" size={24} color={colors.primary[600]} />
            <View style={styles.helpContent}>
              <Text style={styles.helpTitle}>How this helps your business</Text>
              <Text style={styles.helpText}>
                When customers search for "MSI Calacatta" or "Cosentino Silestone" on the map, 
                your business will appear in results if you have tagged those materials. This 
                makes it easy for customers to find exactly what they need from local contractors.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backText: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text.primary,
  },
  content: {
    flex: 1,
  },
  titleSection: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: colors.text.secondary,
    lineHeight: 22,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 14,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary[600],
    borderStyle: "dashed",
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary[600],
  },
  addModal: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 16,
  },
  supplierOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background.primary,
    borderRadius: 8,
    marginBottom: 8,
  },
  supplierOptionDisabled: {
    opacity: 0.5,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text.primary,
  },
  supplierLocation: {
    fontSize: 13,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  relationshipsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.secondary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: colors.text.tertiary,
    marginTop: 8,
  },
  relationshipCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  relationshipHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  relationshipInfo: {
    flex: 1,
    gap: 8,
  },
  relationshipName: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
  },
  typeBadge: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary[100],
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.primary[700],
    textTransform: "capitalize",
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  inventorySection: {
    gap: 12,
  },
  inventoryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  inventoryList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  inventoryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
  },
  inventoryChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.text.primary,
  },
  addInventoryTrigger: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 6,
  },
  addInventoryTriggerText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.primary[600],
  },
  addInventoryForm: {
    flexDirection: "row",
    gap: 8,
  },
  inventoryInput: {
    flex: 1,
    backgroundColor: colors.background.primary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    fontSize: 14,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border.main,
  },
  addInventoryButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: "center",
  },
  addInventoryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  helpSection: {
    padding: 20,
    paddingTop: 0,
  },
  helpCard: {
    flexDirection: "row",
    backgroundColor: colors.primary[50],
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary[900],
    marginBottom: 6,
  },
  helpText: {
    fontSize: 13,
    color: colors.primary[700],
    lineHeight: 19,
  },
});
