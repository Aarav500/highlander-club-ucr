import React, { useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, TouchableOpacityProps, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// ─── Constants ──────────────────────────────────────────────────────────────
const SPRING_CONFIG = {
  stiffness: 400,
  damping: 20,
  mass: 1,
};

// ─── Bounceable ─────────────────────────────────────────────────────────────
interface BounceableProps extends TouchableOpacityProps {
  scaleTo?: number;
  haptic?: Haptics.ImpactFeedbackStyle;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Bounceable({ 
  children, 
  scaleTo = 0.95, 
  haptic = Haptics.ImpactFeedbackStyle.Light,
  onPressIn,
  onPressOut,
  onPress,
  style,
  ...props 
}: BounceableProps) {
  const scale = useSharedValue(1);

  const handlePressIn = (e: any) => {
    scale.value = withSpring(scaleTo, SPRING_CONFIG);
    if (onPressIn) onPressIn(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, SPRING_CONFIG);
    if (onPressOut) onPressOut(e);
  };

  const handlePress = (e: any) => {
    if (haptic) Haptics.impactAsync(haptic);
    if (onPress) onPress(e);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchable
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </AnimatedTouchable>
  );
}

// ─── GlassCard ──────────────────────────────────────────────────────────────
interface GlassCardProps {
  children: React.ReactNode;
  style?: any;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  fallbackColor?: string;
  hasBorder?: boolean;
}

export function GlassCard({ 
  children, 
  style, 
  intensity = 40, 
  tint = 'dark',
  fallbackColor = 'rgba(6, 16, 34, 0.88)',
  hasBorder = true
}: GlassCardProps) {
  return (
    <View style={[styles.glassCardContainer, hasBorder && styles.glassBorder, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: fallbackColor }]} />
      )}
      
      {/* Edge Lighting */}
      {hasBorder && (
        <View style={[StyleSheet.absoluteFill, styles.edgeLighting]} pointerEvents="none" />
      )}
      
      {children}
    </View>
  );
}

// ─── AmbientBackground ──────────────────────────────────────────────────────
export function AmbientBackground() {
  const pulse1 = useSharedValue(0.2);
  const pulse2 = useSharedValue(0.1);

  React.useEffect(() => {
    pulse1.value = withRepeat(
      withTiming(0.6, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    pulse2.value = withRepeat(
      withTiming(0.4, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({ opacity: pulse1.value }));
  const animatedStyle2 = useAnimatedStyle(() => ({ opacity: pulse2.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Deep Navy Base */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#020810' }]} />
      
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle1]}>
        <LinearGradient
          colors={['rgba(41,121,255,0.12)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle2]}>
        <LinearGradient
          colors={['transparent', 'rgba(255,179,0,0.08)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      
      {/* Noise overlay to prevent banding */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glassCardContainer: {
    overflow: 'hidden',
    borderRadius: 24,
  },
  glassBorder: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  edgeLighting: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    borderRadius: 24,
  }
});
