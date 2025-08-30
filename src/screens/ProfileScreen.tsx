import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLyricStore } from '../state/lyricStore';

interface ProfileScreenProps {
  onBack: () => void;
}

export default function ProfileScreen({ onBack }: ProfileScreenProps) {
  const insets = useSafeAreaInsets();
  const [showSidebar, setShowSidebar] = useState(false);
  
  const projects = useLyricStore(s => s.projects);
  const sectionsByProject = useLyricStore(s => s.sectionsByProject);
  const recordingsByProject = useLyricStore(s => s.recordingsByProject);
  
  // Calculate stats
  const totalProjects = projects.length;
  const totalSections = Object.values(sectionsByProject).flat().length;
  const totalRecordings = Object.values(recordingsByProject).flat().length;
  const starredSections = Object.values(sectionsByProject).flat().filter(s => s.isStarred).length;
  
  // Recent activity (last 3 projects)
  const recentProjects = projects
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const StatCard = ({ value, label }: { value: number; label: string }) => (
    <Pressable className="bg-gray-800 border border-gray-700 rounded-xl p-4 items-center flex-1">
      <Text className="text-2xl font-bold text-white mb-1">{value}</Text>
      <Text className="text-sm text-gray-400 text-center">{label}</Text>
    </Pressable>
  );

  const SettingRow = ({ icon, title, subtitle, onPress }: {
    icon: keyof typeof Ionicons.glyphMap;
    title: string;
    subtitle?: string;
    onPress?: () => void;
  }) => (
    <Pressable 
      onPress={onPress}
      className="flex-row items-center justify-between p-4 rounded-xl active:bg-gray-800"
    >
      <View className="flex-row items-center space-x-3">
        <Ionicons name={icon} size={20} color="#9CA3AF" />
        <Text className="text-white text-base">{title}</Text>
      </View>
      <View className="flex-row items-center space-x-2">
        {subtitle && (
          <Text className="text-gray-400 text-sm">{subtitle}</Text>
        )}
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
      </View>
    </Pressable>
  );

  return (
    <View className="flex-1 bg-gray-900" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 border-b border-gray-700">
        <Pressable 
          onPress={onBack}
          className="w-10 h-10 items-center justify-center rounded-lg active:bg-gray-800"
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </Pressable>
        <Text className="text-xl font-semibold text-white">Profile</Text>
        <Pressable className="w-10 h-10 items-center justify-center rounded-lg active:bg-gray-800">
          <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        <View className="items-center py-8 px-4">
          <View className="w-24 h-24 rounded-full bg-gray-700 items-center justify-center mb-4 overflow-hidden">
            <Ionicons name="person" size={40} color="#9CA3AF" />
          </View>
          <Text className="text-2xl font-bold text-white mb-1">Alex Rivera</Text>
          <Text className="text-gray-400 text-base">@alexlyrics</Text>
          <Text className="text-gray-400 text-center mt-2 max-w-64">
            Singer-songwriter crafting stories through melody and verse
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="px-4 mb-8">
          <View className="flex-row space-x-3">
            <StatCard value={totalProjects} label="Projects" />
            <StatCard value={totalSections} label="Sections" />
            <StatCard value={totalRecordings} label="Takes" />
            <StatCard value={starredSections} label="Starred" />
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-4 mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-xl font-semibold text-white">Recent Activity</Text>
            <Pressable>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          </View>
          
          <View className="space-y-3">
            {recentProjects.map((project, index) => {
              const timeAgo = Math.floor((Date.now() - new Date(project.createdAt).getTime()) / (1000 * 60 * 60));
              const icon = index === 0 ? 'musical-notes' : index === 1 ? 'star' : 'mic';
              const iconBg = index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-yellow-500' : 'bg-red-500';
              
              return (
                <View key={project.id} className="bg-gray-800 rounded-xl p-4 flex-row items-center space-x-3">
                  <View className={`w-10 h-10 ${iconBg} rounded-lg items-center justify-center`}>
                    <Ionicons name={icon} size={20} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium">"{project.name}"</Text>
                    <Text className="text-gray-400 text-sm">
                      {timeAgo < 1 ? 'Just now' : `${timeAgo}h ago`}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Settings */}
        <View className="px-4 mb-8">
          <Text className="text-xl font-semibold text-white mb-4">Settings</Text>
          
          <View className="space-y-1">
            <SettingRow 
              icon="color-palette-outline" 
              title="Theme & Display" 
              onPress={() => {}} 
            />
            <SettingRow 
              icon="volume-high-outline" 
              title="Audio Preferences" 
              onPress={() => {}} 
            />
            <SettingRow 
              icon="chatbubbles-outline" 
              title="AI Assistant" 
              subtitle="GPT-4"
              onPress={() => {}} 
            />
            <SettingRow 
              icon="cloud-upload-outline" 
              title="Export & Backup" 
              onPress={() => {}} 
            />
            <SettingRow 
              icon="server-outline" 
              title="Storage Management" 
              subtitle="4.2 GB"
              onPress={() => {}} 
            />
          </View>
        </View>

        {/* Account Actions */}
        <View className="px-4 mb-8">
          <Text className="text-xl font-semibold text-white mb-4">Account</Text>
          
          <View className="space-y-1">
            <SettingRow 
              icon="information-circle-outline" 
              title="About LYRIQ" 
              subtitle="v2.1.0"
              onPress={() => {}} 
            />
            <SettingRow 
              icon="mail-outline" 
              title="Support" 
              onPress={() => {}} 
            />
            <SettingRow 
              icon="shield-outline" 
              title="Privacy Settings" 
              onPress={() => {}} 
            />
            <SettingRow 
              icon="log-out-outline" 
              title="Sign Out" 
              onPress={() => {}} 
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}