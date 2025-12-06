import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  Alert,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../utils/colors";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../nav/RootNavigator";
import * as Haptics from "expo-haptics";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  isToday,
  addDays,
  parseISO,
} from "date-fns";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Event types
type EventType = "appointment" | "installation" | "consultation" | "delivery" | "measurement" | "other";

interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: Date;
  startTime: string;
  endTime: string;
  location?: string;
  notes?: string;
  clientName?: string;
  clientPhone?: string;
  projectId?: string;
  status: "scheduled" | "confirmed" | "completed" | "cancelled";
  reminder?: number; // minutes before
}

// Event type configuration
const EVENT_TYPES: Record<EventType, { color: string; icon: keyof typeof Ionicons.glyphMap; label: string }> = {
  appointment: { color: colors.primary[500], icon: "calendar", label: "Appointment" },
  installation: { color: "#10b981", icon: "construct", label: "Installation" },
  consultation: { color: "#8b5cf6", icon: "chatbubbles", label: "Consultation" },
  delivery: { color: "#f59e0b", icon: "car", label: "Delivery" },
  measurement: { color: "#06b6d4", icon: "resize", label: "Measurement" },
  other: { color: "#6b7280", icon: "ellipsis-horizontal", label: "Other" },
};

// Mock events
const mockEvents: CalendarEvent[] = [
  {
    id: "1",
    title: "Kitchen Countertop Measurement",
    type: "measurement",
    date: new Date(),
    startTime: "10:00 AM",
    endTime: "11:00 AM",
    location: "1234 Oak Street, Phoenix, AZ",
    clientName: "Sarah Martinez",
    clientPhone: "(602) 555-0123",
    status: "confirmed",
    notes: "Bring laser measure and sample book",
  },
  {
    id: "2",
    title: "Granite Installation - Johnson",
    type: "installation",
    date: addDays(new Date(), 2),
    startTime: "8:00 AM",
    endTime: "4:00 PM",
    location: "5678 Palm Ave, Scottsdale, AZ",
    clientName: "Mike Johnson",
    clientPhone: "(480) 555-0456",
    projectId: "proj-1",
    status: "scheduled",
  },
  {
    id: "3",
    title: "Design Consultation",
    type: "consultation",
    date: addDays(new Date(), 1),
    startTime: "2:00 PM",
    endTime: "3:30 PM",
    location: "Showroom",
    clientName: "Emily Chen",
    status: "confirmed",
  },
  {
    id: "4",
    title: "Slab Delivery",
    type: "delivery",
    date: addDays(new Date(), 3),
    startTime: "9:00 AM",
    endTime: "10:00 AM",
    location: "Warehouse",
    notes: "Arctic White Quartzite - 2 slabs",
    status: "scheduled",
  },
  {
    id: "5",
    title: "Follow-up Appointment",
    type: "appointment",
    date: addDays(new Date(), 5),
    startTime: "11:00 AM",
    endTime: "12:00 PM",
    clientName: "David Wilson",
    status: "scheduled",
  },
];

