import React, { useState, useRef, useEffect, useCallback } from "react";
import { View, Text, Pressable, Image, Alert, Dimensions, TextInput, ScrollView, Modal, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../state/authStore";
import { useMeasurementsStore, MeasurementPoint } from "../state/measurementsStore";
import * as ImagePicker from "expo-image-picker";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Accelerometer, Gyroscope } from "expo-sensors";
import * as ImageManipulator from "expo-image-manipulator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MeasureLine {
  id: string;
  start: MeasurementPoint;
  end: MeasurementPoint;
  length: number;
  angle: number;
}

interface DeviceOrientation {
  pitch: number; // Forward/backward tilt
  roll: number;  // Side-to-side tilt
  yaw: number;   // Rotation
}

export default function AdvancedMeasurementScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { addMeasurement } = useMeasurementsStore();
  const cameraRef = useRef<any>(null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<"camera" | "measure" | "calibrate">("calibrate");
  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([]);
  const [measurementLines, setMeasurementLines] = useState<MeasureLine[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [measurementType, setMeasurementType] = useState<"remnant" | "space">("space");
  const [notes, setNotes] = useState("");
  const [tapIndicator, setTapIndicator] = useState<{ x: number; y: number } | null>(null);
  
  // Advanced features
  const [deviceOrientation, setDeviceOrientation] = useState<DeviceOrientation>({ pitch: 0, roll: 0, yaw: 0 });
  const [isDeviceLevel, setIsDeviceLevel] = useState(false);
  const [calibrationDistance, setCalibrationDistance] = useState("24");
  const [pixelsPerInch, setPixelsPerInch] = useState<number | null>(null);
  const [showEdgeDetection, setShowEdgeDetection] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [measurementMode, setMeasurementMode] = useState<"linear" | "area" | "perimeter">("linear");
  const [areaPoints, setAreaPoints] = useState<MeasurementPoint[]>([]);
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  // Initialize sensors
  useEffect(() => {
    let accelerometerSubscription: any;
    let gyroscopeSubscription: any;

    const setupSensors = async () => {
      // Set update intervals
      Accelerometer.setUpdateInterval(100);
      Gyroscope.setUpdateInterval(100);

      // Subscribe to accelerometer
      accelerometerSubscription = Accelerometer.addListener((data) => {
        // Calculate pitch and roll from accelerometer
        const pitch = Math.atan2(data.y, Math.sqrt(data.x * data.x + data.z * data.z)) * (180 / Math.PI);
        const roll = Math.atan2(-data.x, data.z) * (180 / Math.PI);
        
        setDeviceOrientation((prev) => ({ ...prev, pitch, roll }));
        
        // Check if device is level (within 5 degrees)
        const isLevel = Math.abs(pitch) < 5 && Math.abs(roll) < 5;
        setIsDeviceLevel(isLevel);
      });

      // Subscribe to gyroscope for yaw
      gyroscopeSubscription = Gyroscope.addListener((data) => {
        setDeviceOrientation((prev) => ({ ...prev, yaw: data.z }));
      });
    };

    setupSensors();

    return () => {
      accelerometerSubscription?.remove();
      gyroscopeSubscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, []);

  const toggleCameraFacing = () => {
    setFacing(current => (current === "back" ? "front" : "back"));
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
          skipProcessing: false,
        });
        setCapturedImage(photo.uri);
        
        // Edge detection if enabled
        if (showEdgeDetection) {
          await processImageForEdges(photo.uri);
        } else {
          setProcessedImage(photo.uri);
        }
        
        if (pixelsPerInch) {
          setMode("measure");
        } else {
          setMode("calibrate");
        }
      } catch (error) {
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  const processImageForEdges = async (uri: string) => {
    try {
      // Apply edge detection using image manipulation
      const processed = await ImageManipulator.manipulateAsync(
        uri,
        [
          // Increase contrast for edge detection
          { rotate: 0 }, // Placeholder - real edge detection would need native module
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );
      setProcessedImage(processed.uri);
    } catch (error) {
      console.error("Edge detection error:", error);
      setProcessedImage(uri);
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
      setProcessedImage(result.assets[0].uri);
      if (pixelsPerInch) {
        setMode("measure");
      } else {
        setMode("calibrate");
      }
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setProcessedImage(null);
    setMeasurementPoints([]);
    setMeasurementLines([]);
    setAreaPoints([]);
    setMode("camera");
  };

  const addMeasurementPoint = (x: number, y: number) => {
    console.log("✅ Adding measurement point at:", x, y);
    
    // Show tap indicator
    setTapIndicator({ x, y });
    setTimeout(() => setTapIndicator(null), 500);
    
    if (measurementMode === "area" || measurementMode === "perimeter") {
      // Area/Perimeter mode - collect multiple points
      setAreaPoints([...areaPoints, { x, y }]);
    } else {
      // Linear mode - two points at a time
      const newPoint: MeasurementPoint = { x, y };
      const newPoints = [...measurementPoints, newPoint];
      setMeasurementPoints(newPoints);

      if (newPoints.length === 2) {
        createMeasurementLine(newPoints[0], newPoints[1]);
        setMeasurementPoints([]);
      }
    }
  };

  const createMeasurementLine = (start: MeasurementPoint, end: MeasurementPoint) => {
    const pixelDistance = Math.sqrt(
      Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
    );
    
    if (!pixelsPerInch) {
      Alert.alert("Calibration Required", "Please complete calibration first");
      return;
    }

    const lengthInInches = pixelDistance / pixelsPerInch;
    const angle = Math.atan2(end.y - start.y, end.x - start.x) * (180 / Math.PI);

    const newLine: MeasureLine = {
      id: "line-" + Date.now(),
      start,
      end,
      length: Math.round(lengthInInches * 10) / 10,
      angle: Math.round(angle),
    };

    setMeasurementLines([...measurementLines, newLine]);
  };

  const completeCalibration = () => {
    if (measurementPoints.length !== 2) {
      Alert.alert("Calibration", "Please tap two points on a known distance");
      return;
    }

    const distance = parseFloat(calibrationDistance);
    if (isNaN(distance) || distance <= 0) {
      Alert.alert("Invalid Distance", "Please enter a valid distance in inches");
      return;
    }

    const pixelDistance = Math.sqrt(
      Math.pow(measurementPoints[1].x - measurementPoints[0].x, 2) +
      Math.pow(measurementPoints[1].y - measurementPoints[0].y, 2)
    );

    const ppi = pixelDistance / distance;
    setPixelsPerInch(ppi);
    setMeasurementPoints([]);
    setMode("measure");
    
    Alert.alert(
      "Calibration Complete",
      `Calibrated to ${distance}" reference. You can now measure accurately!`
    );
  };

  const calculateArea = () => {
    if (areaPoints.length < 3) {
      Alert.alert("Area Calculation", "Please add at least 3 points to calculate area");
      return;
    }

    // Shoelace formula for polygon area
    let area = 0;
    for (let i = 0; i < areaPoints.length; i++) {
      const j = (i + 1) % areaPoints.length;
      area += areaPoints[i].x * areaPoints[j].y;
      area -= areaPoints[j].x * areaPoints[i].y;
    }
    area = Math.abs(area / 2);

    if (!pixelsPerInch) return;

    // Convert pixel area to square inches
    const areaInSquareInches = area / (pixelsPerInch * pixelsPerInch);
    const areaInSquareFeet = areaInSquareInches / 144;

    Alert.alert(
      "Area Calculated",
      `Area: ${areaInSquareInches.toFixed(1)} sq in\n${areaInSquareFeet.toFixed(2)} sq ft`
    );
  };

  const calculatePerimeter = () => {
    if (areaPoints.length < 2) {
      Alert.alert("Perimeter Calculation", "Please add at least 2 points");
      return;
    }

    let perimeter = 0;
    for (let i = 0; i < areaPoints.length; i++) {
      const j = (i + 1) % areaPoints.length;
      const distance = Math.sqrt(
        Math.pow(areaPoints[j].x - areaPoints[i].x, 2) +
        Math.pow(areaPoints[j].y - areaPoints[i].y, 2)
      );
      perimeter += distance;
    }

    if (!pixelsPerInch) return;

    const perimeterInInches = perimeter / pixelsPerInch;
    const perimeterInFeet = perimeterInInches / 12;

    Alert.alert(
      "Perimeter Calculated",
      `Perimeter: ${perimeterInInches.toFixed(1)}"\n${perimeterInFeet.toFixed(2)} ft`
    );
  };

  const clearLastMeasurement = () => {
    if (measurementMode === "linear" && measurementLines.length > 0) {
      setMeasurementLines(measurementLines.slice(0, -1));
    } else if ((measurementMode === "area" || measurementMode === "perimeter") && areaPoints.length > 0) {
      setAreaPoints(areaPoints.slice(0, -1));
    }
    setMeasurementPoints([]);
  };

  const clearAllMeasurements = () => {
    setMeasurementLines([]);
    setMeasurementPoints([]);
    setAreaPoints([]);
  };

  const saveMeasurement = () => {
    if (!user) {
      Alert.alert("Login Required", "Please log in to save measurements");
      return;
    }

    if (measurementLines.length === 0 || !capturedImage) {
      Alert.alert("No Measurements", "Please add at least one measurement");
      return;
    }

    addMeasurement({
      userId: user.id,
      imageUri: capturedImage,
      points: measurementPoints,
      measurements: measurementLines.map(line => ({
        id: line.id,
        start: line.start,
        end: line.end,
        length: line.length,
        label: `${line.length}" (${line.angle}°)`,
      })),
      notes,
      type: measurementType,
    });

    setShowSaveModal(false);
    Alert.alert(
      "Measurement Saved",
      `Your ${measurementType === "remnant" ? "remnant" : "space"} measurement has been saved to your profile.`,
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  // Calibration Mode
  if (mode === "calibrate" && capturedImage) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <View style={{ flex: 1, position: "relative" }}>
            <Image
              source={{ uri: processedImage || capturedImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />

            {/* Tap overlay */}
            <Pressable
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              onPress={(e) => {
                const { locationX, locationY } = e.nativeEvent;
                addMeasurementPoint(locationX, locationY);
              }}
            >
              <View style={{ flex: 1 }} pointerEvents="box-none">
                {/* Calibration points */}
                {measurementPoints.map((point, index) => (
                  <View
                    key={index}
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: point.x - 20,
                      top: point.y - 20,
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: colors.accent[500],
                      borderWidth: 4,
                      borderColor: "white",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "700", color: "white" }}>
                      {index + 1}
                    </Text>
                  </View>
                ))}

                {/* Calibration line */}
                {measurementPoints.length === 2 && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: measurementPoints[0].x,
                      top: measurementPoints[0].y,
                      width: Math.sqrt(
                        Math.pow(measurementPoints[1].x - measurementPoints[0].x, 2) +
                        Math.pow(measurementPoints[1].y - measurementPoints[0].y, 2)
                      ),
                      height: 4,
                      backgroundColor: colors.accent[500],
                      transform: [{
                        rotate: `${Math.atan2(
                          measurementPoints[1].y - measurementPoints[0].y,
                          measurementPoints[1].x - measurementPoints[0].x
                        ) * (180 / Math.PI)}deg`
                      }],
                      transformOrigin: "top left",
                    }}
                  />
                )}

                {/* Tap indicator */}
                {tapIndicator && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: tapIndicator.x - 20,
                      top: tapIndicator.y - 20,
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      borderWidth: 3,
                      borderColor: colors.accent[500],
                      backgroundColor: "rgba(249, 115, 22, 0.2)",
                    }}
                  />
                )}
              </View>
            </Pressable>
          </View>

          {/* Top Controls */}
          <View style={{
            position: "absolute",
            top: insets.top,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}>
            <View style={{
              backgroundColor: "rgba(0,0,0,0.85)",
              borderRadius: 16,
              padding: 16,
            }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ fontSize: 18, fontWeight: "700", color: "white" }}>
                  📏 Calibration
                </Text>
                <Pressable onPress={retake}>
                  <Ionicons name="close-circle" size={28} color="white" />
                </Pressable>
              </View>

              <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 12, lineHeight: 18 }}>
                Tap two points on a known distance (like a credit card = 3.375", ruler, etc.)
              </Text>

              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "white", marginRight: 8 }}>
                  Known distance:
                </Text>
                <TextInput
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    fontSize: 16,
                    fontWeight: "600",
                    color: "white",
                    marginRight: 8,
                  }}
                  value={calibrationDistance}
                  onChangeText={setCalibrationDistance}
                  keyboardType="decimal-pad"
                  placeholder="24"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                />
                <Text style={{ fontSize: 14, fontWeight: "600", color: "white" }}>
                  inches
                </Text>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                  onPress={() => setCalibrationDistance("3.375")}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "white" }}>
                    💳 Card
                  </Text>
                </Pressable>
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                  onPress={() => setCalibrationDistance("8.5")}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "white" }}>
                    📄 Paper
                  </Text>
                </Pressable>
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                  onPress={() => setCalibrationDistance("12")}
                >
                  <Text style={{ fontSize: 12, fontWeight: "600", color: "white" }}>
                    📏 Ruler
                  </Text>
                </Pressable>
              </View>

              {measurementPoints.length === 2 && (
                <Pressable
                  style={{
                    backgroundColor: colors.accent[500],
                    borderRadius: 12,
                    paddingVertical: 14,
                    alignItems: "center",
                    marginTop: 12,
                  }}
                  onPress={completeCalibration}
                >
                  <Text style={{ fontSize: 16, fontWeight: "700", color: "white" }}>
                    ✓ Complete Calibration
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    );
  }

  // Measure Mode - After calibration
  if (mode === "measure" && capturedImage) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "black" }}>
          <View style={{ flex: 1, position: "relative" }}>
            <Image
              source={{ uri: processedImage || capturedImage }}
              style={{ width: "100%", height: "100%" }}
              resizeMode="contain"
            />

            {/* Tap overlay */}
            <Pressable
              style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
              onPress={(e) => {
                const { locationX, locationY } = e.nativeEvent;
                addMeasurementPoint(locationX, locationY);
              }}
            >
              <View style={{ flex: 1 }} pointerEvents="box-none">
                {/* Measurement Lines */}
                {measurementLines.map((line) => {
                  const dx = line.end.x - line.start.x;
                  const dy = line.end.y - line.start.y;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                  return (
                    <View key={line.id} pointerEvents="none">
                      {/* Line */}
                      <View
                        style={{
                          position: "absolute",
                          left: line.start.x,
                          top: line.start.y,
                          width: length,
                          height: 3,
                          backgroundColor: colors.accent[500],
                          transform: [{ rotate: `${angle}deg` }],
                          transformOrigin: "top left",
                        }}
                      />
                      
                      {/* Start Point */}
                      <View
                        style={{
                          position: "absolute",
                          left: line.start.x - 12,
                          top: line.start.y - 12,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.accent[500],
                          borderWidth: 3,
                          borderColor: "white",
                        }}
                      />
                      
                      {/* End Point */}
                      <View
                        style={{
                          position: "absolute",
                          left: line.end.x - 12,
                          top: line.end.y - 12,
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          backgroundColor: colors.accent[500],
                          borderWidth: 3,
                          borderColor: "white",
                        }}
                      />

                      {/* Length Label with Angle */}
                      <View
                        style={{
                          position: "absolute",
                          left: (line.start.x + line.end.x) / 2 - 35,
                          top: (line.start.y + line.end.y) / 2 - 26,
                          backgroundColor: colors.accent[500],
                          borderRadius: 10,
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderWidth: 2,
                          borderColor: "white",
                        }}
                      >
                        <Text style={{ fontSize: 14, fontWeight: "700", color: "white", textAlign: "center" }}>
                          {line.length}"
                        </Text>
                        <Text style={{ fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.9)", textAlign: "center" }}>
                          {line.angle}°
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {/* Area/Perimeter Points */}
                {areaPoints.map((point, index) => (
                  <View
                    key={`area-${index}`}
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: point.x - 15,
                      top: point.y - 15,
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: colors.accent[500],
                      borderWidth: 3,
                      borderColor: "white",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: "700", color: "white" }}>
                      {index + 1}
                    </Text>
                  </View>
                ))}

                {/* Area polygon lines */}
                {areaPoints.length > 1 && (measurementMode === "area" || measurementMode === "perimeter") && areaPoints.map((point, index) => {
                  if (index === 0) return null;
                  const prev = areaPoints[index - 1];
                  const dx = point.x - prev.x;
                  const dy = point.y - prev.y;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                  return (
                    <View
                      key={`line-${index}`}
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        left: prev.x,
                        top: prev.y,
                        width: length,
                        height: 2,
                        backgroundColor: colors.accent[500],
                        transform: [{ rotate: `${angle}deg` }],
                        transformOrigin: "top left",
                      }}
                    />
                  );
                })}

                {/* Closing line for polygon */}
                {areaPoints.length > 2 && (measurementMode === "area" || measurementMode === "perimeter") && (() => {
                  const first = areaPoints[0];
                  const last = areaPoints[areaPoints.length - 1];
                  const dx = first.x - last.x;
                  const dy = first.y - last.y;
                  const length = Math.sqrt(dx * dx + dy * dy);
                  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                  return (
                    <View
                      pointerEvents="none"
                      style={{
                        position: "absolute",
                        left: last.x,
                        top: last.y,
                        width: length,
                        height: 2,
                        backgroundColor: "rgba(249, 115, 22, 0.5)",
                        borderStyle: "dashed",
                        transform: [{ rotate: `${angle}deg` }],
                        transformOrigin: "top left",
                      }}
                    />
                  );
                })()}

                {/* Current point being placed */}
                {measurementPoints.length === 1 && measurementMode === "linear" && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: measurementPoints[0].x - 15,
                      top: measurementPoints[0].y - 15,
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: colors.accent[500],
                      borderWidth: 3,
                      borderColor: "white",
                    }}
                  />
                )}

                {/* Tap indicator */}
                {tapIndicator && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: tapIndicator.x - 20,
                      top: tapIndicator.y - 20,
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      borderWidth: 3,
                      borderColor: colors.accent[500],
                      backgroundColor: "rgba(249, 115, 22, 0.2)",
                    }}
                  />
                )}
              </View>
            </Pressable>
          </View>

          {/* Top Controls */}
          <View style={{
            position: "absolute",
            top: insets.top,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(0,0,0,0.7)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="close" size={26} color="white" />
            </Pressable>

            <View style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.7)",
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 10,
              marginHorizontal: 12,
            }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: "white", textAlign: "center" }}>
                {measurementMode === "linear" && (measurementPoints.length === 1 ? "Tap end point" : "Tap to measure")}
                {measurementMode === "area" && `Area: ${areaPoints.length} points`}
                {measurementMode === "perimeter" && `Perimeter: ${areaPoints.length} points`}
              </Text>
              {pixelsPerInch && (
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", textAlign: "center", marginTop: 2 }}>
                  Calibrated: {(1 / pixelsPerInch).toFixed(3)} px/in
                </Text>
              )}
            </View>

            <Pressable
              onPress={clearLastMeasurement}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: measurementLines.length > 0 || areaPoints.length > 0 ? colors.accent[500] : "rgba(0,0,0,0.7)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="arrow-undo" size={22} color="white" />
            </Pressable>
          </View>

          {/* Bottom Controls */}
          <View style={{
            position: "absolute",
            bottom: insets.bottom,
            left: 0,
            right: 0,
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}>
            {/* Measurement Mode Selector */}
            <View style={{
              flexDirection: "row",
              backgroundColor: "rgba(0,0,0,0.8)",
              borderRadius: 14,
              padding: 6,
              marginBottom: 12,
              gap: 6,
            }}>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: measurementMode === "linear" ? colors.accent[500] : "transparent",
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
                onPress={() => {
                  setMeasurementMode("linear");
                  setAreaPoints([]);
                }}
              >
                <Ionicons name="remove" size={18} color="white" />
                <Text style={{ fontSize: 11, fontWeight: "600", color: "white", marginTop: 2 }}>
                  Linear
                </Text>
              </Pressable>

              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: measurementMode === "area" ? colors.accent[500] : "transparent",
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
                onPress={() => {
                  setMeasurementMode("area");
                  setMeasurementLines([]);
                }}
              >
                <Ionicons name="square-outline" size={18} color="white" />
                <Text style={{ fontSize: 11, fontWeight: "600", color: "white", marginTop: 2 }}>
                  Area
                </Text>
              </Pressable>

              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: measurementMode === "perimeter" ? colors.accent[500] : "transparent",
                  borderRadius: 10,
                  paddingVertical: 10,
                  alignItems: "center",
                }}
                onPress={() => {
                  setMeasurementMode("perimeter");
                  setMeasurementLines([]);
                }}
              >
                <Ionicons name="git-compare-outline" size={18} color="white" />
                <Text style={{ fontSize: 11, fontWeight: "600", color: "white", marginTop: 2 }}>
                  Perimeter
                </Text>
              </Pressable>
            </View>

            {/* Measurements Info */}
            {(measurementLines.length > 0 || areaPoints.length > 0) && (
              <View style={{
                backgroundColor: "rgba(0,0,0,0.85)",
                borderRadius: 14,
                padding: 14,
                marginBottom: 12,
              }}>
                {measurementMode === "linear" && (
                  <>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "white", marginBottom: 8 }}>
                      📏 Measurements: {measurementLines.length}
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {measurementLines.map((line, index) => (
                        <View
                          key={line.id}
                          style={{
                            backgroundColor: colors.accent[500],
                            borderRadius: 8,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            marginRight: 8,
                          }}
                        >
                          <Text style={{ fontSize: 12, fontWeight: "600", color: "white" }}>
                            #{index + 1}: {line.length}" ({line.angle}°)
                          </Text>
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}
                
                {(measurementMode === "area" || measurementMode === "perimeter") && areaPoints.length > 0 && (
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "white", marginBottom: 8 }}>
                      {measurementMode === "area" ? "📐" : "⬡"} Points: {areaPoints.length}
                    </Text>
                    {areaPoints.length >= 3 && (
                      <Pressable
                        style={{
                          backgroundColor: colors.accent[500],
                          borderRadius: 10,
                          paddingVertical: 10,
                          alignItems: "center",
                        }}
                        onPress={measurementMode === "area" ? calculateArea : calculatePerimeter}
                      >
                        <Text style={{ fontSize: 13, fontWeight: "700", color: "white" }}>
                          Calculate {measurementMode === "area" ? "Area" : "Perimeter"}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.7)",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: "white",
                }}
                onPress={retake}
              >
                <Ionicons name="camera" size={20} color="white" />
                <Text style={{ fontSize: 12, fontWeight: "600", color: "white", marginTop: 4 }}>
                  Retake
                </Text>
              </Pressable>

              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.7)",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: "white",
                }}
                onPress={clearAllMeasurements}
              >
                <Ionicons name="trash" size={20} color="white" />
                <Text style={{ fontSize: 12, fontWeight: "600", color: "white", marginTop: 4 }}>
                  Clear
                </Text>
              </Pressable>

              <Pressable
                style={{
                  flex: 1.2,
                  backgroundColor: measurementLines.length > 0 ? colors.accent[500] : "rgba(150,150,150,0.7)",
                  borderRadius: 14,
                  paddingVertical: 14,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: "white",
                }}
                onPress={() => measurementLines.length > 0 && setShowSaveModal(true)}
                disabled={measurementLines.length === 0}
              >
                <Ionicons name="save" size={20} color="white" />
                <Text style={{ fontSize: 12, fontWeight: "600", color: "white", marginTop: 4 }}>
                  Save ({measurementLines.length})
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Save Modal */}
          <Modal
            visible={showSaveModal}
            transparent
            animationType="slide"
            onRequestClose={() => setShowSaveModal(false)}
          >
            <View style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "flex-end",
            }}>
              <View style={{
                backgroundColor: colors.background.primary,
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                paddingTop: 20,
                paddingBottom: insets.bottom + 20,
                paddingHorizontal: 20,
              }}>
                <View style={{
                  width: 40,
                  height: 4,
                  backgroundColor: colors.neutral[300],
                  alignSelf: "center",
                  borderRadius: 2,
                  marginBottom: 20,
                }} />

                <Text style={{
                  fontSize: 22,
                  fontWeight: "600",
                  color: colors.text.primary,
                  marginBottom: 20,
                }}>
                  Save Measurement
                </Text>

                <Text style={{
                  fontSize: 15,
                  fontWeight: "500",
                  color: colors.text.secondary,
                  marginBottom: 12,
                }}>
                  What are you measuring?
                </Text>

                <View style={{ flexDirection: "row", marginBottom: 20, gap: 12 }}>
                  <Pressable
                    style={{
                      flex: 1,
                      backgroundColor: measurementType === "space" ? colors.accent[500] : colors.background.secondary,
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: measurementType === "space" ? colors.accent[500] : colors.border.main,
                    }}
                    onPress={() => setMeasurementType("space")}
                  >
                    <Ionicons
                      name="home"
                      size={24}
                      color={measurementType === "space" ? "white" : colors.text.secondary}
                    />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: measurementType === "space" ? "white" : colors.text.primary,
                      marginTop: 6,
                    }}>
                      My Space
                    </Text>
                    <Text style={{
                      fontSize: 11,
                      color: measurementType === "space" ? "rgba(255,255,255,0.8)" : colors.text.tertiary,
                      marginTop: 2,
                    }}>
                      Buyer
                    </Text>
                  </Pressable>

                  <Pressable
                    style={{
                      flex: 1,
                      backgroundColor: measurementType === "remnant" ? colors.accent[500] : colors.background.secondary,
                      borderRadius: 12,
                      paddingVertical: 14,
                      alignItems: "center",
                      borderWidth: 2,
                      borderColor: measurementType === "remnant" ? colors.accent[500] : colors.border.main,
                    }}
                    onPress={() => setMeasurementType("remnant")}
                  >
                    <Ionicons
                      name="cube"
                      size={24}
                      color={measurementType === "remnant" ? "white" : colors.text.secondary}
                    />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: measurementType === "remnant" ? "white" : colors.text.primary,
                      marginTop: 6,
                    }}>
                      Remnant
                    </Text>
                    <Text style={{
                      fontSize: 11,
                      color: measurementType === "remnant" ? "rgba(255,255,255,0.8)" : colors.text.tertiary,
                      marginTop: 2,
                    }}>
                      Seller
                    </Text>
                  </Pressable>
                </View>

                <Text style={{
                  fontSize: 15,
                  fontWeight: "500",
                  color: colors.text.secondary,
                  marginBottom: 8,
                }}>
                  Notes (Optional)
                </Text>

                <TextInput
                  style={{
                    backgroundColor: colors.background.secondary,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    fontSize: 15,
                    color: colors.text.primary,
                    marginBottom: 24,
                    height: 80,
                    textAlignVertical: "top",
                  }}
                  placeholder="Add details about this measurement..."
                  placeholderTextColor={colors.text.tertiary}
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <Pressable
                    style={{
                      flex: 1,
                      backgroundColor: colors.background.secondary,
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: "center",
                    }}
                    onPress={() => setShowSaveModal(false)}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text.primary }}>
                      Cancel
                    </Text>
                  </Pressable>

                  <Pressable
                    style={{
                      flex: 1,
                      backgroundColor: colors.accent[500],
                      borderRadius: 12,
                      paddingVertical: 16,
                      alignItems: "center",
                    }}
                    onPress={saveMeasurement}
                  >
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                      Save
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </GestureHandlerRootView>
    );
  }

  // Camera Mode Loading permission state
  if (!permission) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.text.secondary }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  // Permission denied state
  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <View style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{ position: "absolute", top: 20, left: 20, padding: 8 }}
          >
            <Ionicons name="close" size={28} color={colors.text.primary} />
          </Pressable>

          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: colors.accent[100],
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 24,
          }}>
            <Ionicons name="camera" size={40} color={colors.accent[500]} />
          </View>
          
          <Text style={{ fontSize: 22, fontWeight: "600", color: colors.text.primary, marginBottom: 12, textAlign: "center" }}>
            Camera Access Needed
          </Text>
          
          <Text style={{ fontSize: 15, color: colors.text.secondary, textAlign: "center", marginBottom: 32, lineHeight: 22 }}>
            To measure with precision, we need access to your camera and sensors.
          </Text>

          <Pressable
            style={{
              backgroundColor: colors.accent[500],
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 32,
              marginBottom: 12,
            }}
            onPress={requestPermission}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
              Grant Camera Access
            </Text>
          </Pressable>

          <Pressable
            style={{
              backgroundColor: colors.background.secondary,
              borderRadius: 12,
              paddingVertical: 16,
              paddingHorizontal: 32,
              marginBottom: 12,
            }}
            onPress={pickFromGallery}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text.primary }}>
              Choose from Gallery
            </Text>
          </Pressable>

          <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 15, color: colors.text.tertiary }}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Camera Mode
  return (
    <View style={{ flex: 1, backgroundColor: "black" }}>
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing={facing}
      >
        {/* Top Controls */}
        <View style={{
          position: "absolute",
          top: insets.top,
          left: 0,
          right: 0,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 12,
        }}>
          <Pressable
            onPress={() => navigation.goBack()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="close" size={26} color="white" />
          </Pressable>

          <View style={{
            backgroundColor: "rgba(0,0,0,0.7)",
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "white" }}>
              Advanced Measurement
            </Text>
          </View>

          <Pressable
            onPress={() => setShowEdgeDetection(!showEdgeDetection)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: showEdgeDetection ? colors.accent[500] : "rgba(0,0,0,0.7)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="scan" size={22} color="white" />
          </Pressable>
        </View>

        {/* Grid Overlay */}
        {showGrid && (
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
            {/* Center lines */}
            <View style={{
              position: "absolute",
              left: SCREEN_WIDTH / 2 - 1,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: colors.accent[500],
              opacity: 0.6,
            }} />
            <View style={{
              position: "absolute",
              top: SCREEN_HEIGHT / 2 - 1,
              left: 0,
              right: 0,
              height: 2,
              backgroundColor: colors.accent[500],
              opacity: 0.6,
            }} />
            {/* Thirds */}
            {[1, 2].map(i => (
              <React.Fragment key={i}>
                <View style={{
                  position: "absolute",
                  left: (SCREEN_WIDTH * i) / 3 - 0.5,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  backgroundColor: colors.accent[500],
                  opacity: 0.3,
                }} />
                <View style={{
                  position: "absolute",
                  top: (SCREEN_HEIGHT * i) / 3 - 0.5,
                  left: 0,
                  right: 0,
                  height: 1,
                  backgroundColor: colors.accent[500],
                  opacity: 0.3,
                }} />
              </React.Fragment>
            ))}
          </View>
        )}

        {/* Level Indicator */}
        <View style={{
          position: "absolute",
          top: insets.top + 70,
          left: 20,
          right: 20,
        }}>
          <View style={{
            backgroundColor: isDeviceLevel ? "rgba(34, 197, 94, 0.9)" : "rgba(239, 68, 68, 0.9)",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Ionicons
              name={isDeviceLevel ? "checkmark-circle" : "warning"}
              size={20}
              color="white"
              style={{ marginRight: 8 }}
            />
            <Text style={{ fontSize: 13, fontWeight: "600", color: "white" }}>
              {isDeviceLevel ? "Device Level ✓" : `Tilt: ${Math.abs(deviceOrientation.pitch).toFixed(1)}° / ${Math.abs(deviceOrientation.roll).toFixed(1)}°`}
            </Text>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={{
          position: "absolute",
          bottom: insets.bottom,
          left: 0,
          right: 0,
          paddingBottom: 30,
          paddingHorizontal: 20,
        }}>
          {/* Instructions */}
          <View style={{
            backgroundColor: "rgba(0,0,0,0.85)",
            borderRadius: 14,
            padding: 16,
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "white", marginBottom: 6 }}>
              📐 Professional Measurement Tool
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 18 }}>
              • Level device for best accuracy{"\n"}
              • Take photo to start calibration{"\n"}
              • Use known reference for precise measurements
            </Text>
          </View>

          {/* Camera Controls */}
          <View style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
          }}>
            {/* Gallery Button */}
            <Pressable
              onPress={pickFromGallery}
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: "rgba(0,0,0,0.7)",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: "white",
              }}
            >
              <Ionicons name="images" size={26} color="white" />
            </Pressable>

            {/* Capture Button */}
            <Pressable
              onPress={takePicture}
              style={{
                width: 76,
                height: 76,
                borderRadius: 38,
                backgroundColor: "white",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 5,
                borderColor: isDeviceLevel ? "#22c55e" : colors.accent[500],
              }}
            >
              <View style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                backgroundColor: isDeviceLevel ? "#22c55e" : colors.accent[500],
              }} />
            </Pressable>

            {/* Flip Camera Button */}
            <Pressable
              onPress={toggleCameraFacing}
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: "rgba(0,0,0,0.7)",
                justifyContent: "center",
                alignItems: "center",
                borderWidth: 2,
                borderColor: "white",
              }}
            >
              <Ionicons name="camera-reverse" size={26} color="white" />
            </Pressable>
          </View>
        </View>
      </CameraView>
    </View>
  );
}
