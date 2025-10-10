import React, { useState, useRef } from "react";
import { View, Text, Pressable, Image, Alert, Dimensions, TextInput, ScrollView, Modal } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../state/authStore";
import { useMeasurementsStore, MeasurementPoint } from "../state/measurementsStore";
import * as ImagePicker from "expo-image-picker";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MeasureLine {
  id: string;
  start: MeasurementPoint;
  end: MeasurementPoint;
  length: number; // in inches
}

export default function MeasurementCameraScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { addMeasurement } = useMeasurementsStore();
  const cameraRef = useRef<any>(null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [showGrid, setShowGrid] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [mode, setMode] = useState<"camera" | "measure">("camera");
  const [measurementPoints, setMeasurementPoints] = useState<MeasurementPoint[]>([]);
  const [measurementLines, setMeasurementLines] = useState<MeasureLine[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [measurementType, setMeasurementType] = useState<"remnant" | "space">("space");
  const [notes, setNotes] = useState("");
  const calibrationInches = 24; // Default calibration: 24 inches
  const [tapIndicator, setTapIndicator] = useState<{ x: number; y: number } | null>(null);

  // Request permission on mount
  React.useEffect(() => {
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
          quality: 0.8,
        });
        setCapturedImage(photo.uri);
        setMode("measure");
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
      setMode("measure");
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setMeasurementPoints([]);
    setMeasurementLines([]);
    setMode("camera");
  };

  const addMeasurementPoint = (x: number, y: number) => {
    console.log("Adding measurement point at:", x, y);
    
    // Show tap indicator
    setTapIndicator({ x, y });
    setTimeout(() => setTapIndicator(null), 500);
    
    const newPoint: MeasurementPoint = { x, y };
    const newPoints = [...measurementPoints, newPoint];
    setMeasurementPoints(newPoints);

    // If we have 2 points, create a line
    if (newPoints.length === 2) {
      console.log("Creating measurement line");
      const pixelDistance = Math.sqrt(
        Math.pow(newPoints[1].x - newPoints[0].x, 2) +
        Math.pow(newPoints[1].y - newPoints[0].y, 2)
      );
      
      console.log("Pixel distance:", pixelDistance);
      
      // Simple calibration: assume first measurement is the calibration distance
      const inchesPerPixel = measurementLines.length === 0 
        ? calibrationInches / pixelDistance 
        : (calibrationInches / Math.sqrt(
            Math.pow(measurementLines[0].end.x - measurementLines[0].start.x, 2) +
            Math.pow(measurementLines[0].end.y - measurementLines[0].start.y, 2)
          ));

      const lengthInInches = pixelDistance * inchesPerPixel;
      console.log("Length in inches:", lengthInInches);

      const newLine: MeasureLine = {
        id: "line-" + Date.now(),
        start: newPoints[0],
        end: newPoints[1],
        length: Math.round(lengthInInches * 10) / 10,
      };

      setMeasurementLines([...measurementLines, newLine]);
      setMeasurementPoints([]);
    }
  };

  const clearLastMeasurement = () => {
    if (measurementLines.length > 0) {
      setMeasurementLines(measurementLines.slice(0, -1));
    }
    setMeasurementPoints([]);
  };

  const clearAllMeasurements = () => {
    setMeasurementLines([]);
    setMeasurementPoints([]);
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
        label: `${line.length}"`,
      })),
      notes,
      type: measurementType,
    });

    setShowSaveModal(false);
    Alert.alert(
      "Measurement Saved",
      `Your ${measurementType === "remnant" ? "remnant" : "space"} measurement has been saved to your profile.`,
      [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  // Save Modal
  const SaveMeasurementModal = () => (
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
  );

  // Measure Mode - After photo captured
  if (mode === "measure" && capturedImage) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "black" }}>
          {/* Image Container */}
          <View style={{ flex: 1, position: "relative" }}>
            <Image
              source={{ uri: capturedImage }}
              style={{ width: "100%", height: "100%"}}
              resizeMode="contain"
            />

            {/* Tap overlay - captures all touches */}
            <Pressable
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              onPress={(e) => {
                const { locationX, locationY } = e.nativeEvent;
                console.log("✅ Tap detected at:", locationX, locationY);
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

                    {/* Length Label */}
                    <View
                      style={{
                        position: "absolute",
                        left: (line.start.x + line.end.x) / 2 - 30,
                        top: (line.start.y + line.end.y) / 2 - 18,
                        backgroundColor: colors.accent[500],
                        borderRadius: 8,
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderWidth: 2,
                        borderColor: "white",
                      }}
                    >
                      <Text style={{
                        fontSize: 13,
                        fontWeight: "700",
                        color: "white",
                      }}>
                        {line.length}"
                      </Text>
                    </View>
                  </View>
                );
              })}

              {/* Current point being placed */}
              {measurementPoints.length === 1 && (
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

              {/* Tap indicator - visual feedback */}
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
          <View
            style={{
              position: "absolute",
              top: insets.top,
              left: 0,
              right: 0,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 20,
              paddingVertical: 12,
            }}
          >
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
                {measurementPoints.length === 1 ? "Tap end point" : "Tap to measure"}
              </Text>
            </View>

            <Pressable
              onPress={clearLastMeasurement}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: measurementLines.length > 0 ? colors.accent[500] : "rgba(0,0,0,0.7)",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="arrow-undo" size={22} color="white" />
            </Pressable>
          </View>

          {/* Bottom Controls */}
          <View
            style={{
              position: "absolute",
              bottom: insets.bottom,
              left: 0,
              right: 0,
              paddingHorizontal: 20,
              paddingBottom: 20,
            }}
          >
            {/* Measurements Count */}
            {measurementLines.length > 0 && (
              <View style={{
                backgroundColor: "rgba(0,0,0,0.8)",
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "white", marginBottom: 8 }}>
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
                      <Text style={{ fontSize: 13, fontWeight: "600", color: "white" }}>
                        #{index + 1}: {line.length}"
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.7)",
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: "white",
                }}
                onPress={retake}
              >
                <Ionicons name="camera" size={22} color="white" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "white", marginTop: 4 }}>
                  Retake
                </Text>
              </Pressable>

              <Pressable
                style={{
                  flex: 1,
                  backgroundColor: "rgba(0,0,0,0.7)",
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: "white",
                }}
                onPress={clearAllMeasurements}
              >
                <Ionicons name="trash" size={22} color="white" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "white", marginTop: 4 }}>
                  Clear
                </Text>
              </Pressable>

              <Pressable
                style={{
                  flex: 1.5,
                  backgroundColor: measurementLines.length > 0 ? colors.accent[500] : "rgba(150,150,150,0.7)",
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: "center",
                  borderWidth: 2,
                  borderColor: "white",
                }}
                onPress={() => measurementLines.length > 0 && setShowSaveModal(true)}
                disabled={measurementLines.length === 0}
              >
                <Ionicons name="save" size={22} color="white" />
                <Text style={{ fontSize: 13, fontWeight: "600", color: "white", marginTop: 4 }}>
                  Save ({measurementLines.length})
                </Text>
              </Pressable>
            </View>
          </View>

          <SaveMeasurementModal />
        </View>
      </GestureHandlerRootView>
    );
  }

  // Loading permission state
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
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              padding: 8,
            }}
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
            To help you measure with precision, we need access to your camera.
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
        {/* Top Controls with Safe Area */}
        <View
          style={{
            position: "absolute",
            top: insets.top,
            left: 0,
            right: 0,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 12,
          }}
        >
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
              Measurement Tool
            </Text>
          </View>

          <Pressable
            onPress={() => setShowGrid(!showGrid)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: showGrid ? colors.accent[500] : "rgba(0,0,0,0.7)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="grid" size={22} color="white" />
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

        {/* Bottom Controls */}
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom,
            left: 0,
            right: 0,
            paddingBottom: 30,
            paddingHorizontal: 20,
          }}
        >
          {/* Instructions */}
          <View style={{
            backgroundColor: "rgba(0,0,0,0.8)",
            borderRadius: 12,
            padding: 16,
            marginBottom: 20,
          }}>
            <Text style={{ fontSize: 13, color: "white", textAlign: "center", lineHeight: 20 }}>
              📸 Take a photo to start measuring{"\n"}
              Tap two points to create measurements
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
