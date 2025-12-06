import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  Dimensions,
  FlatList,
  StyleSheet,
  ViewToken,
  Share,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useAuthStore, ProjectType } from "../state/authStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FeedItem {
  id: string;
  type: "project" | "product" | "tip" | "before_after";
  imageUrl: string;
  title: string;
  description: string;
  author: {
    name: string;
    avatar?: string;
    role: "contractor" | "designer" | "homeowner" | "vendor";
    verified?: boolean;
  };
  engagement: {
    likes: number;
    comments: number;
    saves: number;
    shares: number;
  };
  tags: string[];
  material?: string;
  style?: string;
  room?: string;
  price?: number;
  location?: string;
  liked?: boolean;
  saved?: boolean;
  projectType?: ProjectType;
}

// Style matching keywords for personalization
const STYLE_KEYWORDS: Record<string, string[]> = {
  modern: ["modern", "minimalist", "clean", "sleek", "contemporary"],
  traditional: ["traditional", "classic", "timeless", "elegant", "ornate"],
  rustic: ["rustic", "farmhouse", "natural", "wood", "reclaimed"],
  industrial: ["industrial", "metal", "concrete", "raw", "urban"],
  coastal: ["coastal", "beach", "blue", "white", "nautical"],
  bohemian: ["bohemian", "eclectic", "colorful", "artisan", "textured"],
};

