import React from "react";
import { View, Text, Pressable } from "react-native";
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
    <View>
      {/* List row */}
      <Pressable
        onPress={onSelect}
        className="flex-row items-center justify-between px-4"
        style={{ height: 64, borderBottomWidth: 1, borderBottomColor: "#2C2C2E" }}
      >
        <View className="flex-1 pr-3">
          <Text className="text-white" style={{ fontSize: 17, fontWeight: "600" }} numberOfLines={1}>
            {r.name || "New Recording"}
          </Text>
          <Text style={{ color: "#9DA3AF", fontSize: 13, marginTop: 2 }}>
            {formatWhen(r.createdAt as any)}
          </Text>
        </View>

        <Text style={{ color: "#9DA3AF", fontSize: 13, marginRight: 6 }}>
          {formatClock(Math.floor(r.duration || 0))}
        </Text>

        <Pressable onPress={onEllipsis} className="w-8 h-8 rounded-full items-center justify-center">
          <Ionicons name="ellipsis-horizontal" size={18} color="#9CA3AF" />
        </Pressable>
      </Pressable>

      {/* Expanded player under the selected row */}
      {isSelected && (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 16, backgroundColor: "#0C0C0C" }}>
          {/* Scrubber */}
          <Pressable
            onPress={(e) => {
              const w = (e.nativeEvent as any).source?.width ?? 1;
              const x = (e.nativeEvent as any).locationX ?? 0;
              const ratio = Math.max(0, Math.min(1, x / Math.max(1, w)));
              // An actual seek gesture can be wired by caller if desired
            }}
            className="h-6 justify-center"
          >
            <View className="h-1 rounded-full" style={{ backgroundColor: "#2C2C2E" }}>
              <View
                className="h-1 rounded-full"
                style={{
                  width: `${totalTime ? (currentTime / totalTime) * 100 : 0}%`,
                  backgroundColor: "#FFFFFF",
                }}
              />
            </View>
            <View className="flex-row justify-between mt-4">
              <Text style={{ color: "#9DA3AF", fontSize: 12 }}>{formatClock(currentTime)}</Text>
              <Text style={{ color: "#9DA3AF", fontSize: 12 }}>{formatRemaining(currentTime, totalTime)}</Text>
            </View>
          </Pressable>

          {/* Controls */}
          <View className="flex-row items-center justify-between mt-10">
            <Pressable
              onPress={() => onSeekBy?.(-15)}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#1C1C1E" }}
              className="items-center justify-center"
            >
              <Ionicons name="play-back" size={18} color="#E5E7EB" />
            </Pressable>

            <Pressable
              onPress={onToggle}
              style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: "#FFFFFF" }}
              className="items-center justify-center"
            >
              <Ionicons name={isPlaying ? "pause" : "play"} size={22} color="#111827" />
            </Pressable>

            <Pressable
              onPress={() => onSeekBy?.(15)}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#1C1C1E" }}
              className="items-center justify-center"
            >
              <Ionicons name="play-forward" size={18} color="#E5E7EB" />
            </Pressable>

            <Pressable
              onPress={onDelete}
              style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: "#1C1C1E" }}
              className="items-center justify-center"
            >
              <Ionicons name="trash" size={18} color="#3B82F6" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}
