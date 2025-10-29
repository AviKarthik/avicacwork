import { Text } from '@react-navigation/elements';
import { StaticScreenProps } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';

// Define the props type for the Profile screen.
type Props = StaticScreenProps<{
  user: string;
}>;

// Profile screen that displays the username passed via route parameters.
export function Profile({ route }: Props) {
  return (
    <View style={styles.container}>
      <Text>{route.params.user}'s Profile</Text>
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
