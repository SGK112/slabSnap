import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Animated,
  Dimensions,
  PanResponder,
  StyleSheet,
  ScrollView,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuthStore, ProjectType, Badge, ProjectIntent } from "../state/authStore";
import * as Haptics from "expo-haptics";
import * as Location from "expo-location";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Quiz stages
type QuizStage =
  | "welcome"
  | "project_type"
  | "project_details"
  | "style_preferences"
  | "budget_timeline"
  | "location"
  | "results";

// Project type options
interface ProjectOption {
  id: ProjectType;
  label: string;
  icon: string;
  color: string;
  description: string;
  subTypes?: { id: string; label: string; icon: string }[];
  matchingPros: string[];
}

const PROJECT_OPTIONS: ProjectOption[] = [
  {
    id: "kitchen",
    label: "Kitchen",
    icon: "restaurant",
    color: "#f97316",
    description: "Countertops, cabinets, appliances",
    subTypes: [
      { id: "countertops", label: "Countertops", icon: "layers" },
      { id: "cabinets", label: "Cabinets", icon: "file-tray-stacked" },
      { id: "full_remodel", label: "Full Remodel", icon: "construct" },
      { id: "backsplash", label: "Backsplash", icon: "grid" },
    ],
    matchingPros: ["countertop_fabricators", "cabinet_makers", "kitchen_designers", "plumbers", "electricians"],
  },
  {
    id: "bathroom",
    label: "Bathroom",
    icon: "water",
    color: "#06b6d4",
    description: "Vanities, showers, tubs, tile",
    subTypes: [
      { id: "vanity", label: "Vanity Top", icon: "browsers" },
      { id: "shower", label: "Shower/Tub", icon: "water" },
      { id: "full_remodel", label: "Full Remodel", icon: "construct" },
      { id: "tile", label: "Tile Work", icon: "grid" },
    ],
    matchingPros: ["countertop_fabricators", "tile_installers", "plumbers", "bathroom_designers"],
  },
  {
    id: "outdoor",
    label: "Outdoor",
    icon: "sunny",
    color: "#22c55e",
    description: "Patios, outdoor kitchens, BBQ",
    subTypes: [
      { id: "outdoor_kitchen", label: "Outdoor Kitchen", icon: "bonfire" },
      { id: "patio", label: "Patio/Deck", icon: "apps" },
      { id: "bbq", label: "BBQ Island", icon: "flame" },
      { id: "pool", label: "Pool Area", icon: "water" },
    ],
    matchingPros: ["outdoor_specialists", "landscapers", "masons", "countertop_fabricators"],
  },
  {
    id: "flooring",
    label: "Flooring",
    icon: "apps",
    color: "#a855f7",
    description: "Tile, hardwood, stone flooring",
    subTypes: [
      { id: "tile", label: "Tile", icon: "grid" },
      { id: "hardwood", label: "Hardwood", icon: "leaf" },
      { id: "marble", label: "Marble/Stone", icon: "diamond" },
      { id: "lvp", label: "LVP/Laminate", icon: "layers" },
    ],
    matchingPros: ["flooring_installers", "tile_installers", "hardwood_specialists"],
  },
  {
    id: "countertops",
    label: "Countertops Only",
    icon: "layers",
    color: "#6366f1",
    description: "Just the countertop surface",
    subTypes: [
      { id: "granite", label: "Granite", icon: "diamond" },
      { id: "quartz", label: "Quartz", icon: "cube" },
      { id: "marble", label: "Marble", icon: "sparkles" },
      { id: "quartzite", label: "Quartzite", icon: "flash" },
    ],
    matchingPros: ["countertop_fabricators", "stone_suppliers"],
  },
  {
    id: "plumbing",
    label: "Plumbing",
    icon: "construct",
    color: "#3b82f6",
    description: "Pipes, fixtures, water systems",
    subTypes: [
      { id: "fixtures", label: "Fixtures", icon: "water" },
      { id: "pipes", label: "Pipe Work", icon: "git-branch" },
      { id: "water_heater", label: "Water Heater", icon: "flame" },
      { id: "sprinkler", label: "Sprinkler System", icon: "rainy" },
    ],
    matchingPros: ["plumbers", "sprinkler_specialists"],
  },
  {
    id: "electrical",
    label: "Electrical",
    icon: "flash",
    color: "#eab308",
    description: "Wiring, outlets, lighting",
    subTypes: [
      { id: "outlets", label: "Outlets", icon: "radio-button-on" },
      { id: "lighting", label: "Lighting", icon: "bulb" },
      { id: "panel", label: "Panel Upgrade", icon: "options" },
      { id: "smart_home", label: "Smart Home", icon: "phone-portrait" },
    ],
    matchingPros: ["electricians", "smart_home_specialists"],
  },
  {
    id: "landscaping",
    label: "Landscaping",
    icon: "leaf",
    color: "#10b981",
    description: "Gardens, lawns, hardscape",
    subTypes: [
      { id: "garden", label: "Garden Design", icon: "flower" },
      { id: "lawn", label: "Lawn Care", icon: "leaf" },
      { id: "hardscape", label: "Hardscape", icon: "cube" },
      { id: "irrigation", label: "Irrigation", icon: "water" },
    ],
    matchingPros: ["landscapers", "hardscape_specialists", "irrigation_specialists"],
  },
];

// Style quiz cards for preferences
type CardType = "statement" | "image" | "color" | "either_or";

interface StyleCard {
  id: string;
  type: CardType;
  statement?: string;
  subtext?: string;
  icon?: string;
  imageUrl?: string;
  imageLabel?: string;
  optionA?: { label: string; icon?: string; color?: string };
  optionB?: { label: string; icon?: string; color?: string };
  colors?: string[];
  colorLabel?: string;
  traits: { dimension: string; rightValue: number }[];
}

