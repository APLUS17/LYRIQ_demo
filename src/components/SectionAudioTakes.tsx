import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { useLyricStore, Recording } from '../state/lyricStore';
import { format } from 'date-fns';

interface SectionAudioTakesProps {
  sectionId: string;
  className?: string;
}

export function SectionAudioTakes({ sectionId, className = '' }: SectionAudioTakesProps) {
  const recordings = useLyricStore(s => s.getRecordings());
  const removeRecording = useLyricStore(s => s.removeRecording);

  // Filter recordings for this section
  const sectionTakes = recordings.filter(r => r.sectionId === sectionId);

  const [expandedTakeId, setExpandedTakeId] = useState<string | null>(null);

  if (sectionTakes.length === 0) {
    return (
      <View className={`bg-[#1c1c1e] rounded-lg p-3 ${className}`}>
        <Text className="text-sm text-gray-500 text-center">
          No takes recorded for this section
        </Text>
      </View>
    );
  }

  return (
    <View className={`bg-[#1c1c1e] rounded-lg p-3 ${className}`}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm font-semibold text-gray-300">
          Takes ({sectionTakes.length})
        </Text>
        <Ionicons name="musical-notes" size={16} color="#6B7280" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="gap-2"
      >
        {sectionTakes.map((take) => (
          <TakeCard
            key={take.id}
            take={take}
            isExpanded={expandedTakeId === take.id}
            onToggle={() =>
              setExpandedTakeId(expandedTakeId === take.id ? null : take.id)
            }
            onDelete={() => removeRecording(take.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

interface TakeCardProps {
  take: Recording;
  isExpanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
}

function TakeCard({ take, isExpanded, onToggle, onDelete }: TakeCardProps) {
  const player = useAudioPlayer(take.uri);
  const [isPlaying, setIsPlaying] = useState(false);

  const togglePlay = async () => {
    try {
      if (isPlaying) {
        player.pause();
        setIsPlaying(false);
      } else {
        await player.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTime = (isoString: string) => {
    try {
      return format(new Date(isoString), 'MMM d, h:mm a');
    } catch {
      return 'Unknown time';
    }
  };

  return (
    <View className="bg-[#2a2a2e] rounded-lg p-3 min-w-[160px] border border-gray-700">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-200 mb-1" numberOfLines={1}>
            {take.name}
          </Text>
          <Text className="text-xs text-gray-500">
            {formatTime(take.createdAt)}
          </Text>
        </View>
        <Pressable onPress={onDelete} className="p-1">
          <Ionicons name="trash-outline" size={16} color="#EF4444" />
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between">
        <Pressable
          onPress={togglePlay}
          className="bg-gray-700 p-2 rounded-full"
        >
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={16}
            color="#FACC15"
          />
        </Pressable>
        <Text
          className="text-xs text-gray-400"
          style={{ fontFamily: 'monospace' }}
        >
          {formatDuration(take.duration)}
        </Text>
      </View>

      {/* Progress bar */}
      {player && (
        <View className="mt-2 h-1 bg-gray-700 rounded-full overflow-hidden">
          <View
            className="h-full bg-yellow-400"
            style={{
              width: `${(player.currentTime / take.duration) * 100}%`,
            }}
          />
        </View>
      )}
    </View>
  );
}
