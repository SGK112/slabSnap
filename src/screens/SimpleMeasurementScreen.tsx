import React, { useState, useRef } from "react";
import { View, Text, Pressable, Image, Alert, TextInput, Modal } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../state/authStore";
import { useMeasurementsStore, MeasurementPoint } from "../state/measurementsStore";
import * as ImagePicker from "expo-image-picker";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";

export default function SimpleMeasurementScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { addMeasurement } = useMeasurementsStore();
  const cameraRef = useRef<any>(null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([]);
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [showInputModal, setShowInputModal] = useState(false);
  const [measurementType, setMeasurementType] = useState<"remnant" | "space">("space");
  const [notes, setNotes] = useState("");

  React.useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        Alert.alert("Error", "Failed to take picture");
      }
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled) {
      setCapturedImage(result.assets[0].uri);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setMeasurementPoints([]);
    setLength("");
    setWidth("");
    setNotes("");
  };

  const handleImageTap = (x: number, y: number) => {
    const newPoints = [...measurementPoints, { x, y }];
    setMeasurementPoints(newPoints);

    // After 4 corners, show input
    if (newPoints.length === 4) {
      setShowInputModal(true);
    }
  };

  const saveMeasurement = () => {
    if (!user) {
      Alert.alert("Login Required", "Please log in to save measurements");
      return;
    }

    if (!length || !width) {
      Alert.alert("Missing Dimensions", "Please enter length and width");
      return;
    }

    if (!capturedImage) return;

    const lengthNum = parseFloat(length);
    const widthNum = parseFloat(width);

    if (isNaN(lengthNum) || isNaN(widthNum)) {
      Alert.alert("Invalid Input", "Please enter valid numbers");
      return;
    }

    // Create simple measurement lines for visual
    const measurements = [];
    if (measurementPoints.length >= 2) {
      // Horizontal line (length)
      measurements.push({
        id: "length",
        start: measurementPoints[0],
        end: measurementPoints[1],
        length: lengthNum,
        label: `${lengthNum}" L`,
      });
    }
    if (measurementPoints.length >= 4) {
      // Vertical line (width)
      measurements.push({
        id: "width",
        start: measurementPoints[1],
        end: measurementPoints[2],
        length: widthNum,
        label: `${widthNum}" W`,
      });
    }

    addMeasurement({
      userId: user.id,
      imageUri: capturedImage,
      points: measurementPoints,
      measurements,
      totalLength: lengthNum,
      totalWidth: widthNum,
      notes,
      type: measurementType,
    });

    Alert.alert(
      "Saved!",
      `${measurementType === "remnant" ? "Remnant" : "Space"} measurement saved: ${lengthNum}" × ${widthNum}"`,
      [{ text: "OK", onPress: () => navigation.goBack() }]
    );
  };

  // Measurement Screen
  if (capturedImage) {
    return (
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <View style={{ flex: 1, position: "relative" }}>
          <Image
            source={{ uri: capturedImage }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />

          {/* Tap overlay */}
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={(e) => {
              if (measurementPoints.length < 4) {
                const { locationX, locationY } = e.nativeEvent;
                handleImageTap(locationX, locationY);
              }
            }}
          >
            <View style={{ flex: 1 }} pointerEvents="box-none">
              {/* Corner points */}
              {measurementPoints.map((point, index) => (
                <View
                  key={index}
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: point.x - 18,
                    top: point.y - 18,
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.accent[500],
                    borderWidth: 4,
                    borderColor: "white",
                    justifyContent: "center",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "white" }}>
                    {index + 1}
                  </Text>
                </View>
              ))}

              {/* Rectangle outline */}
              {measurementPoints.length === 4 && (
                <View pointerEvents="none">
                  {[0, 1, 2, 3].map((i) => {
                    const start = measurementPoints[i];
                    const end = measurementPoints[(i + 1) % 4];
                    const dx = end.x - start.x;
                    const dy = end.y - start.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

                    return (
                      <View
                        key={i}
                        style={{
                          position: "absolute",
                          left: start.x,
                          top: start.y,
                          width: length,
                          height: 3,
                          backgroundColor: colors.accent[500],
                          transform: [{ rotate: `${angle}deg` }],
                          transformOrigin: "top left",
                        }}
                      />
                    );
                  })}
                </View>
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
            backgroundColor: "rgba(0,0,0,0.8)",
            borderRadius: 16,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}>
            <Text style={{ fontSize: 14, fontWeight: "600", color: "white", textAlign: "center" }}>
              {measurementPoints.length === 0 && "Tap corner 1"}
              {measurementPoints.length === 1 && "Tap corner 2"}
              {measurementPoints.length === 2 && "Tap corner 3"}
              {measurementPoints.length === 3 && "Tap corner 4"}
              {measurementPoints.length === 4 && "Enter dimensions →"}
            </Text>
          </View>

          <Pressable
            onPress={retake}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="refresh" size={22} color="white" />
          </Pressable>
        </View>

        {/* Bottom Instructions */}
        <View style={{
          position: "absolute",
          bottom: insets.bottom + 20,
          left: 20,
          right: 20,
        }}>
          <View style={{
            backgroundColor: "rgba(0,0,0,0.85)",
            borderRadius: 16,
            padding: 20,
          }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "white", marginBottom: 8 }}>
              📐 Measure Stone or Space
            </Text>
            <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 20 }}>
              Tap the 4 corners of your remnant or countertop area, then enter actual measurements.
            </Text>

            {measurementPoints.length === 4 && (
              <Pressable
                style={{
                  backgroundColor: colors.accent[500],
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                  marginTop: 16,
                }}
                onPress={() => setShowInputModal(true)}
              >
                <Text style={{ fontSize: 16, fontWeight: "700", color: "white" }}>
                  Enter Dimensions
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* Input Modal */}
        <Modal
          visible={showInputModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowInputModal(false)}
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
                Dimensions
              </Text>

              {/* Type Selector */}
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
                    fontSize: 13,
                    fontWeight: "600",
                    color: measurementType === "space" ? "white" : colors.text.primary,
                    marginTop: 4,
                  }}>
                    My Space
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
                    fontSize: 13,
                    fontWeight: "600",
                    color: measurementType === "remnant" ? "white" : colors.text.primary,
                    marginTop: 4,
                  }}>
                    Remnant
                  </Text>
                </Pressable>
              </View>

              {/* Length Input */}
              <Text style={{
                fontSize: 15,
                fontWeight: "500",
                color: colors.text.secondary,
                marginBottom: 8,
              }}>
                Length (inches)
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.text.primary,
                  marginBottom: 16,
                }}
                value={length}
                onChangeText={setLength}
                keyboardType="decimal-pad"
                placeholder="e.g., 48"
                placeholderTextColor={colors.text.tertiary}
              />

              {/* Width Input */}
              <Text style={{
                fontSize: 15,
                fontWeight: "500",
                color: colors.text.secondary,
                marginBottom: 8,
              }}>
                Width (inches)
              </Text>
              <TextInput
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: 12,
                  paddingHorizontal: 16,
                  paddingVertical: 14,
                  fontSize: 18,
                  fontWeight: "600",
                  color: colors.text.primary,
                  marginBottom: 16,
                }}
                value={width}
                onChangeText={setWidth}
                keyboardType="decimal-pad"
                placeholder="e.g., 24"
                placeholderTextColor={colors.text.tertiary}
              />

              {/* Notes */}
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
                placeholder="Material, color, condition..."
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
                  onPress={() => setShowInputModal(false)}
                >
                  <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text.primary }}>
                    Back
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
    );
  }

  // Camera Mode - Loading
  if (!permission) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.text.secondary }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  // Permission denied
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
            Take photos of stone remnants or spaces to measure
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
        {/* Top Bar */}
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
              Stone Measurement
            </Text>
          </View>

          <View style={{ width: 44 }} />
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
              📸 Quick Measurement
            </Text>
            <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", lineHeight: 18 }}>
              1. Take photo of remnant or space{"\n"}
              2. Tap 4 corners{"\n"}
              3. Enter actual length & width
            </Text>
          </View>

          {/* Camera Controls */}
          <View style={{
            flexDirection: "row",
            justifyContent: "space-around",
            alignItems: "center",
          }}>
            {/* Gallery */}
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

            {/* Capture */}
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
                borderColor: colors.accent[500],
              }}
            >
              <View style={{
                width: 62,
                height: 62,
                borderRadius: 31,
                backgroundColor: colors.accent[500],
              }} />
            </Pressable>

            {/* Flip */}
            <Pressable
              onPress={() => setFacing(facing === "back" ? "front" : "back")}
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
