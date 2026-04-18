// Highlander Events — Shared Animation Utilities
// Uses react-native-reanimated v4 for hardware-accelerated UI-thread animations

import { useEffect, useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
  withRepeat,
  interpolate,
  Extrapolation,
  Easing,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { AnimTiming } from './Colors';

// ─── Staggered Entrance ──────────────────────────────────────────────────────
// Fade + slide up for list items with stagger delay based on index
export function useStaggeredEntrance(index: number, options?: {
  delay?: number;
  translateY?: number;
  duration?: number;
}) {
  const { delay = AnimTiming.stagger, translateY = 30, duration = AnimTiming.entrance } = options || {};
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      index * delay,
      withTiming(1, { duration, easing: Easing.bezier(0.33, 1, 0.68, 1) }) // cubic-out
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [translateY, 0], Extrapolation.CLAMP) }],
  }));

  return animatedStyle;
}

// ─── Fade In ─────────────────────────────────────────────────────────────────
// Simple entrance fade + translate for sections
export function useFadeIn(options?: {
  delay?: number;
  translateY?: number;
  duration?: number;
  autoStart?: boolean;
}) {
  const { delay = 0, translateY = 20, duration = AnimTiming.normal, autoStart = true } = options || {};
  const progress = useSharedValue(0);

  const start = useCallback(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration, easing: Easing.bezier(0.33, 1, 0.68, 1) }) // cubic-out
    );
  }, []);

  useEffect(() => {
    if (autoStart) start();
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: interpolate(progress.value, [0, 1], [translateY, 0], Extrapolation.CLAMP) }],
  }));

  return { animatedStyle, start, progress };
}

// ─── Spring Press ────────────────────────────────────────────────────────────
// Scale-down on press with spring bounce back
export function useSpringPress(options?: { scaleTo?: number }) {
  const { scaleTo = 0.96 } = options || {};
  const scale = useSharedValue(1);

  const onPressIn = useCallback(() => {
    scale.value = withSpring(scaleTo, AnimTiming.springPress);
  }, []);

  const onPressOut = useCallback(() => {
    scale.value = withSpring(1, AnimTiming.springBouncy);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, onPressIn, onPressOut };
}

// ─── Pulse ───────────────────────────────────────────────────────────────────
// Breathing glow effect for live indicators
export function usePulse(options?: { minOpacity?: number; maxOpacity?: number; duration?: number }) {
  const { minOpacity = 0.3, maxOpacity = 1, duration = 1200 } = options || {};
  const pulse = useSharedValue(minOpacity);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(maxOpacity, { duration: duration / 2, easing: Easing.bezier(0.445, 0.05, 0.55, 0.95) }), // sine-in-out
        withTiming(minOpacity, { duration: duration / 2, easing: Easing.bezier(0.445, 0.05, 0.55, 0.95) }) // sine-in-out
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return { animatedStyle, pulse };
}

// ─── Glow Pulse ──────────────────────────────────────────────────────────────
// Scale + opacity pulse for glow rings
export function useGlowPulse(options?: { minScale?: number; maxScale?: number; duration?: number }) {
  const { minScale = 0.9, maxScale = 1.1, duration = 2000 } = options || {};
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withSequence(
        withTiming(1, { duration: duration / 2, easing: Easing.bezier(0.445, 0.05, 0.55, 0.95) }),
        withTiming(0, { duration: duration / 2, easing: Easing.bezier(0.445, 0.05, 0.55, 0.95) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [minScale, maxScale]) }],
  }));

  return animatedStyle;
}

// ─── Shimmer ─────────────────────────────────────────────────────────────────
// Premium loading shimmer with sweeping effect
export function useShimmer(options?: { duration?: number }) {
  const { duration = 1500 } = options || {};
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration, easing: Easing.bezier(0.42, 0, 0.58, 1) }), // ease-in-out
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.15, 0.4, 0.15]),
  }));

  return { animatedStyle, shimmer };
}

// ─── Count Up ────────────────────────────────────────────────────────────────
// Animated number count-up for stats
export function useCountUp(target: number, options?: { duration?: number; delay?: number }) {
  const { duration = 800, delay = 0 } = options || {};
  const current = useSharedValue(0);

  useEffect(() => {
    current.value = withDelay(
      delay,
      withTiming(target, { duration, easing: Easing.bezier(0.33, 1, 0.68, 1) })
    );
  }, [target]);

  return current;
}

