import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';

// Import screens (we'll create these next)
import HomeStackNavigator from './HomeStackNavigator';
import PlansScreen from '../screens/PlansScreen';
import ActivitiesStackNavigator from './ActivitiesStackNavigator';
import ChatsStackNavigator from './ChatsStackNavigator';
import ProfileStackNavigator from './ProfileStackNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10b981', // success green from design system
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          height: 60,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Plans"
        component={PlansScreen}
        options={{
          tabBarLabel: "Today's Plans",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="plans" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Activities"
        component={ActivitiesStackNavigator}
        options={{
          tabBarLabel: 'Activities',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Chats"
        component={ChatsStackNavigator}
        options={{
          tabBarLabel: 'Chats',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="message" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="user" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Simple icon component (we'll improve this later with a proper icon library)
function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const icons: { [key: string]: string } = {
    home: '🏠',
    plans: '📍',
    calendar: '📅',
    message: '💬',
    user: '👤',
  };

  return (
    <Text style={{ fontSize: size, color }}>
      {icons[name]}
    </Text>
  );
}