export default function CalendarScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(mockEvents);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<"month" | "week" | "agenda">("month");

  // New event form state
  const [newEvent, setNewEvent] = useState({
    title: "",
    type: "appointment" as EventType,
    startTime: "9:00 AM",
    endTime: "10:00 AM",
    location: "",
    clientName: "",
    clientPhone: "",
    notes: "",
  });

  // Get days for calendar grid
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Get events for selected date
  const selectedDateEvents = useMemo(() => {
    return events
      .filter((event) => isSameDay(event.date, selectedDate))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [events, selectedDate]);

  // Get upcoming events (next 7 days)
  const upcomingEvents = useMemo(() => {
    const today = new Date();
    const nextWeek = addDays(today, 7);
    return events
      .filter((event) => event.date >= today && event.date <= nextWeek)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [events]);

  // Check if date has events
  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(event.date, date));
  };

  // Navigation
  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Add new event
  const handleAddEvent = () => {
    if (!newEvent.title.trim()) {
      Alert.alert("Error", "Please enter an event title");
      return;
    }

    const event: CalendarEvent = {
      id: `event-${Date.now()}`,
      title: newEvent.title,
      type: newEvent.type,
      date: selectedDate,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
      location: newEvent.location || undefined,
      clientName: newEvent.clientName || undefined,
      clientPhone: newEvent.clientPhone || undefined,
      notes: newEvent.notes || undefined,
      status: "scheduled",
    };

    setEvents([...events, event]);
    setShowAddEvent(false);
    setNewEvent({
      title: "",
      type: "appointment",
      startTime: "9:00 AM",
      endTime: "10:00 AM",
      location: "",
      clientName: "",
      clientPhone: "",
      notes: "",
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Update event status
  const updateEventStatus = (eventId: string, status: CalendarEvent["status"]) => {
    setEvents(events.map((e) => (e.id === eventId ? { ...e, status } : e)));
    setSelectedEvent(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Delete event
  const deleteEvent = (eventId: string) => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          setEvents(events.filter((e) => e.id !== eventId));
          setSelectedEvent(null);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        },
      },
    ]);
  };

  // Render calendar day
  const renderDay = (date: Date) => {
    const dayEvents = getEventsForDate(date);
    const isSelected = isSameDay(date, selectedDate);
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isTodayDate = isToday(date);

    return (
      <Pressable
        key={date.toISOString()}
        style={[
          styles.dayCell,
          isSelected && styles.selectedDay,
          isTodayDate && !isSelected && styles.todayDay,
        ]}
        onPress={() => {
          setSelectedDate(date);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <Text
          style={[
            styles.dayText,
            !isCurrentMonth && styles.dayTextOtherMonth,
            isSelected && styles.dayTextSelected,
            isTodayDate && !isSelected && styles.dayTextToday,
          ]}
        >
          {format(date, "d")}
        </Text>
        {dayEvents.length > 0 && (
          <View style={styles.eventDots}>
            {dayEvents.slice(0, 3).map((event, index) => (
              <View
                key={event.id}
                style={[styles.eventDot, { backgroundColor: EVENT_TYPES[event.type].color }]}
              />
            ))}
          </View>
        )}
      </Pressable>
    );
  };

  // Render event card
  const renderEventCard = (event: CalendarEvent, showDate = false) => {
    const config = EVENT_TYPES[event.type];

    return (
      <Pressable
        key={event.id}
        style={styles.eventCard}
        onPress={() => setSelectedEvent(event)}
      >
        <View style={[styles.eventColorBar, { backgroundColor: config.color }]} />
        <View style={styles.eventContent}>
          <View style={styles.eventHeader}>
            <View style={[styles.eventTypeIcon, { backgroundColor: config.color + "20" }]}>
              <Ionicons name={config.icon} size={16} color={config.color} />
            </View>
            <View style={styles.eventHeaderText}>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {event.title}
              </Text>
              <Text style={styles.eventTime}>
                {showDate && `${format(event.date, "MMM d")} • `}
                {event.startTime} - {event.endTime}
              </Text>
            </View>
            <View style={[styles.statusBadge, styles[`status_${event.status}`]]}>
              <Text style={styles.statusText}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </Text>
            </View>
          </View>

          {(event.clientName || event.location) && (
            <View style={styles.eventDetails}>
              {event.clientName && (
                <View style={styles.eventDetailRow}>
                  <Ionicons name="person-outline" size={14} color={colors.neutral[500]} />
                  <Text style={styles.eventDetailText}>{event.clientName}</Text>
                </View>
              )}
              {event.location && (
                <View style={styles.eventDetailRow}>
                  <Ionicons name="location-outline" size={14} color={colors.neutral[500]} />
                  <Text style={styles.eventDetailText} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  // Render event detail modal
  const renderEventDetail = () => {
    if (!selectedEvent) return null;
    const config = EVENT_TYPES[selectedEvent.type];

    return (
      <Modal visible={!!selectedEvent} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setSelectedEvent(null)} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={colors.neutral[600]} />
            </Pressable>
            <Text style={styles.modalTitle}>Event Details</Text>
            <Pressable onPress={() => deleteEvent(selectedEvent.id)}>
              <Ionicons name="trash-outline" size={24} color={colors.red[500]} />
            </Pressable>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Event Type & Title */}
            <View style={styles.detailSection}>
              <View style={[styles.detailTypeIcon, { backgroundColor: config.color }]}>
                <Ionicons name={config.icon} size={28} color="#fff" />
              </View>
              <Text style={styles.detailTitle}>{selectedEvent.title}</Text>
              <Text style={styles.detailType}>{config.label}</Text>
            </View>

            {/* Date & Time */}
            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={20} color={colors.primary[600]} />
                <View style={styles.detailRowContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {format(selectedEvent.date, "EEEE, MMMM d, yyyy")}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Ionicons name="time-outline" size={20} color={colors.primary[600]} />
                <View style={styles.detailRowContent}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>
                    {selectedEvent.startTime} - {selectedEvent.endTime}
                  </Text>
                </View>
              </View>
            </View>

            {/* Client Info */}
            {(selectedEvent.clientName || selectedEvent.clientPhone) && (
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Client Information</Text>
                {selectedEvent.clientName && (
                  <View style={styles.detailRow}>
                    <Ionicons name="person-outline" size={20} color={colors.neutral[500]} />
                    <View style={styles.detailRowContent}>
                      <Text style={styles.detailLabel}>Name</Text>
                      <Text style={styles.detailValue}>{selectedEvent.clientName}</Text>
                    </View>
                  </View>
                )}
                {selectedEvent.clientPhone && (
                  <Pressable style={styles.detailRow}>
                    <Ionicons name="call-outline" size={20} color={colors.neutral[500]} />
                    <View style={styles.detailRowContent}>
                      <Text style={styles.detailLabel}>Phone</Text>
                      <Text style={[styles.detailValue, { color: colors.primary[600] }]}>
                        {selectedEvent.clientPhone}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.neutral[400]} />
                  </Pressable>
                )}
              </View>
            )}

            {/* Location */}
            {selectedEvent.location && (
              <Pressable style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={20} color={colors.neutral[500]} />
                  <View style={styles.detailRowContent}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <Text style={styles.detailValue}>{selectedEvent.location}</Text>
                  </View>
                  <Ionicons name="navigate-outline" size={20} color={colors.primary[600]} />
                </View>
              </Pressable>
            )}

            {/* Notes */}
            {selectedEvent.notes && (
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Notes</Text>
                <Text style={styles.detailNotes}>{selectedEvent.notes}</Text>
              </View>
            )}

            {/* Status Actions */}
            <View style={styles.statusActions}>
              <Text style={styles.detailCardTitle}>Update Status</Text>
              <View style={styles.statusButtonsRow}>
                {selectedEvent.status !== "confirmed" && (
                  <Pressable
                    style={[styles.statusButton, { backgroundColor: "#10b981" }]}
                    onPress={() => updateEventStatus(selectedEvent.id, "confirmed")}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={styles.statusButtonText}>Confirm</Text>
                  </Pressable>
                )}
                {selectedEvent.status !== "completed" && (
                  <Pressable
                    style={[styles.statusButton, { backgroundColor: colors.primary[600] }]}
                    onPress={() => updateEventStatus(selectedEvent.id, "completed")}
                  >
                    <Ionicons name="checkbox" size={18} color="#fff" />
                    <Text style={styles.statusButtonText}>Complete</Text>
                  </Pressable>
                )}
                {selectedEvent.status !== "cancelled" && (
                  <Pressable
                    style={[styles.statusButton, { backgroundColor: colors.neutral[400] }]}
                    onPress={() => updateEventStatus(selectedEvent.id, "cancelled")}
                  >
                    <Ionicons name="close-circle" size={18} color="#fff" />
                    <Text style={styles.statusButtonText}>Cancel</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  // Render add event modal
  const renderAddEventModal = () => (
    <Modal visible={showAddEvent} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Pressable onPress={() => setShowAddEvent(false)} style={styles.closeButton}>
            <Ionicons name="close" size={28} color={colors.neutral[600]} />
          </Pressable>
          <Text style={styles.modalTitle}>New Event</Text>
          <Pressable onPress={handleAddEvent}>
            <Text style={styles.saveButton}>Save</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
          {/* Date Display */}
          <View style={styles.selectedDateDisplay}>
            <Ionicons name="calendar" size={20} color={colors.primary[600]} />
            <Text style={styles.selectedDateText}>
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </Text>
          </View>

          {/* Event Type */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Event Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeSelector}>
                {(Object.keys(EVENT_TYPES) as EventType[]).map((type) => {
                  const config = EVENT_TYPES[type];
                  const isSelected = newEvent.type === type;
                  return (
                    <Pressable
                      key={type}
                      style={[
                        styles.typeOption,
                        isSelected && { backgroundColor: config.color + "20", borderColor: config.color },
                      ]}
                      onPress={() => setNewEvent({ ...newEvent, type })}
                    >
                      <Ionicons
                        name={config.icon}
                        size={20}
                        color={isSelected ? config.color : colors.neutral[500]}
                      />
                      <Text
                        style={[styles.typeOptionText, isSelected && { color: config.color }]}
                      >
                        {config.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Title */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Title *</Text>
            <TextInput
              style={styles.formInput}
              value={newEvent.title}
              onChangeText={(text) => setNewEvent({ ...newEvent, title: text })}
              placeholder="e.g., Kitchen Measurement"
              placeholderTextColor={colors.neutral[400]}
            />
          </View>

          {/* Time */}
          <View style={styles.formRow}>
            <View style={[styles.formSection, { flex: 1 }]}>
              <Text style={styles.formLabel}>Start Time</Text>
              <TextInput
                style={styles.formInput}
                value={newEvent.startTime}
                onChangeText={(text) => setNewEvent({ ...newEvent, startTime: text })}
                placeholder="9:00 AM"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
            <View style={[styles.formSection, { flex: 1, marginLeft: 12 }]}>
              <Text style={styles.formLabel}>End Time</Text>
              <TextInput
                style={styles.formInput}
                value={newEvent.endTime}
                onChangeText={(text) => setNewEvent({ ...newEvent, endTime: text })}
                placeholder="10:00 AM"
                placeholderTextColor={colors.neutral[400]}
              />
            </View>
          </View>

          {/* Client Info */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Client Name</Text>
            <TextInput
              style={styles.formInput}
              value={newEvent.clientName}
              onChangeText={(text) => setNewEvent({ ...newEvent, clientName: text })}
              placeholder="John Smith"
              placeholderTextColor={colors.neutral[400]}
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Client Phone</Text>
            <TextInput
              style={styles.formInput}
              value={newEvent.clientPhone}
              onChangeText={(text) => setNewEvent({ ...newEvent, clientPhone: text })}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.neutral[400]}
              keyboardType="phone-pad"
            />
          </View>

          {/* Location */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Location</Text>
            <TextInput
              style={styles.formInput}
              value={newEvent.location}
              onChangeText={(text) => setNewEvent({ ...newEvent, location: text })}
              placeholder="Address or 'Showroom'"
              placeholderTextColor={colors.neutral[400]}
            />
          </View>

          {/* Notes */}
          <View style={styles.formSection}>
            <Text style={styles.formLabel}>Notes</Text>
            <TextInput
              style={[styles.formInput, styles.formTextArea]}
              value={newEvent.notes}
              onChangeText={(text) => setNewEvent({ ...newEvent, notes: text })}
              placeholder="Additional details..."
              placeholderTextColor={colors.neutral[400]}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.neutral[700]} />
            </Pressable>
            <Text style={styles.headerTitle}>Calendar</Text>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>Today</Text>
            </Pressable>
            <Pressable
              onPress={() => setShowAddEvent(true)}
              style={styles.addButton}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Month Navigator */}
        <View style={styles.monthNav}>
          <Pressable onPress={goToPreviousMonth} style={styles.monthNavButton}>
            <Ionicons name="chevron-back" size={24} color={colors.neutral[600]} />
          </Pressable>
          <Text style={styles.monthTitle}>{format(currentMonth, "MMMM yyyy")}</Text>
          <Pressable onPress={goToNextMonth} style={styles.monthNavButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.neutral[600]} />
          </Pressable>
        </View>

        {/* Weekday Headers */}
        <View style={styles.weekdayHeader}>
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <Text key={day} style={styles.weekdayText}>
              {day}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>{calendarDays.map(renderDay)}</View>

        {/* Events for Selected Date */}
        <View style={styles.eventsSection}>
          <View style={styles.eventsSectionHeader}>
            <Text style={styles.eventsSectionTitle}>
              {isToday(selectedDate)
                ? "Today's Schedule"
                : format(selectedDate, "EEEE, MMM d")}
            </Text>
            <Text style={styles.eventCount}>
              {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <ScrollView style={styles.eventsList} showsVerticalScrollIndicator={false}>
            {selectedDateEvents.length === 0 ? (
              <View style={styles.noEvents}>
                <Ionicons name="calendar-outline" size={48} color={colors.neutral[300]} />
                <Text style={styles.noEventsText}>No events scheduled</Text>
                <Pressable
                  style={styles.addEventButton}
                  onPress={() => setShowAddEvent(true)}
                >
                  <Ionicons name="add" size={18} color={colors.primary[600]} />
                  <Text style={styles.addEventButtonText}>Add Event</Text>
                </Pressable>
              </View>
            ) : (
              selectedDateEvents.map((event) => renderEventCard(event))
            )}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Modals */}
      {renderEventDetail()}
      {renderAddEventModal()}

      {/* Bottom Navigation */}
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
        <Pressable style={styles.bottomNavItem}>
          <Ionicons name="calendar" size={24} color={colors.primary[600]} />
          <Text style={[styles.bottomNavText, { color: colors.primary[600] }]}>Calendar</Text>
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
          onPress={() => navigation.navigate("MainTabs", { screen: "Profile" } as any)}
        >
          <Ionicons name="person-outline" size={24} color={colors.neutral[500]} />
          <Text style={styles.bottomNavText}>Profile</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    fontSize: 24,
    fontWeight: "700",
    color: colors.neutral[800],
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  todayButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  todayButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary[600],
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[600],
    alignItems: "center",
    justifyContent: "center",
  },

  // Month Navigator
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  monthNavButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.neutral[800],
  },

  // Weekday Header
  weekdayHeader: {
    flexDirection: "row",
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  weekdayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: colors.neutral[500],
  },

  // Calendar Grid
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
  },
  dayCell: {
    width: (SCREEN_WIDTH - 16) / 7,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  selectedDay: {
    backgroundColor: colors.primary[600],
  },
  todayDay: {
    backgroundColor: colors.primary[100],
  },
  dayText: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.neutral[800],
  },
  dayTextOtherMonth: {
    color: colors.neutral[300],
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  dayTextToday: {
    color: colors.primary[700],
    fontWeight: "700",
  },
  eventDots: {
    flexDirection: "row",
    marginTop: 2,
    gap: 2,
  },
  eventDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  // Events Section
  eventsSection: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  eventsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  eventsSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.neutral[800],
  },
  eventCount: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  eventsList: {
    flex: 1,
    paddingHorizontal: 16,
  },

  // Event Card
  eventCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  eventColorBar: {
    width: 4,
  },
  eventContent: {
    flex: 1,
    padding: 12,
  },
  eventHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  eventTypeIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  eventHeaderText: {
    flex: 1,
    marginLeft: 10,
  },
  eventTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.neutral[800],
  },
  eventTime: {
    fontSize: 13,
    color: colors.neutral[500],
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  status_scheduled: {
    backgroundColor: colors.neutral[100],
  },
  status_confirmed: {
    backgroundColor: "#dcfce7",
  },
  status_completed: {
    backgroundColor: "#dbeafe",
  },
  status_cancelled: {
    backgroundColor: "#fee2e2",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.neutral[600],
  },
  eventDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
    gap: 6,
  },
  eventDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventDetailText: {
    fontSize: 13,
    color: colors.neutral[600],
  },

  // No Events
  noEvents: {
    alignItems: "center",
    paddingVertical: 40,
  },
  noEventsText: {
    fontSize: 15,
    color: colors.neutral[400],
    marginTop: 12,
    marginBottom: 16,
  },
  addEventButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.primary[50],
    borderRadius: 8,
  },
  addEventButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary[600],
  },

  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.neutral[800],
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary[600],
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  // Event Detail Modal
  detailSection: {
    alignItems: "center",
    paddingVertical: 24,
  },
  detailTypeIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.neutral[800],
    textAlign: "center",
    marginBottom: 4,
  },
  detailType: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  detailCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  detailCardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[600],
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  detailRowContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.neutral[500],
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.neutral[800],
    marginTop: 2,
  },
  detailNotes: {
    fontSize: 14,
    color: colors.neutral[700],
    lineHeight: 20,
  },
  statusActions: {
    marginTop: 8,
  },
  statusButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  statusButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },

  // Add Event Form
  selectedDateDisplay: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[50],
    padding: 14,
    borderRadius: 12,
    marginBottom: 20,
    gap: 10,
  },
  selectedDateText: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary[700],
  },
  formSection: {
    marginBottom: 16,
  },
  formRow: {
    flexDirection: "row",
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.neutral[700],
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.neutral[800],
    borderWidth: 1,
    borderColor: colors.neutral[200],
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  typeSelector: {
    flexDirection: "row",
    gap: 10,
  },
  typeOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: "#fff",
    gap: 6,
  },
  typeOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.neutral[600],
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
