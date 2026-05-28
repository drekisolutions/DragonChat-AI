/**
 * Red Team Agent Screen
 *
 * Marcus's adversarial business intelligence agent. Stress-tests strategies,
 * proposals, pitches, and plans by attacking them from every angle — competitor
 * moves, market risks, execution gaps, financial assumptions, and blind spots.
 *
 * The agent runs a multi-pass analysis:
 *   1. Devil's Advocate — argues against the proposal
 *   2. Competitor Intelligence — simulates a rival's counter-strategy
 *   3. Risk Matrix — surfaces financial, operational, and reputational risks
 *   4. Blind Spot Report — identifies what the user hasn't considered
 *   5. Verdict — overall resilience score and go/no-go recommendation
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";
import { trpc } from "@/lib/trpc";

// ─── Types ────────────────────────────────────────────────────────────────────

interface RedTeamResult {
  devilsAdvocate: string;
  competitorIntelligence: string;
  riskMatrix: string;
  blindSpots: string;
  verdict: string;
  resilienceScore: number; // 0–100
  recommendation: "GO" | "NO-GO" | "CONDITIONAL";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RECOMMENDATION_COLORS = {
  "GO": "#22C55E",
  "NO-GO": "#EF4444",
  "CONDITIONAL": "#F59E0B",
};

const RECOMMENDATION_ICONS = {
  "GO": "✓",
  "NO-GO": "✗",
  "CONDITIONAL": "⚠",
};

const SECTION_ICONS: Record<keyof Omit<RedTeamResult, "resilienceScore" | "recommendation">, string> = {
  devilsAdvocate: "⚔",
  competitorIntelligence: "🎯",
  riskMatrix: "⚠",
  blindSpots: "🔍",
  verdict: "📋",
};

const SECTION_TITLES: Record<keyof Omit<RedTeamResult, "resilienceScore" | "recommendation">, string> = {
  devilsAdvocate: "Devil's Advocate",
  competitorIntelligence: "Competitor Intelligence",
  riskMatrix: "Risk Matrix",
  blindSpots: "Blind Spot Report",
  verdict: "Verdict",
};

const SECTION_ORDER: (keyof Omit<RedTeamResult, "resilienceScore" | "recommendation">)[] = [
  "devilsAdvocate",
  "competitorIntelligence",
  "riskMatrix",
  "blindSpots",
  "verdict",
];

// ─── Score Ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, recommendation }: { score: number; recommendation: "GO" | "NO-GO" | "CONDITIONAL" }) {
  const color = RECOMMENDATION_COLORS[recommendation];
  return (
    <View style={styles.scoreRingContainer}>
      <View style={[styles.scoreRing, { borderColor: color }]}>
        <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
        <Text style={[styles.scoreLabel, { color }]}>/ 100</Text>
      </View>
      <Text style={[styles.scoreTitle, { color }]}>Resilience Score</Text>
    </View>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({
  sectionKey,
  content,
  colors,
}: {
  sectionKey: keyof Omit<RedTeamResult, "resilienceScore" | "recommendation">;
  content: string;
  colors: ReturnType<typeof useColors>;
}) {
  const [expanded, setExpanded] = useState(true);
  const icon = SECTION_ICONS[sectionKey];
  const title = SECTION_TITLES[sectionKey];
  const isVerdict = sectionKey === "verdict";

  return (
    <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: isVerdict ? "#B8860B" : colors.border }]}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionIcon}>{icon}</Text>
          <Text style={[styles.sectionTitle, { color: isVerdict ? "#B8860B" : colors.foreground }]}>
            {title}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: colors.muted }]}>{expanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={[styles.sectionBody, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionContent, { color: colors.foreground }]}>{content}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function RedTeamScreen() {
  const colors = useColors();
  const [input, setInput] = useState("");
  const [result, setResult] = useState<RedTeamResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string>("");
  const scrollRef = useRef<ScrollView>(null);

  const mutation = trpc.redTeam.analyze.useMutation({
    onMutate: () => {
      setAnalyzing(true);
      setError("");
      setResult(null);
    },
    onSuccess: (data: RedTeamResult) => {
      setAnalyzing(false);
      setResult(data);
      setTimeout(() => scrollRef.current?.scrollTo({ y: 400, animated: true }), 200);
    },
    onError: (err: { message?: string }) => {
      setAnalyzing(false);
      setError(err.message ?? "Marcus Red Team encountered an error. Please try again.");
    },
  });

  const handleAnalyze = () => {
    if (!input.trim() || analyzing) return;
    mutation.mutate({ proposal: input.trim() });
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>RED TEAM</Text>
            </View>
            <Text style={[styles.headerTitle, { color: "#B8860B" }]}>Adversarial Analysis</Text>
            <Text style={[styles.headerSub, { color: colors.muted }]}>
              Submit a strategy, proposal, or business plan. Marcus will attack it from every angle.
            </Text>
          </View>

          {/* Input area */}
          <View style={styles.inputSection}>
            <Text style={[styles.inputLabel, { color: colors.muted }]}>
              STRATEGY / PROPOSAL / PLAN
            </Text>
            <View style={[styles.inputContainer, { backgroundColor: colors.surface, borderColor: analyzing ? "#B8860B" : colors.border }]}>
              <TextInput
                style={[styles.textInput, { color: colors.foreground }]}
                placeholder="Describe your strategy, business proposal, sales pitch, product plan, or any idea you want stress-tested..."
                placeholderTextColor={colors.muted}
                value={input}
                onChangeText={setInput}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
                maxLength={3000}
                editable={!analyzing}
              />
              <Text style={[styles.charCount, { color: colors.muted }]}>
                {input.length}/3000
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.analyzeBtn,
                (!input.trim() || analyzing) && styles.analyzeBtnDisabled,
              ]}
              onPress={handleAnalyze}
              activeOpacity={0.8}
              disabled={!input.trim() || analyzing}
            >
              {analyzing ? (
                <View style={styles.analyzingRow}>
                  <ActivityIndicator color="#0a0a0a" size="small" />
                  <Text style={styles.analyzeBtnText}>  Red Team Analyzing...</Text>
                </View>
              ) : (
                <Text style={styles.analyzeBtnText}>⚔  Launch Red Team Analysis</Text>
              )}
            </TouchableOpacity>

            {analyzing && (
              <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: "#B8860B" }]}>
                <Text style={[styles.progressTitle, { color: "#B8860B" }]}>MARCUS RED TEAM ACTIVE</Text>
                <Text style={[styles.progressBody, { color: colors.muted }]}>
                  Running adversarial analysis across 5 dimensions: devil's advocate, competitor intelligence, risk matrix, blind spot detection, and final verdict...
                </Text>
              </View>
            )}
          </View>

          {/* Error */}
          {error ? (
            <View style={[styles.errorCard, { backgroundColor: "#1a0a0a", borderColor: "#7f1d1d" }]}>
              <Text style={[styles.errorTitle, { color: "#f87171" }]}>Analysis Failed</Text>
              <Text style={[styles.errorBody, { color: "#fca5a5" }]}>{error}</Text>
            </View>
          ) : null}

          {/* Results */}
          {result ? (
            <View style={styles.resultsSection}>
              {/* Score + Recommendation */}
              <View style={[styles.scoreRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <ScoreRing score={result.resilienceScore} recommendation={result.recommendation} />
                <View style={styles.recommendationBlock}>
                  <Text style={[styles.recommendationLabel, { color: colors.muted }]}>
                    RECOMMENDATION
                  </Text>
                  <View style={[styles.recommendationBadge, { backgroundColor: RECOMMENDATION_COLORS[result.recommendation] + "22", borderColor: RECOMMENDATION_COLORS[result.recommendation] }]}>
                    <Text style={[styles.recommendationIcon, { color: RECOMMENDATION_COLORS[result.recommendation] }]}>
                      {RECOMMENDATION_ICONS[result.recommendation]}
                    </Text>
                    <Text style={[styles.recommendationText, { color: RECOMMENDATION_COLORS[result.recommendation] }]}>
                      {result.recommendation}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Section cards */}
              {SECTION_ORDER.map((key) => (
                <SectionCard
                  key={key}
                  sectionKey={key}
                  content={result[key]}
                  colors={colors}
                />
              ))}

              {/* Re-run button */}
              <TouchableOpacity
                style={[styles.rerunBtn, { borderColor: colors.border }]}
                onPress={() => {
                  setResult(null);
                  scrollRef.current?.scrollTo({ y: 0, animated: true });
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.rerunBtnText, { color: colors.muted }]}>
                  ↺  Revise Proposal & Re-run
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: 60,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBadge: {
    backgroundColor: "#7f1d1d",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  headerBadgeText: {
    color: "#fca5a5",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 13,
    lineHeight: 19,
  },
  inputSection: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  inputContainer: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  textInput: {
    fontSize: 14,
    lineHeight: 22,
    minHeight: 120,
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 6,
  },
  analyzeBtn: {
    backgroundColor: "#B8860B",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 16,
  },
  analyzeBtnDisabled: {
    opacity: 0.45,
  },
  analyzeBtnText: {
    color: "#0a0a0a",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  analyzingRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
  },
  progressTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    marginBottom: 8,
  },
  progressBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  errorCard: {
    marginHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 6,
  },
  errorBody: {
    fontSize: 13,
    lineHeight: 20,
  },
  resultsSection: {
    paddingHorizontal: 20,
    gap: 12,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 20,
    marginBottom: 4,
  },
  scoreRingContainer: {
    alignItems: "center",
  },
  scoreRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  scoreNumber: {
    fontSize: 26,
    fontWeight: "800",
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  scoreTitle: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  recommendationBlock: {
    flex: 1,
  },
  recommendationLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  recommendationBadge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    alignSelf: "flex-start",
  },
  recommendationIcon: {
    fontSize: 20,
    fontWeight: "800",
  },
  recommendationText: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 2,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  chevron: {
    fontSize: 12,
  },
  sectionBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  sectionContent: {
    fontSize: 14,
    lineHeight: 22,
  },
  rerunBtn: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  rerunBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