const STYLE_CARDS: StyleCard[] = [
  {
    id: "energy-1",
    type: "statement",
    statement: "I love bright, vibrant colors",
    subtext: "They energize me and make me happy",
    icon: "sunny",
    traits: [{ dimension: "colorEnergy", rightValue: 1 }, { dimension: "boldness", rightValue: 1 }],
  },
  {
    id: "energy-2",
    type: "statement",
    statement: "My ideal space feels calm and peaceful",
    subtext: "A retreat from the busy world",
    icon: "leaf",
    traits: [{ dimension: "colorEnergy", rightValue: -1 }, { dimension: "minimalism", rightValue: 1 }],
  },
  {
    id: "space-1",
    type: "either_or",
    optionA: { label: "Cozy & Intimate", icon: "home", color: "#f59e0b" },
    optionB: { label: "Open & Airy", icon: "expand", color: "#06b6d4" },
    traits: [{ dimension: "spaceFeel", rightValue: 1 }],
  },
  {
    id: "color-1",
    type: "color",
    colors: ["#1e3a5f", "#2d5a87", "#4a90b8", "#87ceeb"],
    colorLabel: "Cool Ocean Blues",
    traits: [{ dimension: "colorTemp", rightValue: -1 }, { dimension: "calmness", rightValue: 1 }],
  },
  {
    id: "color-2",
    type: "color",
    colors: ["#8b4513", "#d2691e", "#deb887", "#f5deb3"],
    colorLabel: "Warm Earth Tones",
    traits: [{ dimension: "colorTemp", rightValue: 1 }, { dimension: "natural", rightValue: 1 }],
  },
  {
    id: "lifestyle-1",
    type: "statement",
    statement: "I love hosting dinner parties",
    subtext: "My kitchen is the heart of my home",
    icon: "restaurant",
    traits: [{ dimension: "social", rightValue: 1 }, { dimension: "kitchenFocus", rightValue: 1 }],
  },
  {
    id: "lifestyle-2",
    type: "statement",
    statement: "Less is more",
    subtext: "I prefer clean surfaces and hidden storage",
    icon: "remove-circle",
    traits: [{ dimension: "minimalism", rightValue: 1 }, { dimension: "clutter", rightValue: -1 }],
  },
  {
    id: "style-1",
    type: "either_or",
    optionA: { label: "Modern & Sleek", icon: "cube", color: "#6366f1" },
    optionB: { label: "Warm & Traditional", icon: "heart", color: "#ef4444" },
    traits: [{ dimension: "modern", rightValue: -1 }, { dimension: "traditional", rightValue: 1 }],
  },
  {
    id: "material-1",
    type: "statement",
    statement: "I'm drawn to natural materials",
    subtext: "Wood, stone, marble - things with character",
    icon: "leaf",
    traits: [{ dimension: "natural", rightValue: 1 }, { dimension: "luxury", rightValue: 1 }],
  },
  {
    id: "image-1",
    type: "image",
    imageUrl: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800",
    imageLabel: "Modern Kitchen",
    traits: [{ dimension: "modern", rightValue: 1 }, { dimension: "minimalism", rightValue: 1 }],
  },
  {
    id: "image-2",
    type: "image",
    imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
    imageLabel: "Farmhouse Charm",
    traits: [{ dimension: "traditional", rightValue: 1 }, { dimension: "natural", rightValue: 1 }],
  },
  {
    id: "final-1",
    type: "either_or",
    optionA: { label: "Timeless Classic", icon: "time", color: "#78716c" },
    optionB: { label: "On-Trend Now", icon: "trending-up", color: "#22c55e" },
    traits: [{ dimension: "traditional", rightValue: -1 }, { dimension: "trendy", rightValue: 1 }],
  },
];

// Available badges
const QUIZ_BADGES: Badge[] = [
  {
    id: "style_explorer",
    name: "Style Explorer",
    description: "Completed the style personality quiz",
    icon: "color-palette",
    color: "#a855f7",
    category: "quiz",
  },
  {
    id: "project_planner",
    name: "Project Planner",
    description: "Created your first project plan",
    icon: "map",
    color: "#22c55e",
    category: "project",
  },
  {
    id: "location_pioneer",
    name: "Location Pioneer",
    description: "Pinned your first project location",
    icon: "location",
    color: "#3b82f6",
    category: "project",
  },
  {
    id: "budget_savvy",
    name: "Budget Savvy",
    description: "Set your project budget preferences",
    icon: "cash",
    color: "#f59e0b",
    category: "quiz",
  },
];

// Style personality result
interface StylePersonality {
  name: string;
  tagline: string;
  description: string;
  colors: string[];
  materials: string[];
  tips: string[];
  icon: string;
}

