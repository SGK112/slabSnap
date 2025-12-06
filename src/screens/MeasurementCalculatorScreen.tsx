import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Calculation types
type CalculationType = "countertop" | "room" | "backsplash" | "flooring" | "wall";

// Shape types for rooms
type RoomShape = "rectangle" | "l-shape" | "u-shape" | "custom";

interface Surface {
  id: string;
  name: string;
  length: string;
  width: string;
  depth?: string; // For countertops (edge depth)
}

interface Cutout {
  id: string;
  type: "sink" | "cooktop" | "other";
  length: string;
  width: string;
}

export default function MeasurementCalculatorScreen() {
  const navigation = useNavigation();

  // Main state
  const [calculationType, setCalculationType] = useState<CalculationType>("countertop");
  const [roomShape, setRoomShape] = useState<RoomShape>("rectangle");
  const [unit, setUnit] = useState<"inches" | "feet">("inches");

  // Surface measurements
  const [surfaces, setSurfaces] = useState<Surface[]>([
    { id: "1", name: "Main Surface", length: "", width: "" },
  ]);

  // Cutouts for countertops
  const [cutouts, setCutouts] = useState<Cutout[]>([]);

  // Edge/backsplash length
  const [edgeLength, setEdgeLength] = useState("");
  const [backsplashHeight, setBacksplashHeight] = useState("4");

  // Results
  const [results, setResults] = useState<{
    totalSqFt: number;
    totalSqIn: number;
    linearFeet: number;
    perimeter: number;
    cutoutSqFt: number;
    netSqFt: number;
  } | null>(null);

  // Calculation type config
  const calcTypes: { type: CalculationType; icon: keyof typeof Ionicons.glyphMap; label: string; color: string }[] = [
    { type: "countertop", icon: "layers", label: "Countertop", color: colors.primary[600] },
    { type: "room", icon: "home", label: "Room", color: "#10b981" },
    { type: "backsplash", icon: "grid", label: "Backsplash", color: "#8b5cf6" },
    { type: "flooring", icon: "albums", label: "Flooring", color: "#f59e0b" },
    { type: "wall", icon: "tablet-portrait", label: "Wall", color: "#ef4444" },
  ];

  // Add a new surface
  const addSurface = () => {
    const newSurface: Surface = {
      id: Date.now().toString(),
      name: `Surface ${surfaces.length + 1}`,
      length: "",
      width: "",
    };
    setSurfaces([...surfaces, newSurface]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Remove a surface
  const removeSurface = (id: string) => {
    if (surfaces.length === 1) {
      Alert.alert("Cannot Remove", "You need at least one surface");
      return;
    }
    setSurfaces(surfaces.filter(s => s.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Update surface
  const updateSurface = (id: string, field: keyof Surface, value: string) => {
    setSurfaces(surfaces.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  // Add cutout
  const addCutout = (type: Cutout["type"]) => {
    const defaultSizes: Record<Cutout["type"], { length: string; width: string }> = {
      sink: { length: "33", width: "22" },
      cooktop: { length: "30", width: "21" },
      other: { length: "", width: "" },
    };

    const newCutout: Cutout = {
      id: Date.now().toString(),
      type,
      ...defaultSizes[type],
    };
    setCutouts([...cutouts, newCutout]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Remove cutout
  const removeCutout = (id: string) => {
    setCutouts(cutouts.filter(c => c.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Update cutout
  const updateCutout = (id: string, field: keyof Cutout, value: string) => {
    setCutouts(cutouts.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  // Convert to inches
  const toInches = (value: string): number => {
    const num = parseFloat(value) || 0;
    return unit === "feet" ? num * 12 : num;
  };

  // Calculate all measurements
  const calculate = useCallback(() => {
    let totalSqIn = 0;
    let totalLinearIn = 0;
    let totalPerimeterIn = 0;
    let cutoutSqIn = 0;

    // Calculate surfaces
    for (const surface of surfaces) {
      const length = toInches(surface.length);
      const width = toInches(surface.width);

      if (length > 0 && width > 0) {
        totalSqIn += length * width;
        totalPerimeterIn += 2 * (length + width);

        // Add edge length (for countertops, typically front edge + sides)
        if (calculationType === "countertop") {
          totalLinearIn += length + (width * 2); // Front + 2 sides
        }
      }
    }

    // Calculate cutouts
    for (const cutout of cutouts) {
      const length = toInches(cutout.length);
      const width = toInches(cutout.width);

      if (length > 0 && width > 0) {
        cutoutSqIn += length * width;
      }
    }

    // Add manual edge length
    if (edgeLength) {
      totalLinearIn = toInches(edgeLength);
    }

    // Backsplash calculation
    if (calculationType === "backsplash" && backsplashHeight) {
      const height = toInches(backsplashHeight);
      // Backsplash area = perimeter * height (minus corners for accuracy)
      totalSqIn = totalLinearIn * height;
    }

    const totalSqFt = totalSqIn / 144;
    const cutoutSqFt = cutoutSqIn / 144;
    const netSqFt = totalSqFt - cutoutSqFt;
    const linearFeet = totalLinearIn / 12;
    const perimeter = totalPerimeterIn / 12;

    setResults({
      totalSqFt: Math.round(totalSqFt * 100) / 100,
      totalSqIn: Math.round(totalSqIn),
      linearFeet: Math.round(linearFeet * 100) / 100,
      perimeter: Math.round(perimeter * 100) / 100,
      cutoutSqFt: Math.round(cutoutSqFt * 100) / 100,
      netSqFt: Math.round(netSqFt * 100) / 100,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [surfaces, cutouts, edgeLength, backsplashHeight, calculationType, unit]);

  // Clear all
  const clearAll = () => {
    setSurfaces([{ id: "1", name: "Main Surface", length: "", width: "" }]);
    setCutouts([]);
    setEdgeLength("");
    setResults(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Get helper text based on calculation type
  const getHelperText = () => {
    switch (calculationType) {
      case "countertop":
        return "Enter dimensions for each countertop section. Add cutouts for sinks and cooktops.";
      case "room":
        return "Enter room dimensions. For L-shaped rooms, add multiple surfaces.";
      case "backsplash":
        return "Enter the linear length and height of the backsplash area.";
      case "flooring":
        return "Enter room dimensions to calculate flooring needed.";
      case "wall":
        return "Enter wall height and width to calculate paint/wallpaper area.";
      default:
        return "";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.neutral[800]} />
        </Pressable>
        <Text style={styles.headerTitle}>Measurement Calculator</Text>
        <Pressable onPress={clearAll} style={styles.clearButton}>
          <Ionicons name="refresh" size={22} color={colors.neutral[500]} />
        </Pressable>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Calculation Type Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What are you measuring?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroller}>
            {calcTypes.map((ct) => (
              <Pressable
                key={ct.type}
                style={[
                  styles.typeButton,
                  calculationType === ct.type && { backgroundColor: ct.color + "15", borderColor: ct.color },
                ]}
                onPress={() => {
                  setCalculationType(ct.type);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons
                  name={ct.icon}
                  size={24}
                  color={calculationType === ct.type ? ct.color : colors.neutral[400]}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    calculationType === ct.type && { color: ct.color, fontWeight: "700" },
                  ]}
                >
                  {ct.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Helper Text */}
        <View style={styles.helperBox}>
          <Ionicons name="information-circle" size={18} color={colors.primary[500]} />
          <Text style={styles.helperText}>{getHelperText()}</Text>
        </View>

        {/* Unit Toggle */}
        <View style={styles.unitToggle}>
          <Pressable
            style={[styles.unitButton, unit === "inches" && styles.unitButtonActive]}
            onPress={() => setUnit("inches")}
          >
            <Text style={[styles.unitButtonText, unit === "inches" && styles.unitButtonTextActive]}>
              Inches
            </Text>
          </Pressable>
          <Pressable
            style={[styles.unitButton, unit === "feet" && styles.unitButtonActive]}
            onPress={() => setUnit("feet")}
          >
            <Text style={[styles.unitButtonText, unit === "feet" && styles.unitButtonTextActive]}>
              Feet
            </Text>
          </Pressable>
        </View>

        {/* Surfaces */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {calculationType === "wall" ? "Walls" : calculationType === "room" ? "Areas" : "Surfaces"}
            </Text>
            <Pressable style={styles.addButton} onPress={addSurface}>
              <Ionicons name="add" size={20} color={colors.primary[600]} />
              <Text style={styles.addButtonText}>Add</Text>
            </Pressable>
          </View>

          {surfaces.map((surface, index) => (
            <View key={surface.id} style={styles.surfaceCard}>
              <View style={styles.surfaceHeader}>
                <TextInput
                  style={styles.surfaceNameInput}
                  value={surface.name}
                  onChangeText={(text) => updateSurface(surface.id, "name", text)}
                  placeholder="Surface name"
                  placeholderTextColor={colors.neutral[400]}
                />
                {surfaces.length > 1 && (
                  <Pressable onPress={() => removeSurface(surface.id)} style={styles.removeButton}>
                    <Ionicons name="close-circle" size={24} color={colors.red[400]} />
                  </Pressable>
                )}
              </View>

              <View style={styles.dimensionsRow}>
                <View style={styles.dimensionInput}>
                  <Text style={styles.dimensionLabel}>Length</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={surface.length}
                      onChangeText={(text) => updateSurface(surface.id, "length", text)}
                      placeholder="0"
                      placeholderTextColor={colors.neutral[300]}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.inputUnit}>{unit === "feet" ? "ft" : "in"}</Text>
                  </View>
                </View>

                <Ionicons name="close" size={20} color={colors.neutral[300]} style={styles.dimensionX} />

                <View style={styles.dimensionInput}>
                  <Text style={styles.dimensionLabel}>
                    {calculationType === "wall" ? "Height" : "Width"}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={surface.width}
                      onChangeText={(text) => updateSurface(surface.id, "width", text)}
                      placeholder="0"
                      placeholderTextColor={colors.neutral[300]}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.inputUnit}>{unit === "feet" ? "ft" : "in"}</Text>
                  </View>
                </View>
              </View>

              {/* Quick area display */}
              {surface.length && surface.width && (
                <View style={styles.quickCalc}>
                  <Text style={styles.quickCalcText}>
                    = {((toInches(surface.length) * toInches(surface.width)) / 144).toFixed(2)} sq ft
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Cutouts (for countertops) */}
        {calculationType === "countertop" && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Cutouts</Text>
              <View style={styles.cutoutButtons}>
                <Pressable style={styles.cutoutButton} onPress={() => addCutout("sink")}>
                  <Text style={styles.cutoutButtonText}>+ Sink</Text>
                </Pressable>
                <Pressable style={styles.cutoutButton} onPress={() => addCutout("cooktop")}>
                  <Text style={styles.cutoutButtonText}>+ Cooktop</Text>
                </Pressable>
                <Pressable style={styles.cutoutButton} onPress={() => addCutout("other")}>
                  <Text style={styles.cutoutButtonText}>+ Other</Text>
                </Pressable>
              </View>
            </View>

            {cutouts.length === 0 ? (
              <Text style={styles.noCutouts}>No cutouts added</Text>
            ) : (
              cutouts.map((cutout) => (
                <View key={cutout.id} style={styles.cutoutCard}>
                  <View style={styles.cutoutHeader}>
                    <View style={styles.cutoutType}>
                      <Ionicons
                        name={cutout.type === "sink" ? "water" : cutout.type === "cooktop" ? "flame" : "shapes"}
                        size={18}
                        color={colors.neutral[600]}
                      />
                      <Text style={styles.cutoutTypeText}>
                        {cutout.type.charAt(0).toUpperCase() + cutout.type.slice(1)}
                      </Text>
                    </View>
                    <Pressable onPress={() => removeCutout(cutout.id)}>
                      <Ionicons name="trash-outline" size={20} color={colors.red[400]} />
                    </Pressable>
                  </View>

                  <View style={styles.dimensionsRow}>
                    <View style={styles.dimensionInput}>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          value={cutout.length}
                          onChangeText={(text) => updateCutout(cutout.id, "length", text)}
                          placeholder="L"
                          placeholderTextColor={colors.neutral[300]}
                          keyboardType="decimal-pad"
                        />
                        <Text style={styles.inputUnit}>{unit === "feet" ? "ft" : "in"}</Text>
                      </View>
                    </View>
                    <Ionicons name="close" size={16} color={colors.neutral[300]} />
                    <View style={styles.dimensionInput}>
                      <View style={styles.inputWrapper}>
                        <TextInput
                          style={styles.input}
                          value={cutout.width}
                          onChangeText={(text) => updateCutout(cutout.id, "width", text)}
                          placeholder="W"
                          placeholderTextColor={colors.neutral[300]}
                          keyboardType="decimal-pad"
                        />
                        <Text style={styles.inputUnit}>{unit === "feet" ? "ft" : "in"}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* Edge/Linear Feet (for countertops and backsplash) */}
        {(calculationType === "countertop" || calculationType === "backsplash") && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {calculationType === "backsplash" ? "Backsplash" : "Edge Length"}
            </Text>

            <View style={styles.edgeRow}>
              <View style={[styles.dimensionInput, { flex: 1 }]}>
                <Text style={styles.dimensionLabel}>
                  {calculationType === "backsplash" ? "Total Length" : "Total Edge Length"}
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={edgeLength}
                    onChangeText={setEdgeLength}
                    placeholder="Auto-calculated if empty"
                    placeholderTextColor={colors.neutral[300]}
                    keyboardType="decimal-pad"
                  />
                  <Text style={styles.inputUnit}>{unit === "feet" ? "ft" : "in"}</Text>
                </View>
              </View>
            </View>

            {calculationType === "backsplash" && (
              <View style={styles.edgeRow}>
                <View style={[styles.dimensionInput, { flex: 1 }]}>
                  <Text style={styles.dimensionLabel}>Backsplash Height</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={backsplashHeight}
                      onChangeText={setBacksplashHeight}
                      placeholder="4"
                      placeholderTextColor={colors.neutral[300]}
                      keyboardType="decimal-pad"
                    />
                    <Text style={styles.inputUnit}>{unit === "feet" ? "ft" : "in"}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Calculate Button */}
        <Pressable style={styles.calculateButton} onPress={calculate}>
          <Ionicons name="calculator" size={24} color="#fff" />
          <Text style={styles.calculateButtonText}>Calculate</Text>
        </Pressable>

        {/* Results */}
        {results && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Results</Text>

            <View style={styles.resultsGrid}>
              <View style={styles.resultCard}>
                <Text style={styles.resultValue}>{results.netSqFt}</Text>
                <Text style={styles.resultLabel}>Total Sq Ft</Text>
                {results.cutoutSqFt > 0 && (
                  <Text style={styles.resultNote}>
                    ({results.totalSqFt} - {results.cutoutSqFt} cutouts)
                  </Text>
                )}
              </View>

              <View style={styles.resultCard}>
                <Text style={styles.resultValue}>{results.totalSqIn}</Text>
                <Text style={styles.resultLabel}>Total Sq Inches</Text>
              </View>

              <View style={styles.resultCard}>
                <Text style={styles.resultValue}>{results.linearFeet}</Text>
                <Text style={styles.resultLabel}>Linear Feet</Text>
                <Text style={styles.resultNote}>(edge length)</Text>
              </View>

              <View style={styles.resultCard}>
                <Text style={styles.resultValue}>{results.perimeter}</Text>
                <Text style={styles.resultLabel}>Perimeter (ft)</Text>
              </View>
            </View>

            {/* Material Estimates */}
            <View style={styles.estimatesSection}>
              <Text style={styles.estimatesTitle}>Material Estimates</Text>

              {calculationType === "countertop" && (
                <>
                  <View style={styles.estimateRow}>
                    <Text style={styles.estimateLabel}>Standard Slab (55 sq ft)</Text>
                    <Text style={styles.estimateValue}>
                      {Math.ceil(results.netSqFt / 55)} slab(s) needed
                    </Text>
                  </View>
                  <View style={styles.estimateRow}>
                    <Text style={styles.estimateLabel}>Jumbo Slab (65 sq ft)</Text>
                    <Text style={styles.estimateValue}>
                      {Math.ceil(results.netSqFt / 65)} slab(s) needed
                    </Text>
                  </View>
                </>
              )}

              {calculationType === "flooring" && (
                <>
                  <View style={styles.estimateRow}>
                    <Text style={styles.estimateLabel}>With 10% waste factor</Text>
                    <Text style={styles.estimateValue}>
                      {(results.netSqFt * 1.1).toFixed(1)} sq ft
                    </Text>
                  </View>
                  <View style={styles.estimateRow}>
                    <Text style={styles.estimateLabel}>Boxes (20 sq ft/box)</Text>
                    <Text style={styles.estimateValue}>
                      {Math.ceil((results.netSqFt * 1.1) / 20)} boxes
                    </Text>
                  </View>
                </>
              )}

              {calculationType === "wall" && (
                <>
                  <View style={styles.estimateRow}>
                    <Text style={styles.estimateLabel}>Paint coverage (350 sq ft/gal)</Text>
                    <Text style={styles.estimateValue}>
                      {(results.netSqFt / 350).toFixed(1)} gallons
                    </Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.neutral[800],
  },
  clearButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.neutral[800],
  },
  typeScroller: {
    marginTop: 12,
  },
  typeButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginRight: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.neutral[200],
    minWidth: 90,
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.neutral[500],
    marginTop: 6,
  },
  helperBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  helperText: {
    flex: 1,
    fontSize: 13,
    color: colors.primary[700],
    lineHeight: 18,
  },
  unitToggle: {
    flexDirection: "row",
    backgroundColor: colors.neutral[100],
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  unitButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  unitButtonActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  unitButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[500],
  },
  unitButtonTextActive: {
    color: colors.primary[600],
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary[600],
  },
  surfaceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  surfaceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  surfaceNameInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: colors.neutral[800],
    padding: 0,
  },
  removeButton: {
    padding: 4,
  },
  dimensionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dimensionInput: {
    flex: 1,
  },
  dimensionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.neutral[500],
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.neutral[50],
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    paddingRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: colors.neutral[800],
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  inputUnit: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[400],
  },
  dimensionX: {
    marginTop: 20,
  },
  quickCalc: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  quickCalcText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary[600],
    textAlign: "right",
  },
  cutoutButtons: {
    flexDirection: "row",
    gap: 8,
  },
  cutoutButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.neutral[100],
    borderRadius: 6,
  },
  cutoutButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.neutral[600],
  },
  noCutouts: {
    fontSize: 14,
    color: colors.neutral[400],
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 16,
  },
  cutoutCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  cutoutHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cutoutType: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cutoutTypeText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[700],
  },
  edgeRow: {
    marginTop: 12,
  },
  calculateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[600],
    borderRadius: 16,
    paddingVertical: 16,
    gap: 10,
    shadowColor: colors.primary[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  calculateButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  resultsSection: {
    marginTop: 24,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.primary[200],
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.neutral[800],
    marginBottom: 16,
    textAlign: "center",
  },
  resultsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  resultCard: {
    width: (SCREEN_WIDTH - 32 - 40 - 12) / 2,
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  resultValue: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary[700],
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.neutral[600],
    marginTop: 4,
  },
  resultNote: {
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 2,
  },
  estimatesSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  estimatesTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.neutral[700],
    marginBottom: 12,
  },
  estimateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  estimateLabel: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  estimateValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.neutral[800],
  },
});
