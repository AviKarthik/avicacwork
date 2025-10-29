import { Text, Button } from '@react-navigation/elements';
import { StyleSheet, View } from 'react-native';

// A simple 404 Not Found screen with a button to navigate back to Home.
export function NotFound() {
  return (
    <View style={styles.container}>
      <Text>404</Text>
      <Button screen="HomeTabs" params={{}}>Go to Home</Button>
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
