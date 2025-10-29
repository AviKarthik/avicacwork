import * as React from 'react';
import { View, Text, Animated, TouchableOpacity, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { doc, onSnapshot } from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';

type CategoryKey = 'water' | 'diet' | 'exercise' | 'sleep';
type GoalKey = 'general' | 'lose_weight' | 'build_muscle' | 'sleep_better' | 'hydrate_more';
type FeedbackTone = 'positive' | 'encourage' | 'neutral';

type DailyValues = Record<string, string | number | boolean | null | undefined> | null;

type Feedback = {
  message: string;
  tone: FeedbackTone;
};

type CardConfig = {
  id: number;
  title: string;
  category: CategoryKey;
  collectionName: string;
};

const CARD_DATA: CardConfig[] = [
  { id: 1, title: 'Water', category: 'water', collectionName: 'waterLogs' },
  { id: 2, title: 'Diet', category: 'diet', collectionName: 'dietLogs' },
  { id: 3, title: 'Exercise', category: 'exercise', collectionName: 'exerciseLogs' },
  { id: 4, title: 'Sleep', category: 'sleep', collectionName: 'sleepLogs' },
];

const CARD_HEIGHT = 120;
const CARD_MIN_WIDTH = 200;
const CARD_MAX_WIDTH = 560;
const STACK_OFFSET = 78;
const RIGHT_MARGIN = -130;
const HORIZONTAL_STEP = 40;
const CARD_BG = 'rgba(20, 24, 40, 0.95)'; // Futuristic dark
const CARD_BORDER_GLOW = 'rgba(0,255,255,0.7)';

const INITIAL_FEEDBACK: Record<CategoryKey, Feedback> = {
  water: { message: 'Log a few days to see hydration feedback.', tone: 'neutral' },
  diet: { message: 'Log yesterday’s meals to get calorie guidance.', tone: 'neutral' },
  exercise: { message: 'Track workouts to unlock tailored coaching.', tone: 'neutral' },
  sleep: { message: 'Record sleep to get bedtime coaching.', tone: 'neutral' },
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function withDaysOffset(days: number) {
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + days);
  return base;
}

function toNumber(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getFeedbackColor(tone: FeedbackTone) {
  switch (tone) {
    case 'positive':
      return '#00eaff';
    case 'encourage':
      return '#ffd166';
    default:
      return 'rgba(255,255,255,0.85)';
  }
}

function resolveCalorieRange(goal: GoalKey) {
  if (goal === 'lose_weight') {
    return { low: 1400, high: 1800 };
  }
  if (goal === 'build_muscle') {
    return { low: 2200, high: 2800 };
  }
  return { low: 1800, high: 2200 };
}

function resolveSleepRange(goal: GoalKey) {
  if (goal === 'sleep_better') {
    return { min: 7, max: 9 };
  }
  return { min: 7, max: 9 };
}

function resolveCardioTarget(goal: GoalKey) {
  if (goal === 'build_muscle') {
    return 20;
  }
  if (goal === 'lose_weight') {
    return 30;
  }
  return 25;
}

function waterFeedback(goal: GoalKey, values: DailyValues): Feedback {
  const glasses = values ? toNumber(values.glasses) : 0;
  const target = goal === 'hydrate_more' ? 10 : 8;
  if (!glasses) {
    return {
      message: 'No water logged yesterday. Capture today’s glasses to stay hydrated.',
      tone: 'encourage',
    };
  }
  if (glasses >= target) {
    return {
      message: `Great job! You drank ${glasses} glass${glasses === 1 ? '' : 'es'} yesterday—keep it up.`,
      tone: 'positive',
    };
  }
  const focusLine = goal === 'lose_weight'
    ? 'Hydration helps fat loss—aim for '
    : goal === 'hydrate_more'
      ? 'Let’s hit '
      : 'Shoot for ';
  return {
    message: `Yesterday came in at ${glasses} glass${glasses === 1 ? '' : 'es'}. ${focusLine}${target}+ glasses today.`,
    tone: 'encourage',
  };
}

function dietFeedback(goal: GoalKey, values: DailyValues): Feedback {
  const calories = values ? toNumber(values.calories) : 0;
  const { low, high } = resolveCalorieRange(goal);
  if (!calories) {
    return {
      message: 'No calories logged yesterday. Log meals to unlock tailored nudges.',
      tone: 'encourage',
    };
  }
  const formattedCalories = calories.toLocaleString();
  if (calories >= low && calories <= high) {
    return {
      message: `Right on target at ${formattedCalories} kcal yesterday—nice discipline!`,
      tone: 'positive',
    };
  }
  if (calories > high) {
    const reason = goal === 'lose_weight'
      ? `To support weight loss aim for ${low}-${high} kcal.`
      : goal === 'build_muscle'
        ? `Lean gains love ${low}-${high} kcal of quality fuel.`
        : `A good range is roughly ${low}-${high} kcal.`;
    return {
      message: `Yesterday we ate ${formattedCalories} kcal. ${reason}`,
      tone: 'encourage',
    };
  }
  const lift = goal === 'build_muscle'
    ? `Muscle growth needs at least ${low} kcal—add a solid meal.`
    : `Let’s aim for about ${low}-${high} kcal to stay energised.`;
  return {
    message: `Calories landed at ${formattedCalories} kcal. ${lift}`,
    tone: 'encourage',
  };
}

function sleepFeedback(goal: GoalKey, values: DailyValues): Feedback {
  const hours = values ? toNumber(values.hours) : 0;
  const { min, max } = resolveSleepRange(goal);
  if (!hours) {
    return {
      message: 'No sleep logged last night. Add it tonight to see recovery tips.',
      tone: 'encourage',
    };
  }
  if (hours >= min && hours <= max) {
    return {
      message: `Last night you slept ${hours} hours—right in the sweet ${min}-${max} hour zone.`,
      tone: 'positive',
    };
  }
  if (hours < min) {
    const focus = goal === 'sleep_better'
      ? 'Let’s guard your bedtime and wind down earlier.'
      : 'Carve out a little more rest to stay sharp.';
    return {
      message: `Last night came in at ${hours} hours. Aim for ${min}-${max} to feel your best. ${focus}`,
      tone: 'encourage',
    };
  }
  return {
    message: `You logged ${hours} hours. If you feel groggy, try settling around ${min}-${max} hours.`,
    tone: 'neutral',
  };
}

function exerciseFeedback(goal: GoalKey, values: DailyValues): Feedback {
  const completed = Boolean(values?.workoutCompleted);
  const cardioMinutes = values ? toNumber(values.cardioMinutes) : 0;
  const target = resolveCardioTarget(goal);

  if (!completed && cardioMinutes <= 0) {
    const cue = goal === 'build_muscle'
      ? 'Lift or move today to build momentum.'
      : goal === 'lose_weight'
        ? 'A brisk 30 minute session will keep the scale trending down.'
        : 'Schedule today’s movement to stay consistent.';
    return {
      message: `No workout logged yesterday. ${cue}`,
      tone: 'encourage',
    };
  }

  if (completed && cardioMinutes >= target) {
    return {
      message: `Workout complete with ${cardioMinutes} min of cardio—excellent follow through!`,
      tone: 'positive',
    };
  }

  if (completed) {
    return {
      message: `Workout done! Add ${target - cardioMinutes > 0 ? target - cardioMinutes : 'a few'} more cardio minutes to smash your goal.`,
      tone: 'encourage',
    };
  }

  return {
    message: `Cardio logged at ${cardioMinutes} min. Pair it with a full workout for even better progress.`,
    tone: 'encourage',
  };
}

function buildFeedback(goal: GoalKey, entries: Record<CategoryKey, DailyValues>): Record<CategoryKey, Feedback> {
  return {
    water: waterFeedback(goal, entries.water),
    diet: dietFeedback(goal, entries.diet),
    exercise: exerciseFeedback(goal, entries.exercise),
    sleep: sleepFeedback(goal, entries.sleep),
  };
}

function useSlideAnimation(activeCard: number | null) {
  const anim = React.useRef(CARD_DATA.map(() => new Animated.Value(0))).current;

  React.useEffect(() => {
    CARD_DATA.forEach((card, idx) => {
      if (activeCard === card.id) {
        Animated.timing(anim[idx], {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(anim[idx], {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [activeCard, anim]);

  return anim;
}

function getCardStyle(
  idx: number,
  isActive: boolean,
  animValue: Animated.Value,
  baseTop: number,
  screenWidth: number
) {
  const rightOffset = RIGHT_MARGIN + idx * HORIZONTAL_STEP;
  const widthProgress = CARD_DATA.length > 1 ? idx / (CARD_DATA.length - 1) : 0;
  const maxResponsive = Math.min(CARD_MAX_WIDTH, Math.max(CARD_MIN_WIDTH + 160, screenWidth * 0.9));
  const minResponsiveCap = Math.min(maxResponsive - 120, screenWidth * 0.6);
  const minResponsive = Math.max(CARD_MIN_WIDTH, minResponsiveCap);
  const widthSpan = Math.max(0, maxResponsive - minResponsive);
  const overflowBoost = Math.max(40, Math.abs(Math.min(0, rightOffset)) * 0.6);
  const responsiveWidth = minResponsive + widthSpan * widthProgress + overflowBoost;
  const cardWidth = Math.round(Math.min(CARD_MAX_WIDTH, responsiveWidth));

  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -28],
  });

  const translateX = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -24],
  });

  return {
    position: 'absolute' as const,
    right: rightOffset,
    top: baseTop + idx * STACK_OFFSET,
    width: cardWidth,
    height: CARD_HEIGHT,
    backgroundColor: CARD_BG,
    borderColor: CARD_BORDER_GLOW,
    borderWidth: isActive ? 4 : 2,
    shadowColor: '#00eaff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isActive ? 0.6 : 0.4,
    shadowRadius: 18,
    elevation: isActive ? 18 : 12,
    transform: [
      { translateY },
      { translateX },
    ],
    borderTopLeftRadius: 12,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 18,
    overflow: 'visible' as const,
    zIndex: isActive ? 30 : 20 - idx,
  };
}

export default function HomeScreen() {
  const [activeCard, setActiveCard] = React.useState<number | null>(null);
  const anim = useSlideAnimation(activeCard);
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const { user } = useAuth();
  const [goal, setGoal] = React.useState<GoalKey>('general');
  const [entries, setEntries] = React.useState<Record<CategoryKey, DailyValues>>({
    water: null,
    diet: null,
    exercise: null,
    sleep: null,
  });

  React.useEffect(() => {
    if (!user) {
      setGoal('general');
      return undefined;
    }

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        const data = snapshot.data() as { preferences?: { primaryGoal?: GoalKey } } | undefined;
        const nextGoal = data?.preferences?.primaryGoal ?? 'general';
        setGoal(nextGoal as GoalKey);
      },
      (error) => {
        console.error('Failed to load goal for home feedback', error);
      }
    );

    return unsubscribe;
  }, [user]);

  React.useEffect(() => {
    if (!user) {
      setEntries({ water: null, diet: null, exercise: null, sleep: null });
      return undefined;
    }

    const dateKey = formatDateKey(withDaysOffset(-1));
    const unsubs = CARD_DATA.map((card) => {
      const ref = doc(db, 'users', user.uid, card.collectionName, dateKey);
      return onSnapshot(
        ref,
        (snapshot) => {
          const data = snapshot.data() as { values?: DailyValues } | undefined;
          const values = data?.values ?? null;
          setEntries((prev) => ({
            ...prev,
            [card.category]: values,
          }));
        },
        (error) => {
          console.error(`Failed to load ${card.collectionName} snapshot`, error);
        }
      );
    });

    return () => {
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch (error) {
          console.error('Failed to unsubscribe from home feedback listener', error);
        }
      });
    };
  }, [user]);

  const feedbackByCategory = React.useMemo(() => {
    if (!user) {
      return INITIAL_FEEDBACK;
    }
    return buildFeedback(goal, entries);
  }, [entries, goal, user]);

  const stackHeight = CARD_HEIGHT + (CARD_DATA.length - 1) * STACK_OFFSET;
  const safeHeight = Number.isFinite(screenHeight) && screenHeight > 0 ? screenHeight : 720;
  const bottomPadding = 48;
  const highestAllowedTop = Math.max(24, safeHeight - stackHeight - bottomPadding);
  const targetTop = Math.max(24, safeHeight * 0.32);
  const baseTop = Math.min(targetTop, highestAllowedTop);

  return (
    <View style={{ flex: 1 }}>
      {/* Futuristic gradient background */}
      <LinearGradient
        colors={["#181c2f", "#232a45", "#0f2027", "#2c5364"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', width: '100%', height: '100%' }}
      />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', padding: 16 }}>
    {/* Large glowy person outline, positioned lower, no lines, just outline */}
    <View style={{ position: 'absolute', top: 140, left: 24, zIndex: 10 }}>
          <Svg height="180" width="90" viewBox="0 0 60 120">
            {/* Head outline */}
            <Circle cx="30" cy="20" r="16" stroke="#00eaff" strokeWidth="5.25" fill="none" opacity="0.9" />
            {/* Body outline (rectangle) */}
            <Rect x="18" y="36" width="24" height="44" rx="12" stroke="#00eaff" strokeWidth="5.25" fill="none" opacity="0.9" />
            {/* Left leg outline */}
            <Rect x="18" y="80" width="8" height="32" rx="4" stroke="#00eaff" strokeWidth="5.25" fill="none" opacity="0.9" />
            {/* Right leg outline */}
            <Rect x="34" y="80" width="8" height="32" rx="4" stroke="#00eaff" strokeWidth="5.25" fill="none" opacity="0.9" />
            {/* Left arm outline */}
            <Rect x="4" y="44" width="10" height="32" rx="5" stroke="#00eaff" strokeWidth="5.25" fill="none" opacity="0.7" />
            {/* Right arm outline */}
            <Rect x="46" y="44" width="10" height="32" rx="5" stroke="#00eaff" strokeWidth="5.25" fill="none" opacity="0.7" />
          </Svg>
        </View>
        {/* shapes in the background */}
        <View style={{ position: 'absolute', top: 60, left: 40, zIndex: 0 }}>
          <View style={{ width: 120, height: 120, borderRadius: 32, borderWidth: 4, borderColor: '#00eaff', opacity: 0.18, backgroundColor: 'transparent', transform: [{ rotate: '30deg' }] }} />
        </View>
        <View style={{ position: 'absolute', top: 200, right: 60, zIndex: 0 }}>
          <View style={{ width: 80, height: 80, borderRadius: 16, borderWidth: 3, borderColor: '#7f00ff', opacity: 0.22, backgroundColor: 'transparent', transform: [{ rotate: '-20deg' }] }} />
        </View>
        <View style={{ position: 'absolute', bottom: 80, left: 100, zIndex: 0 }}>
          <View style={{ width: 100, height: 40, borderRadius: 8, borderWidth: 2, borderColor: '#00eaff', opacity: 0.15, backgroundColor: 'transparent', transform: [{ rotate: '10deg' }] }} />
        </View>
        {/* Flashcard stack aligned near the right edge */}
        <View style={styles.cardLayer} pointerEvents="box-none">
          {activeCard !== null && (
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setActiveCard(null)}
            >
              <View style={styles.scrim} />
            </Pressable>
          )}
          {CARD_DATA.map((card, idx) => {
            const isActive = activeCard === card.id;
            const feedback = feedbackByCategory[card.category] ?? INITIAL_FEEDBACK[card.category];
            const feedbackColor = getFeedbackColor(feedback.tone);
            return (
              <Animated.View
                key={card.id}
                style={getCardStyle(idx, isActive, anim[idx], baseTop, screenWidth)}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{ width: '100%', height: '100%', justifyContent: 'flex-start', alignItems: 'flex-start', borderRadius: 12, backgroundColor: CARD_BG, flexDirection: 'column' }}
                  onPress={() => setActiveCard(card.id)}
                  disabled={isActive}
                >
                  <View style={{ position: 'absolute', bottom: 0, left: 0, width: '82%', paddingVertical: 12, paddingLeft: 18, paddingRight: 0, borderBottomLeftRadius: 12, borderTopRightRadius: 16, backgroundColor: '#181c2f', borderTopWidth: 2, borderTopColor: CARD_BORDER_GLOW, shadowColor: '#00eaff', shadowOpacity: 0.7, shadowRadius: 12 }}>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#00eaff', textAlign: 'left', letterSpacing: 2, textShadowColor: '#7f00ff', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8, fontFamily: 'monospace' }}>
                      {card.title}
                    </Text>
                  </View>
                  <View style={{ maxWidth: '78%', paddingLeft: 24, paddingRight: 32, paddingTop: 10, paddingBottom: 64, justifyContent: 'flex-start', alignItems: 'flex-start', alignSelf: 'flex-start', gap: 3 }}>
                    <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: 1, textTransform: 'uppercase', fontFamily: 'monospace' }}>
                      Yesterday
                    </Text>
                    <Text
                      style={{ fontSize: 13, color: feedbackColor, fontFamily: 'monospace', opacity: 0.9, textAlign: 'left', lineHeight: 18 }}
                      numberOfLines={isActive ? 4 : 2}
                    >
                      {feedback.message}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
        <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#00eaff', marginBottom: 32, textAlign: 'center', textShadowColor: '#7f00ff', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 8, fontFamily: 'monospace', letterSpacing: 2 }}>
          Welcome Avi lets have another great day!
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardLayer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    paddingRight: 0,
    paddingLeft: 24,
    paddingBottom: 56,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
});