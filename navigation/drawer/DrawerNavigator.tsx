import * as React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import TabsNavigator from '../tabs/TabsNavigator';
import SettingsScreen from '../../screens/SettingsScreen';

// Define the types for the drawer navigator's parameters.
export type DrawerParamList = {
  Tabs: undefined;     // the bottom tabs live here
  Settings: undefined;
};

// Create the drawer navigator.
const Drawer = createDrawerNavigator<DrawerParamList>();

// The drawer navigator that contains the bottom tabs and a settings screen.
export default function DrawerNavigator() {
  return (
    <Drawer.Navigator initialRouteName="Tabs">
      <Drawer.Screen
        name="Tabs"
        component={TabsNavigator}
        options={{ title: 'Main' }}
      />
      <Drawer.Screen name="Settings" component={SettingsScreen} />
    </Drawer.Navigator>
  );
}