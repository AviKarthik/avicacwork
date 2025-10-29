import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Picker } from '@react-native-picker/picker';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'intense';
type NutritionFocus = 'weight_loss' | 'maintenance' | 'muscle_gain';
type SleepPriority = 'routine' | 'recovery' | 'flexible';
type HydrationFocus = 'baseline' | 'performance' | 'detox';

type ProfilePreferences = {
  activityLevel: ActivityLevel;
  nutritionFocus: NutritionFocus;
  sleepPriority: SleepPriority;
  hydrationFocus: HydrationFocus;
};

const DEFAULT_PREFS: ProfilePreferences = {
  activityLevel: 'light',
  nutritionFocus: 'maintenance',
  sleepPriority: 'routine',
  hydrationFocus: 'baseline',
};

const DROPDOWNS: Array<{
  key: keyof ProfilePreferences;
  label: string;
  options: { value: ProfilePreferences[keyof ProfilePreferences]; label: string; helper: string }[];
}> = [
  {
    key: 'activityLevel',
    label: 'Activity Level',
    options: [
      { value: 'sedentary', label: 'Sedentary', helper: 'Desk-bound or minimal daily movement.' },
      { value: 'light', label: 'Lightly Active', helper: 'Walking and casual movement most days.' },
      { value: 'moderate', label: 'Moderately Active', helper: 'Structured workouts 3-4 times a week.' },
      { value: 'intense', label: 'Highly Active', helper: 'Daily training or demanding physical job.' },
    ],
  },
  {
    key: 'nutritionFocus',
    label: 'Nutrition Focus',
    options: [
      { value: 'weight_loss', label: 'Weight Loss', helper: 'Lean out gradually with steady deficit.' },
      { value: 'maintenance', label: 'Maintenance', helper: 'Keep energy stable and habits dialled in.' },
      { value: 'muscle_gain', label: 'Muscle Gain', helper: 'Fuel strength and recovery intentionally.' },
    ],
  },
  {
    key: 'sleepPriority',
    label: 'Sleep Priority',
    options: [
      { value: 'routine', label: 'Consistent Routine', helper: 'Stick to predictable bed and wake times.' },
      { value: 'recovery', label: 'Deep Recovery', helper: 'Maximise quality to recharge fully.' },
      { value: 'flexible', label: 'Flexible Schedule', helper: 'Balance rest with variable days.' },
    ],
  },
  {
    key: 'hydrationFocus',
    label: 'Hydration Focus',
    options: [
      { value: 'baseline', label: 'Daily Baseline', helper: 'Meet everyday hydration needs.' },
      { value: 'performance', label: 'Performance Boost', helper: 'Stay topped up for demanding workouts.' },
      { value: 'detox', label: 'Detox Support', helper: 'Keep fluids high for metabolic reset.' },
    ],
  },
];

export default function ProfileScreen() {
  const { user } = useAuth();
  const [preferences, setPreferences] = React.useState<ProfilePreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = React.useState(true);
  const [savingKey, setSavingKey] = React.useState<keyof ProfilePreferences | null>(null);

  React.useEffect(() => {
    if (!user) {
      setPreferences(DEFAULT_PREFS);
      setLoading(false);
      return undefined;
    }

    const ref = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.data() as { profile?: ProfilePreferences } | undefined;
        if (data?.profile) {
          setPreferences({ ...DEFAULT_PREFS, ...data.profile });
        }
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load profile preferences', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const updatePreference = React.useCallback(
    async <K extends keyof ProfilePreferences>(key: K, value: ProfilePreferences[K]) => {
      if (!user) {
        return;
      }
      setSavingKey(key);
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            profile: {
              ...preferences,
              [key]: value,
            },
          },
          { merge: true }
        );
        setPreferences((prev) => ({
          ...prev,
          [key]: value,
        }));
      } catch (error) {
        console.error('Failed to update profile preference', error);
        Alert.alert('Update failed', 'Could not save your selection. Try again.');
      } finally {
        setSavingKey(null);
      }
    },
    [user, preferences]
  );

  return (
    <LinearGradient
      colors={["#181c2f", "#232a45", "#0f2027", "#2c5364"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Profile Preferences</Text>
        <Text style={styles.subtitle}>
          Personalise your coaching so feedback hits the right targets.
        </Text>

        {loading ? (
          <ActivityIndicator color="#00eaff" style={{ marginTop: 32 }} />
        ) : (
          DROPDOWNS.map((dropdown) => {
            const currentValue = preferences[dropdown.key];
            const isSaving = savingKey === dropdown.key;
            return (
              <View key={dropdown.key} style={styles.card}>
                <Text style={styles.cardLabel}>{dropdown.label}</Text>
                <View style={styles.pickerWrapper}>
                  <Picker
                    selectedValue={currentValue}
                    onValueChange={(value) => updatePreference(dropdown.key, value as ActivityLevel)}
                    dropdownIconColor="#00eaff"
                    style={styles.picker}
                  >
                    {dropdown.options.map((option) => (
                      <Picker.Item key={option.value} label={option.label} value={option.value} />
                    ))}
                  </Picker>
                </View>
                <Text style={styles.helperText}>{dropdown.options.find((o) => o.value === currentValue)?.helper}</Text>
                {isSaving && <Text style={styles.savingText}>Saving…</Text>}
              </View>
            );
          })
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    paddingTop: 72,
    gap: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#00eaff',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: 'rgba(0, 234, 255, 0.25)',
    borderRadius: 18,
    padding: 18,
    backgroundColor: 'rgba(15, 32, 39, 0.85)',
    gap: 12,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: 'rgba(0, 234, 255, 0.35)',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(12, 18, 32, 0.9)',
  },
  picker: {
    color: '#FFFFFF',
    backgroundColor: 'transparent',
  },
  helperText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  savingText: {
    fontSize: 12,
    color: '#00eaff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});