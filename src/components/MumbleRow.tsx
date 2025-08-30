import React from "react";
import { View, Text, Pressable, AccessibilityInfo, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export type MumbleRowProps = {
  r: { id: string; name: string; createdAt: any; duration?: number };
  isSelected: boolean;
  onSelect: () => void;
  onEllipsis: () => void;
  onToggle: () => void;
  onDelete: () => void;
  currentTime: number;
  totalTime: number;
  isPlaying: boolean;
  onSeekBy?: (deltaSec: number) => void;
};

const formatClock = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const formatRemaining = (current: number, total: number) => {
  const remain = Math.max(0, total - current);
  const m = Math.floor(remain / 60);
  const s = remain % 60;
  return `-${m}:${s.toString().padStart(2, "0")}`;
};

const formatWhen = (d: Date) => {
  const dt = new Date(d);
  const now = new Date();
  const isSameDay = dt.toDateString() === now.toDateString();
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  const isYesterday = dt.toDateString() === yest.toDateString();
  if (isSameDay) return dt.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  if (isYesterday) return "Yesterday";
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
};

export default function MumbleRow({ r, isSelected, onSelect, onEllipsis, onToggle, onDelete, currentTime, totalTime, isPlaying, onSeekBy }: MumbleRowProps) {
  return (
    <View
      accessible
      accessibilityRole="button"
      accessibilityLabel={r.name || "New Recording"}
      accessibilityState={{ expanded: isSelected }}
      style={{
        borderRadius: 20,
        overflow: "hidden",
        marginVertical: 6,
        backgroundColor: isSelected ? "#18181B" : "#111113",
        borderWidth: 1,
        borderColor: isSelected ? "#3B82F6" : "#232326",
        shadowColor: isSelected ? "#3B82F6" : undefined,
        shadowOpacity: isSelected ? 0.15 : 0,
        shadowRadius: isSelected ? 8 : 0,
      }}
    >
      {/* List row */}
      <Pressable
        onPress={onSelect}
        accessibilityRole="button"
        accessibilityLabel={`Select take: ${r.name || "New Recording"}`}
        accessibilityState={{ selected: isSelected }}
        className="flex-row items-center justify-between px-4"
        style={{ height: 72 }}
        android_ripple={{ color: "#232326" }}
      >
        <View className="flex-1 pr-3">
          <Text className="text-white" style={{ fontSize: 18, fontWeight: "700" }} numberOfLines={1}>
            {r.name || "New Recording"}
          </Text>
          <Text style={{ color: "#9DA3AF", fontSize: 13, marginTop: 2 }}>
            {formatWhen(r.createdAt as any)}
          </Text>
        </View>
        <Text style={{ color: "#9DA3AF", fontSize: 13, marginRight: 6 }}>
          {formatClock(Math.floor(r.duration || 0))}
        </Text>
        <Pressable
          onPress={onEllipsis}
          accessibilityRole="button"
          accessibilityLabel={`More options for ${r.name || "New Recording"}`}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ marginLeft: 2 }}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
        </Pressable>
      </Pressable>
      {/* Expanded player under the selected row */}
      {isSelected && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, backgroundColor: "#18181B" }}>
          {/* Scrubber */}
          <Pressable
            onPress={(e) => {
              // TODO: Implement seek logic if needed
            }}
            className="h-6 justify-center"
            accessibilityRole="adjustable"
            accessibilityLabel="Playback position"
            accessibilityValue={{ min: 0, max: totalTime, now: currentTime }}
            style={{ marginBottom: 12 }}
          >
            <View
              className="h-1 rounded-full"
              style={{ backgroundColor: "#232326" }}
              accessibilityRole="progressbar"
              accessibilityLabel="Playback progress"
              accessibilityValue={{ min: 0, max: totalTime, now: currentTime }}
            >
              <View
                className="h-1 rounded-full"
                style={{
                  width: `${totalTime ? (currentTime / totalTime) * 100 : 0}%`,
                  backgroundColor: "#3B82F6",
                  boxShadow: Platform.OS === "web" ? "0 0 8px rgba(0,132,255,.3)" : undefined,
                }}
              />
            </View>
            <View className="flex-row justify-between mt-2" accessibilityLiveRegion="polite">
              <Text style={{ color: "#9DA3AF", fontSize: 12 }}>{formatClock(currentTime)}</Text>
              <Text style={{ color: "#9DA3AF", fontSize: 12 }}>{formatRemaining(currentTime, totalTime)}</Text>
            </View>
          </Pressable>
          {/* Controls */}
          <View className="flex-row items-center justify-between mt-6">
            <Pressable
              onPress={() => onSeekBy?.(-15)}
              accessibilityRole="button"
              accessibilityLabel="Seek backward 15 seconds"
              className="items-center justify-center"
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#232326" }}
            >
              <Ionicons name="play-back" size={22} color="#E5E7EB" />
            </Pressable>
            <Pressable
              onPress={onToggle}
              accessibilityRole="button"
              accessibilityLabel={isPlaying ? "Pause" : "Play"}
              className="items-center justify-center"
              style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "#FFFFFF" }}
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#111827" />
            </Pressable>
            <Pressable
              onPress={() => onSeekBy?.(15)}
              accessibilityRole="button"
              accessibilityLabel="Seek forward 15 seconds"
              className="items-center justify-center"
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#232326" }}
            >
              <Ionicons name="play-forward" size={22} color="#E5E7EB" />
            </Pressable>
            <Pressable
              onPress={onDelete}
              accessibilityRole="button"
              accessibilityLabel={`Delete take: ${r.name || "New Recording"}`}
              className="items-center justify-center"
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#232326" }}
            >
              <Ionicons name="trash" size={22} color="#EF4444" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
