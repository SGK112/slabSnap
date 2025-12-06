import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  FlatList,
  Modal,
  Share,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav/RootNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// User role types
type UserRole = "contractor" | "designer" | "homeowner" | "supplier" | "fabricator";

// Project status
type ProjectStatus = "sourcing" | "quoting" | "approved" | "in_progress" | "completed";

// Material selection in a project
interface MaterialSelection {
  id: string;
  name: string;
  type: "countertop" | "tile" | "flooring" | "cabinet" | "other";
  color: string;
  supplier: string;
  supplierType: "wholesale" | "retail" | "direct";
  image?: string;
  gradientColors: readonly [string, string, string];
  dimensions?: string;
  priceRange?: string; // For customers: "$$$" not actual price
  proPrice?: number; // Only visible to contractors with account
  availability: "in_stock" | "special_order" | "remnant";
  notes?: string;
  addedBy: string;
  addedByRole: UserRole;
}

// Team member on a project
interface TeamMember {
  id: string;
  name: string;
  role: UserRole;
  company?: string;
  avatar?: string;
  phone?: string;
  email?: string;
  canViewPricing: boolean;
}

// Project board
interface Project {
  id: string;
  name: string;
  status: ProjectStatus;
  customer: {
    name: string;
    location: string;
    phone?: string;
  };
  scope: string[];
  materials: MaterialSelection[];
  team: TeamMember[];
  messages: ProjectMessage[];
  createdAt: Date;
  updatedAt: Date;
  shareCode?: string; // For sharing with customers
}

// Project message/comment
interface ProjectMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  message: string;
  attachmentUrl?: string;
  timestamp: Date;
}

// Mock current user (would come from auth)
const currentUser: TeamMember = {
  id: "user-1",
  name: "John's Countertops",
  role: "contractor",
  company: "Surprise Granite",
  canViewPricing: true,
};

// Mock project data
const mockProjects: Project[] = [
  {
    id: "proj-1",
    name: "Martinez Kitchen Remodel",
    status: "sourcing",
    customer: {
      name: "Sarah Martinez",
      location: "Peoria, AZ",
      phone: "(623) 555-0123",
    },
    scope: ["Kitchen countertops", "Backsplash tile", "Island"],
    materials: [
      {
        id: "mat-1",
        name: "Calacatta Gold",
        type: "countertop",
        color: "White with gold veining",
        supplier: "Arizona Tile",
        supplierType: "wholesale",
        gradientColors: ["#f5f5f0", "#e8e4d9", "#f0ece3"] as const,
        dimensions: '126" x 63"',
        priceRange: "$$$$",
        proPrice: 85, // per sq ft
        availability: "in_stock",
        addedBy: "John's Countertops",
        addedByRole: "contractor",
      },
      {
        id: "mat-2",
        name: "Bianco Carrara",
        type: "countertop",
        color: "White with grey veining",
        supplier: "MSI",
        supplierType: "wholesale",
        gradientColors: ["#e8e8e8", "#d4d4d4", "#f0f0f0"] as const,
        dimensions: '120" x 60"',
        priceRange: "$$$",
        proPrice: 55,
        availability: "in_stock",
        addedBy: "John's Countertops",
        addedByRole: "contractor",
        notes: "Customer's 2nd choice - more budget friendly",
      },
    ],
    team: [
      {
        id: "user-1",
        name: "John's Countertops",
        role: "contractor",
        company: "Surprise Granite",
        canViewPricing: true,
      },
      {
        id: "user-2",
        name: "Sarah Martinez",
        role: "homeowner",
        canViewPricing: false,
      },
      {
        id: "user-3",
        name: "Maria Design Studio",
        role: "designer",
        canViewPricing: false,
      },
    ],
    messages: [
      {
        id: "msg-1",
        userId: "user-2",
        userName: "Sarah Martinez",
        userRole: "homeowner",
        message: "I really love the Calacatta! Can we see it in person?",
        timestamp: new Date(Date.now() - 86400000),
      },
      {
        id: "msg-2",
        userId: "user-1",
        userName: "John's Countertops",
        userRole: "contractor",
        message: "Absolutely! Arizona Tile has it in their showroom. I can meet you there Thursday at 2pm?",
        timestamp: new Date(Date.now() - 43200000),
      },
    ],
    createdAt: new Date(Date.now() - 604800000),
    updatedAt: new Date(),
    shareCode: "MTZ-2024",
  },
  {
    id: "proj-2",
    name: "Johnson Bathroom Vanity",
    status: "quoting",
    customer: {
      name: "Mike Johnson",
      location: "Surprise, AZ",
    },
    scope: ["Bathroom vanity top", "Small - single sink"],
    materials: [
      {
        id: "mat-3",
        name: "Steel Grey Granite",
        type: "countertop",
        color: "Dark grey with flecks",
        supplier: "Surprise Granite (Remnant)",
        supplierType: "direct",
        gradientColors: ["#4a4a4a", "#5c5c5c", "#3d3d3d"] as const,
        dimensions: '36" x 22"',
        priceRange: "$",
        proPrice: 150, // flat for remnant
        availability: "remnant",
        addedBy: "John's Countertops",
        addedByRole: "contractor",
        notes: "Perfect remnant piece - exact size needed!",
      },
    ],
    team: [
      currentUser,
      {
        id: "user-4",
        name: "Mike Johnson",
        role: "homeowner",
        canViewPricing: false,
      },
    ],
    messages: [],
    createdAt: new Date(Date.now() - 172800000),
    updatedAt: new Date(),
    shareCode: "JHN-2024",
  },
];

