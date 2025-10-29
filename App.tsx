import 'react-native-gesture-handler'; // must be first
import * as React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import { AuthProvider, useAuth } from './context/AuthContext';
import { RootNavigator } from './navigation';
import LoginScreen from './screens/LoginScreen';

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0f2027', // screen backgrounds
    card: '#0f2027',       // headers, tab bars, drawer
    text: '#FFFFFF',
    border: '#0f2027',
    primary: '#FFFFFF',
  },
};

type AppStackParamList = {
  Login: undefined;
  Main: undefined;
};

const Stack = createNativeStackNavigator<AppStackParamList>();

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f2027' }}>
        <ActivityIndicator size="large" color="#00eaff" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {user ? (
        <Stack.Screen name="Main" component={RootNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer theme={MyTheme}>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