const getStylePersonality = (dimensions: Record<string, number>): StylePersonality => {
  const isWarm = (dimensions.colorTemp || 0) > 0;
  const isBold = (dimensions.boldness || 0) > 0;
  const isModern = (dimensions.modern || 0) > 0;
  const isMinimal = (dimensions.minimalism || 0) > 0;
  const isNatural = (dimensions.natural || 0) > 0;
  const isLuxury = (dimensions.luxury || 0) > 0;
  const isSocial = (dimensions.social || 0) > 0;
  const isCalm = (dimensions.calmness || 0) > 0;

  if (isModern && isMinimal && !isWarm) {
    return {
      name: "The Modernist",
      tagline: "Clean lines, clear mind",
      description: "You appreciate the beauty of simplicity. Your ideal space is uncluttered, functional, and lets each carefully chosen piece shine.",
      colors: ["Cool grays", "Pure whites", "Black accents", "Navy blue"],
      materials: ["Quartz", "Polished concrete", "Steel", "Glass"],
      tips: ["Choose handleless cabinets", "Consider a waterfall edge countertop", "Invest in statement lighting"],
      icon: "cube",
    };
  }

  if (isWarm && isNatural && !isModern) {
    return {
      name: "The Naturalist",
      tagline: "Bringing the outdoors in",
      description: "You're drawn to organic beauty and materials that tell a story. Your space feels grounded, warm, and connected to nature.",
      colors: ["Warm beiges", "Forest greens", "Terracotta", "Cream"],
      materials: ["Natural marble", "Wood", "Granite", "Soapstone"],
      tips: ["Embrace natural stone with unique veining", "Mix wood tones for depth", "Add plants to complement materials"],
      icon: "leaf",
    };
  }

  if (isLuxury && isCalm) {
    return {
      name: "The Refined",
      tagline: "Quiet luxury speaks volumes",
      description: "You appreciate quality over quantity. Your space exudes understated elegance with premium materials and thoughtful details.",
      colors: ["Soft whites", "Warm grays", "Champagne", "Muted gold"],
      materials: ["Calacatta marble", "Quartzite", "Brushed brass", "Natural stone"],
      tips: ["Invest in book-matched slabs", "Choose honed finishes", "Layer textures for visual interest"],
      icon: "diamond",
    };
  }

  if (isBold && isSocial) {
    return {
      name: "The Entertainer",
      tagline: "Life of the party, heart of the home",
      description: "Your kitchen is your stage! You love spaces that spark conversation and make a statement.",
      colors: ["Bold blues", "Rich greens", "Dramatic black", "Pops of color"],
      materials: ["Dramatic veined marble", "Colorful quartz", "Patterned tile", "Mixed metals"],
      tips: ["Consider a large island for gathering", "Choose statement backsplash", "Install good task and ambient lighting"],
      icon: "people",
    };
  }

  if (isWarm && !isModern) {
    return {
      name: "The Traditionalist",
      tagline: "Timeless beauty never goes out of style",
      description: "You value classic design that stands the test of time. Your space feels welcoming and elegantly appointed.",
      colors: ["Cream", "Warm white", "Soft sage", "Classic navy"],
      materials: ["Granite", "Marble", "Natural wood", "Ceramic tile"],
      tips: ["Choose classic edge profiles", "Consider furniture-style cabinet details", "Mix traditional patterns"],
      icon: "home",
    };
  }

  if (isMinimal && isCalm) {
    return {
      name: "The Zen Seeker",
      tagline: "Find peace in your space",
      description: "Your home is your sanctuary. You crave calm, balanced spaces that help you decompress.",
      colors: ["Soft whites", "Pale grays", "Sage green", "Sand"],
      materials: ["Matte quartz", "Light wood", "Natural stone", "Concrete"],
      tips: ["Keep countertops clear", "Choose seamless, integrated sinks", "Use soft, diffused lighting"],
      icon: "flower",
    };
  }

  return {
    name: "The Creative",
    tagline: "Rules are meant to be broken",
    description: "You don't fit in a box - and neither should your space! You love mixing styles and materials.",
    colors: ["Mixed palette", "Unexpected combos", "Personal favorites", "Accent colors"],
    materials: ["Mixed materials", "Vintage finds", "Bold patterns", "Unique stones"],
    tips: ["Don't be afraid to mix materials", "Let your personality guide choices", "Focus on pieces that bring you joy"],
    icon: "color-palette",
  };
};

