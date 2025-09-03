import React, { useState } from "react";
import { View, TextInput, FlatList, Text, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import tokens from "../../tokens.json";

type Msg = { id: string; role: "user" | "ai"; text: string };

interface ChatEditorScreenProps {
  onBack: () => void;
}

export default function ChatEditorScreen({ onBack }: ChatEditorScreenProps) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");

  const send = () => {
    if (!draft.trim()) return;
    setMessages((m) => [...m, { id: Date.now().toString(), role: "user", text: draft.trim() }]);
    setDraft("");
  };

  return (
    <KeyboardAvoidingView
      style={{ 
        flex: 1, 
        backgroundColor: tokens.global.colors["background-dark"],
        paddingTop: insets.top 
      }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-800">
        <Pressable
          onPress={onBack}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
        >
          <Ionicons name="chevron-back" size={20} color="#9CA3AF" />
        </Pressable>
        
        <Text className="text-2xl font-light text-white">Lyriq</Text>
        
        <View className="w-10 h-10" />
      </View>

      {/* Messages or Empty State */}
      {messages.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text 
            className="text-center mb-8"
            style={{ 
              fontSize: 48, 
              fontWeight: '300',
              color: '#9CA3AF',
              letterSpacing: -1
            }}
          >
            Lyriq
          </Text>
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: tokens.global.spacing.lg }}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <View
              style={{
                alignSelf: item.role === "user" ? "flex-end" : "flex-start",
                backgroundColor:
                  item.role === "user"
                    ? tokens.global.colors.primary
                    : tokens.global.colors.surface,
                borderRadius: tokens.global.radius.card,
                padding: tokens.global.spacing.md,
                marginBottom: tokens.global.spacing.sm,
                maxWidth: "80%",
              }}
            >
              <Text
                style={{
                  color: item.role === "user" ? "#FFFFFF" : tokens.global.colors["text-primary"],
                  fontSize: tokens.global.typography.body["font-size"],
                }}
              >
                {item.text}
              </Text>
            </View>
          )}
        />
      )}

      {/* Input Area */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: tokens.global.spacing.sm,
          padding: tokens.global.spacing.md,
          borderTopWidth: 1,
          borderTopColor: tokens.global.colors.border,
          backgroundColor: tokens.global.colors["background-dark"],
        }}
      >
        <Pressable className="p-3">
          <Ionicons name="add" size={20} color="#9CA3AF" />
        </Pressable>
        
        <Pressable className="p-3">
          <Ionicons name="search" size={20} color="#9CA3AF" />
        </Pressable>
        
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask anything..."
          placeholderTextColor={tokens.global.colors["text-muted"]}
          style={{
            flex: 1,
            backgroundColor: "#1E1F22",
            color: "#fff",
            padding: tokens.global.spacing.md,
            borderRadius: tokens.global.radius.button,
            fontSize: 16,
          }}
        />
        
        <Pressable className="p-3">
          <Ionicons name="mic" size={20} color="#9CA3AF" />
        </Pressable>
        
        <Pressable
          onPress={send}
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{
            backgroundColor: draft.trim() ? tokens.global.colors.primary : "#2A2B2F",
          }}
        >
          <Ionicons name="arrow-up" size={20} color={draft.trim() ? "#fff" : "#6B7280"} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}