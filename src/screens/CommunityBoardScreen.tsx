import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Modal,
  StyleSheet,
  Dimensions,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../utils/colors";
import { useAuthStore } from "../state/authStore";
import { CommunityTopic, TopicCategory, TopicAuthorRole, TRENDING_TOPICS } from "../types/marketplace";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Mock community topics data
const MOCK_TOPICS: CommunityTopic[] = [
  {
    id: "1",
    authorId: "u1",
    authorName: "Mike's Tile Pro",
    authorRole: "contractor",
    authorVerified: true,
    title: "Just finished this stunning walk-in shower with large format porcelain",
    content: "Used 48x48 porcelain slabs for this master bath remodel. The homeowner wanted minimal grout lines and we delivered! Pro tip: always use a leveling system for large tiles.",
    category: "tile_shower",
    images: ["https://images.unsplash.com/photo-1620626011761-996317b8d101?w=600"],
    tags: ["tile", "shower", "porcelain", "master-bath"],
    likeCount: 47,
    commentCount: 12,
    viewCount: 324,
    isTrending: true,
    createdAt: Date.now() - 3600000,
    lastActivityAt: Date.now() - 1800000,
    status: "active",
  },
  {
    id: "2",
    authorId: "u2",
    authorName: "Sarah Designer",
    authorRole: "designer",
    authorVerified: true,
    title: "Marble look tile - which brand has the most realistic veining?",
    content: "Working on a high-end bathroom project and the client wants the marble look without the maintenance. Been comparing MSI, Daltile, and Bedrosians. Anyone have experience with these?",
    category: "ask_pros",
    tags: ["tile", "marble-look", "porcelain", "design"],
    likeCount: 23,
    commentCount: 31,
    viewCount: 567,
    createdAt: Date.now() - 7200000,
    lastActivityAt: Date.now() - 900000,
    status: "active",
  },
  {
    id: "3",
    authorId: "u3",
    authorName: "HomeReno2024",
    authorRole: "homeowner",
    title: "Before & After: Our DIY bathroom floor tile project",
    content: "Finally finished our guest bathroom! Went with a herringbone pattern using 3x12 subway tiles. Took 3 weekends but so worth it. Total cost was around $800 for materials.",
    category: "before_after",
    images: ["https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=600"],
    tags: ["diy", "bathroom", "herringbone", "before-after"],
    likeCount: 89,
    commentCount: 24,
    viewCount: 1203,
    isFeatured: true,
    createdAt: Date.now() - 86400000,
    lastActivityAt: Date.now() - 3600000,
    status: "active",
  },
  {
    id: "4",
    authorId: "u4",
    authorName: "Floor Masters AZ",
    authorRole: "contractor",
    authorVerified: true,
    title: "LVP vs Tile for kitchen floors - honest pros take",
    content: "After 15 years in flooring, here's my honest take: LVP is great for budget projects but tile wins for longevity. Kitchen tile can last 50+ years. LVP typically 15-20. Consider your timeline.",
    category: "flooring",
    tags: ["flooring", "lvp", "tile", "kitchen"],
    likeCount: 156,
    commentCount: 67,
    viewCount: 2341,
    isPinned: true,
    createdAt: Date.now() - 172800000,
    lastActivityAt: Date.now() - 7200000,
    status: "active",
  },
  {
    id: "5",
    authorId: "u5",
    authorName: "TileDealFinder",
    authorRole: "homeowner",
    title: "Found Carrara look porcelain at $2.99/sqft - is this legit?",
    content: "Local store is having a clearance sale. They have Italian-made porcelain that looks like Carrara marble for $2.99/sqft. Normally $8+. Anyone bought from clearance sales? Tips?",
    category: "deals_finds",
    tags: ["deals", "tile", "carrara", "clearance"],
    likeCount: 34,
    commentCount: 45,
    viewCount: 892,
    createdAt: Date.now() - 14400000,
    lastActivityAt: Date.now() - 600000,
    status: "active",
  },
  {
    id: "6",
    authorId: "u6",
    authorName: "ProjectPM_Lisa",
    authorRole: "project_manager",
    authorVerified: true,
    title: "Timeline for full bathroom tile job - what to tell clients",
    content: "Managing expectations is key. I always tell clients: demo 1 day, waterproofing 1-2 days cure, floor tile 1-2 days, wall tile 2-3 days, grout/caulk 1 day + cure. Total 7-10 working days minimum.",
    category: "project_help",
    tags: ["timeline", "bathroom", "project-management"],
    likeCount: 78,
    commentCount: 19,
    viewCount: 445,
    createdAt: Date.now() - 259200000,
    lastActivityAt: Date.now() - 10800000,
    status: "active",
  },
];

