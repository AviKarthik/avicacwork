import { Text } from '@react-navigation/elements';
import { StyleSheet, View } from 'react-native';

// Settings screen that displays "settings screen"
export function Settings() {
  return (
    <View style={styles.container}>
      <Text>Settings Screen</Text>
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
});
