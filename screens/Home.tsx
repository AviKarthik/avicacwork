import { Button, Text } from '@react-navigation/elements';
import { StyleSheet, View } from 'react-native';

// A simple home screen that offers navigation to the Profile and Settings screens.
export function Home() {
  return (
    <View style={styles.container}>
      <Text>Home Screen</Text>
      <Text>Open up 'src/App.tsx' to start working on your app!</Text>
      <Button screen="Profile" params={{ user: 'jane' }}>
        Go to Profile
      </Button>
      <Button screen="Settings" params={{}}>Go to Settings</Button>
    </View>
  );
}

// styles to center the content of the screen.
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
});