// Mock feed data - would come from API based on user preferences
const MOCK_FEED: FeedItem[] = [
  {
    id: "1",
    type: "project",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800",
    title: "Modern Kitchen Transformation",
    description: "White quartz countertops with waterfall edge. This project took 3 weeks from demo to completion. The homeowner wanted a clean, modern look.",
    author: {
      name: "Elite Stone Works",
      role: "contractor",
      verified: true,
    },
    engagement: { likes: 2341, comments: 89, saves: 456, shares: 23 },
    tags: ["modern", "quartz", "kitchen", "minimalist"],
    material: "Quartz",
    style: "Modern",
    room: "Kitchen",
    location: "Phoenix, AZ",
    projectType: "kitchen",
  },
  {
    id: "2",
    type: "product",
    imageUrl: "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
    title: "Calacatta Gold Marble Slab",
    description: "Premium Italian marble with stunning gold veining. Perfect for statement kitchen islands or bathroom vanities.",
    author: {
      name: "Arizona Stone Supply",
      role: "vendor",
      verified: true,
    },
    engagement: { likes: 1876, comments: 45, saves: 892, shares: 67 },
    tags: ["luxury", "marble", "italian", "traditional", "elegant"],
    material: "Marble",
    style: "Luxury",
    price: 185,
    location: "Phoenix, AZ",
    projectType: "countertops",
  },
  {
    id: "3",
    type: "before_after",
    imageUrl: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
    title: "Master Bath Renovation",
    description: "From dated tile to stunning natural stone. Porcelain tile shower with heated floors and frameless glass.",
    author: {
      name: "Sarah's Designs",
      role: "designer",
      verified: true,
    },
    engagement: { likes: 3421, comments: 156, saves: 1203, shares: 89 },
    tags: ["bathroom", "renovation", "tile", "contemporary"],
    material: "Porcelain",
    style: "Contemporary",
    room: "Bathroom",
    projectType: "bathroom",
  },
  {
    id: "4",
    type: "tip",
    imageUrl: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    title: "How to Choose the Right Countertop",
    description: "Consider durability, maintenance, and budget. Quartz is great for busy kitchens, while marble adds timeless elegance but needs more care.",
    author: {
      name: "DIY Kitchen Pro",
      role: "homeowner",
    },
    engagement: { likes: 5678, comments: 234, saves: 2341, shares: 156 },
    tags: ["tips", "countertops", "guide"],
    style: "Educational",
    projectType: "countertops",
  },
  {
    id: "5",
    type: "project",
    imageUrl: "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800",
    title: "Outdoor Kitchen Paradise",
    description: "Granite counters rated for outdoor use. Built-in grill, sink, and refrigerator. The perfect entertaining space.",
    author: {
      name: "Desert Outdoor Living",
      role: "contractor",
      verified: true,
    },
    engagement: { likes: 4532, comments: 178, saves: 987, shares: 45 },
    tags: ["outdoor", "granite", "entertaining", "modern"],
    material: "Granite",
    style: "Modern",
    room: "Outdoor",
    location: "Scottsdale, AZ",
    projectType: "outdoor",
  },
  {
    id: "6",
    type: "product",
    imageUrl: "https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=800",
    title: "Remnant Sale - 50% Off",
    description: "Premium quartz remnants perfect for bathroom vanities, laundry rooms, or small projects. Limited quantities!",
    author: {
      name: "Remnant Depot",
      role: "vendor",
    },
    engagement: { likes: 2145, comments: 67, saves: 543, shares: 234 },
    tags: ["sale", "remnants", "deal"],
    material: "Quartz",
    price: 45,
    location: "Mesa, AZ",
    projectType: "bathroom",
  },
  {
    id: "7",
    type: "project",
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    title: "Rustic Farmhouse Kitchen",
    description: "Reclaimed wood accents with natural stone counters. This farmhouse-inspired kitchen blends warmth with functionality.",
    author: {
      name: "Countryside Renovations",
      role: "contractor",
      verified: true,
    },
    engagement: { likes: 3892, comments: 134, saves: 1567, shares: 78 },
    tags: ["rustic", "farmhouse", "natural", "wood", "reclaimed"],
    material: "Granite",
    style: "Rustic",
    room: "Kitchen",
    location: "Gilbert, AZ",
    projectType: "kitchen",
  },
  {
    id: "8",
    type: "before_after",
    imageUrl: "https://images.unsplash.com/photo-1600607687644-c7171b42498f?w=800",
    title: "Industrial Loft Flooring",
    description: "Polished concrete floors with metal accents. Raw, urban aesthetic meets modern comfort in this industrial renovation.",
    author: {
      name: "Urban Design Studio",
      role: "designer",
      verified: true,
    },
    engagement: { likes: 2756, comments: 98, saves: 845, shares: 56 },
    tags: ["industrial", "concrete", "metal", "urban", "loft"],
    material: "Concrete",
    style: "Industrial",
    room: "Living",
    projectType: "flooring",
  },
  {
    id: "9",
    type: "project",
    imageUrl: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=800",
    title: "Coastal Bathroom Retreat",
    description: "White subway tiles with blue accents create a serene, beach-inspired oasis. Nautical touches throughout.",
    author: {
      name: "Seaside Interiors",
      role: "designer",
    },
    engagement: { likes: 4123, comments: 167, saves: 1890, shares: 112 },
    tags: ["coastal", "beach", "blue", "white", "nautical", "tile"],
    material: "Ceramic Tile",
    style: "Coastal",
    room: "Bathroom",
    projectType: "bathroom",
  },
  {
    id: "10",
    type: "tip",
    imageUrl: "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800",
    title: "Plumbing Prep for Kitchen Remodel",
    description: "Before tearing out cabinets, know your plumbing layout. Pro tip: always shut off water main and label pipes.",
    author: {
      name: "Master Plumbers AZ",
      role: "contractor",
      verified: true,
    },
    engagement: { likes: 1987, comments: 89, saves: 678, shares: 45 },
    tags: ["plumbing", "tips", "kitchen", "remodel"],
    style: "Educational",
    projectType: "plumbing",
  },
  {
    id: "11",
    type: "product",
    imageUrl: "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800",
    title: "Bohemian Mosaic Tile Set",
    description: "Hand-painted artisan tiles perfect for backsplashes. Eclectic, colorful patterns that make a statement.",
    author: {
      name: "Artisan Tile Co",
      role: "vendor",
      verified: true,
    },
    engagement: { likes: 2345, comments: 78, saves: 1234, shares: 89 },
    tags: ["bohemian", "eclectic", "colorful", "artisan", "mosaic"],
    material: "Ceramic",
    style: "Bohemian",
    price: 28,
    location: "Tempe, AZ",
    projectType: "kitchen",
  },
  {
    id: "12",
    type: "project",
    imageUrl: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
    title: "Backyard Patio Transformation",
    description: "Travertine pavers with drought-resistant landscaping. Low maintenance, high impact for Arizona living.",
    author: {
      name: "Desert Landscape Pros",
      role: "contractor",
      verified: true,
    },
    engagement: { likes: 3567, comments: 145, saves: 987, shares: 67 },
    tags: ["outdoor", "landscaping", "patio", "desert"],
    material: "Travertine",
    style: "Modern",
    room: "Outdoor",
    location: "Chandler, AZ",
    projectType: "landscaping",
  },
];

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const FeedCard = ({ item, isActive }: { item: FeedItem; isActive: boolean }) => {
  const navigation = useNavigation<NavigationProp>();
  const [liked, setLiked] = useState(item.liked || false);
  const [saved, setSaved] = useState(item.saved || false);
  const [likeCount, setLikeCount] = useState(item.engagement.likes);

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleSave = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSaved(!saved);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Check out this ${item.title} on SlabSnap!`,
      });
    } catch (error) {
      // Handle error
    }
  };

  const handleComment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to comments
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "contractor": return "#3b82f6";
      case "designer": return "#8b5cf6";
      case "vendor": return "#22c55e";
      default: return "#6b7280";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "project": return "PROJECT";
      case "product": return "FOR SALE";
      case "tip": return "PRO TIP";
      case "before_after": return "TRANSFORMATION";
      default: return "";
    }
  };

  return (
    <View style={styles.feedCard}>
      {/* Background Image */}
      <Image source={{ uri: item.imageUrl }} style={styles.feedImage} />

      {/* Gradient Overlay */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.3)", "rgba(0,0,0,0.85)"]}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      />

      {/* Content Type Badge */}
      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>{getTypeLabel(item.type)}</Text>
      </View>

      {/* Right Side Actions */}
      <View style={styles.sideActions}>
        {/* Like */}
        <Pressable style={styles.actionItem} onPress={handleLike}>
          <Ionicons
            name={liked ? "heart" : "heart-outline"}
            size={32}
            color={liked ? "#ef4444" : "#fff"}
          />
          <Text style={styles.actionCount}>{formatNumber(likeCount)}</Text>
        </Pressable>

        {/* Comment */}
        <Pressable style={styles.actionItem} onPress={handleComment}>
          <Ionicons name="chatbubble-outline" size={30} color="#fff" />
          <Text style={styles.actionCount}>{formatNumber(item.engagement.comments)}</Text>
        </Pressable>

        {/* Save */}
        <Pressable style={styles.actionItem} onPress={handleSave}>
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={30}
            color={saved ? "#fbbf24" : "#fff"}
          />
          <Text style={styles.actionCount}>{formatNumber(item.engagement.saves)}</Text>
        </Pressable>

        {/* Share */}
        <Pressable style={styles.actionItem} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={30} color="#fff" />
          <Text style={styles.actionCount}>{formatNumber(item.engagement.shares)}</Text>
        </Pressable>
      </View>

      {/* Bottom Content */}
      <View style={styles.bottomContent}>
        {/* Author */}
        <Pressable style={styles.authorRow}>
          <View style={styles.authorAvatar}>
            {item.author.avatar ? (
              <Image source={{ uri: item.author.avatar }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={20} color="#fff" />
            )}
          </View>
          <Text style={styles.authorName}>{item.author.name}</Text>
          {item.author.verified && (
            <Ionicons name="checkmark-circle" size={16} color="#3b82f6" />
          )}
          <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(item.author.role) }]}>
            <Text style={styles.roleBadgeText}>{item.author.role}</Text>
          </View>
        </Pressable>

        {/* Title */}
        <Text style={styles.feedTitle} numberOfLines={2}>{item.title}</Text>

        {/* Description */}
        <Text style={styles.feedDescription} numberOfLines={3}>{item.description}</Text>

        {/* Tags & Info */}
        <View style={styles.metaRow}>
          {item.material && (
            <View style={styles.metaTag}>
              <Ionicons name="layers-outline" size={14} color="#fff" />
              <Text style={styles.metaText}>{item.material}</Text>
            </View>
          )}
          {item.price && (
            <View style={styles.metaTag}>
              <Text style={styles.priceText}>${item.price}/sqft</Text>
            </View>
          )}
          {item.location && (
            <View style={styles.metaTag}>
              <Ionicons name="location-outline" size={14} color="#fff" />
              <Text style={styles.metaText}>{item.location}</Text>
            </View>
          )}
        </View>

        {/* Action Button */}
        {item.type === "product" && (
          <Pressable style={styles.ctaButton}>
            <Text style={styles.ctaText}>View Details</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );
};

type FeedTab = "for_you" | "following" | "trending";

export default function InspirationFeedScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { preferences } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<FeedTab>("for_you");
  const flatListRef = useRef<FlatList>(null);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
    []
  );

  // Score and sort feed items based on user preferences
  const getPersonalizedFeed = useCallback((): FeedItem[] => {
    const userStyle = preferences?.primaryStyle?.toLowerCase() || "";
    const userProjectTypes = preferences?.projectTypes || [];

    // Get style keywords for matching
    const styleKeywords = STYLE_KEYWORDS[userStyle] || [];

    // Score each item
    const scoredItems = MOCK_FEED.map(item => {
      let score = 0;

      // Project type match (highest priority)
      if (item.projectType && userProjectTypes.includes(item.projectType)) {
        score += 10;
      }

      // Style keyword match
      item.tags.forEach(tag => {
        if (styleKeywords.includes(tag.toLowerCase())) {
          score += 5;
        }
      });

      // Style name match
      if (item.style && userStyle && item.style.toLowerCase().includes(userStyle)) {
        score += 3;
      }

      // Engagement boost for popular content
      const engagementScore = (item.engagement.likes + item.engagement.saves * 2) / 1000;
      score += Math.min(engagementScore, 5);

      return { item, score };
    });

    // Sort by score (descending)
    return scoredItems
      .sort((a, b) => b.score - a.score)
      .map(x => x.item);
  }, [preferences]);

  // Get feed based on active tab
  const getFeedData = useCallback((): FeedItem[] => {
    switch (activeTab) {
      case "for_you":
        return getPersonalizedFeed();
      case "following":
        // Would filter to followed users - for now show verified authors
        return MOCK_FEED.filter(item => item.author.verified);
      case "trending":
        // Sort by engagement
        return [...MOCK_FEED].sort((a, b) =>
          (b.engagement.likes + b.engagement.saves) - (a.engagement.likes + a.engagement.saves)
        );
      default:
        return MOCK_FEED;
    }
  }, [activeTab, getPersonalizedFeed]);

  const feedData = getFeedData();

  const handleTabChange = (tab: FeedTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tab);
    setActiveIndex(0);
    // Scroll to top when changing tabs
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  };

  const renderItem = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => (
      <FeedCard item={item} isActive={index === activeIndex} />
    ),
    [activeIndex]
  );

  // Check if user has set up preferences
  const hasPreferences = preferences?.onboardingComplete ||
    (preferences?.projectTypes?.length || 0) > 0 ||
    preferences?.primaryStyle;

  return (
    <View style={styles.container}>
      {/* Header Overlay */}
      <SafeAreaView style={styles.headerOverlay} edges={["top"]}>
        <View style={styles.header}>
          <Pressable
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close" size={20} color="#fff" />
          </Pressable>

          <View style={styles.headerTabs}>
            <Pressable
              style={activeTab === "for_you" ? styles.tabActive : styles.tab}
              onPress={() => handleTabChange("for_you")}
            >
              <Text style={activeTab === "for_you" ? styles.tabTextActive : styles.tabText}>For You</Text>
            </Pressable>
            <Pressable
              style={activeTab === "following" ? styles.tabActive : styles.tab}
              onPress={() => handleTabChange("following")}
            >
              <Text style={activeTab === "following" ? styles.tabTextActive : styles.tabText}>Following</Text>
            </Pressable>
            <Pressable
              style={activeTab === "trending" ? styles.tabActive : styles.tab}
              onPress={() => handleTabChange("trending")}
            >
              <Text style={activeTab === "trending" ? styles.tabTextActive : styles.tabText}>Trending</Text>
            </Pressable>
          </View>

          <Pressable style={styles.headerButton}>
            <Ionicons name="search" size={18} color="#fff" />
          </Pressable>
        </View>

        {/* Style Indicator / Quiz CTA */}
        {activeTab === "for_you" && (
          hasPreferences ? (
            <View style={styles.styleIndicator}>
              <Ionicons name="sparkles" size={14} color="#fbbf24" />
              <Text style={styles.styleIndicatorText}>
                {preferences?.styleName
                  ? `Personalized for: ${preferences.styleName}`
                  : `Showing: ${preferences?.projectTypes?.join(", ") || "All"}`
                }
              </Text>
            </View>
          ) : (
            <Pressable
              style={styles.quizCta}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate("StyleQuiz" as never);
              }}
            >
              <Ionicons name="heart" size={14} color="#fff" />
              <Text style={styles.quizCtaText}>Take style quiz for personalized content</Text>
              <Ionicons name="chevron-forward" size={14} color="#fff" />
            </Pressable>
          )
        )}

        {/* Project Type Filter Pills */}
        {activeTab === "for_you" && (preferences?.projectTypes?.length || 0) > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.projectFilters}
          >
            {preferences?.projectTypes?.map(projectType => (
              <View key={projectType} style={styles.projectFilterPill}>
                <Ionicons
                  name={
                    projectType === "kitchen" ? "restaurant" :
                    projectType === "bathroom" ? "water" :
                    projectType === "outdoor" ? "leaf" :
                    projectType === "flooring" ? "grid" :
                    projectType === "plumbing" ? "build" :
                    "construct"
                  }
                  size={12}
                  color="#fff"
                />
                <Text style={styles.projectFilterText}>
                  {projectType.charAt(0).toUpperCase() + projectType.slice(1)}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Feed */}
      <FlatList
        ref={flatListRef}
        data={feedData}
        renderItem={renderItem}
        keyExtractor={(item) => `${activeTab}-${item.id}`}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 18,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    borderRadius: 18,
  },
  headerTabs: {
    flexDirection: "row",
    gap: 20,
  },
  tab: {
    paddingVertical: 4,
  },
  tabActive: {
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderBottomColor: "#fff",
  },
  tabText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 16,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  styleIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  styleIndicatorText: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "600",
  },
  feedCard: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  feedImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
  },
  typeBadge: {
    position: "absolute",
    top: 120,
    left: 16,
    backgroundColor: "rgba(59, 130, 246, 0.9)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  sideActions: {
    position: "absolute",
    right: 12,
    bottom: 180,
    alignItems: "center",
    gap: 20,
  },
  actionItem: {
    alignItems: "center",
    gap: 4,
  },
  actionCount: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  bottomContent: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 70,
    paddingHorizontal: 16,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  authorName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  roleBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  feedTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 24,
  },
  feedDescription: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  metaTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  priceText: {
    color: "#22c55e",
    fontSize: 13,
    fontWeight: "700",
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 12,
  },
  ctaText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  // Quiz CTA styles
  quizCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "rgba(168, 85, 247, 0.8)",
    marginHorizontal: 16,
    marginTop: 4,
    borderRadius: 12,
  },
  quizCtaText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  // Project filter pills
  projectFilters: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    flexDirection: "row",
  },
  projectFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  projectFilterText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});
