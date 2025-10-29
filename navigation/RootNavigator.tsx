import * as React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DrawerNavigator from './drawer/DrawerNavigator';
import DetailsScreen from '../screens/DetailsScreen';

// Define the types for the root stack navigator's parameters.
export type RootStackParamList = {
  Main: undefined;         // the drawer lives here
  Details: { id?: string } | undefined; // example stack-only screen
};

// Create the native stack navigator.
const Stack = createNativeStackNavigator<RootStackParamList>();

// The root navigator that contains the drawer and stack screens.
export default function RootNavigator() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Main"
        component={DrawerNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen name="Details" component={DetailsScreen} />
    </Stack.Navigator>
  );
}