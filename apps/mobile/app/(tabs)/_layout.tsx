import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import { Colors, Fonts, Gradients, Glass } from '../../constants/Colors';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
} from 'react-native-reanimated';

function TabBarBackground() {
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        tint="dark"
        intensity={Glass.blurIntensityStrong}
        style={StyleSheet.absoluteFill}
      />
    );
  }
  // Android + Web fallback: gradient glass effect
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={Gradients.tabBarGlass}
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Glass.backgroundStrong }]} />
    </View>
  );
}

// Animated tab icon with Reanimated bouncy physics
function AnimatedTabIcon({
  name,
  focusedName,
  color,
  focused,
}: {
  name: string;
  focusedName: string;
  color: string;
  focused: boolean;
}) {
  // Spring config for the icon bounce
  const springConfig = { damping: 15, stiffness: 350 };
  
  const iconScale = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(focused ? 1.15 : 1, springConfig) }]
    };
  }, [focused]);

  const dotStyle = useAnimatedStyle(() => {
    return {
      opacity: withSpring(focused ? 1 : 0, springConfig),
      transform: [{ translateY: withSpring(focused ? 0 : 5, springConfig) }]
    };
  }, [focused]);

  return (
    <View style={styles.iconContainer}>
      <Animated.View style={iconScale}>
        <Ionicons
          name={(focused ? focusedName : name) as any}
          size={24}
          color={color}
        />
      </Animated.View>
      {/* Animated active dot indicator */}
      <Animated.View style={[styles.activeDot, { backgroundColor: color }, dotStyle]} />
    </View>
  );
}

export default function TabLayout() {
  const theme = Colors.dark;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarBackground: () => <TabBarBackground />,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 20 : 12,
          left: 16,
          right: 16,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(2,8,16,0.96)',
          borderTopWidth: 0,
          borderRadius: 24,
          height: Platform.OS === 'ios' ? 72 : 64,
          paddingBottom: Platform.OS === 'ios' ? 12 : 8,
          paddingTop: 8,
          elevation: 0,
          borderWidth: 1,
          borderColor: Glass.border,
          overflow: 'hidden',
          // Glass shadow
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          letterSpacing: 0.3,
          fontFamily: Fonts.headingMed,
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="flame-outline" focusedName="flame" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Calendar',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="calendar-outline" focusedName="calendar" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="map-outline" focusedName="map" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="compass-outline" focusedName="compass" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon name="person-circle-outline" focusedName="person-circle" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 36,
    position: 'relative',
  },

  activeDot: {
    position: 'absolute',
    bottom: -8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
