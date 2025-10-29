import * as React from 'react';
import {
  ActivityIndicator,
  Alert,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

type GoalKey = 'general' | 'lose_weight' | 'build_muscle' | 'sleep_better' | 'hydrate_more';

const GOAL_OPTIONS: { key: GoalKey; label: string; helper: string }[] = [
  { key: 'lose_weight', label: 'Lose Weight', helper: 'Dial in nutrition for fat loss.' },
  { key: 'build_muscle', label: 'Build Muscle', helper: 'Focus on training and fueling.' },
  { key: 'sleep_better', label: 'Improve Sleep', helper: 'Prioritise consistent rest.' },
  { key: 'hydrate_more', label: 'Stay Hydrated', helper: 'Keep fluids topped up daily.' },
  { key: 'general', label: 'Balanced Health', helper: 'Keep everything on an even keel.' },
];

export default function SettingsScreen() {
  const { user, signOutAsync } = useAuth();
  const [selectedGoal, setSelectedGoal] = React.useState<GoalKey>('general');
  const [loadingGoal, setLoadingGoal] = React.useState(true);
  const [savingGoal, setSavingGoal] = React.useState(false);

  React.useEffect(() => {
    if (!user) {
      setSelectedGoal('general');
      setLoadingGoal(false);
      return undefined;
    }

    const userRef = doc(db, 'users', user.uid);
    setLoadingGoal(true);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        const data = snapshot.data() as { preferences?: { primaryGoal?: GoalKey } } | undefined;
        const nextGoal = data?.preferences?.primaryGoal ?? 'general';
        setSelectedGoal(nextGoal as GoalKey);
        setLoadingGoal(false);
      },
      (error) => {
        console.error('Failed to load goal preferences', error);
        setLoadingGoal(false);
      }
    );

    return unsubscribe;
  }, [user]);

  const handleSelectGoal = React.useCallback(
    async (goal: GoalKey) => {
      if (!user || goal === selectedGoal) {
        return;
      }
      setSavingGoal(true);
      try {
        await setDoc(
          doc(db, 'users', user.uid),
          {
            preferences: {
              primaryGoal: goal,
            },
          },
          { merge: true }
        );
        setSelectedGoal(goal);
      } catch (error) {
        console.error('Failed to update goal preference', error);
        Alert.alert('Update failed', 'We could not save your goal. Please try again.');
      } finally {
        setSavingGoal(false);
      }
    },
    [user, selectedGoal]
  );

  return (
    <LinearGradient
      colors={["#181c2f", "#232a45", "#0f2027", "#2c5364"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Text style={styles.heading}>Settings</Text>
        <Text style={styles.description}>
          Manage your preferences and account options here.
        </Text>
        <View style={styles.goalSection}>
          <Text style={styles.sectionTitle}>Your Primary Goal</Text>
          {loadingGoal ? (
            <ActivityIndicator color="#00eaff" />
          ) : (
            <View style={styles.goalGrid}>
              {GOAL_OPTIONS.map((option) => {
                const isActive = option.key === selectedGoal;
                return (
                  <TouchableOpacity
                    key={option.key}
                    activeOpacity={0.85}
                    style={[styles.goalChip, isActive && styles.goalChipActive]}
                    onPress={() => handleSelectGoal(option.key)}
                    disabled={savingGoal}
                  >
                    <Text style={[styles.goalChipLabel, isActive && styles.goalChipLabelActive]}>
                      {option.label}
                    </Text>
                    <Text style={[styles.goalChipHelper, isActive && styles.goalChipHelperActive]}>
                      {option.helper}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
          {savingGoal && <Text style={styles.helperText}>Saving your preference…</Text>}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={signOutAsync}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00eaff',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  description: {
    marginTop: 16,
    marginBottom: 32,
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  goalSection: {
    width: '100%',
    marginBottom: 40,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00eaff',
    letterSpacing: 1,
    textAlign: 'center',
  },
  goalGrid: {
    width: '100%',
    gap: 12,
  },
  goalChip: {
    borderWidth: 1,
    borderColor: 'rgba(0, 234, 255, 0.3)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(12, 18, 32, 0.65)',
    gap: 6,
  },
  goalChipActive: {
    borderColor: '#00eaff',
    backgroundColor: 'rgba(0, 234, 255, 0.18)',
  },
  goalChipLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  goalChipLabelActive: {
    color: '#00eaff',
  },
  goalChipHelper: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
  },
  goalChipHelperActive: {
    color: 'rgba(0, 234, 255, 0.9)',
  },
  helperText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    textAlign: 'center',
  },
  logoutButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#00eaff',
    backgroundColor: 'rgba(0, 234, 255, 0.15)',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});