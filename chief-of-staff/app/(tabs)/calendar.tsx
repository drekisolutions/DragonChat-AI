import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";

const BRONZE = "#C9922A";
const SILVER = "#C0C0C0";
const MUTED = "#7A7A7A";
const SURFACE = "#1A1A1A";
const BORDER = "#2A2A2A";

type EventType = "meeting" | "call" | "deadline" | "personal";

interface CalEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  attendees: string[];
  location?: string;
  description?: string;
  type: EventType;
}

const MOCK_EVENTS: CalEvent[] = [
  {
    id: "1",
    title: "Daily Standup",
    startTime: "9:00 AM",
    endTime: "9:30 AM",
    attendees: ["Sarah Chen", "James Okafor", "David Park", "Lisa Wu", "Tom Reed"],
    location: "Google Meet",
    description: "Daily team sync. Review blockers and priorities.",
    type: "meeting",
  },
  {
    id: "2",
    title: "Client Call — Acme Corp",
    startTime: "2:00 PM",
    endTime: "3:00 PM",
    attendees: ["John Acme", "Maria Santos", "You"],
    location: "Zoom",
    description: "Quarterly business review and renewal discussion.",
    type: "call",
  },
  {
    id: "3",
    title: "Q3 Report Review Deadline",
    startTime: "4:00 PM",
    endTime: "4:30 PM",
    attendees: ["You"],
    description: "Final review and sign-off on Q3 revenue projections.",
    type: "deadline",
  },
  {
    id: "4",
    title: "Team Review",
    startTime: "5:00 PM",
    endTime: "5:45 PM",
    attendees: ["Sarah Chen", "James Okafor", "David Park", "Lisa Wu", "Tom Reed", "Ana Costa", "Ben Liu", "Priya Nair"],
    location: "Conference Room B",
    description: "Weekly team performance review and planning.",
    type: "meeting",
  },
];

