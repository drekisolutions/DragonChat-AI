import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMimeIcon(mimeType: string): string {
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "📊";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📽";
  if (mimeType.includes("document") || mimeType.includes("word")) return "📄";
  if (mimeType.includes("pdf")) return "📕";
  if (mimeType.includes("image")) return "🖼";
  if (mimeType.includes("video")) return "🎬";
  if (mimeType.includes("audio")) return "🎵";
  if (mimeType.includes("folder")) return "📁";
  if (mimeType.includes("zip") || mimeType.includes("archive")) return "🗜";
  return "📎";
}

function getMimeLabel(mimeType: string): string {
  if (mimeType.includes("spreadsheet")) return "Spreadsheet";
  if (mimeType.includes("presentation")) return "Presentation";
  if (mimeType.includes("document")) return "Document";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("image")) return "Image";
  if (mimeType.includes("video")) return "Video";
  if (mimeType.includes("audio")) return "Audio";
  if (mimeType.includes("folder")) return "Folder";
  return "File";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatSize(bytes?: string): string {
  if (!bytes) return "";
  const n = parseInt(bytes, 10);
  if (isNaN(n)) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── File Row ─────────────────────────────────────────────────────────────────

function FileRow({
  file,
  onPress,
  colors,
}: {
  file: DriveFile;
  onPress: (f: DriveFile) => void;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <TouchableOpacity
      style={[styles.fileRow, { borderBottomColor: colors.border }]}
      onPress={() => onPress(file)}
      activeOpacity={0.7}
    >
      <Text style={styles.fileIcon}>{getMimeIcon(file.mimeType)}</Text>
      <View style={styles.fileMeta}>
        <Text style={[styles.fileName, { color: colors.foreground }]} numberOfLines={1}>
          {file.name}
        </Text>
        <Text style={[styles.fileSubtitle, { color: colors.muted }]}>
          {getMimeLabel(file.mimeType)}
          {file.size ? `  ·  ${formatSize(file.size)}` : ""}
          {"  ·  "}
          {formatDate(file.modifiedTime)}
        </Text>
      </View>
      <Text style={[styles.chevron, { color: colors.muted }]}>›</Text>
    </TouchableOpacity>
  );
}

// ─── File Detail Modal ────────────────────────────────────────────────────────

function FileDetailModal({
  file,
  visible,
  onClose,
  colors,
}: {
  file: DriveFile | null;
  visible: boolean;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const [summary, setSummary] = useState<string>("");
  const [summarizing, setSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string>("");

  const summarizeMutation = trpc.drive.summarize.useMutation({
    onMutate: () => {
      setSummarizing(true);
      setSummaryError("");
      setSummary("");
    },
    onSuccess: (data: { summary: string; fileId: string }) => {
      setSummarizing(false);
      setSummary(data.summary);
    },
    onError: (err: { message?: string }) => {
      setSummarizing(false);
      setSummaryError(err.message ?? "Marcus could not summarize this file.");
    },
  });

  const handleClose = () => {
    setSummary("");
    setSummaryError("");
    setSummarizing(false);
    onClose();
  };

  if (!file) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={handleClose} style={styles.modalClose}>
            <Text style={[styles.modalCloseText, { color: colors.muted }]}>Close</Text>
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>
            {file.name}
          </Text>
          <View style={styles.modalClose} />
        </View>

        <ScrollView contentContainerStyle={styles.modalBody}>
          {/* File icon + type */}
          <View style={styles.modalIconRow}>
            <Text style={styles.modalBigIcon}>{getMimeIcon(file.mimeType)}</Text>
            <View style={styles.modalIconMeta}>
              <Text style={[styles.modalFileType, { color: "#B8860B" }]}>
                {getMimeLabel(file.mimeType).toUpperCase()}
              </Text>
              {file.size ? (
                <Text style={[styles.modalFileStat, { color: colors.muted }]}>
                  {formatSize(file.size)}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Metadata card */}
          <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <MetaRow label="File Name" value={file.name} colors={colors} />
            <MetaRow label="Type" value={getMimeLabel(file.mimeType)} colors={colors} />
            <MetaRow label="Last Modified" value={formatDate(file.modifiedTime)} colors={colors} />
            {file.size ? <MetaRow label="Size" value={formatSize(file.size)} colors={colors} /> : null}
            <MetaRow label="File ID" value={file.id} colors={colors} mono />
          </View>

          {/* Summarize button */}
          <TouchableOpacity
            style={[styles.summarizeBtn, summarizing && styles.summarizeBtnDisabled]}
            onPress={() => {
              if (!summarizing) {
                summarizeMutation.mutate({ fileId: file.id, fileName: file.name, mimeType: file.mimeType });
              }
            }}
            activeOpacity={0.8}
          >
            {summarizing ? (
              <ActivityIndicator color="#0a0a0a" size="small" />
            ) : (
              <Text style={styles.summarizeBtnText}>
                {summary ? "Re-summarize with Marcus" : "Summarize with Marcus"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Summary output */}
          {summaryError ? (
            <View style={[styles.summaryBox, { backgroundColor: "#1a0a0a", borderColor: "#7f1d1d" }]}>
              <Text style={[styles.summaryLabel, { color: "#f87171" }]}>Error</Text>
              <Text style={[styles.summaryText, { color: "#fca5a5" }]}>{summaryError}</Text>
            </View>
          ) : null}

          {summary ? (
            <View style={[styles.summaryBox, { backgroundColor: colors.surface, borderColor: "#B8860B" }]}>
              <View style={styles.summaryLabelRow}>
                <Text style={[styles.summaryLabel, { color: "#B8860B" }]}>Marcus Summary</Text>
              </View>
              <Text style={[styles.summaryText, { color: colors.foreground }]}>{summary}</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}

function MetaRow({
  label,
  value,
  colors,
  mono,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  mono?: boolean;
}) {
  return (
    <View style={[styles.metaRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.metaLabel, { color: colors.muted }]}>{label}</Text>
      <Text
        style={[styles.metaValue, { color: colors.foreground }, mono && styles.metaMono]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function FilesScreen() {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Recent files
  const recentQuery = trpc.drive.recent.useQuery(
    { maxResults: 20 },
    { staleTime: 60_000 }
  );

  // Search results
  const searchQuery = trpc.drive.search.useQuery(
    { query, maxResults: 20 },
    { enabled: searchActive && query.trim().length > 1, staleTime: 30_000 }
  );

  const handleSearch = useCallback(() => {
    if (query.trim().length > 1) setSearchActive(true);
  }, [query]);

  const handleClearSearch = () => {
    setQuery("");
    setSearchActive(false);
  };

  const handleFilePress = (file: DriveFile) => {
    setSelectedFile(file);
    setModalVisible(true);
  };

  const displayFiles: DriveFile[] = searchActive
    ? (searchQuery.data ?? [])
    : (recentQuery.data ?? []);

  const isLoading = searchActive ? searchQuery.isLoading : recentQuery.isLoading;
  const isError = searchActive ? searchQuery.isError : recentQuery.isError;

  return (
    <ScreenContainer>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: "#B8860B" }]}>Files</Text>
        <Text style={[styles.headerSub, { color: colors.muted }]}>Google Drive</Text>
      </View>

      {/* Search bar */}
      <View style={[styles.searchRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search Drive..."
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            if (t.trim().length === 0) setSearchActive(false);
          }}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
          autoCorrect={false}
          autoCapitalize="none"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClearSearch} style={styles.clearBtn}>
            <Text style={[styles.clearBtnText, { color: colors.muted }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Section label */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionLabel, { color: colors.muted }]}>
          {searchActive ? `Results for "${query}"` : "Recent Files"}
        </Text>
        {isLoading && <ActivityIndicator size="small" color="#B8860B" style={{ marginLeft: 8 }} />}
      </View>

      {/* File list */}
      {isError ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>⚠️</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Drive Unavailable</Text>
          <Text style={[styles.emptyBody, { color: colors.muted }]}>
            Marcus could not connect to Google Drive. Ensure the Drive connector is active in your integrations.
          </Text>
        </View>
      ) : displayFiles.length === 0 && !isLoading ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>{searchActive ? "🔍" : "📁"}</Text>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            {searchActive ? "No Results" : "No Recent Files"}
          </Text>
          <Text style={[styles.emptyBody, { color: colors.muted }]}>
            {searchActive
              ? "Try a different search term."
              : "Your recent Google Drive files will appear here once the Drive connector is active."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={displayFiles}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <FileRow file={item} onPress={handleFilePress} colors={colors} />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* File detail modal */}
      <FileDetailModal
        file={selectedFile}
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        colors={colors}
      />
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: 12,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    height: 44,
  },
  clearBtn: {
    padding: 4,
  },
  clearBtnText: {
    fontSize: 14,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  listContent: {
    paddingBottom: 32,
  },
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  fileIcon: {
    fontSize: 26,
    width: 36,
    textAlign: "center",
    marginRight: 12,
  },
  fileMeta: {
    flex: 1,
  },
  fileName: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 3,
  },
  fileSubtitle: {
    fontSize: 12,
  },
  chevron: {
    fontSize: 22,
    marginLeft: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingBottom: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  // Modal
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  modalClose: {
    width: 60,
  },
  modalCloseText: {
    fontSize: 15,
  },
  modalTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  modalBody: {
    padding: 20,
    paddingBottom: 60,
  },
  modalIconRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  modalBigIcon: {
    fontSize: 52,
    marginRight: 16,
  },
  modalIconMeta: {
    flex: 1,
  },
  modalFileType: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  modalFileStat: {
    fontSize: 13,
  },
  metaCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  metaLabel: {
    fontSize: 13,
    width: 110,
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  metaMono: {
    fontFamily: "monospace",
    fontSize: 11,
  },
  summarizeBtn: {
    backgroundColor: "#B8860B",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 20,
  },
  summarizeBtnDisabled: {
    opacity: 0.6,
  },
  summarizeBtnText: {
    color: "#0a0a0a",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  summaryBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  summaryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 22,
  },
});
