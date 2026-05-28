/**
 * Names & Voices — Customization screen
 * Lets the user rename Marcus and all 5 sub-agents, and pick a Chirp 3 HD voice.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Modal,
  FlatList,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { useRouter } from "expo-router";
import {
  useAgentNames,
  AGENT_DEFAULTS,
  type AgentKey,
} from "@/lib/agent-names-context";
import { trpc } from "@/lib/trpc";

const AGENT_KEYS: AgentKey[] = [
  "chiefOfStaff",
  "research",
  "sales",
  "support",
  "bookkeeping",
  "personal",
];

export default function NamesScreen() {
  const colors = useColors();
  const router = useRouter();
  const { agents, names, updateName, resetToDefaults } = useAgentNames();

  const [editingKey, setEditingKey] = useState<AgentKey | null>(null);
  const [editValue, setEditValue] = useState("");
  const [voicePickerKey, setVoicePickerKey] = useState<AgentKey | null>(null);
  const [saving, setSaving] = useState(false);

  const voicesQuery = trpc.tts.listVoices.useQuery();

  const openEdit = useCallback((key: AgentKey) => {
    setEditingKey(key);
    setEditValue(names[key]);
  }, [names]);

  const saveEdit = useCallback(async () => {
    if (!editingKey) return;
    const trimmed = editValue.trim();
    if (!trimmed) {
      Alert.alert("Name required", "Please enter a name for this agent.");
      return;
    }
    setSaving(true);
    await updateName(editingKey, trimmed);
    setSaving(false);
    setEditingKey(null);
  }, [editingKey, editValue, updateName]);

  const handleReset = useCallback(() => {
    Alert.alert(
      "Reset All Names",
      "This will restore all agent names to their defaults. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: async () => {
            await resetToDefaults();
          },
        },
      ]
    );
  }, [resetToDefaults]);

  return (
    <ScreenContainer>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: colors.border,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ marginRight: 16, padding: 4 }}
        >
          <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.foreground, fontSize: 18, fontWeight: "700" }}>
            Names & Voices
          </Text>
          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
            Customize agent names and voices
          </Text>
        </View>
        <TouchableOpacity onPress={handleReset} style={{ padding: 4 }}>
          <Text style={{ color: colors.error, fontSize: 13 }}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        {/* Info banner */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            marginBottom: 24,
            borderLeftWidth: 3,
            borderLeftColor: colors.primary,
          }}
        >
          <Text style={{ color: colors.foreground, fontSize: 13, lineHeight: 20 }}>
            Each agent has a unique name and voice. Names appear throughout the app and in
            spoken responses. Voices use Google Cloud TTS Chirp 3 HD — the most natural
            AI voices available.
          </Text>
        </View>

        {/* Agent cards */}
        {AGENT_KEYS.map(key => {
          const agent = agents[key];
          const defaults = AGENT_DEFAULTS[key];
          const isChief = key === "chiefOfStaff";

          return (
            <View
              key={key}
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 16,
                marginBottom: 14,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              {/* Color dot + role */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: agent.color,
                    marginRight: 8,
                  }}
                />
                <Text style={{ color: colors.muted, fontSize: 11, fontWeight: "600", letterSpacing: 1 }}>
                  {agent.role.toUpperCase()}
                </Text>
                {isChief && (
                  <View
                    style={{
                      marginLeft: 8,
                      backgroundColor: colors.primary,
                      borderRadius: 4,
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                    }}
                  >
                    <Text style={{ color: "#000", fontSize: 9, fontWeight: "700" }}>
                      CHIEF
                    </Text>
                  </View>
                )}
              </View>

              {/* Current name */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 22,
                    fontWeight: "700",
                    flex: 1,
                  }}
                >
                  {agent.name}
                </Text>
                {agent.name !== defaults.defaultName && (
                  <Text style={{ color: colors.muted, fontSize: 11 }}>
                    (default: {defaults.defaultName})
                  </Text>
                )}
              </View>

              {/* Description */}
              <Text
                style={{
                  color: colors.muted,
                  fontSize: 12,
                  lineHeight: 18,
                  marginBottom: 12,
                }}
              >
                {agent.description}
              </Text>

              {/* Voice badge */}
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}>
                <View
                  style={{
                    backgroundColor: "#1A1A1A",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flex: 1,
                  }}
                >
                  <Text style={{ color: colors.muted, fontSize: 10, marginBottom: 1 }}>
                    VOICE
                  </Text>
                  <Text style={{ color: colors.foreground, fontSize: 12, fontWeight: "600" }}>
                    {agent.voiceName.replace("en-US-Chirp3-HD-", "")} · Chirp 3 HD
                  </Text>
                </View>
              </View>

              {/* Actions */}
              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  onPress={() => openEdit(key)}
                  style={{
                    flex: 1,
                    backgroundColor: colors.primary,
                    borderRadius: 10,
                    paddingVertical: 10,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#000", fontWeight: "700", fontSize: 13 }}>
                    Rename
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

        {/* Voice info footer */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 12,
            padding: 14,
            marginTop: 8,
          }}
        >
          <Text
            style={{
              color: colors.muted,
              fontSize: 11,
              lineHeight: 18,
              textAlign: "center",
            }}
          >
            Voices powered by Google Cloud TTS Chirp 3 HD — the latest generation of
            generative AI voices with emotional resonance and natural intonation.
            Requires Google Cloud Application Default Credentials.
          </Text>
        </View>
      </ScrollView>

      {/* Rename Modal */}
      <Modal
        visible={editingKey !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingKey(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.7)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 24,
              width: "100%",
              maxWidth: 360,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {editingKey && (
              <>
                <Text
                  style={{
                    color: colors.muted,
                    fontSize: 11,
                    fontWeight: "600",
                    letterSpacing: 1,
                    marginBottom: 4,
                  }}
                >
                  RENAME {AGENT_DEFAULTS[editingKey].role.toUpperCase()}
                </Text>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 16,
                  }}
                >
                  {agents[editingKey].name}
                </Text>

                <TextInput
                  value={editValue}
                  onChangeText={setEditValue}
                  placeholder="Enter new name..."
                  placeholderTextColor={colors.muted}
                  maxLength={30}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={saveEdit}
                  style={{
                    backgroundColor: "#1A1A1A",
                    borderRadius: 10,
                    padding: 14,
                    color: colors.foreground,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: colors.border,
                    marginBottom: 20,
                  }}
                />

                <View style={{ flexDirection: "row", gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => setEditingKey(null)}
                    style={{
                      flex: 1,
                      backgroundColor: "#1A1A1A",
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: colors.border,
                    }}
                  >
                    <Text style={{ color: colors.muted, fontWeight: "600" }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={saveEdit}
                    disabled={saving}
                    style={{
                      flex: 1,
                      backgroundColor: colors.primary,
                      borderRadius: 10,
                      paddingVertical: 12,
                      alignItems: "center",
                    }}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#000" />
                    ) : (
                      <Text style={{ color: "#000", fontWeight: "700" }}>Save</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}
