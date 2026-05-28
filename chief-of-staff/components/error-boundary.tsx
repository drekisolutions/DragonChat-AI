/**
 * ErrorBoundary — Catches uncaught React errors and shows a recovery screen
 * instead of a blank crash on Android.
 */
import React, { Component, type ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: "" };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error?.message ?? String(error) };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[MARCUS ErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.wordmark}>MARCUS</Text>
            <Text style={styles.subtitle}>CHIEF OF STAFF · DREKI SOLUTIONS</Text>
            <View style={styles.card}>
              <Text style={styles.errorTitle}>Startup Error</Text>
              <Text style={styles.errorMsg}>{this.state.error}</Text>
            </View>
            <TouchableOpacity style={styles.btn} onPress={this.handleReset}>
              <Text style={styles.btnText}>Restart Marcus</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A",
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 24,
  },
  wordmark: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 10,
    color: "#C9922A",
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 2,
    color: "#7A7A7A",
    textTransform: "uppercase",
  },
  card: {
    width: "100%",
    backgroundColor: "#1A1A1A",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    gap: 10,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#EF5350",
  },
  errorMsg: {
    fontSize: 13,
    color: "#C0C0C0",
    lineHeight: 20,
  },
  btn: {
    backgroundColor: "#C9922A",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  btnText: {
    color: "#0A0A0A",
    fontWeight: "700",
    fontSize: 15,
    letterSpacing: 0.5,
  },
});
