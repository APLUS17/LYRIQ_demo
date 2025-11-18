import React from 'react';
import { View, Text } from 'react-native';
import { countSyllablesInLine } from '../utils/syllableCounter';

interface SyllableDisplayProps {
  lines: string[];
  className?: string;
}

export function SyllableDisplay({ lines, className = '' }: SyllableDisplayProps) {
  const syllableCounts = lines.map(line => countSyllablesInLine(line));

  return (
    <View className={`flex-col ${className}`}>
      {lines.map((line, index) => (
        <View key={index} className="flex-row items-center mb-1">
          <Text
            className="w-10 text-right text-sm text-gray-500 mr-3"
            style={{ fontFamily: 'monospace' }}
          >
            {line.trim() ? syllableCounts[index] : ''}
          </Text>
          <Text className="flex-1 text-base text-gray-200 leading-6">
            {line}
          </Text>
        </View>
      ))}
    </View>
  );
}

interface SyllableCountBadgeProps {
  text: string;
  className?: string;
}

export function SyllableCountBadge({ text, className = '' }: SyllableCountBadgeProps) {
  const count = countSyllablesInLine(text);

  return (
    <View className={`bg-gray-700 px-2 py-1 rounded ${className}`}>
      <Text
        className="text-xs text-gray-300"
        style={{ fontFamily: 'monospace' }}
      >
        {count} syllable{count !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

interface SyllableStatsProps {
  lines: string[];
  className?: string;
}

export function SyllableStats({ lines, className = '' }: SyllableStatsProps) {
  const nonEmptyLines = lines.filter(l => l.trim().length > 0);
  const counts = nonEmptyLines.map(line => countSyllablesInLine(line));

  const total = counts.reduce((sum, count) => sum + count, 0);
  const avg = counts.length > 0 ? (total / counts.length).toFixed(1) : '0';
  const min = counts.length > 0 ? Math.min(...counts) : 0;
  const max = counts.length > 0 ? Math.max(...counts) : 0;

  return (
    <View className={`flex-row items-center gap-3 ${className}`}>
      <View className="bg-gray-700 px-2 py-1 rounded">
        <Text className="text-xs text-gray-400">Total</Text>
        <Text
          className="text-sm text-gray-200 font-semibold"
          style={{ fontFamily: 'monospace' }}
        >
          {total}
        </Text>
      </View>
      <View className="bg-gray-700 px-2 py-1 rounded">
        <Text className="text-xs text-gray-400">Avg</Text>
        <Text
          className="text-sm text-gray-200 font-semibold"
          style={{ fontFamily: 'monospace' }}
        >
          {avg}
        </Text>
      </View>
      <View className="bg-gray-700 px-2 py-1 rounded">
        <Text className="text-xs text-gray-400">Range</Text>
        <Text
          className="text-sm text-gray-200 font-semibold"
          style={{ fontFamily: 'monospace' }}
        >
          {min}-{max}
        </Text>
      </View>
    </View>
  );
}