const getRoleColor = (role: TopicAuthorRole): string => {
  switch (role) {
    case "contractor": return "#2563eb";
    case "designer": return "#7c3aed";
    case "homeowner": return "#059669";
    case "project_manager": return "#d97706";
    case "vendor": return "#dc2626";
    case "fabricator": return "#0891b2";
    default: return "#6b7280";
  }
};

const getRoleLabel = (role: TopicAuthorRole): string => {
  switch (role) {
    case "contractor": return "Pro";
    case "designer": return "Designer";
    case "homeowner": return "Homeowner";
    case "project_manager": return "PM";
    case "vendor": return "Vendor";
    case "fabricator": return "Fab";
    default: return "";
  }
};

const formatTimeAgo = (timestamp: number): string => {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

export default function CommunityBoardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const [selectedCategory, setSelectedCategory] = useState<TopicCategory | "all">("all");
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTopics = MOCK_TOPICS.filter(topic => {
    if (selectedCategory !== "all" && topic.category !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return topic.title.toLowerCase().includes(query) ||
             topic.content.toLowerCase().includes(query) ||
             topic.tags?.some(t => t.toLowerCase().includes(query));
    }
    return true;
  });

  const handleLike = (topicId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In production, update the like status via API
  };

  const renderTopicCard = ({ item: topic }: { item: CommunityTopic }) => (
    <Pressable
      style={styles.topicCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        // Navigate to topic detail
      }}
    >
      {/* Header */}
      <View style={styles.topicHeader}>
        <View style={styles.authorInfo}>
          {topic.authorAvatar ? (
            <Image source={{ uri: topic.authorAvatar }} style={styles.authorAvatar} />
          ) : (
            <View style={[styles.authorAvatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={16} color="#fff" />
            </View>
          )}
          <View>
            <View style={styles.authorNameRow}>
              <Text style={styles.authorName}>{topic.authorName}</Text>
              {topic.authorVerified && (
                <Ionicons name="checkmark-circle" size={14} color="#2563eb" style={{ marginLeft: 4 }} />
              )}
            </View>
            <View style={styles.authorMeta}>
              <View style={[styles.roleBadge, { backgroundColor: getRoleColor(topic.authorRole) + "20" }]}>
                <Text style={[styles.roleText, { color: getRoleColor(topic.authorRole) }]}>
                  {getRoleLabel(topic.authorRole)}
                </Text>
              </View>
              <Text style={styles.timeAgo}>{formatTimeAgo(topic.createdAt)}</Text>
            </View>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.badges}>
          {topic.isTrending && (
            <View style={styles.trendingBadge}>
              <Ionicons name="flame" size={12} color="#dc2626" />
            </View>
          )}
          {topic.isPinned && (
            <View style={styles.pinnedBadge}>
              <Ionicons name="pin" size={12} color="#2563eb" />
            </View>
          )}
        </View>
      </View>

      {/* Category Tag */}
      {topic.category === "tile_shower" && (
        <View style={styles.hotCategoryTag}>
          <Ionicons name="water" size={12} color="#0891b2" />
          <Text style={styles.hotCategoryText}>Tile & Shower</Text>
          <View style={styles.hotBadge}>
            <Text style={styles.hotBadgeText}>HOT</Text>
          </View>
        </View>
      )}

      {/* Content */}
      <Text style={styles.topicTitle} numberOfLines={2}>{topic.title}</Text>
      <Text style={styles.topicContent} numberOfLines={3}>{topic.content}</Text>

      {/* Image Preview */}
      {topic.images && topic.images.length > 0 && (
        <Image source={{ uri: topic.images[0] }} style={styles.topicImage} />
      )}

      {/* Tags */}
      {topic.tags && topic.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {topic.tags.slice(0, 4).map((tag, idx) => (
            <View key={idx} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Engagement */}
      <View style={styles.engagementRow}>
        <Pressable style={styles.engagementButton} onPress={() => handleLike(topic.id)}>
          <Ionicons name="heart-outline" size={18} color="#6b7280" />
          <Text style={styles.engagementCount}>{topic.likeCount || 0}</Text>
        </Pressable>
        <View style={styles.engagementButton}>
          <Ionicons name="chatbubble-outline" size={18} color="#6b7280" />
          <Text style={styles.engagementCount}>{topic.commentCount || 0}</Text>
        </View>
        <View style={styles.engagementButton}>
          <Ionicons name="eye-outline" size={18} color="#6b7280" />
          <Text style={styles.engagementCount}>{topic.viewCount || 0}</Text>
        </View>
        <Pressable style={styles.shareButton}>
          <Ionicons name="share-outline" size={18} color="#6b7280" />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Community</Text>
          <Text style={styles.headerSubtitle}>Connect with pros & homeowners</Text>
        </View>
        <Pressable
          style={styles.newPostButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowNewTopicModal(true);
          }}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search topics, tags..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Trending Categories */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesScroll}
        contentContainerStyle={styles.categoriesContent}
      >
        <Pressable
          style={[
            styles.categoryChip,
            selectedCategory === "all" && styles.categoryChipActive
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedCategory("all");
          }}
        >
          <Text style={[
            styles.categoryChipText,
            selectedCategory === "all" && styles.categoryChipTextActive
          ]}>All</Text>
        </Pressable>

        {TRENDING_TOPICS.map((topic) => (
          <Pressable
            key={topic.category}
            style={[
              styles.categoryChip,
              selectedCategory === topic.category && styles.categoryChipActive,
              topic.isHot && styles.categoryChipHot
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(topic.category);
            }}
          >
            <Ionicons
              name={topic.icon as any}
              size={14}
              color={selectedCategory === topic.category ? "#fff" : topic.color}
              style={{ marginRight: 4 }}
            />
            <Text style={[
              styles.categoryChipText,
              selectedCategory === topic.category && styles.categoryChipTextActive
            ]}>{topic.label}</Text>
            {topic.isHot && (
              <Ionicons name="flame" size={12} color="#dc2626" style={{ marginLeft: 4 }} />
            )}
          </Pressable>
        ))}
      </ScrollView>

      {/* Topics List */}
      <FlatList
        data={filteredTopics}
        keyExtractor={(item) => item.id}
        renderItem={renderTopicCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No topics found</Text>
            <Text style={styles.emptySubtitle}>Be the first to start a conversation!</Text>
          </View>
        }
      />

      {/* New Topic Modal - Simplified */}
      <Modal visible={showNewTopicModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowNewTopicModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>New Topic</Text>
            <Pressable style={styles.postButton}>
              <Text style={styles.postButtonText}>Post</Text>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={styles.topicTitleInput}
              placeholder="What's on your mind?"
              placeholderTextColor="#9ca3af"
              multiline
            />

            <View style={styles.modalActions}>
              <Pressable style={styles.mediaButton}>
                <Ionicons name="image-outline" size={24} color="#6b7280" />
                <Text style={styles.mediaButtonText}>Photo</Text>
              </Pressable>
              <Pressable style={styles.mediaButton}>
                <Ionicons name="videocam-outline" size={24} color="#6b7280" />
                <Text style={styles.mediaButtonText}>Video</Text>
              </Pressable>
              <Pressable style={styles.mediaButton}>
                <Ionicons name="pricetag-outline" size={24} color="#6b7280" />
                <Text style={styles.mediaButtonText}>Tag</Text>
              </Pressable>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 2,
  },
  newPostButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: colors.text.primary,
  },
  categoriesScroll: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background.secondary,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: colors.primary[600],
  },
  categoryChipHot: {
    borderWidth: 1,
    borderColor: "#dc262640",
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.secondary,
  },
  categoryChipTextActive: {
    color: "#fff",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  topicCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topicHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  authorInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary[400],
    alignItems: "center",
    justifyContent: "center",
  },
  authorNameRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  authorName: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text.primary,
  },
  authorMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: "700",
  },
  timeAgo: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  badges: {
    flexDirection: "row",
    gap: 6,
  },
  trendingBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  pinnedBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  hotCategoryTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfeff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginBottom: 10,
  },
  hotCategoryText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0891b2",
    marginLeft: 4,
  },
  hotBadge: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 6,
  },
  hotBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text.primary,
    lineHeight: 22,
    marginBottom: 6,
  },
  topicContent: {
    fontSize: 14,
    color: colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  topicImage: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.background.secondary,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: colors.primary[600],
  },
  engagementRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  engagementButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  engagementCount: {
    marginLeft: 4,
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },
  shareButton: {
    marginLeft: "auto",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.primary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.text.secondary,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  modalCancel: {
    fontSize: 16,
    color: colors.text.secondary,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: colors.text.primary,
  },
  postButton: {
    backgroundColor: colors.primary[600],
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  postButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  topicTitleInput: {
    fontSize: 18,
    color: colors.text.primary,
    minHeight: 120,
    textAlignVertical: "top",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    paddingTop: 16,
    marginTop: "auto",
  },
  mediaButton: {
    alignItems: "center",
    gap: 4,
  },
  mediaButtonText: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});