// Material type icons
const MATERIAL_TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  countertop: "layers",
  tile: "grid",
  flooring: "albums",
  cabinet: "cube",
  other: "ellipsis-horizontal",
};

// Role colors and labels
const ROLE_CONFIG: Record<UserRole, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  contractor: { color: colors.primary[600], label: "Contractor", icon: "construct" },
  designer: { color: colors.accent[500], label: "Designer", icon: "color-palette" },
  homeowner: { color: colors.red[500], label: "Homeowner", icon: "home" },
  supplier: { color: "#8b5cf6", label: "Supplier", icon: "business" },
  fabricator: { color: "#10b981", label: "Fabricator", icon: "hammer" },
};

// Status config
const STATUS_CONFIG: Record<ProjectStatus, { color: string; label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  sourcing: { color: colors.primary[500], label: "Sourcing Materials", icon: "search" },
  quoting: { color: colors.accent[500], label: "Preparing Quote", icon: "document-text" },
  approved: { color: "#10b981", label: "Approved", icon: "checkmark-circle" },
  in_progress: { color: "#f59e0b", label: "In Progress", icon: "hammer" },
  completed: { color: "#6b7280", label: "Completed", icon: "checkbox" },
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function ProjectBoardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [projects, setProjects] = useState<Project[]>(mockProjects);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showMaterialFinder, setShowMaterialFinder] = useState(false);
  const [activeTab, setActiveTab] = useState<"materials" | "team" | "messages">("materials");

  // Share project with customer
  const shareProject = async (project: Project) => {
    try {
      await Share.share({
        message: `View your project "${project.name}" on REMODELY: remodely://project/${project.shareCode}`,
        title: `REMODELY Project: ${project.name}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  // Render material card
  const renderMaterialCard = (material: MaterialSelection) => {
    const canSeePricing = currentUser.canViewPricing;

    return (
      <Pressable key={material.id} style={styles.materialCard}>
        {/* Material Image/Gradient */}
        <LinearGradient
          colors={material.gradientColors}
          style={styles.materialImage}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Stone texture overlay */}
          <View style={styles.stoneTexture}>
            <View style={styles.vein1} />
            <View style={styles.vein2} />
          </View>

          {/* Availability badge */}
          <View style={[
            styles.availabilityBadge,
            material.availability === "remnant" && styles.remnantBadge,
            material.availability === "special_order" && styles.specialOrderBadge,
          ]}>
            <Text style={styles.availabilityText}>
              {material.availability === "in_stock" ? "In Stock" :
               material.availability === "remnant" ? "Remnant" : "Special Order"}
            </Text>
          </View>
        </LinearGradient>

        {/* Material Info */}
        <View style={styles.materialInfo}>
          <View style={styles.materialHeader}>
            <View style={styles.materialTypeIcon}>
              <Ionicons
                name={MATERIAL_TYPE_ICONS[material.type]}
                size={14}
                color={colors.primary[600]}
              />
            </View>
            <Text style={styles.materialName} numberOfLines={1}>{material.name}</Text>
          </View>

          <Text style={styles.materialColor} numberOfLines={1}>{material.color}</Text>
          <Text style={styles.materialSupplier} numberOfLines={1}>
            <Ionicons name="business-outline" size={12} color={colors.neutral[400]} />{" "}
            {material.supplier}
          </Text>

          {material.dimensions && (
            <Text style={styles.materialDimensions}>
              <Ionicons name="resize-outline" size={12} color={colors.neutral[400]} />{" "}
              {material.dimensions}
            </Text>
          )}

          {/* Pricing - role based */}
          <View style={styles.pricingRow}>
            {canSeePricing ? (
              <View style={styles.proPriceContainer}>
                <Text style={styles.proPriceLabel}>Pro Price:</Text>
                <Text style={styles.proPrice}>
                  ${material.proPrice}{material.availability !== "remnant" ? "/sf" : " flat"}
                </Text>
              </View>
            ) : (
              <View style={styles.priceRangeContainer}>
                <Text style={styles.priceRangeLabel}>Price Range:</Text>
                <Text style={styles.priceRange}>{material.priceRange}</Text>
              </View>
            )}
          </View>

          {/* Notes */}
          {material.notes && (
            <View style={styles.notesContainer}>
              <Ionicons name="chatbubble-outline" size={12} color={colors.neutral[400]} />
              <Text style={styles.notesText} numberOfLines={2}>{material.notes}</Text>
            </View>
          )}

          {/* Added by */}
          <View style={styles.addedByRow}>
            <View style={[styles.roleBadge, { backgroundColor: ROLE_CONFIG[material.addedByRole].color + "20" }]}>
              <Ionicons
                name={ROLE_CONFIG[material.addedByRole].icon}
                size={10}
                color={ROLE_CONFIG[material.addedByRole].color}
              />
              <Text style={[styles.roleBadgeText, { color: ROLE_CONFIG[material.addedByRole].color }]}>
                {material.addedBy}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  // Render team member
  const renderTeamMember = (member: TeamMember) => {
    const roleConfig = ROLE_CONFIG[member.role];

    return (
      <View key={member.id} style={styles.teamMemberCard}>
        <View style={[styles.memberAvatar, { backgroundColor: roleConfig.color + "20" }]}>
          <Ionicons name={roleConfig.icon} size={24} color={roleConfig.color} />
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.name}</Text>
          {member.company && <Text style={styles.memberCompany}>{member.company}</Text>}
          <View style={[styles.roleTag, { backgroundColor: roleConfig.color + "15" }]}>
            <Text style={[styles.roleTagText, { color: roleConfig.color }]}>{roleConfig.label}</Text>
          </View>
        </View>
        <View style={styles.memberActions}>
          {member.phone && (
            <Pressable style={styles.memberActionBtn}>
              <Ionicons name="call-outline" size={20} color={colors.primary[600]} />
            </Pressable>
          )}
          <Pressable style={styles.memberActionBtn}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.primary[600]} />
          </Pressable>
        </View>
      </View>
    );
  };

  // Render message
  const renderMessage = (message: ProjectMessage) => {
    const isCurrentUser = message.userId === currentUser.id;
    const roleConfig = ROLE_CONFIG[message.userRole];

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isCurrentUser && styles.messageContainerSent,
        ]}
      >
        {!isCurrentUser && (
          <View style={[styles.messageAvatar, { backgroundColor: roleConfig.color + "20" }]}>
            <Ionicons name={roleConfig.icon} size={16} color={roleConfig.color} />
          </View>
        )}
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.messageBubbleSent : styles.messageBubbleReceived,
        ]}>
          {!isCurrentUser && (
            <Text style={styles.messageSender}>{message.userName}</Text>
          )}
          <Text style={[
            styles.messageText,
            isCurrentUser && styles.messageTextSent,
          ]}>
            {message.message}
          </Text>
          <Text style={[
            styles.messageTime,
            isCurrentUser && styles.messageTimeSent,
          ]}>
            {new Date(message.timestamp).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  // Project detail view
  const renderProjectDetail = () => {
    if (!selectedProject) return null;

    const statusConfig = STATUS_CONFIG[selectedProject.status];

    return (
      <Modal visible={!!selectedProject} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setSelectedProject(null)} style={styles.closeButton}>
              <Ionicons name="chevron-down" size={28} color={colors.neutral[600]} />
            </Pressable>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle} numberOfLines={1}>{selectedProject.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: statusConfig.color + "20" }]}>
                <Ionicons name={statusConfig.icon} size={12} color={statusConfig.color} />
                <Text style={[styles.statusText, { color: statusConfig.color }]}>{statusConfig.label}</Text>
              </View>
            </View>
            <Pressable onPress={() => shareProject(selectedProject)} style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color={colors.primary[600]} />
            </Pressable>
          </View>

          {/* Customer Info */}
          <View style={styles.customerBanner}>
            <Ionicons name="person" size={20} color={colors.neutral[600]} />
            <View style={styles.customerInfo}>
              <Text style={styles.customerName}>{selectedProject.customer.name}</Text>
              <Text style={styles.customerLocation}>
                <Ionicons name="location-outline" size={12} /> {selectedProject.customer.location}
              </Text>
            </View>
            {selectedProject.customer.phone && (
              <Pressable style={styles.callCustomerBtn}>
                <Ionicons name="call" size={18} color="#fff" />
              </Pressable>
            )}
          </View>

          {/* Scope */}
          <View style={styles.scopeContainer}>
            <Text style={styles.scopeLabel}>Project Scope:</Text>
            <View style={styles.scopeTags}>
              {selectedProject.scope.map((item, idx) => (
                <View key={idx} style={styles.scopeTag}>
                  <Text style={styles.scopeTagText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tabs */}
          <View style={styles.tabBar}>
            <Pressable
              style={[styles.tab, activeTab === "materials" && styles.tabActive]}
              onPress={() => setActiveTab("materials")}
            >
              <Ionicons
                name="layers"
                size={18}
                color={activeTab === "materials" ? colors.primary[600] : colors.neutral[400]}
              />
              <Text style={[styles.tabText, activeTab === "materials" && styles.tabTextActive]}>
                Materials ({selectedProject.materials.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === "team" && styles.tabActive]}
              onPress={() => setActiveTab("team")}
            >
              <Ionicons
                name="people"
                size={18}
                color={activeTab === "team" ? colors.primary[600] : colors.neutral[400]}
              />
              <Text style={[styles.tabText, activeTab === "team" && styles.tabTextActive]}>
                Team ({selectedProject.team.length})
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, activeTab === "messages" && styles.tabActive]}
              onPress={() => setActiveTab("messages")}
            >
              <Ionicons
                name="chatbubbles"
                size={18}
                color={activeTab === "messages" ? colors.primary[600] : colors.neutral[400]}
              />
              <Text style={[styles.tabText, activeTab === "messages" && styles.tabTextActive]}>
                Chat ({selectedProject.messages.length})
              </Text>
            </Pressable>
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            {activeTab === "materials" && (
              <View style={styles.materialsGrid}>
                {selectedProject.materials.map(renderMaterialCard)}

                {/* Add Material Button */}
                <Pressable
                  style={styles.addMaterialCard}
                  onPress={() => setShowMaterialFinder(true)}
                >
                  <Ionicons name="add-circle" size={40} color={colors.primary[400]} />
                  <Text style={styles.addMaterialText}>Add Material</Text>
                  <Text style={styles.addMaterialSubtext}>Search inventory or snap a photo</Text>
                </Pressable>
              </View>
            )}

            {activeTab === "team" && (
              <View style={styles.teamList}>
                {selectedProject.team.map(renderTeamMember)}

                {/* Invite Button */}
                <Pressable style={styles.inviteButton}>
                  <Ionicons name="person-add" size={20} color={colors.primary[600]} />
                  <Text style={styles.inviteButtonText}>Invite Team Member</Text>
                </Pressable>
              </View>
            )}

            {activeTab === "messages" && (
              <View style={styles.messagesContainer}>
                {selectedProject.messages.length === 0 ? (
                  <View style={styles.emptyMessages}>
                    <Ionicons name="chatbubbles-outline" size={48} color={colors.neutral[300]} />
                    <Text style={styles.emptyMessagesText}>No messages yet</Text>
                    <Text style={styles.emptyMessagesSubtext}>Start the conversation!</Text>
                  </View>
                ) : (
                  selectedProject.messages.map(renderMessage)
                )}
              </View>
            )}
          </ScrollView>

          {/* Message Input (when on messages tab) */}
          {activeTab === "messages" && (
            <View style={styles.messageInputContainer}>
              <TextInput
                style={styles.messageInput}
                placeholder="Type a message..."
                placeholderTextColor={colors.neutral[400]}
              />
              <Pressable style={styles.sendButton}>
                <Ionicons name="send" size={20} color="#fff" />
              </Pressable>
            </View>
          )}

          {/* Action Buttons */}
          {activeTab === "materials" && (
            <View style={styles.actionButtons}>
              <Pressable style={styles.actionButtonSecondary}>
                <Ionicons name="calculator" size={20} color={colors.primary[600]} />
                <Text style={styles.actionButtonSecondaryText}>Generate Quote</Text>
              </Pressable>
              <Pressable style={styles.actionButtonPrimary}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.actionButtonPrimaryText}>Send to Customer</Text>
              </Pressable>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    );
  };

  // Project card in list
  const renderProjectCard = (project: Project) => {
    const statusConfig = STATUS_CONFIG[project.status];

    return (
      <Pressable
        key={project.id}
        style={styles.projectCard}
        onPress={() => setSelectedProject(project)}
      >
        {/* Status indicator */}
        <View style={[styles.statusIndicator, { backgroundColor: statusConfig.color }]} />

        <View style={styles.projectCardContent}>
          <View style={styles.projectCardHeader}>
            <Text style={styles.projectCardTitle}>{project.name}</Text>
            <View style={[styles.statusBadgeSmall, { backgroundColor: statusConfig.color + "15" }]}>
              <Text style={[styles.statusBadgeText, { color: statusConfig.color }]}>
                {statusConfig.label}
              </Text>
            </View>
          </View>

          <View style={styles.projectCardMeta}>
            <Ionicons name="person-outline" size={14} color={colors.neutral[400]} />
            <Text style={styles.projectCardMetaText}>{project.customer.name}</Text>
            <Text style={styles.metaDot}>•</Text>
            <Ionicons name="location-outline" size={14} color={colors.neutral[400]} />
            <Text style={styles.projectCardMetaText}>{project.customer.location}</Text>
          </View>

          {/* Material preview */}
          <View style={styles.materialPreviewRow}>
            {project.materials.slice(0, 3).map((mat, idx) => (
              <LinearGradient
                key={mat.id}
                colors={mat.gradientColors}
                style={[styles.materialPreviewDot, { marginLeft: idx > 0 ? -8 : 0 }]}
              />
            ))}
            <Text style={styles.materialCount}>
              {project.materials.length} material{project.materials.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {/* Team avatars */}
          <View style={styles.teamPreviewRow}>
            {project.team.slice(0, 4).map((member, idx) => (
              <View
                key={member.id}
                style={[
                  styles.teamPreviewAvatar,
                  { backgroundColor: ROLE_CONFIG[member.role].color + "30", marginLeft: idx > 0 ? -10 : 0 },
                ]}
              >
                <Ionicons
                  name={ROLE_CONFIG[member.role].icon}
                  size={12}
                  color={ROLE_CONFIG[member.role].color}
                />
              </View>
            ))}
            <Text style={styles.teamCount}>
              {project.team.length} team member{project.team.length !== 1 ? "s" : ""}
            </Text>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={20} color={colors.neutral[300]} />
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
            </Pressable>
            <View>
              <Text style={styles.headerTitle}>Project Board</Text>
              <Text style={styles.headerSubtitle}>Collaborate with your team</Text>
            </View>
          </View>
          <Pressable
            style={styles.newProjectButton}
            onPress={() => setShowNewProjectModal(true)}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{projects.filter(p => p.status === "sourcing").length}</Text>
            <Text style={styles.statLabel}>Sourcing</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{projects.filter(p => p.status === "quoting").length}</Text>
            <Text style={styles.statLabel}>Quoting</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{projects.filter(p => p.status === "in_progress").length}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{projects.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Projects List */}
        <ScrollView style={styles.projectsList} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionTitle}>Active Projects</Text>
          {projects.map(renderProjectCard)}

          {/* Empty state */}
          {projects.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="folder-open-outline" size={64} color={colors.neutral[300]} />
              <Text style={styles.emptyStateTitle}>No projects yet</Text>
              <Text style={styles.emptyStateText}>
                Create your first project to start collaborating with customers and team members
              </Text>
              <Pressable style={styles.emptyStateButton}>
                <Text style={styles.emptyStateButtonText}>Create Project</Text>
              </Pressable>
            </View>
          )}

          {/* Pro tip */}
          <View style={styles.proTip}>
            <Ionicons name="bulb" size={20} color={colors.accent[500]} />
            <View style={styles.proTipContent}>
              <Text style={styles.proTipTitle}>Pro Tip</Text>
              <Text style={styles.proTipText}>
                Share projects with customers using the share code. They can view materials and chat - but won't see your pricing!
              </Text>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </SafeAreaView>

      {/* Project Detail Modal */}
      {renderProjectDetail()}

      {/* New Project Modal */}
      <Modal visible={showNewProjectModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowNewProjectModal(false)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.neutral[600]} />
            </Pressable>
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>New Project</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
            <NewProjectForm
              onSubmit={(newProject) => {
                setProjects([newProject, ...projects]);
                setShowNewProjectModal(false);
              }}
              onCancel={() => setShowNewProjectModal(false)}
            />
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <Pressable
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate("MainTabs", { screen: "Home" } as any)}
        >
          <Ionicons name="home-outline" size={24} color={colors.neutral[500]} />
          <Text style={styles.bottomNavText}>Home</Text>
        </Pressable>
        <Pressable
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate("MainTabs", { screen: "Map" } as any)}
        >
          <Ionicons name="map-outline" size={24} color={colors.neutral[500]} />
          <Text style={styles.bottomNavText}>Map</Text>
        </Pressable>
        <Pressable
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate("MainTabs", { screen: "Tools" } as any)}
        >
          <Ionicons name="construct-outline" size={24} color={colors.neutral[500]} />
          <Text style={styles.bottomNavText}>Tools</Text>
        </Pressable>
        <Pressable
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate("MainTabs", { screen: "Add" } as any)}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.neutral[500]} />
          <Text style={styles.bottomNavText}>Sell</Text>
        </Pressable>
        <Pressable
          style={styles.bottomNavItem}
          onPress={() => navigation.navigate("MainTabs", { screen: "Profile" } as any)}
        >
          <Ionicons name="person-outline" size={24} color={colors.neutral[500]} />
          <Text style={styles.bottomNavText}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

// New Project Form Component
function NewProjectForm({ onSubmit, onCancel }: { onSubmit: (project: Project) => void; onCancel: () => void }) {
  const [projectName, setProjectName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerLocation, setCustomerLocation] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [scope, setScope] = useState<string[]>([]);
  const [customScope, setCustomScope] = useState("");

  const scopeOptions = [
    "Kitchen countertops",
    "Bathroom vanity",
    "Backsplash tile",
    "Island",
    "Flooring",
    "Fireplace surround",
    "Outdoor kitchen",
    "Laundry room",
  ];

  const toggleScope = (item: string) => {
    if (scope.includes(item)) {
      setScope(scope.filter(s => s !== item));
    } else {
      setScope([...scope, item]);
    }
  };

  const addCustomScope = () => {
    if (customScope.trim() && !scope.includes(customScope.trim())) {
      setScope([...scope, customScope.trim()]);
      setCustomScope("");
    }
  };

  const handleSubmit = () => {
    if (!projectName.trim() || !customerName.trim()) {
      return;
    }

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: projectName.trim(),
      status: "sourcing",
      customer: {
        name: customerName.trim(),
        location: customerLocation.trim() || "Location TBD",
        phone: customerPhone.trim() || undefined,
      },
      scope: scope.length > 0 ? scope : ["General remodel"],
      materials: [],
      team: [
        {
          id: "user-1",
          name: "John's Countertops",
          role: "contractor",
          company: "Surprise Granite",
          canViewPricing: true,
        },
        {
          id: `customer-${Date.now()}`,
          name: customerName.trim(),
          role: "homeowner",
          canViewPricing: false,
        },
      ],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      shareCode: `${customerName.trim().substring(0, 3).toUpperCase()}-${new Date().getFullYear()}`,
    };

    onSubmit(newProject);
  };

  return (
    <View style={newProjectStyles.container}>
      {/* Project Name */}
      <View style={newProjectStyles.inputGroup}>
        <Text style={newProjectStyles.label}>Project Name *</Text>
        <TextInput
          style={newProjectStyles.input}
          placeholder="e.g., Martinez Kitchen Remodel"
          placeholderTextColor={colors.neutral[400]}
          value={projectName}
          onChangeText={setProjectName}
        />
      </View>

      {/* Customer Info */}
      <View style={newProjectStyles.sectionHeader}>
        <Ionicons name="person" size={20} color={colors.primary[600]} />
        <Text style={newProjectStyles.sectionTitle}>Customer Information</Text>
      </View>

      <View style={newProjectStyles.inputGroup}>
        <Text style={newProjectStyles.label}>Customer Name *</Text>
        <TextInput
          style={newProjectStyles.input}
          placeholder="e.g., Sarah Martinez"
          placeholderTextColor={colors.neutral[400]}
          value={customerName}
          onChangeText={setCustomerName}
        />
      </View>

      <View style={newProjectStyles.inputGroup}>
        <Text style={newProjectStyles.label}>Location</Text>
        <TextInput
          style={newProjectStyles.input}
          placeholder="e.g., Peoria, AZ"
          placeholderTextColor={colors.neutral[400]}
          value={customerLocation}
          onChangeText={setCustomerLocation}
        />
      </View>

      <View style={newProjectStyles.inputGroup}>
        <Text style={newProjectStyles.label}>Phone Number</Text>
        <TextInput
          style={newProjectStyles.input}
          placeholder="e.g., (623) 555-0123"
          placeholderTextColor={colors.neutral[400]}
          value={customerPhone}
          onChangeText={setCustomerPhone}
          keyboardType="phone-pad"
        />
      </View>

      {/* Project Scope */}
      <View style={newProjectStyles.sectionHeader}>
        <Ionicons name="list" size={20} color={colors.primary[600]} />
        <Text style={newProjectStyles.sectionTitle}>Project Scope</Text>
      </View>

      <View style={newProjectStyles.scopeGrid}>
        {scopeOptions.map((item) => (
          <Pressable
            key={item}
            style={[
              newProjectStyles.scopeOption,
              scope.includes(item) && newProjectStyles.scopeOptionSelected,
            ]}
            onPress={() => toggleScope(item)}
          >
            <Text
              style={[
                newProjectStyles.scopeOptionText,
                scope.includes(item) && newProjectStyles.scopeOptionTextSelected,
              ]}
            >
              {item}
            </Text>
            {scope.includes(item) && (
              <Ionicons name="checkmark-circle" size={16} color={colors.primary[600]} />
            )}
          </Pressable>
        ))}
      </View>

      {/* Custom Scope */}
      <View style={newProjectStyles.customScopeRow}>
        <TextInput
          style={[newProjectStyles.input, { flex: 1 }]}
          placeholder="Add custom scope item..."
          placeholderTextColor={colors.neutral[400]}
          value={customScope}
          onChangeText={setCustomScope}
          onSubmitEditing={addCustomScope}
        />
        <Pressable style={newProjectStyles.addScopeBtn} onPress={addCustomScope}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      {/* Selected Scope Tags */}
      {scope.length > 0 && (
        <View style={newProjectStyles.selectedScope}>
          <Text style={newProjectStyles.selectedScopeLabel}>Selected:</Text>
          <View style={newProjectStyles.selectedScopeTags}>
            {scope.map((item) => (
              <View key={item} style={newProjectStyles.selectedScopeTag}>
                <Text style={newProjectStyles.selectedScopeTagText}>{item}</Text>
                <Pressable onPress={() => toggleScope(item)}>
                  <Ionicons name="close-circle" size={16} color={colors.primary[400]} />
                </Pressable>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons */}
      <View style={newProjectStyles.actionButtons}>
        <Pressable style={newProjectStyles.cancelButton} onPress={onCancel}>
          <Text style={newProjectStyles.cancelButtonText}>Cancel</Text>
        </Pressable>
        <Pressable
          style={[
            newProjectStyles.submitButton,
            (!projectName.trim() || !customerName.trim()) && newProjectStyles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!projectName.trim() || !customerName.trim()}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={newProjectStyles.submitButtonText}>Create Project</Text>
        </Pressable>
      </View>
    </View>
  );
}

const newProjectStyles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[700],
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: colors.neutral[800],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.neutral[800],
  },
  scopeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  scopeOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  scopeOptionSelected: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[300],
  },
  scopeOptionText: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  scopeOptionTextSelected: {
    color: colors.primary[700],
    fontWeight: "500",
  },
  customScopeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  addScopeBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },
  selectedScope: {
    marginBottom: 24,
  },
  selectedScopeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.neutral[500],
    marginBottom: 8,
  },
  selectedScopeTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedScopeTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary[100],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  selectedScopeTagText: {
    fontSize: 13,
    color: colors.primary[700],
    fontWeight: "500",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.neutral[100],
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.neutral[600],
  },
  submitButton: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  submitButtonDisabled: {
    backgroundColor: colors.neutral[300],
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.neutral[800],
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
    marginTop: 2,
  },
  newProjectButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary[800],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.primary[600],
  },
  statLabel: {
    fontSize: 11,
    color: colors.neutral[500],
    marginTop: 2,
  },

  // Projects List
  projectsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.neutral[700],
    marginBottom: 12,
    marginTop: 8,
  },
  projectCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusIndicator: {
    width: 4,
    height: "100%",
  },
  projectCardContent: {
    flex: 1,
    padding: 16,
  },
  projectCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  projectCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.neutral[800],
    flex: 1,
  },
  statusBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },
  projectCardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 4,
  },
  projectCardMetaText: {
    fontSize: 13,
    color: colors.neutral[500],
  },
  metaDot: {
    color: colors.neutral[300],
    marginHorizontal: 4,
  },
  materialPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  materialPreviewDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  materialCount: {
    fontSize: 12,
    color: colors.neutral[500],
    marginLeft: 8,
  },
  teamPreviewRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  teamPreviewAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  teamCount: {
    fontSize: 12,
    color: colors.neutral[500],
    marginLeft: 8,
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
    backgroundColor: "#fff",
  },
  closeButton: {
    padding: 4,
  },
  modalTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.neutral[800],
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
    gap: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  shareButton: {
    padding: 8,
  },

  // Customer Banner
  customerBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.neutral[800],
  },
  customerLocation: {
    fontSize: 13,
    color: colors.neutral[500],
    marginTop: 2,
  },
  callCustomerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },

  // Scope
  scopeContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  scopeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.neutral[500],
    marginBottom: 8,
  },
  scopeTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  scopeTag: {
    backgroundColor: colors.primary[50],
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  scopeTagText: {
    fontSize: 12,
    color: colors.primary[700],
    fontWeight: "500",
  },

  // Tabs
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: colors.primary[600],
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.neutral[500],
  },
  tabTextActive: {
    color: colors.primary[600],
  },

  // Tab Content
  tabContent: {
    flex: 1,
    padding: 16,
  },

  // Materials Grid
  materialsGrid: {
    gap: 12,
  },
  materialCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  materialImage: {
    height: 120,
    position: "relative",
  },
  stoneTexture: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  vein1: {
    position: "absolute",
    top: "30%",
    left: -20,
    width: "120%",
    height: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    transform: [{ rotate: "15deg" }],
  },
  vein2: {
    position: "absolute",
    bottom: "25%",
    right: -20,
    width: "80%",
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    transform: [{ rotate: "-10deg" }],
  },
  availabilityBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(16, 185, 129, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  remnantBadge: {
    backgroundColor: "rgba(245, 158, 11, 0.9)",
  },
  specialOrderBadge: {
    backgroundColor: "rgba(139, 92, 246, 0.9)",
  },
  availabilityText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  materialInfo: {
    padding: 14,
  },
  materialHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 8,
  },
  materialTypeIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  materialName: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.neutral[800],
    flex: 1,
  },
  materialColor: {
    fontSize: 13,
    color: colors.neutral[600],
    marginBottom: 4,
  },
  materialSupplier: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 2,
  },
  materialDimensions: {
    fontSize: 12,
    color: colors.neutral[500],
    marginBottom: 8,
  },
  pricingRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  proPriceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  proPriceLabel: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  proPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primary[600],
  },
  priceRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  priceRangeLabel: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  priceRange: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.accent[600],
  },
  notesContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 10,
    padding: 10,
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    color: colors.neutral[600],
    fontStyle: "italic",
  },
  addedByRow: {
    marginTop: 10,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },

  // Add Material Card
  addMaterialCard: {
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary[200],
    borderStyle: "dashed",
  },
  addMaterialText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary[600],
    marginTop: 8,
  },
  addMaterialSubtext: {
    fontSize: 13,
    color: colors.primary[400],
    marginTop: 4,
  },

  // Team List
  teamList: {
    gap: 12,
  },
  teamMemberCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: colors.neutral[800],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  memberAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.neutral[800],
  },
  memberCompany: {
    fontSize: 13,
    color: colors.neutral[500],
  },
  roleTag: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: "600",
  },
  memberActions: {
    flexDirection: "row",
    gap: 8,
  },
  memberActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[50],
    alignItems: "center",
    justifyContent: "center",
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[50],
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary[200],
    borderStyle: "dashed",
  },
  inviteButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary[600],
  },

  // Messages
  messagesContainer: {
    gap: 12,
  },
  emptyMessages: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyMessagesText: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.neutral[500],
    marginTop: 12,
  },
  emptyMessagesSubtext: {
    fontSize: 14,
    color: colors.neutral[400],
    marginTop: 4,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  messageContainerSent: {
    justifyContent: "flex-end",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 16,
  },
  messageBubbleReceived: {
    backgroundColor: "#fff",
    borderBottomLeftRadius: 4,
  },
  messageBubbleSent: {
    backgroundColor: colors.primary[600],
    borderBottomRightRadius: 4,
  },
  messageSender: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.neutral[500],
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: colors.neutral[800],
    lineHeight: 20,
  },
  messageTextSent: {
    color: "#fff",
  },
  messageTime: {
    fontSize: 10,
    color: colors.neutral[400],
    marginTop: 4,
    alignSelf: "flex-end",
  },
  messageTimeSent: {
    color: "rgba(255,255,255,0.7)",
  },
  messageInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: 10,
  },
  messageInput: {
    flex: 1,
    backgroundColor: colors.neutral[100],
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.neutral[800],
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },

  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: 24,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    gap: 12,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary[50],
    gap: 8,
  },
  actionButtonSecondaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary[600],
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    gap: 8,
  },
  actionButtonPrimaryText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.neutral[700],
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.neutral[500],
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  emptyStateButton: {
    marginTop: 20,
    backgroundColor: colors.primary[600],
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyStateButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },

  // Pro Tip
  proTip: {
    flexDirection: "row",
    backgroundColor: colors.accent[50],
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.accent[200],
  },
  proTipContent: {
    flex: 1,
  },
  proTipTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.accent[700],
    marginBottom: 4,
  },
  proTipText: {
    fontSize: 13,
    color: colors.accent[600],
    lineHeight: 18,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
    paddingBottom: 20,
    paddingTop: 8,
  },
  bottomNavItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  bottomNavText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.neutral[500],
    marginTop: 4,
  },
});