const eventTypeConfig: Record<EventType, { color: string; icon: "phone.fill" | "calendar" | "exclamationmark.triangle.fill" | "person.fill" }> = {
  meeting:  { color: BRONZE,     icon: "calendar" },
  call:     { color: "#4CAF50",  icon: "phone.fill" },
  deadline: { color: "#FF9800",  icon: "exclamationmark.triangle.fill" },
  personal: { color: SILVER,     icon: "person.fill" },
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarScreen() {
  const [selectedEvent, setSelectedEvent] = useState<CalEvent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTime, setNewTime] = useState("");

  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - today.getDay() + i);
    return d;
  });

  return (
    <ScreenContainer containerClassName="bg-background">
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Calendar</Text>
          <Text style={styles.headerSub}>
            {today.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
          </Text>
        </View>
        <Pressable
          style={styles.addBtn}
          onPress={() => setShowCreate(true)}
        >
          <IconSymbol name="plus.circle.fill" size={28} color={BRONZE} />
        </Pressable>
      </View>

      {/* Week strip */}
      <View style={styles.weekStrip}>
        {weekDays.map((d, i) => {
          const isToday = d.toDateString() === today.toDateString();
          return (
            <Pressable key={i} style={[styles.dayBtn, isToday && styles.dayBtnActive]}>
              <Text style={[styles.dayName, isToday && { color: BRONZE }]}>
                {DAYS[d.getDay()]}
              </Text>
              <Text style={[styles.dayNum, isToday && styles.dayNumActive]}>
                {d.getDate()}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Events list */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.eventList}>
        <Text style={styles.dayLabel}>
          {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </Text>

        {MOCK_EVENTS.map((event) => {
          const cfg = eventTypeConfig[event.type];
          return (
            <Pressable
              key={event.id}
              style={({ pressed }) => [styles.eventCard, pressed && { opacity: 0.75 }]}
              onPress={() => setSelectedEvent(event)}
            >
              <View style={[styles.eventAccent, { backgroundColor: cfg.color }]} />
              <View style={styles.eventContent}>
                <View style={styles.eventTopRow}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <IconSymbol name={cfg.icon} size={14} color={cfg.color} />
                </View>
                <Text style={styles.eventTime}>{event.startTime} – {event.endTime}</Text>
                {event.location && (
                  <Text style={styles.eventLocation}>{event.location}</Text>
                )}
                <Text style={styles.eventAttendees}>
                  {event.attendees.length} attendee{event.attendees.length !== 1 ? "s" : ""}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Event detail modal */}
      <Modal
        visible={!!selectedEvent}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedEvent(null)}
      >
        {selectedEvent && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Pressable onPress={() => setSelectedEvent(null)}>
                <IconSymbol name="xmark.circle.fill" size={24} color={MUTED} />
              </Pressable>
              <Text style={styles.modalTitle} numberOfLines={1}>{selectedEvent.title}</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
              <View style={styles.detailRow}>
                <IconSymbol name="clock.fill" size={16} color={BRONZE} />
                <Text style={styles.detailText}>
                  {selectedEvent.startTime} – {selectedEvent.endTime}
                </Text>
              </View>
              {selectedEvent.location && (
                <View style={styles.detailRow}>
                  <IconSymbol name="building.2.fill" size={16} color={SILVER} />
                  <Text style={styles.detailText}>{selectedEvent.location}</Text>
                </View>
              )}
              <View style={styles.detailRow}>
                <IconSymbol name="person.3.fill" size={16} color={SILVER} />
                <Text style={styles.detailText}>
                  {selectedEvent.attendees.join(", ")}
                </Text>
              </View>
              {selectedEvent.description && (
                <View style={styles.descriptionBox}>
                  <Text style={styles.descriptionText}>{selectedEvent.description}</Text>
                </View>
              )}

              <View style={styles.actionRow}>
                <Pressable style={styles.actionBtn}>
                  <IconSymbol name="square.and.pencil" size={16} color={BRONZE} />
                  <Text style={styles.actionBtnText}>Reschedule</Text>
                </Pressable>
                <Pressable style={[styles.actionBtn, styles.actionBtnDanger]}>
                  <IconSymbol name="trash.fill" size={16} color="#EF5350" />
                  <Text style={[styles.actionBtnText, { color: "#EF5350" }]}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.actionBtn}>
                  <IconSymbol name="text.bubble.fill" size={16} color={SILVER} />
                  <Text style={styles.actionBtnText}>Notes</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>

      {/* Create event modal */}
      <Modal
        visible={showCreate}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreate(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowCreate(false)}>
              <IconSymbol name="xmark.circle.fill" size={24} color={MUTED} />
            </Pressable>
            <Text style={styles.modalTitle}>New Event</Text>
            <Pressable
              style={styles.saveBtn}
              onPress={() => {
                setShowCreate(false);
                setNewTitle("");
                setNewTime("");
              }}
            >
              <Text style={styles.saveBtnText}>Save</Text>
            </Pressable>
          </View>
          <View style={styles.createForm}>
            <TextInput
              style={styles.formInput}
              placeholder="Event title"
              placeholderTextColor={MUTED}
              value={newTitle}
              onChangeText={setNewTitle}
            />
            <TextInput
              style={styles.formInput}
              placeholder="Time (e.g. 3:00 PM – 4:00 PM)"
              placeholderTextColor={MUTED}
              value={newTime}
              onChangeText={setNewTime}
            />
            <Pressable style={styles.voiceCreateBtn}>
              <IconSymbol name="mic.fill" size={18} color={BRONZE} />
              <Text style={styles.voiceCreateText}>Or say it to Marcus</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F0EDE8",
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  addBtn: {
    padding: 4,
  },
  weekStrip: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    gap: 4,
  },
  dayBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 10,
  },
  dayBtnActive: {
    backgroundColor: "rgba(201,146,42,0.10)",
  },
  dayName: {
    fontSize: 10,
    color: MUTED,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  dayNum: {
    fontSize: 16,
    fontWeight: "700",
    color: SILVER,
    marginTop: 4,
  },
  dayNumActive: {
    color: BRONZE,
  },
  eventList: {
    padding: 16,
    paddingBottom: 40,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: MUTED,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  eventCard: {
    flexDirection: "row",
    backgroundColor: SURFACE,
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  eventAccent: {
    width: 4,
    flexShrink: 0,
  },
  eventContent: {
    flex: 1,
    padding: 14,
    gap: 4,
  },
  eventTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F0EDE8",
    flex: 1,
    marginRight: 8,
  },
  eventTime: {
    fontSize: 12,
    color: SILVER,
  },
  eventLocation: {
    fontSize: 12,
    color: MUTED,
  },
  eventAttendees: {
    fontSize: 11,
    color: MUTED,
  },
  modal: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    gap: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#F0EDE8",
  },
  modalBody: {
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
    color: "#D0CCC6",
    lineHeight: 20,
  },
  descriptionBox: {
    backgroundColor: SURFACE,
    borderRadius: 10,
    padding: 14,
    marginTop: 4,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  descriptionText: {
    fontSize: 14,
    color: "#D0CCC6",
    lineHeight: 21,
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: SURFACE,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  actionBtnDanger: {
    borderColor: "rgba(239,83,80,0.3)",
    backgroundColor: "rgba(239,83,80,0.08)",
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: SILVER,
  },
  saveBtn: {
    backgroundColor: BRONZE,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0A0A0A",
  },
  createForm: {
    padding: 16,
    gap: 12,
  },
  formInput: {
    backgroundColor: SURFACE,
    borderRadius: 10,
    padding: 14,
    color: "#F0EDE8",
    fontSize: 15,
    borderWidth: 0.5,
    borderColor: BORDER,
  },
  voiceCreateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(201,146,42,0.10)",
    borderRadius: 10,
    paddingVertical: 14,
    borderWidth: 0.5,
    borderColor: BRONZE,
    marginTop: 4,
  },
  voiceCreateText: {
    fontSize: 14,
    color: BRONZE,
    fontWeight: "600",
  },
});
