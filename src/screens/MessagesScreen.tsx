import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { useMessagingStore } from "../state/messagingStore";
import { useAuthStore } from "../state/authStore";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";
import { colors } from "../utils/colors";
import Swipeable from "react-native-gesture-handler/Swipeable";
import * as Haptics from "expo-haptics";

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type InboxFilter = "all" | "unread" | "pinned" | "archived";
type PlatformFilter = "all" | "slabsnap" | "whatsapp" | "telegram";

export default function MessagesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { conversations, favoriteConversations, toggleFavorite, deleteConversation, loadSampleConversations } = useMessagingStore();
  const { user } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [inboxFilter, setInboxFilter] = useState<InboxFilter>("all");
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("all");
  const [showFilters, setShowFilters] = useState(false);
  const swipeableRefs = React.useRef<{ [key: string]: Swipeable | null }>({});

  // Load sample data if no conversations exist
  useEffect(() => {
    if (user && conversations.length === 0) {
      loadSampleConversations();
    }
  }, [user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.primary[600]} />
          </View>
          <Text style={styles.emptyTitle}>
            Welcome to Inbox
          </Text>
          <Text style={styles.emptySubtitle}>
            Sign in to access messages from Remodely, WhatsApp, and Telegram
          </Text>
          <Pressable
            style={styles.primaryButton}
            onPress={() => navigation.navigate("Signup")}
          >
            <Text style={styles.primaryButtonText}>
              Get Started
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // Filter conversations
  const filteredConversations = conversations
    .filter((conv) => {
      // Search filter
      const matchesSearch = !searchQuery ||
        conv.otherUserName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (conv.listingTitle && conv.listingTitle.toLowerCase().includes(searchQuery.toLowerCase())) ||
        conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

      // Inbox filter
      let matchesInbox = true;
      if (inboxFilter === "unread") matchesInbox = conv.unreadCount > 0;
      if (inboxFilter === "pinned") matchesInbox = conv.isPinned === true;
      if (inboxFilter === "archived") matchesInbox = conv.isArchived === true;

      // Platform filter
      const matchesPlatform = platformFilter === "all" || conv.platform === platformFilter;

      return matchesSearch && matchesInbox && matchesPlatform;
    })
    .sort((a, b) => {
      // Pinned first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      
      // Favorites next
      const aIsFavorite = favoriteConversations.includes(a.id);
      const bIsFavorite = favoriteConversations.includes(b.id);
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // Then by time
      return b.lastMessageTime - a.lastMessageTime;
    });

  const unreadCount = conversations.filter(c => c.unreadCount > 0).length;
  const pinnedCount = conversations.filter(c => c.isPinned).length;

  const renderRightActions = (conversationId: string) => {
    const isFavorite = favoriteConversations.includes(conversationId);
    
    return (
      <View style={styles.swipeActionsContainer}>
        <Pressable
          style={styles.favoriteAction}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            toggleFavorite(conversationId);
            swipeableRefs.current[conversationId]?.close();
          }}
        >
          <Ionicons 
            name={isFavorite ? "star" : "star-outline"} 
            size={24} 
            color="white" 
          />
        </Pressable>
        <Pressable
          style={styles.deleteAction}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            deleteConversation(conversationId);
          }}
        >
          <Ionicons name="trash-outline" size={24} color="white" />
        </Pressable>
      </View>
    );
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "whatsapp": return "logo-whatsapp";
      case "telegram": return "paper-plane";
      default: return "chatbubble";
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case "whatsapp": return "#25D366";
      case "telegram": return "#0088cc";
      default: return colors.primary[600];
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Slack-style Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Inbox</Text>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.iconButton}
              onPress={() => navigation.navigate("VendorRelationships" as any)}
            >
              <Ionicons name="settings-outline" size={22} color={colors.text.primary} />
            </Pressable>
            <Pressable
              style={styles.iconButton}
              onPress={() => {/* Compose new message */}}
            >
              <Ionicons name="create-outline" size={22} color={colors.text.primary} />
            </Pressable>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={24} color={colors.text.quaternary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            placeholderTextColor={colors.text.quaternary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={24} color={colors.text.quaternary} />
            </Pressable>
          )}
        </View>

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterTabs}
          contentContainerStyle={styles.filterTabsContent}
        >
          <Pressable
            style={[styles.filterTab, inboxFilter === "all" && styles.filterTabActive]}
            onPress={() => setInboxFilter("all")}
          >
            <Ionicons name="chatbubbles" size={28} color={inboxFilter === "all" ? colors.primary[600] : colors.text.tertiary} />
            <Text style={[styles.filterTabText, inboxFilter === "all" && styles.filterTabTextActive]}>
              All
            </Text>
            <View style={[styles.filterBadge, inboxFilter === "all" && { backgroundColor: colors.primary[600] }]}>
              <Text style={styles.filterBadgeText}>{filteredConversations.length}</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.filterTab, inboxFilter === "unread" && styles.filterTabActive]}
            onPress={() => setInboxFilter("unread")}
          >
            <Ionicons name="mail-unread" size={28} color={inboxFilter === "unread" ? colors.primary[600] : colors.text.tertiary} />
            <Text style={[styles.filterTabText, inboxFilter === "unread" && styles.filterTabTextActive]}>
              Unread
            </Text>
            {unreadCount > 0 && (
              <View style={[styles.filterBadge, inboxFilter === "unread" && { backgroundColor: colors.primary[600] }]}>
                <Text style={styles.filterBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={[styles.filterTab, inboxFilter === "pinned" && styles.filterTabActive]}
            onPress={() => setInboxFilter("pinned")}
          >
            <Ionicons name="pin" size={28} color={inboxFilter === "pinned" ? colors.primary[600] : colors.text.tertiary} />
            <Text style={[styles.filterTabText, inboxFilter === "pinned" && styles.filterTabTextActive]}>
              Pinned
            </Text>
            {pinnedCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{pinnedCount}</Text>
              </View>
            )}
          </Pressable>

          {/* Platform Filters */}
          <View style={styles.filterDivider} />

          <Pressable
            style={[styles.filterTab, platformFilter === "whatsapp" && styles.filterTabActive]}
            onPress={() => setPlatformFilter(platformFilter === "whatsapp" ? "all" : "whatsapp")}
          >
            <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
            <Text style={[styles.filterTabText, platformFilter === "whatsapp" && styles.filterTabTextActive]}>
              WhatsApp
            </Text>
          </Pressable>

          <Pressable
            style={[styles.filterTab, platformFilter === "telegram" && styles.filterTabActive]}
            onPress={() => setPlatformFilter(platformFilter === "telegram" ? "all" : "telegram")}
          >
            <Ionicons name="paper-plane" size={28} color="#0088cc" />
            <Text style={[styles.filterTabText, platformFilter === "telegram" && styles.filterTabTextActive]}>
              Telegram
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Conversations List */}
      <ScrollView style={styles.scrollView}>
        {filteredConversations.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.neutral[300]} />
            <Text style={styles.emptyStateTitle}>
              {searchQuery ? "No results found" : "No conversations yet"}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery
                ? "Try adjusting your search"
                : "Start a conversation by messaging a seller"}
            </Text>
          </View>
        ) : (
          filteredConversations.map((conversation) => {
            const isFavorite = favoriteConversations.includes(conversation.id);
            const platform = conversation.platform || "slabsnap";
            
            return (
              <Swipeable
                key={conversation.id}
                ref={(ref) => {
                  swipeableRefs.current[conversation.id] = ref;
                }}
                renderRightActions={() => renderRightActions(conversation.id)}
                overshootRight={false}
                friction={2}
                rightThreshold={40}
              >
                <Pressable
                  style={[
                    styles.conversationCard,
                    conversation.unreadCount > 0 && styles.conversationCardUnread,
                  ]}
                  onPress={() =>
                    navigation.navigate("Chat", { conversationId: conversation.id })
                  }
                >
                  {/* Avatar with Platform Badge */}
                  <View style={styles.avatarContainer}>
                    {conversation.listingImage ? (
                      <Image
                        source={{ uri: conversation.listingImage }}
                        style={styles.avatar}
                      />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>
                          {conversation.otherUserName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    
                    {/* Platform Badge */}
                    <View style={[styles.platformBadge, { backgroundColor: getPlatformColor(platform) }]}>
                      <Ionicons name={getPlatformIcon(platform) as any} size={10} color="white" />
                    </View>

                    {/* Unread Indicator */}
                    {conversation.unreadCount > 0 && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>

                  {/* Content */}
                  <View style={styles.conversationContent}>
                    <View style={styles.conversationHeader}>
                      <View style={styles.titleRow}>
                        {conversation.isPinned && (
                          <Ionicons name="pin" size={12} color={colors.text.tertiary} style={{ marginRight: 4 }} />
                        )}
                        {isFavorite && (
                          <Ionicons name="star" size={12} color={colors.accent[500]} style={{ marginRight: 4 }} />
                        )}
                        <Text style={styles.userName} numberOfLines={1}>
                          {conversation.otherUserName}
                        </Text>
                      </View>
                      <Text style={styles.timestamp}>
                        {formatDistanceToNow(conversation.lastMessageTime, {
                          addSuffix: false,
                        }).replace("about ", "")}
                      </Text>
                    </View>
                    
                    {conversation.listingTitle && (
                      <Text style={styles.contextText} numberOfLines={1}>
                        {conversation.listingTitle}
                      </Text>
                    )}
                    
                    <View style={styles.lastMessageRow}>
                      <Text
                        style={[
                          styles.lastMessage,
                          conversation.unreadCount > 0 && styles.lastMessageUnread
                        ]}
                        numberOfLines={1}
                      >
                        {conversation.lastMessage}
                      </Text>
                      {conversation.unreadCount > 0 && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>
                            {conversation.unreadCount}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </Pressable>
              </Swipeable>
            );
          })
        )}
      </ScrollView>

      {/* Connect External Platforms FAB */}
      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("PlatformIntegrations" as any)}
      >
        <Ionicons name="link" size={24} color="white" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    backgroundColor: colors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.text.primary,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.background.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
    color: colors.text.primary,
  },
  filterTabs: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTabsContent: {
    gap: 10,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
    backgroundColor: colors.background.secondary,
  },
  filterTabActive: {
    backgroundColor: colors.primary[100],
    borderWidth: 1,
    borderColor: colors.primary[400],
  },
  filterTabText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text.tertiary,
  },
  filterTabTextActive: {
    color: colors.primary[600],
    fontWeight: "600",
  },
  filterBadge: {
    backgroundColor: colors.text.quaternary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  filterBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
  },
  filterDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border.main,
    marginHorizontal: 8,
    alignSelf: "center",
  },
  scrollView: {
    flex: 1,
  },
  conversationCard: {
    flexDirection: "row",
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background.primary,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.light,
  },
  conversationCardUnread: {
    backgroundColor: colors.primary[50],
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  avatarPlaceholder: {
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "600",
    color: "white",
  },
  platformBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  unreadDot: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accent[500],
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  conversationContent: {
    flex: 1,
    justifyContent: "center",
  },
  conversationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginLeft: 8,
  },
  contextText: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginBottom: 4,
  },
  lastMessageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lastMessage: {
    flex: 1,
    fontSize: 14,
    color: colors.text.tertiary,
  },
  lastMessageUnread: {
    fontWeight: "600",
    color: colors.text.primary,
  },
  unreadBadge: {
    backgroundColor: colors.accent[500],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "white",
  },
  swipeActionsContainer: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  favoriteAction: {
    backgroundColor: colors.accent[500],
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  deleteAction: {
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.background.tertiary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: colors.text.tertiary,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: colors.primary[600],
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
    width: "100%",
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: "center",
    lineHeight: 20,
  },
  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