// ─── Floating / Breathing ────────────────────────────────────────────────────
// Slow oscillating translateY for floating elements
export function useFloating(options?: { amplitude?: number; duration?: number }) {
  const { amplitude = 8, duration = 3000 } = options || {};
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(
      withSequence(
        withTiming(amplitude, { duration: duration / 2, easing: Easing.bezier(0.445, 0.05, 0.55, 0.95) }),
        withTiming(-amplitude, { duration: duration / 2, easing: Easing.bezier(0.445, 0.05, 0.55, 0.95) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return animatedStyle;
}

// ─── Animated Tab Indicator ──────────────────────────────────────────────────
// Smooth animated position for tab indicators
export function useTabIndicator(activeIndex: number, tabWidth: number) {
  const translateX = useSharedValue(activeIndex * tabWidth);

  useEffect(() => {
    translateX.value = withSpring(activeIndex * tabWidth, AnimTiming.springSnappy);
  }, [activeIndex, tabWidth]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return animatedStyle;
}

// ─── Heart Burst ─────────────────────────────────────────────────────────────
// Explosive scale animation for RSVP/like buttons
export function useHeartBurst() {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const burst = useCallback(() => {
    scale.value = withSequence(
      withSpring(1.4, { damping: 4, stiffness: 400 }),
      withSpring(1, { damping: 8, stiffness: 200 })
    );
    rotation.value = withSequence(
      withTiming(-10, { duration: 80 }),
      withTiming(10, { duration: 80 }),
      withTiming(-5, { duration: 60 }),
      withTiming(0, { duration: 60 })
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  return { animatedStyle, burst };
}

// ─── Slide In ────────────────────────────────────────────────────────────────
// Slide from side for cards and panels
export function useSlideIn(direction: 'left' | 'right' | 'up' | 'down' = 'up', options?: {
  delay?: number;
  distance?: number;
  duration?: number;
}) {
  const { delay = 0, distance = 50, duration = AnimTiming.normal } = options || {};
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withSpring(1, AnimTiming.springGentle)
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const offset = interpolate(progress.value, [0, 1], [distance, 0], Extrapolation.CLAMP);
    const isHorizontal = direction === 'left' || direction === 'right';
    const sign = direction === 'right' || direction === 'down' ? 1 : -1;

    return {
      opacity: progress.value,
      transform: isHorizontal
        ? [{ translateX: offset * sign }]
        : [{ translateY: offset * (direction === 'down' ? 1 : 1) }],
    };
  });

  return animatedStyle;
}

// ─── Scale In ────────────────────────────────────────────────────────────────
// Scale from 0 to 1 with bounce for avatars, badges
export function useScaleIn(options?: { delay?: number; from?: number }) {
  const { delay = 0, from = 0.5 } = options || {};
  const scale = useSharedValue(from);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, AnimTiming.springBouncy));
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return animatedStyle;
}

// ─── Gradient Shift ──────────────────────────────────────────────────────────
// Animated gradient position for breathing background effects
export function useGradientShift(options?: { duration?: number }) {
  const { duration = 4000 } = options || {};
  const shift = useSharedValue(0);

  useEffect(() => {
    shift.value = withRepeat(
      withSequence(
        withTiming(1, { duration, easing: Easing.bezier(0.445, 0.05, 0.55, 0.95) }),
        withTiming(0, { duration, easing: Easing.bezier(0.445, 0.05, 0.55, 0.95) })
      ),
      -1,
      false
    );
  }, []);

  return shift;
}

// ─── Animated Arrow (for swipe hints) ────────────────────────────────────────
export function useBouncingArrow(options?: { amplitude?: number; duration?: number }) {
  const { amplitude = 10, duration = 1200 } = options || {};
  const offset = useSharedValue(0);

  useEffect(() => {
    offset.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration: duration / 2, easing: Easing.bezier(0.445, 0.05, 0.55, 0.95) }),
        withTiming(0, { duration: duration / 2, easing: Easing.bezier(0.445, 0.05, 0.55, 0.95) })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.value }],
  }));

  return animatedStyle;
}
