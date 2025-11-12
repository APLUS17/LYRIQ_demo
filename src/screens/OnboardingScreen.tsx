import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLyricStore } from "../state/lyricStore";

export default function OnboardingScreen() {
  // Onboarding copy — force line breaks to match your PNGs
  const slides = useMemo(
    () => [
      { id: 0, title: "WRITE. REFINE.\nRECORD." },
      { id: 1, title: "FIND YOUR FLOW." },
      { id: 2, title: "SONGS START\nHERE." },
    ],
    []
  );

  const [index, setIndex] = useState(0);
  const completeOnboarding = useLyricStore((state) => state.completeOnboarding);

  // Fade animation
  const fade = useRef(new Animated.Value(0)).current;
  const animateIn = () => {
    fade.setValue(0);
    Animated.timing(fade, {
      toValue: 1,
      duration: 420,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    // Animate on first render
    animateIn();
  }, []);

  // Trigger fade on index change
  useEffect(() => {
    animateIn();
  }, [index]);

  const onContinue = () => {
    if (index < slides.length - 1) {
      setIndex((i) => i + 1);
    } else {
      // Mark onboarding as complete
      completeOnboarding();
    }
  };

  const onSkip = () => {
    // Go to last slide, then user can tap continue
    setIndex(slides.length - 1);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />

      {/* Top bar with optional SKIP */}
      <View style={styles.topBar}>
        <View style={{ width: 48 }} />
        <View style={{ flex: 1 }} />
        {index < slides.length - 1 ? (
          <TouchableOpacity onPress={onSkip} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.skip}>SKIP</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>

      {/* Headline */}
      <Animated.View
        style={[
          styles.headlineWrap,
          {
            opacity: fade,
            transform: [
              {
                translateY: fade.interpolate({
                  inputRange: [0, 1],
                  outputRange: [10, 0], // tiny ease-up while fading
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.headline}>{slides[index].title}</Text>
      </Animated.View>

      {/* Bottom area: dots + button */}
      <View style={styles.bottom}>
        <View style={styles.dotsRow}>
          {slides.map((s, i) => {
            const active = i === index;
            return (
              <View
                key={s.id}
                style={[styles.dot, active ? styles.dotActive : styles.dotInactive]}
              />
            );
          })}
        </View>

        <TouchableOpacity style={styles.cta} activeOpacity={0.9} onPress={onContinue}>
          <Text style={styles.ctaText}>CONTINUE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const PURPLE = "#5B5CE2"; // tuned to the PNG hue
const BLACK = "#000000";
const WHITE = "#FFFFFF";
const GREY = "#2B2B2B";

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BLACK,
  },
  topBar: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: 8,
  },
  skip: {
    color: WHITE,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  headlineWrap: {
    flex: 1,
    justifyContent: "flex-start",
    paddingHorizontal: 24,
    paddingTop: 6, // keeps it near the top like your mock
  },
  headline: {
    color: WHITE,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: "900",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    textAlign: "left",
  },
  bottom: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  dotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  dotInactive: {
    width: 6,
    backgroundColor: GREY,
  },
  dotActive: {
    // elongated active indicator to match your PNG
    width: 16,
    backgroundColor: PURPLE,
  },
  cta: {
    backgroundColor: PURPLE,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    color: WHITE,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
});