export default function StyleQuizScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { updatePreferences, addBadge, addProject, completeQuiz } = useAuthStore();

  // Stage navigation
  const [stage, setStage] = useState<QuizStage>("welcome");

  // Project selection
  const [selectedProject, setSelectedProject] = useState<ProjectOption | null>(null);
  const [selectedSubTypes, setSelectedSubTypes] = useState<string[]>([]);
  const [projectDescription, setProjectDescription] = useState("");

  // Budget & Timeline
  const [budget, setBudget] = useState<"low" | "medium" | "high" | "luxury" | null>(null);
  const [timeline, setTimeline] = useState<"urgent" | "soon" | "planning" | "exploring" | null>(null);
  const [diyLevel, setDiyLevel] = useState<"full_diy" | "some_help" | "full_pro" | null>(null);

  // Location
  const [location, setLocation] = useState<{ latitude: number; longitude: number; address?: string } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);

  // Style quiz
  const [styleCardIndex, setStyleCardIndex] = useState(0);
  const [dimensions, setDimensions] = useState<Record<string, number>>({});
  const [personality, setPersonality] = useState<StylePersonality | null>(null);

  // Animation
  const position = useRef(new Animated.ValueXY()).current;
  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-8deg", "0deg", "8deg"],
    extrapolate: "clamp",
  });
  const yesOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const noOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });
  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.92, 1],
    extrapolate: "clamp",
  });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy * 0.5 });
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          swipeRight();
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          swipeLeft();
        } else {
          resetPosition();
        }
      },
    })
  ).current;

  const resetPosition = () => {
    Animated.spring(position, {
      toValue: { x: 0, y: 0 },
      useNativeDriver: false,
      friction: 5,
    }).start();
  };

  const swipeLeft = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(position, {
      toValue: { x: -SCREEN_WIDTH - 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => handleStyleSwipe(false));
  };

  const swipeRight = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.timing(position, {
      toValue: { x: SCREEN_WIDTH + 100, y: 0 },
      duration: 250,
      useNativeDriver: false,
    }).start(() => handleStyleSwipe(true));
  };

  const handleStyleSwipe = (swipedRight: boolean) => {
    const card = STYLE_CARDS[styleCardIndex];
    const newDimensions = { ...dimensions };

    card.traits.forEach(trait => {
      const currentValue = newDimensions[trait.dimension] || 0;
      const delta = swipedRight ? trait.rightValue : -trait.rightValue;
      newDimensions[trait.dimension] = currentValue + delta;
    });

    setDimensions(newDimensions);

    if (styleCardIndex >= STYLE_CARDS.length - 1) {
      const result = getStylePersonality(newDimensions);
      setPersonality(result);
      setStage("results");

      // Award badge
      addBadge(QUIZ_BADGES.find(b => b.id === "style_explorer")!);
      completeQuiz("style_personality");

      // Save style preferences
      updatePreferences({
        styleName: result.name,
        primaryStyle: result.name.toLowerCase().replace(/\s+/g, "_"),
        colorPalette: result.colors[0],
      });
    } else {
      setStyleCardIndex(prev => prev + 1);
      position.setValue({ x: 0, y: 0 });
    }
  };

  const requestLocation = async () => {
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setLocationLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const [address] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        address: address ? `${address.city}, ${address.region}` : undefined,
      });

      // Award badge
      addBadge(QUIZ_BADGES.find(b => b.id === "location_pioneer")!);
    } catch (error) {
      console.error("Location error:", error);
    }
    setLocationLoading(false);
  };

  const handleProjectSelect = (project: ProjectOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedProject(project);
    setStage("project_details");
  };

  const handleSubTypeToggle = (subTypeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSubTypes(prev =>
      prev.includes(subTypeId)
        ? prev.filter(id => id !== subTypeId)
        : [...prev, subTypeId]
    );
  };

  const handleContinueFromDetails = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStage("budget_timeline");
  };

  const handleContinueFromBudget = () => {
    addBadge(QUIZ_BADGES.find(b => b.id === "budget_savvy")!);
    setStage("location");
  };

  const handleContinueFromLocation = () => {
    setStage("style_preferences");
  };

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Create and save the project
    if (selectedProject) {
      const project: ProjectIntent = {
        id: `project-${Date.now()}`,
        type: selectedProject.id,
        subtype: selectedSubTypes.join(","),
        description: projectDescription,
        location: location || undefined,
        budget: budget || undefined,
        timeline: timeline || undefined,
        diyLevel: diyLevel || undefined,
        createdAt: Date.now(),
      };
      addProject(project);
      addBadge(QUIZ_BADGES.find(b => b.id === "project_planner")!);
    }

    // Save all preferences
    updatePreferences({
      onboardingComplete: true,
      budgetRange: budget || undefined,
      timelinePreference: timeline || undefined,
      preferredContractorTypes: selectedProject?.matchingPros || [],
    });

    navigation.navigate("MainTabs");
  };

  const handleSkip = () => {
    navigation.navigate("MainTabs");
  };

  // Progress calculation - Flow: welcome -> project_type -> project_details -> budget_timeline -> location -> style_preferences -> results
  const getProgress = () => {
    switch (stage) {
      case "welcome": return 0;
      case "project_type": return 0.1;
      case "project_details": return 0.2;
      case "budget_timeline": return 0.35;
      case "location": return 0.5;
      case "style_preferences": return 0.5 + (styleCardIndex / STYLE_CARDS.length) * 0.45;
      case "results": return 1;
      default: return 0;
    }
  };

  // Render style card
  const renderStyleCard = (card: StyleCard | null, isTop: boolean) => {
    if (!card) return null;

    if (card.type === "statement") {
      return (
        <View style={styles.statementCard}>
          <View style={styles.statementIconContainer}>
            <Ionicons name={card.icon as any || "chatbubble"} size={48} color="#6366f1" />
          </View>
          <Text style={styles.statementText}>{card.statement}</Text>
          <Text style={styles.statementSubtext}>{card.subtext}</Text>
        </View>
      );
    }

    if (card.type === "color") {
      return (
        <View style={styles.colorCard}>
          <Text style={styles.colorCardTitle}>Do you love this palette?</Text>
          <View style={styles.colorSwatches}>
            {card.colors?.map((color, i) => (
              <View key={i} style={[styles.colorSwatch, { backgroundColor: color }]} />
            ))}
          </View>
          <Text style={styles.colorLabel}>{card.colorLabel}</Text>
        </View>
      );
    }

    if (card.type === "either_or") {
      return (
        <View style={styles.eitherOrCard}>
          <Text style={styles.eitherOrTitle}>Which speaks to you more?</Text>
          <View style={styles.eitherOrOptions}>
            <View style={styles.eitherOrOption}>
              <View style={[styles.eitherOrIcon, { backgroundColor: card.optionA?.color }]}>
                <Ionicons name={card.optionA?.icon as any} size={32} color="#fff" />
              </View>
              <Text style={styles.eitherOrLabel}>{card.optionA?.label}</Text>
              <View style={styles.swipeHint}>
                <Ionicons name="arrow-back" size={16} color="#9ca3af" />
                <Text style={styles.swipeHintText}>Swipe left</Text>
              </View>
            </View>
            <View style={styles.eitherOrDivider}>
              <Text style={styles.orText}>or</Text>
            </View>
            <View style={styles.eitherOrOption}>
              <View style={[styles.eitherOrIcon, { backgroundColor: card.optionB?.color }]}>
                <Ionicons name={card.optionB?.icon as any} size={32} color="#fff" />
              </View>
              <Text style={styles.eitherOrLabel}>{card.optionB?.label}</Text>
              <View style={styles.swipeHint}>
                <Text style={styles.swipeHintText}>Swipe right</Text>
                <Ionicons name="arrow-forward" size={16} color="#9ca3af" />
              </View>
            </View>
          </View>
        </View>
      );
    }

    if (card.type === "image") {
      return (
        <View style={styles.imageCard}>
          <Image source={{ uri: card.imageUrl }} style={styles.cardImage} />
          <LinearGradient colors={["transparent", "rgba(0,0,0,0.7)"]} style={styles.imageGradient} />
          <View style={styles.imageLabelContainer}>
            <Text style={styles.imageQuestion}>Does this inspire you?</Text>
            <Text style={styles.imageLabel}>{card.imageLabel}</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  // RENDER: Welcome Stage
  if (stage === "welcome") {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#1e3a5f", "#0f172a"]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeIconContainer}>
              <Ionicons name="sparkles" size={48} color="#fff" />
            </View>
            <Text style={styles.welcomeTitle}>Let's Personalize{"\n"}Your Experience</Text>
            <Text style={styles.welcomeSubtitle}>
              Answer a few questions to get matched with the right pros, materials, and inspiration for your project.
            </Text>

            <View style={styles.benefitsContainer}>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.benefitText}>Get matched with relevant contractors</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.benefitText}>See personalized material recommendations</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.benefitText}>Earn badges and build your profile</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.benefitText}>Pin projects to the map</Text>
              </View>
            </View>

            <Pressable
              style={styles.startButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setStage("project_type");
              }}
            >
              <Text style={styles.startButtonText}>Let's Go</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>

            <Pressable style={styles.skipLink} onPress={handleSkip}>
              <Text style={styles.skipLinkText}>Skip for now</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // RENDER: Project Type Selection
  if (stage === "project_type") {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#0f172a", "#1e293b"]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${getProgress() * 100}%` }]} />
              </View>
            </View>
            <View style={{ width: 50 }} />
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stageTitle}>What are you working on?</Text>
            <Text style={styles.stageSubtitle}>Select your project type to get matched with the right pros</Text>

            <View style={styles.projectGrid}>
              {PROJECT_OPTIONS.map(project => (
                <Pressable
                  key={project.id}
                  style={styles.projectCard}
                  onPress={() => handleProjectSelect(project)}
                >
                  <View style={[styles.projectIconContainer, { backgroundColor: project.color }]}>
                    <Ionicons name={project.icon as any} size={28} color="#fff" />
                  </View>
                  <Text style={styles.projectLabel}>{project.label}</Text>
                  <Text style={styles.projectDescription}>{project.description}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // RENDER: Project Details
  if (stage === "project_details" && selectedProject) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#0f172a", "#1e293b"]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <Pressable onPress={() => setStage("project_type")} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.6)" />
            </Pressable>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${getProgress() * 100}%` }]} />
              </View>
            </View>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={[styles.selectedProjectBadge, { backgroundColor: selectedProject.color }]}>
              <Ionicons name={selectedProject.icon as any} size={20} color="#fff" />
              <Text style={styles.selectedProjectText}>{selectedProject.label}</Text>
            </View>

            <Text style={styles.stageTitle}>Tell us more</Text>
            <Text style={styles.stageSubtitle}>What specifically are you looking for?</Text>

            {selectedProject.subTypes && (
              <View style={styles.subTypesContainer}>
                {selectedProject.subTypes.map(subType => (
                  <Pressable
                    key={subType.id}
                    style={[
                      styles.subTypeButton,
                      selectedSubTypes.includes(subType.id) && styles.subTypeButtonActive,
                    ]}
                    onPress={() => handleSubTypeToggle(subType.id)}
                  >
                    <Ionicons
                      name={subType.icon as any}
                      size={20}
                      color={selectedSubTypes.includes(subType.id) ? "#fff" : "rgba(255,255,255,0.7)"}
                    />
                    <Text
                      style={[
                        styles.subTypeLabel,
                        selectedSubTypes.includes(subType.id) && styles.subTypeLabelActive,
                      ]}
                    >
                      {subType.label}
                    </Text>
                    {selectedSubTypes.includes(subType.id) && (
                      <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                    )}
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={styles.inputLabel}>Describe your project (optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Replacing old laminate countertops with granite..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={projectDescription}
              onChangeText={setProjectDescription}
              multiline
              numberOfLines={3}
            />

            <Pressable style={styles.continueButton} onPress={handleContinueFromDetails}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // RENDER: Budget & Timeline
  if (stage === "budget_timeline") {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#0f172a", "#1e293b"]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <Pressable onPress={() => setStage("project_details")} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.6)" />
            </Pressable>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${getProgress() * 100}%` }]} />
              </View>
            </View>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.stageTitle}>Budget & Timeline</Text>
            <Text style={styles.stageSubtitle}>Help us find the right options for you</Text>

            <Text style={styles.sectionLabel}>What's your budget range?</Text>
            <View style={styles.optionGrid}>
              {[
                { id: "low", label: "Budget-Friendly", icon: "wallet", sublabel: "Under $2,000" },
                { id: "medium", label: "Mid-Range", icon: "cash", sublabel: "$2,000 - $5,000" },
                { id: "high", label: "Premium", icon: "diamond", sublabel: "$5,000 - $15,000" },
                { id: "luxury", label: "Luxury", icon: "sparkles", sublabel: "$15,000+" },
              ].map(option => (
                <Pressable
                  key={option.id}
                  style={[styles.optionCard, budget === option.id && styles.optionCardActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setBudget(option.id as any);
                  }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={budget === option.id ? "#22c55e" : "rgba(255,255,255,0.6)"}
                  />
                  <Text style={[styles.optionLabel, budget === option.id && styles.optionLabelActive]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionSublabel}>{option.sublabel}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionLabel}>When do you want to start?</Text>
            <View style={styles.optionGrid}>
              {[
                { id: "urgent", label: "ASAP", icon: "flash", sublabel: "Within 2 weeks" },
                { id: "soon", label: "Soon", icon: "calendar", sublabel: "1-2 months" },
                { id: "planning", label: "Planning", icon: "map", sublabel: "3-6 months" },
                { id: "exploring", label: "Just Looking", icon: "search", sublabel: "No timeline" },
              ].map(option => (
                <Pressable
                  key={option.id}
                  style={[styles.optionCard, timeline === option.id && styles.optionCardActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTimeline(option.id as any);
                  }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={timeline === option.id ? "#22c55e" : "rgba(255,255,255,0.6)"}
                  />
                  <Text style={[styles.optionLabel, timeline === option.id && styles.optionLabelActive]}>
                    {option.label}
                  </Text>
                  <Text style={styles.optionSublabel}>{option.sublabel}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.sectionLabel}>DIY or Hire a Pro?</Text>
            <View style={styles.diyOptions}>
              {[
                { id: "full_diy", label: "Full DIY", icon: "hammer", description: "I'll do it myself" },
                { id: "some_help", label: "Some Help", icon: "people", description: "Need help with some parts" },
                { id: "full_pro", label: "Full Pro", icon: "construct", description: "Hire professionals for everything" },
              ].map(option => (
                <Pressable
                  key={option.id}
                  style={[styles.diyOption, diyLevel === option.id && styles.diyOptionActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDiyLevel(option.id as any);
                  }}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={diyLevel === option.id ? "#22c55e" : "rgba(255,255,255,0.6)"}
                  />
                  <View style={styles.diyTextContainer}>
                    <Text style={[styles.diyLabel, diyLevel === option.id && styles.diyLabelActive]}>
                      {option.label}
                    </Text>
                    <Text style={styles.diyDescription}>{option.description}</Text>
                  </View>
                  {diyLevel === option.id && (
                    <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  )}
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.continueButton} onPress={handleContinueFromBudget}>
              <Text style={styles.continueButtonText}>Continue</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  // RENDER: Location
  if (stage === "location") {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#0f172a", "#1e293b"]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <Pressable onPress={() => setStage("budget_timeline")} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.6)" />
            </Pressable>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${getProgress() * 100}%` }]} />
              </View>
            </View>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          <View style={styles.locationContent}>
            <View style={styles.locationIconContainer}>
              <Ionicons name="location" size={48} color="#3b82f6" />
            </View>

            <Text style={styles.stageTitle}>Pin Your Project</Text>
            <Text style={styles.stageSubtitle}>
              Add your location to find nearby contractors, suppliers, and remnants
            </Text>

            {location ? (
              <View style={styles.locationResult}>
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                <View style={styles.locationResultText}>
                  <Text style={styles.locationAddress}>{location.address || "Location added"}</Text>
                  <Text style={styles.locationCoords}>
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </Text>
                </View>
              </View>
            ) : (
              <Pressable
                style={styles.locationButton}
                onPress={requestLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <Text style={styles.locationButtonText}>Getting location...</Text>
                ) : (
                  <>
                    <Ionicons name="locate" size={20} color="#fff" />
                    <Text style={styles.locationButtonText}>Use My Location</Text>
                  </>
                )}
              </Pressable>
            )}

            <View style={styles.locationBenefits}>
              <View style={styles.locationBenefit}>
                <Ionicons name="storefront" size={20} color="#a855f7" />
                <Text style={styles.locationBenefitText}>Find local stone yards</Text>
              </View>
              <View style={styles.locationBenefit}>
                <Ionicons name="people" size={20} color="#f59e0b" />
                <Text style={styles.locationBenefitText}>Connect with nearby pros</Text>
              </View>
              <View style={styles.locationBenefit}>
                <Ionicons name="pricetag" size={20} color="#22c55e" />
                <Text style={styles.locationBenefitText}>See local deals & remnants</Text>
              </View>
            </View>

            <Pressable style={styles.continueButton} onPress={handleContinueFromLocation}>
              <Text style={styles.continueButtonText}>
                {location ? "Continue" : "Skip for now"}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // RENDER: Style Preferences (Swipe Cards)
  if (stage === "style_preferences") {
    const currentCard = STYLE_CARDS[styleCardIndex];
    const nextCard = styleCardIndex < STYLE_CARDS.length - 1 ? STYLE_CARDS[styleCardIndex + 1] : null;

    if (!currentCard) {
      setStage("results");
      return null;
    }

    return (
      <View style={styles.container}>
        <LinearGradient colors={["#0f172a", "#1e293b"]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.safe}>
          <View style={styles.header}>
            <Pressable onPress={() => setStage("location")} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.6)" />
            </Pressable>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${getProgress() * 100}%` }]} />
              </View>
              <Text style={styles.progressText}>{styleCardIndex + 1} of {STYLE_CARDS.length}</Text>
            </View>
            <Pressable onPress={handleSkip} style={styles.skipButton}>
              <Text style={styles.skipText}>Skip</Text>
            </Pressable>
          </View>

          <Text style={styles.styleQuizTitle}>Discover Your Style</Text>

          <View style={styles.cardsContainer}>
            {nextCard && (
              <Animated.View
                style={[styles.card, styles.nextCard, { transform: [{ scale: nextCardScale }] }]}
              >
                {renderStyleCard(nextCard, false)}
              </Animated.View>
            )}

            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.card,
                {
                  transform: [
                    { translateX: position.x },
                    { translateY: position.y },
                    { rotate },
                  ],
                },
              ]}
            >
              {renderStyleCard(currentCard, true)}

              <Animated.View style={[styles.overlay, styles.yesOverlay, { opacity: yesOpacity }]}>
                <View style={styles.overlayBadge}>
                  <Ionicons name="heart" size={40} color="#22c55e" />
                  <Text style={styles.overlayText}>YES!</Text>
                </View>
              </Animated.View>

              <Animated.View style={[styles.overlay, styles.noOverlay, { opacity: noOpacity }]}>
                <View style={[styles.overlayBadge, { borderColor: "#ef4444" }]}>
                  <Ionicons name="close" size={40} color="#ef4444" />
                  <Text style={[styles.overlayText, { color: "#ef4444" }]}>NOPE</Text>
                </View>
              </Animated.View>
            </Animated.View>
          </View>

          <View style={styles.instructions}>
            <View style={styles.instructionItem}>
              <Ionicons name="arrow-back" size={20} color="rgba(255,255,255,0.5)" />
              <Text style={styles.instructionText}>Not me</Text>
            </View>
            <View style={styles.instructionItem}>
              <Text style={styles.instructionText}>That's me!</Text>
              <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.5)" />
            </View>
          </View>

          <View style={styles.actions}>
            <Pressable style={styles.actionButton} onPress={swipeLeft}>
              <Ionicons name="close" size={32} color="#ef4444" />
            </Pressable>
            <Pressable style={[styles.actionButton, styles.yesButton]} onPress={swipeRight}>
              <Ionicons name="heart" size={32} color="#22c55e" />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // RENDER: Results
  if (stage === "results" && personality) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={["#1e3a5f", "#0f172a"]} style={StyleSheet.absoluteFill} />
        <SafeAreaView style={styles.resultsSafe}>
          <ScrollView style={styles.resultsScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.resultsContent}>
              <View style={styles.personalityIcon}>
                <Ionicons name={personality.icon as any} size={48} color="#fff" />
              </View>

              <Text style={styles.resultsLabel}>YOUR DESIGN PERSONALITY</Text>
              <Text style={styles.resultsTitle}>{personality.name}</Text>
              <Text style={styles.resultsTagline}>"{personality.tagline}"</Text>
              <Text style={styles.resultsDescription}>{personality.description}</Text>

              {/* Badges Earned */}
              <View style={styles.badgesEarned}>
                <Text style={styles.badgesTitle}>Badges Earned!</Text>
                <View style={styles.badgesList}>
                  {QUIZ_BADGES.slice(0, 3).map(badge => (
                    <View key={badge.id} style={[styles.badgeItem, { borderColor: badge.color }]}>
                      <Ionicons name={badge.icon as any} size={20} color={badge.color} />
                      <Text style={styles.badgeName}>{badge.name}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Project Summary */}
              {selectedProject && (
                <View style={styles.projectSummary}>
                  <Text style={styles.summaryTitle}>Your Project</Text>
                  <View style={styles.summaryRow}>
                    <Ionicons name={selectedProject.icon as any} size={20} color={selectedProject.color} />
                    <Text style={styles.summaryText}>{selectedProject.label}</Text>
                  </View>
                  {selectedSubTypes.length > 0 && (
                    <Text style={styles.summaryDetail}>
                      Focus: {selectedSubTypes.map(st =>
                        selectedProject.subTypes?.find(s => s.id === st)?.label
                      ).join(", ")}
                    </Text>
                  )}
                  {budget && (
                    <Text style={styles.summaryDetail}>
                      Budget: {budget.charAt(0).toUpperCase() + budget.slice(1)}
                    </Text>
                  )}
                  {location && (
                    <Text style={styles.summaryDetail}>
                      Location: {location.address || "Pinned"}
                    </Text>
                  )}
                </View>
              )}

              {/* Matched Pros */}
              {selectedProject && (
                <View style={styles.matchedPros}>
                  <Text style={styles.matchedTitle}>We'll Match You With</Text>
                  <View style={styles.prosList}>
                    {selectedProject.matchingPros.slice(0, 4).map((pro, i) => (
                      <View key={i} style={styles.proItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                        <Text style={styles.proText}>
                          {pro.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Style Recommendations */}
              <View style={styles.resultsCard}>
                <View style={styles.resultSection}>
                  <Text style={styles.resultSectionTitle}>Your Colors</Text>
                  <Text style={styles.resultSectionValue}>{personality.colors.join(" • ")}</Text>
                </View>
                <View style={styles.resultSection}>
                  <Text style={styles.resultSectionTitle}>Your Materials</Text>
                  <Text style={styles.resultSectionValue}>{personality.materials.join(" • ")}</Text>
                </View>
              </View>

              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>Pro Tips for You</Text>
                {personality.tips.map((tip, i) => (
                  <View key={i} style={styles.tipRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>

              <Pressable style={styles.finishButton} onPress={handleFinish}>
                <Text style={styles.finishButtonText}>Start Exploring</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  skipButton: { padding: 10 },
  skipText: { color: "rgba(255,255,255,0.6)", fontSize: 16, fontWeight: "500" },
  backButton: { padding: 10 },
  progressContainer: { alignItems: "center" },
  progressBar: {
    width: 140,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
  },
  progressFill: { height: "100%", backgroundColor: "#22c55e", borderRadius: 2 },
  progressText: { color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 6 },

  // Welcome
  welcomeContent: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
  welcomeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    textAlign: "center",
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsContainer: { marginBottom: 40 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  benefitText: { color: "rgba(255,255,255,0.8)", fontSize: 15 },
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22c55e",
    paddingVertical: 18,
    borderRadius: 14,
    gap: 10,
  },
  startButtonText: { fontSize: 18, fontWeight: "700", color: "#fff" },
  skipLink: { alignItems: "center", marginTop: 20 },
  skipLinkText: { color: "rgba(255,255,255,0.5)", fontSize: 15 },

  // Scroll Content
  scrollContent: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  stageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 8,
  },
  stageSubtitle: {
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 24,
  },

  // Project Grid
  projectGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingBottom: 40,
  },
  projectCard: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  projectIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  projectLabel: { fontSize: 16, fontWeight: "700", color: "#fff", marginBottom: 4 },
  projectDescription: { fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center" },

  // Selected Project Badge
  selectedProjectBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 20,
  },
  selectedProjectText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  // Sub Types
  subTypesContainer: { marginBottom: 24 },
  subTypeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  subTypeButtonActive: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  subTypeLabel: { flex: 1, color: "rgba(255,255,255,0.7)", fontSize: 16 },
  subTypeLabelActive: { color: "#fff", fontWeight: "600" },

  // Text Input
  inputLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14, marginBottom: 8 },
  textInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 16,
    color: "#fff",
    fontSize: 15,
    minHeight: 100,
    textAlignVertical: "top",
    marginBottom: 24,
  },

  // Continue Button
  continueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginBottom: 40,
  },
  continueButtonText: { fontSize: 17, fontWeight: "700", color: "#fff" },

  // Budget Options
  sectionLabel: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    marginTop: 8,
  },
  optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  optionCard: {
    width: "48%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  optionCardActive: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  optionLabel: { color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "600", marginTop: 8 },
  optionLabelActive: { color: "#fff" },
  optionSublabel: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 },

  // DIY Options
  diyOptions: { marginBottom: 24 },
  diyOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    gap: 12,
  },
  diyOptionActive: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderWidth: 1,
    borderColor: "#22c55e",
  },
  diyTextContainer: { flex: 1 },
  diyLabel: { color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: "600" },
  diyLabelActive: { color: "#fff" },
  diyDescription: { color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 2 },

  // Location
  locationContent: { flex: 1, justifyContent: "center", paddingHorizontal: 32 },
  locationIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 24,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
    marginTop: 24,
  },
  locationButtonText: { fontSize: 17, fontWeight: "700", color: "#fff" },
  locationResult: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  locationResultText: { flex: 1 },
  locationAddress: { color: "#fff", fontSize: 16, fontWeight: "600" },
  locationCoords: { color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 2 },
  locationBenefits: { marginTop: 32 },
  locationBenefit: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  locationBenefitText: { color: "rgba(255,255,255,0.7)", fontSize: 15 },

  // Style Quiz Title
  styleQuizTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },

  // Cards
  cardsContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_HEIGHT * 0.48,
    borderRadius: 24,
    overflow: "hidden",
    position: "absolute",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  nextCard: { top: 10 },

  // Statement Card
  statementCard: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    backgroundColor: "#fff",
  },
  statementIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f0f4ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  statementText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 12,
  },
  statementSubtext: { fontSize: 15, color: "#6b7280", textAlign: "center", lineHeight: 22 },

  // Color Card
  colorCard: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: "#fff" },
  colorCardTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a", marginBottom: 24 },
  colorSwatches: { flexDirection: "row", marginBottom: 20 },
  colorSwatch: { width: 50, height: 100, marginHorizontal: 4, borderRadius: 10 },
  colorLabel: { fontSize: 16, fontWeight: "600", color: "#374151" },

  // Either/Or Card
  eitherOrCard: { flex: 1, padding: 24, backgroundColor: "#fff" },
  eitherOrTitle: { fontSize: 20, fontWeight: "700", color: "#0f172a", textAlign: "center", marginBottom: 24, marginTop: 16 },
  eitherOrOptions: { flex: 1, flexDirection: "row", alignItems: "center" },
  eitherOrOption: { flex: 1, alignItems: "center" },
  eitherOrIcon: { width: 70, height: 70, borderRadius: 35, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  eitherOrLabel: { fontSize: 14, fontWeight: "600", color: "#374151", textAlign: "center", marginBottom: 8 },
  swipeHint: { flexDirection: "row", alignItems: "center", gap: 4 },
  swipeHintText: { fontSize: 11, color: "#9ca3af" },
  eitherOrDivider: { width: 40, alignItems: "center" },
  orText: { fontSize: 14, color: "#9ca3af", fontWeight: "500" },

  // Image Card
  imageCard: { flex: 1 },
  cardImage: { width: "100%", height: "100%" },
  imageGradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: "40%" },
  imageLabelContainer: { position: "absolute", bottom: 24, left: 20, right: 20 },
  imageQuestion: { fontSize: 14, color: "rgba(255,255,255,0.8)", marginBottom: 6 },
  imageLabel: { fontSize: 24, fontWeight: "700", color: "#fff" },

  // Overlays
  overlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  yesOverlay: {},
  noOverlay: {},
  overlayBadge: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: "#22c55e",
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
  },
  overlayText: { fontSize: 20, fontWeight: "800", color: "#22c55e", marginTop: 6 },

  // Instructions
  instructions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 40,
    marginBottom: 12,
  },
  instructionItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  instructionText: { color: "rgba(255,255,255,0.5)", fontSize: 14 },

  // Actions
  actions: { flexDirection: "row", justifyContent: "center", gap: 40, paddingBottom: 30 },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  yesButton: { backgroundColor: "rgba(34, 197, 94, 0.1)", borderColor: "rgba(34, 197, 94, 0.3)" },

  // Results
  resultsSafe: { flex: 1 },
  resultsScroll: { flex: 1 },
  resultsContent: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 40 },
  personalityIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 20,
  },
  resultsLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 6,
  },
  resultsTitle: { fontSize: 28, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 6 },
  resultsTagline: { fontSize: 15, fontStyle: "italic", color: "#22c55e", textAlign: "center", marginBottom: 16 },
  resultsDescription: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },

  // Badges
  badgesEarned: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  badgesTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 12 },
  badgesList: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badgeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    borderWidth: 1,
  },
  badgeName: { color: "#fff", fontSize: 12, fontWeight: "600" },

  // Project Summary
  projectSummary: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 12 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  summaryText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  summaryDetail: { color: "rgba(255,255,255,0.6)", fontSize: 14, marginLeft: 30, marginBottom: 4 },

  // Matched Pros
  matchedPros: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  matchedTitle: { fontSize: 14, fontWeight: "700", color: "#22c55e", marginBottom: 12 },
  prosList: { gap: 8 },
  proItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  proText: { color: "rgba(255,255,255,0.8)", fontSize: 14 },

  // Style Results Card
  resultsCard: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  resultSection: { marginBottom: 12 },
  resultSectionTitle: {
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultSectionValue: { fontSize: 13, color: "#fff", lineHeight: 20 },

  // Tips
  tipsContainer: { marginBottom: 24 },
  tipsTitle: { fontSize: 14, fontWeight: "700", color: "#fff", marginBottom: 12 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 8 },
  tipText: { flex: 1, fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 18 },

  // Finish Button
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 14,
    gap: 10,
  },
  finishButtonText: { fontSize: 17, fontWeight: "700", color: "#fff" },
});
