import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, Image, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav";
import { useAuthStore } from "../state/authStore";
import { useListingsStore } from "../state/listingsStore";
import { useJobsStore } from "../state/jobsStore";
import { Ionicons } from "@expo/vector-icons";
import { formatDistanceToNow } from "date-fns";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type TabType = "listings" | "jobs";

export default function MyListingsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuthStore();
  const { listings, archiveExpiredListings, updateListing, deleteListing } = useListingsStore();
  const { jobs, deleteJob, updateJob, getJobsByUser } = useJobsStore();
  
  const [activeTab, setActiveTab] = useState<TabType>("listings");

  const myListings = listings.filter((listing) => listing.sellerId === user?.id);
  const activeListings = myListings.filter((l) => l.status === "active");
  const archivedListings = myListings.filter((l) => l.status === "archived");
  
  const myJobs = user ? getJobsByUser(user.id) : [];
  const openJobs = myJobs.filter((j) => j.status === "open");
  const inProgressJobs = myJobs.filter((j) => j.status === "in_progress");
  const completedJobs = myJobs.filter((j) => j.status === "completed");

  useEffect(() => {
    archiveExpiredListings();
  }, []);

  const handleMarkAsSold = (listingId: string) => {
    updateListing(listingId, { status: "sold" });
  };

  const handleDeleteListing = (listingId: string) => {
    deleteListing(listingId);
  };

  const handleDeleteJob = (jobId: string) => {
    deleteJob(jobId);
  };

  const handleMarkJobComplete = (jobId: string) => {
    updateJob(jobId, { status: "completed" });
  };

  // Prompt login if not authenticated
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyStateContainer}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="cube-outline" size={64} color="#9ca3af" />
          </View>
          <Text style={styles.emptyTitle}>Sign in to view your listings</Text>
          <Text style={styles.emptySubtitle}>
            Create an account to post and manage your listings and jobs
          </Text>
          <Pressable style={styles.signupButton} onPress={() => navigation.navigate("Signup")}>
            <Text style={styles.signupButtonText}>Sign Up</Text>
          </Pressable>
          <Pressable style={styles.loginButton} onPress={() => navigation.navigate("Login")}>
            <Text style={styles.loginButtonText}>Log In</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const renderListing = (listing: any, showActions = true) => {
    const timeLeft =
      listing.status === "active"
        ? formatDistanceToNow(listing.expiresAt, { addSuffix: true })
        : null;

    return (
      <Pressable
        key={listing.id}
        style={styles.card}
        onPress={() => navigation.navigate("ListingDetail", { listingId: listing.id })}
      >
        <View style={styles.cardContent}>
          <Image source={{ uri: listing.images[0] }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {listing.title}
            </Text>
            <Text style={styles.cardSubtitle}>{listing.stoneType}</Text>
            <Text style={styles.cardPrice}>${listing.price}</Text>
            {listing.dimensions && (
              <View style={styles.dimensionsBadge}>
                <Ionicons name="resize-outline" size={12} color="#10b981" />
                <Text style={styles.dimensionsText}>
                  {listing.dimensions.length}" × {listing.dimensions.width}"
                </Text>
              </View>
            )}
            {timeLeft && (
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={14} color="#9ca3af" />
                <Text style={styles.timeText}>Expires {timeLeft}</Text>
              </View>
            )}
            {listing.status === "archived" && (
              <View style={[styles.statusBadge, styles.archivedBadge]}>
                <Text style={styles.archivedText}>Archived</Text>
              </View>
            )}
            {listing.status === "sold" && (
              <View style={[styles.statusBadge, styles.soldBadge]}>
                <Text style={styles.soldText}>Sold</Text>
              </View>
            )}
          </View>
        </View>

        {showActions && listing.status === "active" && (
          <View style={styles.actionsContainer}>
            <Pressable
              style={[styles.actionButton, styles.actionButtonLeft]}
              onPress={() => handleMarkAsSold(listing.id)}
            >
              <Ionicons name="checkmark-circle-outline" size={18} color="#10b981" />
              <Text style={styles.actionButtonText}>Mark as Sold</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleDeleteListing(listing.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text style={[styles.actionButtonText, styles.deleteText]}>Delete</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  const renderJob = (job: any, showActions = true) => {
    const timeLeft = formatDistanceToNow(job.deadline, { addSuffix: true });

    return (
      <Pressable
        key={job.id}
        style={styles.card}
        onPress={() => navigation.navigate("JobDetail", { jobId: job.id })}
      >
        <View style={styles.cardContent}>
          <Image source={{ uri: job.images[0] }} style={styles.cardImage} resizeMode="cover" />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {job.title}
            </Text>
            <Text style={styles.cardSubtitle}>{job.category}</Text>
            <Text style={styles.cardPrice}>
              ${job.budget.min} - ${job.budget.max}
            </Text>
            <View style={styles.jobMetaRow}>
              <View style={styles.jobMetaItem}>
                <Ionicons name="people-outline" size={14} color="#2563eb" />
                <Text style={styles.jobMetaText}>{job.bidCount} bids</Text>
              </View>
              <View style={styles.jobMetaItem}>
                <Ionicons name="location-outline" size={14} color="#9ca3af" />
                <Text style={styles.jobMetaText}>{job.location.split(",")[0]}</Text>
              </View>
            </View>
            <View style={styles.timeContainer}>
              <Ionicons name="calendar-outline" size={14} color="#9ca3af" />
              <Text style={styles.timeText}>Deadline {timeLeft}</Text>
            </View>
            {job.status === "in_progress" && (
              <View style={[styles.statusBadge, styles.inProgressBadge]}>
                <Text style={styles.inProgressText}>In Progress</Text>
              </View>
            )}
            {job.status === "completed" && (
              <View style={[styles.statusBadge, styles.completedBadge]}>
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>
        </View>

        {showActions && job.status === "in_progress" && (
          <View style={styles.actionsContainer}>
            <Pressable
              style={[styles.actionButton, styles.actionButtonLeft]}
              onPress={() => handleMarkJobComplete(job.id)}
            >
              <Ionicons name="checkmark-done-outline" size={18} color="#10b981" />
              <Text style={styles.actionButtonText}>Mark Complete</Text>
            </Pressable>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleDeleteJob(job.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text style={[styles.actionButtonText, styles.deleteText]}>Delete</Text>
            </Pressable>
          </View>
        )}
        {showActions && job.status === "open" && (
          <View style={styles.actionsContainer}>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleDeleteJob(job.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
              <Text style={[styles.actionButtonText, styles.deleteText]}>Delete</Text>
            </Pressable>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{ marginRight: 12 }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </Pressable>
        <Text style={styles.headerTitle}>My Listings & Jobs</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === "listings" && styles.tabActive]}
          onPress={() => setActiveTab("listings")}
        >
          <Ionicons
            name="pricetag"
            size={20}
            color={activeTab === "listings" ? "#10b981" : "#9ca3af"}
          />
          <Text style={[styles.tabText, activeTab === "listings" && styles.tabTextActive]}>
            Listings ({myListings.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "jobs" && styles.tabActive]}
          onPress={() => setActiveTab("jobs")}
        >
          <Ionicons
            name="briefcase"
            size={20}
            color={activeTab === "jobs" ? "#10b981" : "#9ca3af"}
          />
          <Text style={[styles.tabText, activeTab === "jobs" && styles.tabTextActive]}>
            Jobs ({myJobs.length})
          </Text>
        </Pressable>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 20 }}>
        {activeTab === "listings" ? (
          myListings.length === 0 ? (
            <View style={styles.emptyContent}>
              <Ionicons name="pricetag-outline" size={64} color="#e5e7eb" />
              <Text style={styles.emptyContentTitle}>No listings yet</Text>
              <Text style={styles.emptyContentText}>
                Create your first listing to start selling
              </Text>
            </View>
          ) : (
            <>
              {activeListings.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Active ({activeListings.length})</Text>
                  {activeListings.map((listing) => renderListing(listing, true))}
                </>
              )}

              {archivedListings.length > 0 && (
                <>
                  <Text style={styles.sectionTitle}>Archived ({archivedListings.length})</Text>
                  {archivedListings.map((listing) => renderListing(listing, false))}
                </>
              )}
            </>
          )
        ) : myJobs.length === 0 ? (
          <View style={styles.emptyContent}>
            <Ionicons name="briefcase-outline" size={64} color="#e5e7eb" />
            <Text style={styles.emptyContentTitle}>No jobs yet</Text>
            <Text style={styles.emptyContentText}>Post a job to find contractors</Text>
          </View>
        ) : (
          <>
            {openJobs.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Open ({openJobs.length})</Text>
                {openJobs.map((job) => renderJob(job, true))}
              </>
            )}

            {inProgressJobs.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>In Progress ({inProgressJobs.length})</Text>
                {inProgressJobs.map((job) => renderJob(job, true))}
              </>
            )}

            {completedJobs.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Completed ({completedJobs.length})</Text>
                {completedJobs.map((job) => renderJob(job, false))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'white',
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1f2937',
    letterSpacing: -0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: '#e5e7eb',
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    gap: 8,
  },
  tabActive: {
    backgroundColor: '#d1fae5',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9ca3af',
  },
  tabTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
    marginTop: 8,
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
  },
  cardImage: {
    width: 120,
    height: 120,
    backgroundColor: '#f3f4f6',
  },
  cardInfo: {
    flex: 1,
    padding: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  dimensionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginBottom: 8,
  },
  dimensionsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
  },
  jobMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  jobMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  jobMetaText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  archivedBadge: {
    backgroundColor: '#f3f4f6',
  },
  archivedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6b7280',
  },
  soldBadge: {
    backgroundColor: '#d1fae5',
  },
  soldText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  inProgressBadge: {
    backgroundColor: '#dbeafe',
  },
  inProgressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  completedBadge: {
    backgroundColor: '#d1fae5',
  },
  completedText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  actionsContainer: {
    flexDirection: 'row',
    borderTopWidth: 2,
    borderTopColor: '#e5e7eb',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 6,
  },
  actionButtonLeft: {
    borderRightWidth: 2,
    borderRightColor: '#e5e7eb',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10b981',
  },
  deleteText: {
    color: '#ef4444',
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#9ca3af',
    textAlign: 'center',
    marginBottom: 32,
  },
  signupButton: {
    width: '100%',
    backgroundColor: '#10b981',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signupButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    letterSpacing: 0.3,
  },
  loginButton: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  loginButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1f2937',
  },
  emptyContent: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyContentTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 20,
    marginBottom: 8,
  },
  emptyContentText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#9ca3af',
    textAlign: 'center',
  },
});
