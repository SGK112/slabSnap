import React, { useState, useRef } from "react";
import { View, Text, Pressable, StyleSheet, Dimensions, Image } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useNavigation, useRoute } from "@react-navigation/native";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type CalibrationMode = "credit-card" | "dollar-bill";

// Standard dimensions in inches
const REFERENCE_DIMENSIONS = {
  "credit-card": {
    width: 3.37,
    height: 2.125,
    name: "Credit Card",
    instructions: "Align your card within the guide",
  },
  "dollar-bill": {
    width: 6.14,
    height: 2.61,
    name: "Dollar Bill",
    instructions: "Align your bill within the guide",
  },
};

export default function CalibrationCameraScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<any>(null);
  
  const params = route.params as { mode?: CalibrationMode; onCalibrate?: (pixelsPerInch: number) => void } | undefined;
  const mode = (params?.mode || "credit-card") as CalibrationMode;
  const onCalibrate = params?.onCalibrate;
  
  const [permission, requestPermission] = useCameraPermissions();
  const [facing] = useState<CameraType>("back");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAligned, setIsAligned] = useState(false);
  const [alignmentQuality, setAlignmentQuality] = useState(0); // 0-100
  
  const referenceDims = REFERENCE_DIMENSIONS[mode];
  
  // Calculate overlay dimensions (maintain aspect ratio)
  const OVERLAY_WIDTH = SCREEN_WIDTH * 0.85;
  const OVERLAY_HEIGHT = OVERLAY_WIDTH * (referenceDims.height / referenceDims.width);
  
  // Calculate pixels per inch based on overlay size
  const calculatePixelsPerInch = () => {
    const pixelsPerInch = OVERLAY_WIDTH / referenceDims.width;
    return Math.round(pixelsPerInch * 10) / 10;
  };

  React.useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // Simulated alignment detection (in production, you'd use edge detection)
  React.useEffect(() => {
    // Simulate alignment quality fluctuation
    const interval = setInterval(() => {
      const quality = Math.random() * 100;
      setAlignmentQuality(quality);
      setIsAligned(quality > 70);
      
      if (quality > 85) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.9,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        console.error("Failed to take picture", error);
      }
    }
  };

  const confirmCalibration = () => {
    const pixelsPerInch = calculatePixelsPerInch();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    if (onCalibrate) {
      onCalibrate(pixelsPerInch);
    }
    
    navigation.goBack();
  };

  const retake = () => {
    setCapturedImage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Permission screens
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: colors.text.secondary }}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}>
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
            Align your {referenceDims.name.toLowerCase()} to calibrate measurements
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

          <Pressable onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
            <Text style={{ fontSize: 15, color: colors.text.tertiary }}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Preview captured image
  if (capturedImage) {
    return (
      <View style={styles.fullScreen}>
        <Image
          source={{ uri: capturedImage }}
          style={styles.fullScreen}
          resizeMode="contain"
        />
        
        {/* Overlay guide on preview */}
        <View style={styles.overlayContainer}>
          <View
            style={[
              styles.overlay,
              {
                width: OVERLAY_WIDTH,
                height: OVERLAY_HEIGHT,
                borderColor: colors.accent[500],
                borderWidth: 3,
                borderRadius: 12,
                backgroundColor: "rgba(249, 115, 22, 0.1)",
              },
            ]}
          >
            {/* Corner markers */}
            {[
              { top: -2, left: -2 },
              { top: -2, right: -2 },
              { bottom: -2, left: -2 },
              { bottom: -2, right: -2 },
            ].map((position, index) => (
              <View
                key={index}
                style={[
                  styles.cornerMarker,
                  position,
                  { borderColor: colors.accent[500] },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Top Bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <View style={styles.topBarContent}>
            <Pressable onPress={retake} style={styles.topBarButton}>
              <Ionicons name="arrow-back" size={24} color="white" />
            </Pressable>
            
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Preview</Text>
            </View>
            
            <View style={{ width: 40 }} />
          </View>
        </View>

        {/* Bottom Actions */}
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.previewInfo}>
            <Ionicons name="checkmark-circle" size={24} color={colors.accent[500]} />
            <Text style={styles.previewInfoText}>
              Calibration: {calculatePixelsPerInch()} pixels per inch
            </Text>
          </View>

          <View style={styles.actionButtons}>
            <Pressable onPress={retake} style={[styles.actionButton, styles.retakeButton]}>
              <Ionicons name="camera-reverse" size={24} color="white" />
              <Text style={styles.actionButtonText}>Retake</Text>
            </Pressable>

            <Pressable onPress={confirmCalibration} style={[styles.actionButton, styles.confirmButton]}>
              <Ionicons name="checkmark" size={24} color="white" />
              <Text style={styles.actionButtonText}>Confirm</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  // Camera view with overlay
  return (
    <View style={styles.fullScreen}>
      <CameraView ref={cameraRef} style={styles.fullScreen} facing={facing}>
        {/* Dark overlay with cutout effect */}
        <View style={styles.darkOverlay}>
          <View style={styles.overlayTop} />
          
          <View style={styles.overlayMiddle}>
            <View style={styles.overlaySide} />
            
            {/* The guide box */}
            <View
              style={[
                styles.guideBox,
                {
                  width: OVERLAY_WIDTH,
                  height: OVERLAY_HEIGHT,
                },
              ]}
            >
              {/* Animated border */}
              <View
                style={[
                  styles.guideBorder,
                  {
                    borderColor: isAligned ? colors.accent[500] : "white",
                    borderWidth: isAligned ? 4 : 3,
                    backgroundColor: isAligned 
                      ? "rgba(249, 115, 22, 0.15)" 
                      : "transparent",
                  },
                ]}
              >
                {/* Corner markers */}
                {[
                  { top: -3, left: -3, borderTopWidth: 4, borderLeftWidth: 4 },
                  { top: -3, right: -3, borderTopWidth: 4, borderRightWidth: 4 },
                  { bottom: -3, left: -3, borderBottomWidth: 4, borderLeftWidth: 4 },
                  { bottom: -3, right: -3, borderBottomWidth: 4, borderRightWidth: 4 },
                ].map((position, index) => (
                  <View
                    key={index}
                    style={[
                      styles.cornerMarker,
                      position,
                      { borderColor: isAligned ? colors.accent[500] : "white" },
                    ]}
                  />
                ))}
                
                {/* Center crosshair */}
                <View style={styles.crosshair}>
                  <View style={[styles.crosshairLine, styles.crosshairHorizontal]} />
                  <View style={[styles.crosshairLine, styles.crosshairVertical]} />
                </View>
              </View>
            </View>
            
            <View style={styles.overlaySide} />
          </View>
          
          <View style={styles.overlayBottom} />
        </View>

        {/* Top Bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 12 }]}>
          <View style={styles.topBarContent}>
            <Pressable onPress={() => navigation.goBack()} style={styles.topBarButton}>
              <Ionicons name="close" size={26} color="white" />
            </Pressable>
            
            <View style={styles.badge}>
              <Ionicons name="construct" size={16} color="white" style={{ marginRight: 6 }} />
              <Text style={styles.badgeText}>Calibrate</Text>
            </View>
            
            <View style={{ width: 44 }} />
          </View>
        </View>

        {/* Instructions Card */}
        <View style={[styles.instructionsCard, { top: insets.top + 80 }]}>
          <View style={styles.instructionsHeader}>
            <Ionicons 
              name={mode === "credit-card" ? "card" : "cash"} 
              size={24} 
              color={colors.accent[500]} 
            />
            <Text style={styles.instructionsTitle}>{referenceDims.name}</Text>
          </View>
          <Text style={styles.instructionsText}>{referenceDims.instructions}</Text>
          
          {/* Alignment indicator */}
          <View style={styles.alignmentIndicator}>
            <View style={styles.alignmentBarContainer}>
              <View 
                style={[
                  styles.alignmentBar,
                  { 
                    width: `${alignmentQuality}%`,
                    backgroundColor: 
                      alignmentQuality > 80 ? "#10b981" :
                      alignmentQuality > 50 ? "#f59e0b" :
                      "#ef4444"
                  },
                ]} 
              />
            </View>
            <Text style={styles.alignmentText}>
              {isAligned ? "✓ Aligned - Ready to capture" : "Position your card/bill"}
            </Text>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 30 }]}>
          {/* Dimension labels */}
          <View style={styles.dimensionLabels}>
            <View style={styles.dimensionLabel}>
              <Text style={styles.dimensionText}>
                Width: {referenceDims.width}"
              </Text>
            </View>
            <View style={styles.dimensionLabel}>
              <Text style={styles.dimensionText}>
                Height: {referenceDims.height}"
              </Text>
            </View>
          </View>

          {/* Capture button */}
          <Pressable
            onPress={takePicture}
            style={[
              styles.captureButton,
              isAligned && styles.captureButtonAligned,
            ]}
          >
            <View style={[
              styles.captureButtonInner,
              isAligned && styles.captureButtonInnerAligned,
            ]}>
              {isAligned && (
                <Ionicons name="checkmark" size={32} color="white" />
              )}
            </View>
          </Pressable>

          {/* Tip */}
          <View style={styles.tipContainer}>
            <Ionicons name="bulb" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={styles.tipText}>
              Place on a flat, well-lit surface
            </Text>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  fullScreen: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "black",
  },
  darkOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
  },
  overlayTop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  overlayMiddle: {
    flexDirection: "row",
  },
  overlaySide: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  overlayContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  overlay: {
    justifyContent: "center",
    alignItems: "center",
  },
  guideBox: {
    justifyContent: "center",
    alignItems: "center",
  },
  guideBorder: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cornerMarker: {
    position: "absolute",
    width: 30,
    height: 30,
  },
  crosshair: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  crosshairLine: {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
  crosshairHorizontal: {
    width: 40,
    height: 2,
  },
  crosshairVertical: {
    width: 2,
    height: 40,
    position: "absolute",
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  topBarContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topBarButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  badgeText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
  instructionsCard: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  instructionsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    marginLeft: 10,
  },
  instructionsText: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 12,
    lineHeight: 20,
  },
  alignmentIndicator: {
    marginTop: 8,
  },
  alignmentBarContainer: {
    height: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  alignmentBar: {
    height: "100%",
    borderRadius: 3,
  },
  alignmentText: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
    textAlign: "center",
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  dimensionLabels: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  dimensionLabel: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  dimensionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "white",
  },
  captureButton: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  captureButtonAligned: {
    borderColor: colors.accent[500],
  },
  captureButtonInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureButtonInnerAligned: {
    backgroundColor: colors.accent[500],
  },
  tipContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  tipText: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
  },
  previewInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginBottom: 16,
  },
  previewInfoText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
  },
  retakeButton: {
    backgroundColor: "rgba(100, 100, 100, 0.9)",
  },
  confirmButton: {
    backgroundColor: colors.accent[500],
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
});
