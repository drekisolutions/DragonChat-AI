// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols → Material Icons mapping for MARCUS app.
 */
const MAPPING = {
  // Navigation tabs
  "house.fill": "home",
  "envelope.fill": "email",
  "calendar": "calendar-today",
  "person.3.fill": "groups",
  "ellipsis.circle.fill": "more-horiz",
  // Voice / mic
  "mic.fill": "mic",
  "mic.slash.fill": "mic-off",
  "waveform": "graphic-eq",
  // Actions
  "paperplane.fill": "send",
  "square.and.pencil": "edit",
  "plus.circle.fill": "add-circle",
  "trash.fill": "delete",
  "arrow.uturn.left": "reply",
  "arrow.right.circle.fill": "arrow-circle-right",
  "checkmark.circle.fill": "check-circle",
  "xmark.circle.fill": "cancel",
  // Status
  "bolt.fill": "bolt",
  "clock.fill": "schedule",
  "bell.fill": "notifications",
  "exclamationmark.triangle.fill": "warning",
  // Files
  "folder.fill": "folder",
  "doc.fill": "description",
  "magnifyingglass": "search",
  // Settings / rules
  "slider.horizontal.3": "tune",
  "gearshape.fill": "settings",
  "lock.fill": "lock",
  "shield.fill": "security",
  // Calls
  "phone.fill": "phone",
  "phone.down.fill": "call-end",
  "text.bubble.fill": "chat",
  // Misc
  "chevron.right": "chevron-right",
  "chevron.left.forwardslash.chevron.right": "code",
  "star.fill": "star",
  "person.fill": "person",
  "person.2.fill": "people",
  "building.2.fill": "business",
  "chart.bar.fill": "bar-chart",
  "dollarsign.circle.fill": "attach-money",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
