import React, { useState, useRef } from "react";
import { View, Text, Pressable, Image, TextInput, Modal, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav/RootNavigator";
import { useAuthStore } from "../state/authStore";
import { useMeasurementsStore } from "../state/measurementsStore";
import * as ImagePicker from "expo-image-picker";
import { CameraView, CameraType, useCameraPermissions } from "expo-camera";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { validateMeasurements, MEASUREMENT_TEMPLATES, generateMeasurementSummary } from "../utils/measurementAI";
import { detectShapesInImage, convertShapeToPin, shouldUseCurves, ShapeDetectionResult } from "../utils/shapeDetection";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Pin {
  id: string;
  x: number;
  y: number;
}

interface Line {
  id: string;
  startPin: string;
  endPin: string;
  length: number;
  angle?: number; // Angle in degrees
  isCurved?: boolean; // Whether this line represents a curve
  curvePoints?: { x: number; y: number }[]; // Points along a curve
  isBumpOut?: boolean; // Whether this is a bump-out/protrusion
}

interface PhotoMeasurement {
  uri: string;
  pins: Pin[];
  lines: Line[];
  dimensions?: {
    length: number;
    width: number;
    area: number;
  };
  timestamp: number;
}

type MeasurementUnit = "inches" | "cm" | "feet";

export default function SmartMeasurementScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { addMeasurement } = useMeasurementsStore();
  const cameraRef = useRef<any>(null);
  
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>("back");
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [photoGallery, setPhotoGallery] = useState<PhotoMeasurement[]>([]);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);
  
  // Measurement state
  const [pins, setPins] = useState<Pin[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [isDraggingLine, setIsDraggingLine] = useState(false);
  const [isDraggingPin, setIsDraggingPin] = useState(false);
  const [dragLineStart, setDragLineStart] = useState<Pin | null>(null);
  const [dragLineEnd, setDragLineEnd] = useState<{ x: number; y: number } | null>(null);
  const [snapTargetPin, setSnapTargetPin] = useState<Pin | null>(null);
  const [draggingPinId, setDraggingPinId] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<any>(null);
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [shapeDetectionMode, setShapeDetectionMode] = useState<"straight" | "angle" | "curve" | "bumpout">("straight");
  const [curvePoints, setCurvePoints] = useState<{ x: number; y: number }[]>([]);
  
  // History for undo/redo
  const [history, setHistory] = useState<Array<{ pins: Pin[]; lines: Line[] }>>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Dimensions
  const [dimensions, setDimensions] = useState<{ length: number; width: number; area: number } | null>(null);
  
  // Modal states
  const [showDimensionsForm, setShowDimensionsForm] = useState(false);
  const [showSearchForm, setShowSearchForm] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCameraTooltip, setShowCameraTooltip] = useState(true);
  const [showUnitsModal, setShowUnitsModal] = useState(false);
  const [showCalibrationModal, setShowCalibrationModal] = useState(false);
  const [measurementType, setMeasurementType] = useState<"remnant" | "space">("space");
  const [notes, setNotes] = useState("");
  const [showTemplates, setShowTemplates] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  
  // Units and calibration
  const [units, setUnits] = useState<MeasurementUnit>("inches");
  const [pixelsPerInch, setPixelsPerInch] = useState(20);

  // Auto-detect and UI visibility state
  const [showGallery, setShowGallery] = useState(true);
  const [showBottomTools, setShowBottomTools] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionResult, setDetectionResult] = useState<ShapeDetectionResult | null>(null);
  const [imageLayout, setImageLayout] = useState<{ width: number; height: number } | null>(null);

  // Auto-dismiss camera tooltip after 10 seconds
  React.useEffect(() => {
    if (showCameraTooltip && !currentPhoto) {
      const timer = setTimeout(() => {
        setShowCameraTooltip(false);
      }, 10000); // 10 seconds
      return () => clearTimeout(timer);
    }
  }, [showCameraTooltip, currentPhoto]);

  // Show tutorial on first photo - but with a delay and only once
  React.useEffect(() => {
    if (currentPhoto && photoGallery.length === 1 && pins.length === 0 && !showTutorial) {
      // Show tutorial after a short delay (1.5 seconds)
      const timer = setTimeout(() => setShowTutorial(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [currentPhoto, photoGallery.length]);

  // Auto-dismiss tutorial after 8 seconds if user doesn't dismiss it
  React.useEffect(() => {
    if (showTutorial) {
      const autoDismissTimer = setTimeout(() => {
        setShowTutorial(false);
      }, 8000); // 8 seconds
      return () => clearTimeout(autoDismissTimer);
    }
  }, [showTutorial]);

  // Unit conversion helpers
  const convertFromInches = (inches: number): number => {
    if (units === "cm") return inches * 2.54;
    if (units === "feet") return inches / 12;
    return inches;
  };
  
  const getUnitLabel = (): string => {
    if (units === "cm") return "cm";
    if (units === "feet") return "ft";
    return "\"";
  };
  
  const formatMeasurement = (inches: number): string => {
    const value = convertFromInches(inches);
    return `${value.toFixed(1)}${getUnitLabel()}`;
  };
  
  // Shape detection helpers
  const calculateAngle = (pin1: Pin, pin2: Pin, pin3: Pin): number => {
    // Calculate angle at pin2 formed by pin1-pin2-pin3
    const v1 = { x: pin1.x - pin2.x, y: pin1.y - pin2.y };
    const v2 = { x: pin3.x - pin2.x, y: pin3.y - pin2.y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
    
    const angleRad = Math.acos(dot / (mag1 * mag2));
    return (angleRad * 180) / Math.PI;
  };
  
  const detectAngle = (line1: Line, line2: Line): number | null => {
    // Detect if two lines form an angle and calculate it
    const line1Start = pins.find(p => p.id === line1.startPin);
    const line1End = pins.find(p => p.id === line1.endPin);
    const line2Start = pins.find(p => p.id === line2.startPin);
    const line2End = pins.find(p => p.id === line2.endPin);
    
    if (!line1Start || !line1End || !line2Start || !line2End) return null;
    
    // Find common pin (corner)
    let cornerPin: Pin | null = null;
    let otherPin1: Pin | null = null;
    let otherPin2: Pin | null = null;
    
    if (line1End.id === line2Start.id) {
      cornerPin = line1End;
      otherPin1 = line1Start;
      otherPin2 = line2End;
    } else if (line1End.id === line2End.id) {
      cornerPin = line1End;
      otherPin1 = line1Start;
      otherPin2 = line2Start;
    } else if (line1Start.id === line2Start.id) {
      cornerPin = line1Start;
      otherPin1 = line1End;
      otherPin2 = line2End;
    } else if (line1Start.id === line2End.id) {
      cornerPin = line1Start;
      otherPin1 = line1End;
      otherPin2 = line2Start;
    }
    
    if (cornerPin && otherPin1 && otherPin2) {
      return calculateAngle(otherPin1, cornerPin, otherPin2);
    }
    
    return null;
  };
  
  const detectCurve = (points: { x: number; y: number }[]): boolean => {
    // Detect if points form a curve by checking if they deviate from straight line
    if (points.length < 3) return false;
    
    const first = points[0];
    const last = points[points.length - 1];
    
    // Calculate expected straight line
    const lineLength = Math.sqrt(
      Math.pow(last.x - first.x, 2) + Math.pow(last.y - first.y, 2)
    );
    
    // Check deviation of middle points
    let maxDeviation = 0;
    for (let i = 1; i < points.length - 1; i++) {
      const point = points[i];
      // Calculate perpendicular distance from point to line
      const deviation = Math.abs(
        ((last.y - first.y) * point.x - (last.x - first.x) * point.y + last.x * first.y - last.y * first.x) /
        lineLength
      );
      maxDeviation = Math.max(maxDeviation, deviation);
    }
    
    // If max deviation is more than 10% of line length, it's a curve
    return maxDeviation > lineLength * 0.1;
  };
  
  const calculateCurveLength = (points: { x: number; y: number }[]): number => {
    // Calculate arc length along curve points
    let length = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      length += Math.sqrt(dx * dx + dy * dy);
    }
    return length;
  };
  
  const detectBumpOut = (existingLines: Line[], newLine: Line): boolean => {
    // Detect if a new line creates a bump-out (protrusion) pattern
    if (existingLines.length < 2) return false;
    
    const startPin = pins.find(p => p.id === newLine.startPin);
    const endPin = pins.find(p => p.id === newLine.endPin);
    if (!startPin || !endPin) return false;
    
    // Check if this line is perpendicular to existing lines and creates an outward pattern
    for (const line of existingLines.slice(-2)) {
      const lineStart = pins.find(p => p.id === line.startPin);
      const lineEnd = pins.find(p => p.id === line.endPin);
      if (!lineStart || !lineEnd) continue;
      
      // Calculate angle between lines
      const v1 = { x: lineEnd.x - lineStart.x, y: lineEnd.y - lineStart.y };
      const v2 = { x: endPin.x - startPin.x, y: endPin.y - startPin.y };
      
      const dot = v1.x * v2.x + v1.y * v2.y;
      const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
      const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
      
      const angle = Math.acos(dot / (mag1 * mag2)) * (180 / Math.PI);
      
      // If angle is close to 90 degrees (80-100), it's potentially a bump-out
      if (angle > 80 && angle < 100) {
        return true;
      }
    }
    
    return false;
  };
  
  // History management
  const saveToHistory = (newPins: Pin[], newLines: Line[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push({ pins: [...newPins], lines: [...newLines] });
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setPins(prevState.pins);
      setLines(prevState.lines);
      setHistoryIndex(historyIndex - 1);
      if (prevState.pins.length >= 4 && prevState.lines.length >= 2) {
        calculateDimensions(prevState.pins, prevState.lines);
      } else {
        setDimensions(null);
      }
      updateCurrentPhotoInGallery(prevState.pins, prevState.lines);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
  
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setPins(nextState.pins);
      setLines(nextState.lines);
      setHistoryIndex(historyIndex + 1);
      if (nextState.pins.length >= 4 && nextState.lines.length >= 2) {
        calculateDimensions(nextState.pins, nextState.lines);
      } else {
        setDimensions(null);
      }
      updateCurrentPhotoInGallery(nextState.pins, nextState.lines);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({ quality: 0.9 });
        
        const newPhoto: PhotoMeasurement = {
          uri: photo.uri,
          pins: [],
          lines: [],
          timestamp: Date.now(),
        };
        
        setPhotoGallery([newPhoto, ...photoGallery]);
        setCurrentPhoto(photo.uri);
        setSelectedPhotoIndex(0);
        setPins([]);
        setLines([]);
        setDimensions(null);
        setHistory([]);
        setHistoryIndex(-1);
      } catch (error) {
        console.error("Failed to take picture", error);
      }
    }
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: false,
      quality: 0.9,
    });

    if (!result.canceled) {
      const newPhoto: PhotoMeasurement = {
        uri: result.assets[0].uri,
        pins: [],
        lines: [],
        timestamp: Date.now(),
      };
      
      setPhotoGallery([newPhoto, ...photoGallery]);
      setCurrentPhoto(result.assets[0].uri);
      setSelectedPhotoIndex(0);
      setPins([]);
      setLines([]);
      setDimensions(null);
      setHistory([]);
      setHistoryIndex(-1);
    }
  };

  const selectPhotoFromGallery = (index: number) => {
    const photo = photoGallery[index];
    setCurrentPhoto(photo.uri);
    setSelectedPhotoIndex(index);
    setPins(photo.pins);
    setLines(photo.lines);
    setDimensions(photo.dimensions || null);
  };

  // Auto-detect shape using AI
  const autoDetectShape = async () => {
    if (!currentPhoto || !imageLayout) return;
    
    setIsDetecting(true);
    setDetectionResult(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      const result = await detectShapesInImage(currentPhoto);
      setDetectionResult(result);
      
      if (result.primaryShape) {
        // Convert detected shape to pins
        const pinPositions = convertShapeToPin(
          result.primaryShape,
          imageLayout.width,
          imageLayout.height
        );
        
        // Create pins
        const newPins: Pin[] = pinPositions.map((pos, i) => ({
          id: `pin-${Date.now()}-${i}`,
          x: pos.x,
          y: pos.y,
        }));
        
        // Create lines connecting pins
        const newLines: Line[] = [];
        for (let i = 0; i < newPins.length; i++) {
          const start = newPins[i];
          const end = newPins[(i + 1) % newPins.length];
          
          const dx = end.x - start.x;
          const dy = end.y - start.y;
          const length = Math.sqrt(dx * dx + dy * dy);
          
          newLines.push({
            id: `line-${Date.now()}-${i}`,
            startPin: start.id,
            endPin: end.id,
            length,
            isCurved: shouldUseCurves(result.primaryShape.type),
          });
        }
        
        setPins(newPins);
        setLines(newLines);
        saveToHistory(newPins, newLines);
        updateCurrentPhotoInGallery(newPins, newLines);
        
        // Calculate dimensions if we have enough data
        if (newPins.length >= 3) {
          calculateDimensions(newPins, newLines);
        }
        
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (error) {
      console.error("Auto-detect failed:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsDetecting(false);
    }
  };

  // Toggle functions for UI visibility
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
    setShowGallery(!isFullScreen);
    setShowBottomTools(!isFullScreen);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const dismissGallery = () => {
    setShowGallery(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const dismissBottomTools = () => {
    setShowBottomTools(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleImageTap = (x: number, y: number) => {
    if (isDraggingLine || isDraggingPin) return;
    
    const newPin: Pin = {
      id: `pin-${Date.now()}`,
      x,
      y,
    };
    
    const updatedPins = [...pins, newPin];
    setPins(updatedPins);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Auto-connect to previous pin
    if (pins.length > 0) {
      const lastPin = pins[pins.length - 1];
      const distance = Math.sqrt(
        Math.pow(newPin.x - lastPin.x, 2) + Math.pow(newPin.y - lastPin.y, 2)
      );
      
      const newLine: Line = {
        id: `line-${Date.now()}`,
        startPin: lastPin.id,
        endPin: newPin.id,
        length: distance,
      };
      
      let updatedLines = [...lines, newLine];
      
      // Auto-close the shape when 4th pin is placed (complete the box)
      if (updatedPins.length === 4 && pins.length === 3) {
        const firstPin = updatedPins[0];
        const closingDistance = Math.sqrt(
          Math.pow(firstPin.x - newPin.x, 2) + Math.pow(firstPin.y - newPin.y, 2)
        );
        
        const closingLine: Line = {
          id: `line-close-${Date.now()}`,
          startPin: newPin.id,
          endPin: firstPin.id,
          length: closingDistance,
        };
        
        updatedLines = [...updatedLines, closingLine];
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      setLines(updatedLines);
      
      if (updatedPins.length >= 4) {
        calculateDimensions(updatedPins, updatedLines);
      }
      
      saveToHistory(updatedPins, updatedLines);
      updateCurrentPhotoInGallery(updatedPins, updatedLines);
    } else {
      saveToHistory(updatedPins, lines);
      updateCurrentPhotoInGallery(updatedPins, lines);
    }
  };

  const startDragLine = (pin: Pin) => {
    setIsDraggingLine(true);
    setDragLineStart(pin);
    setDragLineEnd({ x: pin.x, y: pin.y });
  };

  const updateDragLine = (x: number, y: number) => {
    if (isDraggingLine) {
      // Capture points for curve detection
      if (shapeDetectionMode === "curve") {
        setCurvePoints(prev => [...prev, { x, y }]);
      }
      
      const snapDistance = 50;
      const nearbyPin = pins.find(p => {
        const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
        return dist < snapDistance && p.id !== dragLineStart?.id;
      });
      
      if (nearbyPin) {
        setDragLineEnd({ x: nearbyPin.x, y: nearbyPin.y });
        if (snapTargetPin?.id !== nearbyPin.id) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSnapTargetPin(nearbyPin);
        }
      } else {
        setDragLineEnd({ x, y });
        if (snapTargetPin) {
          setSnapTargetPin(null);
        }
      }
    }
  };

  const endDragLine = (x: number, y: number) => {
    if (!isDraggingLine || !dragLineStart) return;
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const snapDistance = 50;
    const nearbyPin = pins.find(p => {
      const dist = Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2));
      return dist < snapDistance && p.id !== dragLineStart.id;
    });
    
    let endPin: Pin;
    let updatedPins = [...pins];
    
    if (nearbyPin) {
      endPin = nearbyPin;
    } else {
      endPin = {
        id: `pin-${Date.now()}`,
        x,
        y,
      };
      updatedPins = [...pins, endPin];
      setPins(updatedPins);
    }
    
    const distance = Math.sqrt(
      Math.pow(endPin.x - dragLineStart.x, 2) + Math.pow(endPin.y - dragLineStart.y, 2)
    );
    
    // Calculate line angle
    const angleRad = Math.atan2(endPin.y - dragLineStart.y, endPin.x - dragLineStart.x);
    const angleDeg = (angleRad * 180) / Math.PI;
    
    const newLine: Line = {
      id: `line-${Date.now()}`,
      startPin: dragLineStart.id,
      endPin: endPin.id,
      length: distance,
      angle: angleDeg,
      isCurved: shapeDetectionMode === "curve" && curvePoints.length > 0 ? detectCurve(curvePoints) : false,
      curvePoints: shapeDetectionMode === "curve" && curvePoints.length > 0 ? [...curvePoints] : undefined,
      isBumpOut: shapeDetectionMode === "bumpout" ? detectBumpOut(lines, {
        id: "temp",
        startPin: dragLineStart.id,
        endPin: endPin.id,
        length: distance,
      }) : false,
    };
    
    const updatedLines = [...lines, newLine];
    setLines(updatedLines);
    
    // Detect angles if we have at least 2 lines
    if (updatedLines.length >= 2) {
      const lastTwoLines = updatedLines.slice(-2);
      const detectedAngle = detectAngle(lastTwoLines[0], lastTwoLines[1]);
      if (detectedAngle !== null) {
        // Store angle information on the second line
        lastTwoLines[1].angle = detectedAngle;
      }
    }
    
    if (updatedPins.length >= 4) {
      calculateDimensions(updatedPins, updatedLines);
    }
    
    saveToHistory(updatedPins, updatedLines);
    updateCurrentPhotoInGallery(updatedPins, updatedLines);
    
    setIsDraggingLine(false);
    setDragLineStart(null);
    setDragLineEnd(null);
    setSnapTargetPin(null);
    setCurvePoints([]);
  };

  // Pin dragging for repositioning
  const handlePinPressIn = (pin: Pin) => {
    const timer = setTimeout(() => {
      handlePinLongPress(pin.id);
    }, 500);
    setLongPressTimer(timer);
  };

  const handlePinPressOut = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  const startDragPin = (pin: Pin) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    setIsDraggingPin(true);
    setDraggingPinId(pin.id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const updateDraggedPin = (x: number, y: number) => {
    if (isDraggingPin && draggingPinId) {
      const updatedPins = pins.map(p => {
        if (p.id === draggingPinId) {
          return { ...p, x, y };
        }
        return p;
      });
      setPins(updatedPins);
      
      const updatedLines = lines.map(line => {
        const startPin = updatedPins.find(p => p.id === line.startPin);
        const endPin = updatedPins.find(p => p.id === line.endPin);
        if (startPin && endPin) {
          const distance = Math.sqrt(
            Math.pow(endPin.x - startPin.x, 2) + Math.pow(endPin.y - startPin.y, 2)
          );
          return { ...line, length: distance };
        }
        return line;
      });
      setLines(updatedLines);
      
      if (updatedPins.length >= 4 && updatedLines.length >= 2) {
        calculateDimensions(updatedPins, updatedLines);
      }
    }
  };

  const endDraggedPin = () => {
    if (isDraggingPin) {
      setIsDraggingPin(false);
      setDraggingPinId(null);
      saveToHistory(pins, lines);
      updateCurrentPhotoInGallery(pins, lines);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handlePinLongPress = (pinId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const updatedPins = pins.filter(p => p.id !== pinId);
    const updatedLines = lines.filter(l => l.startPin !== pinId && l.endPin !== pinId);
    setPins(updatedPins);
    setLines(updatedLines);
    
    if (updatedPins.length >= 4 && updatedLines.length >= 2) {
      calculateDimensions(updatedPins, updatedLines);
    } else {
      setDimensions(null);
    }
    
    saveToHistory(updatedPins, updatedLines);
    updateCurrentPhotoInGallery(updatedPins, updatedLines);
  };

  const handleDeleteLine = (lineId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updatedLines = lines.filter(l => l.id !== lineId);
    setLines(updatedLines);
    setSelectedLine(null);
    
    if (pins.length >= 4 && updatedLines.length >= 2) {
      calculateDimensions(pins, updatedLines);
    } else {
      setDimensions(null);
    }
    
    saveToHistory(pins, updatedLines);
    updateCurrentPhotoInGallery(pins, updatedLines);
  };

  const calculateDimensions = (currentPins: Pin[], currentLines: Line[]) => {
    if (currentLines.length < 3) return; // Need at least 3 lines for a triangle
    
    let dims: { length: number; width: number; area: number } | null = null;
    
    // For rectangles (4 pins, 4 lines), find length and width
    if (currentPins.length === 4 && currentLines.length === 4) {
      const sortedLines = [...currentLines].sort((a, b) => b.length - a.length);
      const length = sortedLines[0].length / pixelsPerInch;
      const width = sortedLines[1].length / pixelsPerInch;
      
      const area = length * width;
      
      dims = {
        length: Math.round(length * 10) / 10,
        width: Math.round(width * 10) / 10,
        area: Math.round(area * 10) / 10,
      };
      
      setDimensions(dims);
    } else {
      // For other shapes, calculate area using polygon formula
      if (currentPins.length >= 3) {
        // Calculate perimeter
        const totalPerimeter = currentLines.reduce((sum, line) => sum + (line.length / pixelsPerInch), 0);
        
        // Calculate area using shoelace formula
        let area = 0;
        for (let i = 0; i < currentPins.length; i++) {
          const j = (i + 1) % currentPins.length;
          area += currentPins[i].x * currentPins[j].y;
          area -= currentPins[j].x * currentPins[i].y;
        }
        area = Math.abs(area / 2) / (pixelsPerInch * pixelsPerInch);
        
        // Estimate length and width from bounding box
        const xCoords = currentPins.map(p => p.x);
        const yCoords = currentPins.map(p => p.y);
        const length = (Math.max(...xCoords) - Math.min(...xCoords)) / pixelsPerInch;
        const width = (Math.max(...yCoords) - Math.min(...yCoords)) / pixelsPerInch;
        
        dims = {
          length: Math.round(length * 10) / 10,
          width: Math.round(width * 10) / 10,
          area: Math.round(area * 10) / 10,
        };
        
        setDimensions(dims);
      }
    }
    
    // Validate measurements
    const validation = validateMeasurements(currentPins, currentLines.map(l => ({ length: l.length / pixelsPerInch })));
    if (!validation.isValid || validation.warnings.length > 0) {
      setShowValidation(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
    
    if (selectedPhotoIndex !== null && dims) {
      const updatedGallery = [...photoGallery];
      updatedGallery[selectedPhotoIndex].dimensions = dims;
      setPhotoGallery(updatedGallery);
    }
  };

  const updateCurrentPhotoInGallery = (currentPins: Pin[], currentLines: Line[]) => {
    if (selectedPhotoIndex !== null) {
      const updatedGallery = [...photoGallery];
      updatedGallery[selectedPhotoIndex].pins = currentPins;
      updatedGallery[selectedPhotoIndex].lines = currentLines;
      setPhotoGallery(updatedGallery);
    }
  };

  const clearMeasurements = () => {
    setPins([]);
    setLines([]);
    setDimensions(null);
    setDragLineStart(null);
    setDragLineEnd(null);
    setIsDraggingLine(false);
    setHistory([]);
    setHistoryIndex(-1);
    
    if (selectedPhotoIndex !== null) {
      const updatedGallery = [...photoGallery];
      updatedGallery[selectedPhotoIndex].pins = [];
      updatedGallery[selectedPhotoIndex].lines = [];
      updatedGallery[selectedPhotoIndex].dimensions = undefined;
      setPhotoGallery(updatedGallery);
    }
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const saveToProfile = () => {
    if (!user) {
      return;
    }

    if (!currentPhoto || !dimensions) {
      return;
    }

    addMeasurement({
      userId: user.id,
      imageUri: currentPhoto,
      points: pins.map(p => ({ x: p.x, y: p.y })),
      measurements: lines.map(l => {
        const startPin = pins.find(p => p.id === l.startPin)!;
        const endPin = pins.find(p => p.id === l.endPin)!;
        return {
          id: l.id,
          start: { x: startPin.x, y: startPin.y },
          end: { x: endPin.x, y: endPin.y },
          length: l.length / pixelsPerInch,
          label: formatMeasurement(l.length / pixelsPerInch),
        };
      }),
      totalLength: dimensions.length,
      totalWidth: dimensions.width,
      notes,
      type: measurementType,
    });

    setShowDimensionsForm(false);
    navigation.goBack();
  };

  const getPinForId = (id: string): Pin | undefined => {
    return pins.find(p => p.id === id);
  };

  // Tutorial Modal
  const TutorialModal = () => (
    <Modal
      visible={showTutorial}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTutorial(false)}
    >
      <Pressable 
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 20 }}
        onPress={() => setShowTutorial(false)}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
        >
          <BlurView 
            intensity={95} 
            tint="dark"
            style={{ 
              borderRadius: 24, 
              padding: 24, 
              width: "100%",
              maxWidth: 400,
              borderWidth: 2, 
              borderColor: "rgba(255,255,255,0.2)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {/* Close button - top right */}
            <Pressable
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: "rgba(255,255,255,0.15)",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 10,
              }}
              onPress={() => setShowTutorial(false)}
            >
              <Text style={{ fontSize: 20, color: "white", fontWeight: "700" }}>✕</Text>
            </Pressable>

            <View style={{ alignItems: "center", marginBottom: 24 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: colors.accent[500], justifyContent: "center", alignItems: "center", marginBottom: 16 }}>
                <Ionicons name="expand" size={40} color="white" />
              </View>
              <Text style={{ fontSize: 24, fontWeight: "700", color: "white", textAlign: "center" }}>
                Smart Measurement Tool
              </Text>
              <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 4, textAlign: "center" }}>
                Professional precision made simple
              </Text>
            </View>

            <View style={{ gap: 18 }}>
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(249, 115, 22, 0.2)", justifyContent: "center", alignItems: "center", marginRight: 14, borderWidth: 2, borderColor: colors.accent[500] }}>
                  <Ionicons name="hand-left" size={20} color={colors.accent[400]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "white", marginBottom: 4 }}>
                    Tap to drop pins
                  </Text>
                  <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 20 }}>
                    Place measurement points on corners
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(249, 115, 22, 0.2)", justifyContent: "center", alignItems: "center", marginRight: 14, borderWidth: 2, borderColor: colors.accent[500] }}>
                  <Ionicons name="move" size={20} color={colors.accent[400]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "white", marginBottom: 4 }}>
                    Press & drag for lines
                  </Text>
                  <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 20 }}>
                    Connect pins to measure distances
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(249, 115, 22, 0.2)", justifyContent: "center", alignItems: "center", marginRight: 14, borderWidth: 2, borderColor: colors.accent[500] }}>
                  <Ionicons name="calculator" size={20} color={colors.accent[400]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "white", marginBottom: 4 }}>
                    Auto-calculates dimensions
                  </Text>
                  <Text style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 20 }}>
                    Get length, width, and area instantly
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ 
              marginTop: 20, 
              padding: 14, 
              backgroundColor: "rgba(249, 115, 22, 0.15)", 
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(249, 115, 22, 0.3)",
            }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="bulb" size={18} color={colors.accent[400]} style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: "500", flex: 1 }}>
                  Calibrate first for best accuracy
                </Text>
              </View>
            </View>

            <Pressable
              style={{ 
                backgroundColor: colors.accent[500], 
                borderRadius: 14, 
                paddingVertical: 16, 
                alignItems: "center", 
                marginTop: 24,
                shadowColor: colors.accent[500],
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
              }}
              onPress={() => setShowTutorial(false)}
            >
              <Text style={{ fontSize: 17, fontWeight: "700", color: "white" }}>
                Got it! Start Measuring
              </Text>
            </Pressable>

            <Text style={{ 
              fontSize: 12, 
              color: "rgba(255,255,255,0.5)", 
              textAlign: "center", 
              marginTop: 12 
            }}>
              Tap anywhere outside to dismiss
            </Text>
          </BlurView>
        </Pressable>
      </Pressable>
    </Modal>
  );

  // Render measurement screen
  if (currentPhoto) {
    return (
      <View style={{ flex: 1, backgroundColor: "black" }}>
        <View style={{ flex: 1, position: "relative" }}>
          <Image
            source={{ uri: currentPhoto }}
            style={{ width: "100%", height: "100%" }}
            resizeMode="contain"
          />

          {/* Interactive overlay */}
          <Pressable
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
            onPress={(e) => {
              if (!isDraggingLine && !isDraggingPin) {
                const { locationX, locationY } = e.nativeEvent;
                handleImageTap(locationX, locationY);
              }
            }}
            onTouchMove={(e) => {
              const touch = e.nativeEvent.touches[0];
              if (isDraggingLine) {
                updateDragLine(touch.locationX, touch.locationY);
              } else if (isDraggingPin) {
                updateDraggedPin(touch.locationX, touch.locationY);
              }
            }}
            onTouchEnd={(e) => {
              if (isDraggingLine) {
                const touch = e.nativeEvent.changedTouches[0];
                endDragLine(touch.locationX, touch.locationY);
              } else if (isDraggingPin) {
                endDraggedPin();
              }
            }}
          >
            <View style={{ flex: 1 }} pointerEvents="box-none">
              {/* Solid Lines */}
              {lines.map((line) => {
                const startPin = getPinForId(line.startPin);
                const endPin = getPinForId(line.endPin);
                if (!startPin || !endPin) return null;

                const dx = endPin.x - startPin.x;
                const dy = endPin.y - startPin.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                const angle = Math.atan2(dy, dx) * (180 / Math.PI);
                const lengthInInches = line.length / pixelsPerInch;
                const isSelected = selectedLine === line.id;

                return (
                  <View key={line.id} pointerEvents="box-none">
                    {/* Main Line or Curve */}
                    {line.isCurved && line.curvePoints ? (
                      // Render curve as connected segments
                      <>
                        {line.curvePoints.map((point, idx) => {
                          if (idx === 0) return null;
                          const prevPoint = line.curvePoints![idx - 1];
                          const segDx = point.x - prevPoint.x;
                          const segDy = point.y - prevPoint.y;
                          const segLength = Math.sqrt(segDx * segDx + segDy * segDy);
                          const segAngle = Math.atan2(segDy, segDx) * (180 / Math.PI);
                          
                          return (
                            <View
                              key={`curve-seg-${idx}`}
                              style={{
                                position: "absolute",
                                left: prevPoint.x,
                                top: prevPoint.y,
                                width: segLength,
                                height: 4,
                                backgroundColor: colors.primary[600],
                                transform: [{ rotate: `${segAngle}deg` }],
                                transformOrigin: "top left",
                              }}
                            />
                          );
                        })}
                      </>
                    ) : (
                      <View
                        style={{
                          position: "absolute",
                          left: startPin.x,
                          top: startPin.y,
                          width: length,
                          height: isSelected ? 6 : 4,
                          backgroundColor: line.isBumpOut ? colors.yellow[500] : (isSelected ? colors.accent[600] : colors.accent[500]),
                          transform: [{ rotate: `${angle}deg` }],
                          transformOrigin: "top left",
                          shadowColor: isSelected ? colors.accent[500] : "transparent",
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: 0.5,
                          shadowRadius: 8,
                        }}
                      />
                    )}
                    
                    {/* Measurement Label */}
                    <Pressable
                      onPress={() => setSelectedLine(isSelected ? null : line.id)}
                      style={{
                        position: "absolute",
                        left: (startPin.x + endPin.x) / 2 - 60,
                        top: (startPin.y + endPin.y) / 2 - 28,
                        flexDirection: "column",
                        alignItems: "center",
                        backgroundColor: isSelected ? "#dc2626" : 
                          line.isBumpOut ? colors.yellow[600] :
                          line.isCurved ? colors.primary[600] :
                          colors.accent[500],
                        borderRadius: 10,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderWidth: 2,
                        borderColor: "white",
                        gap: 2,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: "700", color: "white" }}>
                        {formatMeasurement(line.isCurved && line.curvePoints ? 
                          calculateCurveLength(line.curvePoints) / pixelsPerInch : lengthInInches)}
                      </Text>
                      {line.angle && (
                        <Text style={{ fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.9)" }}>
                          {line.angle.toFixed(0)}°
                        </Text>
                      )}
                      {line.isCurved && (
                        <Text style={{ fontSize: 9, fontWeight: "600", color: "rgba(255,255,255,0.9)" }}>
                          CURVE
                        </Text>
                      )}
                      {line.isBumpOut && (
                        <Text style={{ fontSize: 9, fontWeight: "600", color: "rgba(255,255,255,0.9)" }}>
                          BUMP
                        </Text>
                      )}
                      {isSelected && (
                        <Pressable
                          onPress={() => handleDeleteLine(line.id)}
                          style={{
                            marginTop: 4,
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: "rgba(255,255,255,0.3)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Ionicons name="close" size={14} color="white" />
                        </Pressable>
                      )}
                    </Pressable>
                  </View>
                );
              })}

              {/* Drag line preview - Dotted */}
              {isDraggingLine && dragLineStart && dragLineEnd && (
                <View pointerEvents="none">
                  {snapTargetPin && (
                    <View
                      style={{
                        position: "absolute",
                        left: snapTargetPin.x - 30,
                        top: snapTargetPin.y - 30,
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        borderWidth: 3,
                        borderColor: colors.accent[500],
                        backgroundColor: "rgba(249, 115, 22, 0.2)",
                      }}
                    />
                  )}
                  
                  {(() => {
                    const dx = dragLineEnd.x - dragLineStart.x;
                    const dy = dragLineEnd.y - dragLineStart.y;
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const dotCount = Math.floor(length / 15);
                    const dots = [];
                    
                    for (let i = 0; i <= dotCount; i++) {
                      const t = i / dotCount;
                      const x = dragLineStart.x + dx * t;
                      const y = dragLineStart.y + dy * t;
                      
                      dots.push(
                        <View
                          key={i}
                          style={{
                            position: "absolute",
                            left: x - 2,
                            top: y - 2,
                            width: 4,
                            height: 4,
                            borderRadius: 2,
                            backgroundColor: colors.accent[500],
                          }}
                        />
                      );
                    }
                    
                    return dots;
                  })()}
                  
                  <View
                    style={{
                      position: "absolute",
                      left: (dragLineStart.x + dragLineEnd.x) / 2 - 35,
                      top: (dragLineStart.y + dragLineEnd.y) / 2 - 16,
                      backgroundColor: "rgba(249, 115, 22, 0.9)",
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                      borderWidth: 2,
                      borderColor: "white",
                    }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: "700", color: "white" }}>
                      {formatMeasurement(Math.sqrt(
                        Math.pow(dragLineEnd.x - dragLineStart.x, 2) +
                        Math.pow(dragLineEnd.y - dragLineStart.y, 2)
                      ) / pixelsPerInch)}
                    </Text>
                  </View>
                </View>
              )}

              {/* Pins */}
              {pins.map((pin, index) => (
                <Pressable
                  key={pin.id}
                  onPressIn={() => {
                    handlePinPressIn(pin);
                    setTimeout(() => {
                      if (!isDraggingPin) {
                        startDragLine(pin);
                      }
                    }, 50);
                  }}
                  onPressOut={handlePinPressOut}
                  onLongPress={() => startDragPin(pin)}
                  delayLongPress={150}
                  style={{
                    position: "absolute",
                    left: pin.x - 20,
                    top: pin.y - 20,
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: isDraggingPin && draggingPinId === pin.id 
                      ? colors.accent[600] 
                      : colors.accent[500],
                    borderWidth: 4,
                    borderColor: "white",
                    justifyContent: "center",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "white" }}>
                    {index + 1}
                  </Text>
                </Pressable>
              ))}
              
              {/* Close Shape Helper - Show when 3+ pins but shape not closed */}
              {pins.length >= 3 && lines.length < pins.length && (
                <View style={{
                  position: "absolute",
                  left: pins[0].x - 30,
                  top: pins[0].y - 30,
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  borderWidth: 3,
                  borderColor: "#10b981",
                  backgroundColor: "rgba(16, 185, 129, 0.2)",
                  borderStyle: "dashed",
                }} pointerEvents="none" />
              )}
            </View>
          </Pressable>
        </View>

        {/* Close Shape Button - Show when 3+ pins placed */}
        {pins.length >= 3 && lines.length < pins.length && !isDetecting && (
          <View style={{
            position: "absolute",
            top: insets.top + 80,
            left: 20,
            right: 20,
            alignItems: "center",
            zIndex: 100,
          }}>
            <Pressable
              style={{
                backgroundColor: "#10b981",
                paddingHorizontal: 24,
                paddingVertical: 14,
                borderRadius: 14,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#10b981",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
              onPress={() => {
                // Close the shape by connecting last pin to first pin
                if (pins.length >= 3) {
                  const firstPin = pins[0];
                  const lastPin = pins[pins.length - 1];
                  
                  const closingDistance = Math.sqrt(
                    Math.pow(firstPin.x - lastPin.x, 2) + Math.pow(firstPin.y - lastPin.y, 2)
                  );
                  
                  const closingLine: Line = {
                    id: `line-close-${Date.now()}`,
                    startPin: lastPin.id,
                    endPin: firstPin.id,
                    length: closingDistance,
                  };
                  
                  const updatedLines = [...lines, closingLine];
                  setLines(updatedLines);
                  saveToHistory(pins, updatedLines);
                  updateCurrentPhotoInGallery(pins, updatedLines);
                  calculateDimensions(pins, updatedLines);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              }}
            >
              <Ionicons name="checkmark-circle" size={22} color="white" />
              <Text style={{
                color: "white",
                fontSize: 16,
                fontWeight: "700",
                marginLeft: 10,
              }}>
                Close Shape & Calculate
              </Text>
            </Pressable>
            
            <Text style={{
              color: "#64748b",
              fontSize: 13,
              marginTop: 10,
              textAlign: "center",
            }}>
              Tap to complete the box and get area
            </Text>
          </View>
        )}

        {/* Auto-Detect Button - Show when photo exists but no pins yet */}
        {currentPhoto && pins.length === 0 && !isDetecting && (
          <View style={{
            position: "absolute",
            top: insets.top + 80,
            left: 20,
            right: 20,
            alignItems: "center",
            zIndex: 100,
          }}>
            <Pressable
              style={{
                backgroundColor: "#8b5cf6",
                paddingHorizontal: 32,
                paddingVertical: 16,
                borderRadius: 16,
                flexDirection: "row",
                alignItems: "center",
                shadowColor: "#8b5cf6",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
              onPress={() => {
                // Get image dimensions
                Image.getSize(currentPhoto, (width, height) => {
                  setImageLayout({ width, height });
                  autoDetectShape();
                });
              }}
            >
              <Ionicons name="scan" size={24} color="white" />
              <Text style={{
                color: "white",
                fontSize: 18,
                fontWeight: "700",
                marginLeft: 12,
              }}>
                Auto-Detect Shape
              </Text>
            </Pressable>
            
            <Text style={{
              color: "#64748b",
              fontSize: 14,
              marginTop: 12,
              textAlign: "center",
            }}>
              Or tap image to place pins manually
            </Text>
          </View>
        )}

        {/* Detection Loading */}
        {isDetecting && (
          <View style={{
            position: "absolute",
            top: insets.top + 80,
            left: 20,
            right: 20,
            alignItems: "center",
            zIndex: 100,
          }}>
            <View style={{
              backgroundColor: "rgba(0,0,0,0.8)",
              paddingHorizontal: 32,
              paddingVertical: 20,
              borderRadius: 16,
              alignItems: "center",
            }}>
              <ActivityIndicator size="large" color="#8b5cf6" />
              <Text style={{
                color: "white",
                fontSize: 16,
                fontWeight: "600",
                marginTop: 12,
              }}>
                Analyzing image...
              </Text>
              <Text style={{
                color: "#94a3b8",
                fontSize: 13,
                marginTop: 4,
              }}>
                Detecting shapes
              </Text>
            </View>
          </View>
        )}

        {/* Detection Result */}
        {detectionResult && detectionResult.shapes.length > 0 && pins.length > 0 && (
          <View style={{
            position: "absolute",
            top: insets.top + 80,
            left: 20,
            right: 20,
            zIndex: 100,
          }}>
            <View style={{
              backgroundColor: "white",
              borderRadius: 16,
              padding: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 8,
            }}>
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#0f172a", marginLeft: 8 }}>
                  Detected: {detectionResult.primaryShape?.type}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
                {detectionResult.primaryShape?.description}
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: "#8b5cf6",
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                  onPress={() => setDetectionResult(null)}
                >
                  <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
                    Great!
                  </Text>
                </Pressable>
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: "#f1f5f9",
                    paddingVertical: 10,
                    borderRadius: 10,
                    alignItems: "center",
                  }}
                  onPress={() => {
                    Image.getSize(currentPhoto, (width, height) => {
                      setImageLayout({ width, height });
                      autoDetectShape();
                    });
                  }}
                >
                  <Text style={{ color: "#475569", fontWeight: "600", fontSize: 14 }}>
                    Re-detect
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* Full-Screen Toggle Button */}
        {currentPhoto && (
          <Pressable
            style={{
              position: "absolute",
              top: insets.top + 16,
              right: 16,
              backgroundColor: isFullScreen ? "rgba(139, 92, 246, 0.9)" : "rgba(0, 0, 0, 0.6)",
              borderRadius: 12,
              padding: 12,
              zIndex: 200,
            }}
            onPress={toggleFullScreen}
          >
            <Ionicons 
              name={isFullScreen ? "contract" : "expand"} 
              size={20} 
              color="white" 
            />
          </Pressable>
        )}

        {/* Top Bar */}
        <View style={{
          position: "absolute",
          top: insets.top,
          left: 0,
          right: 0,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
        }}>
          <Pressable
            onPress={() => {
              setCurrentPhoto(null);
              setSelectedPhotoIndex(null);
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </Pressable>

          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => setShowUnitsModal(true)}
              style={{
                backgroundColor: "rgba(0,0,0,0.7)",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Ionicons name="resize" size={16} color="white" />
              <Text style={{ fontSize: 12, fontWeight: "600", color: "white" }}>
                {units === "inches" ? "IN" : units === "cm" ? "CM" : "FT"}
              </Text>
            </Pressable>

            {/* Shape Detection Mode */}
            <Pressable
              onPress={() => {
                const modes: Array<"straight" | "angle" | "curve" | "bumpout"> = ["straight", "angle", "curve", "bumpout"];
                const currentIndex = modes.indexOf(shapeDetectionMode);
                const nextMode = modes[(currentIndex + 1) % modes.length];
                setShapeDetectionMode(nextMode);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={{
                backgroundColor: "rgba(0,0,0,0.7)",
                borderRadius: 12,
                paddingHorizontal: 12,
                paddingVertical: 8,
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                borderWidth: 2,
                borderColor: shapeDetectionMode !== "straight" ? colors.accent[500] : "transparent",
              }}
            >
              <Ionicons 
                name={
                  shapeDetectionMode === "angle" ? "git-compare" :
                  shapeDetectionMode === "curve" ? "git-branch" :
                  shapeDetectionMode === "bumpout" ? "cube" :
                  "remove"
                } 
                size={16} 
                color={shapeDetectionMode !== "straight" ? colors.accent[500] : "white"} 
              />
              <Text style={{ fontSize: 11, fontWeight: "600", color: shapeDetectionMode !== "straight" ? colors.accent[500] : "white" }}>
                {shapeDetectionMode === "straight" ? "Line" : 
                 shapeDetectionMode === "angle" ? "Angle" :
                 shapeDetectionMode === "curve" ? "Curve" : "Bump"}
              </Text>
            </Pressable>

            <View style={{
              backgroundColor: "rgba(0,0,0,0.8)",
              borderRadius: 12,
              paddingHorizontal: 12,
              paddingVertical: 8,
            }}>
              <Text style={{ fontSize: 12, fontWeight: "600", color: "white" }}>
                {pins.length === 0 ? "Tap to drop pin" : `${pins.length} pins`}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={clearMeasurements}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.7)",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Ionicons name="trash-outline" size={22} color="white" />
          </Pressable>
        </View>

        {/* Bottom Controls */}
        <View style={{
          position: "absolute",
          bottom: insets.bottom,
          left: 0,
          right: 0,
          paddingBottom: 12,
        }}>
          {/* Dimensions Display */}
          {dimensions && showBottomTools && (
            <View style={{
              marginHorizontal: 16,
              marginBottom: 12,
              backgroundColor: "rgba(0,0,0,0.9)",
              borderRadius: 16,
              padding: 16,
              position: "relative",
            }}>
              {/* Dismiss Button */}
              <Pressable
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  zIndex: 10,
                }}
                onPress={dismissBottomTools}
              >
                <Ionicons name="close-circle" size={20} color="#64748b" />
              </Pressable>

              <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 12 }}>
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                    LENGTH
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: colors.accent[500] }}>
                    {formatMeasurement(dimensions.length)}
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                    WIDTH
                  </Text>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: colors.accent[500] }}>
                    {formatMeasurement(dimensions.width)}
                  </Text>
                </View>
                <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.2)" }} />
                <View style={{ alignItems: "center" }}>
                  <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
                    AREA
                  </Text>
                  <Text style={{ fontSize: 16, fontWeight: "700", color: colors.accent[500] }}>
                    {convertFromInches(dimensions.area).toFixed(1)} sq {units === "inches" ? "in" : units}
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary[600],
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                  onPress={() => setShowSearchForm(true)}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "white" }}>
                    Search Remnants
                  </Text>
                </Pressable>
                <Pressable
                  style={{
                    flex: 1,
                    backgroundColor: colors.accent[500],
                    borderRadius: 10,
                    paddingVertical: 12,
                    alignItems: "center",
                  }}
                  onPress={() => setShowDimensionsForm(true)}
                >
                  <Text style={{ fontSize: 14, fontWeight: "600", color: "white" }}>
                    Save to Profile
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* Photo Gallery */}
          {showGallery && photoGallery.length > 0 && (
            <View style={{ position: "relative" }}>
              {/* Dismiss Gallery Button */}
              <Pressable
                style={{
                  position: "absolute",
                  top: -30,
                  right: 20,
                  backgroundColor: "rgba(0,0,0,0.6)",
                  borderRadius: 16,
                  padding: 8,
                  zIndex: 10,
                }}
                onPress={dismissGallery}
              >
                <Ionicons name="close" size={16} color="white" />
              </Pressable>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ paddingLeft: 16 }}
                contentContainerStyle={{ paddingRight: 16 }}
              >
                <Pressable
                  onPress={takePicture}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: 12,
                    backgroundColor: "rgba(0,0,0,0.7)",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12,
                    borderWidth: 2,
                    borderColor: "rgba(255,255,255,0.3)",
                  }}
                >
                  <Ionicons name="camera" size={28} color="white" />
                  <Text style={{ fontSize: 10, color: "white", marginTop: 4 }}>New</Text>
                </Pressable>

                {photoGallery.map((photo, index) => (
                  <Pressable
                    key={photo.timestamp}
                    onPress={() => selectPhotoFromGallery(index)}
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 12,
                      overflow: "hidden",
                      marginRight: 12,
                      borderWidth: selectedPhotoIndex === index ? 3 : 2,
                      borderColor: selectedPhotoIndex === index ? colors.accent[500] : "rgba(255,255,255,0.3)",
                    }}
                  >
                    <Image
                      source={{ uri: photo.uri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                    {photo.dimensions && (
                      <View style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: "rgba(0,0,0,0.8)",
                        padding: 4,
                      }}>
                        <Text style={{ fontSize: 9, fontWeight: "600", color: "white", textAlign: "center" }}>
                          {formatMeasurement(photo.dimensions.length)} × {formatMeasurement(photo.dimensions.width)}
                        </Text>
                      </View>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Action buttons */}
          <View style={{
            flexDirection: "row",
            paddingHorizontal: 16,
            paddingTop: 12,
            gap: 8,
          }}>
            <Pressable
              onPress={undo}
              disabled={historyIndex <= 0}
              style={{
                flex: 1,
                backgroundColor: historyIndex > 0 ? "rgba(59, 130, 246, 0.9)" : "rgba(100,100,100,0.5)",
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons name="arrow-undo" size={16} color="white" />
              <Text style={{ fontSize: 13, fontWeight: "600", color: "white" }}>
                Undo
              </Text>
            </Pressable>
            
            <Pressable
              onPress={redo}
              disabled={historyIndex >= history.length - 1}
              style={{
                flex: 1,
                backgroundColor: historyIndex < history.length - 1 ? "rgba(59, 130, 246, 0.9)" : "rgba(100,100,100,0.5)",
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons name="arrow-redo" size={16} color="white" />
              <Text style={{ fontSize: 13, fontWeight: "600", color: "white" }}>
                Redo
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowCalibrationModal(true)}
              style={{
                flex: 1,
                backgroundColor: "rgba(168, 85, 247, 0.9)",
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 6,
              }}
            >
              <Ionicons name="construct" size={16} color="white" />
              <Text style={{ fontSize: 13, fontWeight: "600", color: "white" }}>
                Calibrate
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowTutorial(true)}
              style={{
                paddingHorizontal: 16,
                backgroundColor: "rgba(0,0,0,0.7)",
                borderRadius: 10,
                paddingVertical: 10,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="help-circle" size={20} color="white" />
            </Pressable>
          </View>
        </View>

        {/* Units Modal */}
        <Modal
          visible={showUnitsModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowUnitsModal(false)}
        >
          <Pressable 
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" }}
            onPress={() => setShowUnitsModal(false)}
          >
            <View style={{ backgroundColor: colors.background.primary, borderRadius: 16, padding: 20, marginHorizontal: 20, width: 280 }}>
              <Text style={{ fontSize: 20, fontWeight: "600", color: colors.text.primary, marginBottom: 16 }}>
                Measurement Units
              </Text>
              
              {(["inches", "cm", "feet"] as MeasurementUnit[]).map((unit) => (
                <Pressable
                  key={unit}
                  onPress={() => {
                    setUnits(unit);
                    setShowUnitsModal(false);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    backgroundColor: units === unit ? colors.accent[500] : colors.background.secondary,
                    borderRadius: 12,
                    paddingVertical: 14,
                    paddingHorizontal: 16,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontSize: 16, fontWeight: "600", color: units === unit ? "white" : colors.text.primary }}>
                    {unit === "inches" ? "Inches (\")" : unit === "cm" ? "Centimeters (cm)" : "Feet (ft)"}
                  </Text>
                  {units === unit && <Ionicons name="checkmark-circle" size={24} color="white" />}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Modal>

        {/* Calibration Modal */}
        <Modal
          visible={showCalibrationModal}
          transparent
          animationType="slide"
          onRequestClose={() => setShowCalibrationModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" }}>
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

              <Text style={{ fontSize: 22, fontWeight: "600", color: colors.text.primary, marginBottom: 8 }}>
                Calibrate Measurements
              </Text>
              <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 20 }}>
                Use your camera to scan a reference object
              </Text>

              <View style={{ backgroundColor: colors.accent[100], borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 2, borderColor: colors.accent[500] }}>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                  <Ionicons name="camera" size={20} color={colors.accent[500]} />
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text.primary, marginLeft: 8 }}>
                    AR-Guided Calibration
                  </Text>
                </View>
                <Text style={{ fontSize: 13, color: colors.text.secondary, lineHeight: 18 }}>
                  Place your card or bill on a flat surface and align it with the on-screen guide for automatic calibration
                </Text>
              </View>

              <View style={{ gap: 12, marginBottom: 20 }}>
                <Pressable
                  onPress={() => {
                    setShowCalibrationModal(false);
                    navigation.navigate("CalibrationCamera", {
                      mode: "credit-card",
                      onCalibrate: (ppi: number) => {
                        setPixelsPerInch(ppi);
                        if (pins.length >= 4 && lines.length >= 2) {
                          calculateDimensions(pins, lines);
                        }
                      },
                    });
                  }}
                  style={{
                    backgroundColor: colors.accent[500],
                    borderRadius: 12,
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Ionicons name="card" size={24} color="white" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                      Credit Card
                    </Text>
                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                      3.37" × 2.125" • Most accurate
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="white" />
                </Pressable>

                <Pressable
                  onPress={() => {
                    setShowCalibrationModal(false);
                    navigation.navigate("CalibrationCamera", {
                      mode: "dollar-bill",
                      onCalibrate: (ppi: number) => {
                        setPixelsPerInch(ppi);
                        if (pins.length >= 4 && lines.length >= 2) {
                          calculateDimensions(pins, lines);
                        }
                      },
                    });
                  }}
                  style={{
                    backgroundColor: colors.accent[500],
                    borderRadius: 12,
                    paddingVertical: 16,
                    paddingHorizontal: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <Ionicons name="cash" size={24} color="white" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                      Dollar Bill
                    </Text>
                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.8)" }}>
                      6.14" × 2.61" • Good accuracy
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="white" />
                </Pressable>
              </View>

              <Pressable
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: 12,
                  paddingVertical: 14,
                  alignItems: "center",
                }}
                onPress={() => setShowCalibrationModal(false)}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text.primary }}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <TutorialModal />

        {/* Save to Profile Modal */}
        <Modal
          visible={showDimensionsForm}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDimensionsForm(false)}
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

              {dimensions && (
                <View style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text.primary, marginBottom: 8 }}>
                    Dimensions
                  </Text>
                  <Text style={{ fontSize: 16, color: colors.text.secondary }}>
                    Length: {formatMeasurement(dimensions.length)} × Width: {formatMeasurement(dimensions.width)}
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.text.tertiary, marginTop: 4 }}>
                    Area: {convertFromInches(dimensions.area).toFixed(2)} sq {units === "inches" ? "in" : units}
                  </Text>
                </View>
              )}

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
                placeholder="Stone type, color, notes..."
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
                  onPress={() => setShowDimensionsForm(false)}
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
                  onPress={saveToProfile}
                >
                  <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                    Save
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Search Form Modal */}
        <Modal
          visible={showSearchForm}
          transparent
          animationType="slide"
          onRequestClose={() => setShowSearchForm(false)}
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
                marginBottom: 8,
              }}>
                Search Remnants
              </Text>
              <Text style={{
                fontSize: 14,
                color: colors.text.secondary,
                marginBottom: 20,
              }}>
                Find stone remnants that fit your measured space
              </Text>

              {dimensions && (
                <View style={{
                  backgroundColor: colors.accent[100],
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 20,
                  borderWidth: 2,
                  borderColor: colors.accent[500],
                }}>
                  <Text style={{ fontSize: 14, fontWeight: "600", color: colors.text.primary, marginBottom: 8 }}>
                    Your Space Requirements
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <View>
                      <Text style={{ fontSize: 12, color: colors.text.tertiary }}>Minimum Length</Text>
                      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.accent[500] }}>
                        {formatMeasurement(dimensions.length)}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, color: colors.text.tertiary }}>Minimum Width</Text>
                      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.accent[500] }}>
                        {formatMeasurement(dimensions.width)}
                      </Text>
                    </View>
                    <View>
                      <Text style={{ fontSize: 12, color: colors.text.tertiary }}>Area Needed</Text>
                      <Text style={{ fontSize: 18, fontWeight: "700", color: colors.accent[500] }}>
                        {convertFromInches(dimensions.area / 144).toFixed(1)} sq {units === "feet" ? "ft" : units}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <Pressable
                style={{
                  backgroundColor: colors.accent[500],
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  marginBottom: 12,
                }}
                onPress={() => {
                  setShowSearchForm(false);
                  navigation.goBack();
                }}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: "white" }}>
                  Find Matching Remnants
                </Text>
              </Pressable>

              <Pressable
                style={{
                  backgroundColor: colors.background.secondary,
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                }}
                onPress={() => setShowSearchForm(false)}
              >
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.text.primary }}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // Permission screens
  if (!permission) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.primary, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: colors.text.secondary }}>Loading...</Text>
      </SafeAreaView>
    );
  }

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
            Measure stone remnants and spaces with smart pin placement
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
              Smart Measurement
            </Text>
          </View>

        <View style={{ width: 44 }} />
      </View>

      {/* Camera tooltip - auto-dismisses after 10s - POSITIONED ABOVE CAMERA CONTROLS */}
      {showCameraTooltip && (
        <View style={{
          position: "absolute",
          bottom: insets.bottom + 170, // 170px above bottom to be above camera controls
          left: 0,
          right: 0,
          paddingHorizontal: 20,
        }}>
          <BlurView intensity={95} style={{
            borderRadius: 20,
            overflow: "hidden",
            marginBottom: 24,
            borderWidth: 2,
            borderColor: "rgba(255,255,255,0.2)",
          }} tint="dark">
            <View style={{ padding: 24 }}>
              {/* Close button */}
              <Pressable
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(255,255,255,0.15)",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 10,
                }}
                onPress={() => setShowCameraTooltip(false)}
              >
                <Text style={{ fontSize: 18, color: "white", fontWeight: "700" }}>✕</Text>
              </Pressable>

              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                <View style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.accent[500],
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}>
                  <Ionicons name="resize" size={24} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 20, fontWeight: "700", color: "white", marginBottom: 4 }}>
                    Smart Measurement Tool
                  </Text>
                  <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" }}>
                    Professional precision made simple
                  </Text>
                </View>
              </View>

              <View style={{ gap: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "rgba(249,115,22,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}>
                    <Ionicons name="hand-left" size={18} color={colors.accent[400]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "white", marginBottom: 2 }}>
                      Tap to drop pins
                    </Text>
                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 18 }}>
                      Place measurement points on corners
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "rgba(249,115,22,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}>
                    <Ionicons name="move" size={18} color={colors.accent[400]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "white", marginBottom: 2 }}>
                      Press & drag for lines
                    </Text>
                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 18 }}>
                      Connect pins to measure distances
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: "rgba(249,115,22,0.2)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}>
                    <Ionicons name="calculator" size={18} color={colors.accent[400]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "white", marginBottom: 2 }}>
                      Auto-calculates dimensions
                    </Text>
                    <Text style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 18 }}>
                      Get length, width, and area instantly
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{
                marginTop: 16,
                paddingTop: 16,
                borderTopWidth: 1,
                borderTopColor: "rgba(255,255,255,0.1)",
                flexDirection: "row",
                alignItems: "center",
              }}>
                <Ionicons name="bulb" size={16} color={colors.accent[400]} />
                <Text style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginLeft: 8, flex: 1 }}>
                  Calibrate first for best accuracy
                </Text>
              </View>
            </View>
          </BlurView>
        </View>
      )}

      {/* Camera Controls - Always visible */}
      <View style={{
        position: "absolute",
        bottom: insets.bottom + 30,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
      }}>
        <View style={{
          flexDirection: "row",
          justifyContent: "space-around",
          alignItems: "center",
        }}>
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
