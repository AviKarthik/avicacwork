import * as React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from '../../screens/HomeScreen';
import ProfileScreen from '../../screens/ProfileScreen';
import WaterLogScreen from '../../screens/WaterLogScreen';
import DietLogScreen from '../../screens/DietLogScreen';
import ExerciseLogScreen from '../../screens/ExerciseLogScreen';
import SleepLogScreen from '../../screens/SleepLogScreen';

// Define the types for the tab navigator's parameters.
export type TabsParamList = {
  Home: undefined;
  Water: undefined;
  Diet: undefined;
  Exercise: undefined;
  Sleep: undefined;
  Profile: undefined;
};

// Create the bottom tab navigator.
const Tab = createBottomTabNavigator<TabsParamList>();

// The bottom tab navigator that contains the Home and Profile screens.
export default function TabsNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0f2027',
          borderTopColor: 'rgba(0, 234, 255, 0.2)',
          paddingVertical: 8,
          height: 72,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#9AA0A6',
        tabBarLabelStyle: { fontSize: 13, letterSpacing: 1.2 },
        headerStyle: { backgroundColor: '#0f2027' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { letterSpacing: 2 },
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Water"
        component={WaterLogScreen}
        options={{ title: 'Water Log' }}
      />
      <Tab.Screen
        name="Diet"
        component={DietLogScreen}
        options={{ title: 'Diet Log' }}
      />
      <Tab.Screen
        name="Exercise"
        component={ExerciseLogScreen}
        options={{ title: 'Exercise Log' }}
      />
      <Tab.Screen
        name="Sleep"
        component={SleepLogScreen}
        options={{ title: 'Sleep Log' }}
      />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
