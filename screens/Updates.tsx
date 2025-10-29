import { Text } from '@react-navigation/elements';
import { StyleSheet, View } from 'react-native';

// Updates screen that displays "Updates Screen"
export function Updates() {
  return (
    <View style={styles.container}>
      <Text>Updates Screen</Text>
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
