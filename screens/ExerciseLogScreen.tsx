import { createCalendarLogScreen } from './CalendarLogTemplate';

const ExerciseLogScreen = createCalendarLogScreen({
  categoryKey: 'exercise',
  collectionName: 'exerciseLogs',
  title: 'Exercise Log',
  accentColor: '#ff9f1c',
  instructions: 'Click on the date you would like to log your exercise on.',
  fields: [
    {
      type: 'toggle',
      key: 'workoutCompleted',
      label: 'Workout completed?',
      trueLabel: 'Completed',
      falseLabel: 'Not yet',
    },
    {
      type: 'number',
      key: 'cardioMinutes',
      label: 'Minutes of cardio',
      placeholder: '0',
      unit: 'min',
    },
  ],
  formatSummary: (values) => {
    const completed = Boolean(values.workoutCompleted);
    const cardioRaw = values.cardioMinutes;
    const cardioMinutes = typeof cardioRaw === 'number' ? cardioRaw : Number(cardioRaw ?? 0);
    const completedText = completed ? 'Workout done' : 'Workout skipped';
    if (cardioMinutes && completed) {
      return `${completedText} • ${cardioMinutes} min cardio`;
    }
    if (cardioMinutes) {
      return `${cardioMinutes} min of cardio`;
    }
    if (completed) {
      return completedText;
    }
    return 'No exercise logged yet';
  },
  formatDayValue: (values) => {
    const completed = Boolean(values.workoutCompleted);
    const cardioRaw = values.cardioMinutes;
    const cardioMinutes = typeof cardioRaw === 'number' ? cardioRaw : Number(cardioRaw ?? 0);
    if (Number.isFinite(cardioMinutes) && cardioMinutes > 0) {
      return `${cardioMinutes}m`;
    }
    return completed ? 'Done' : '';
  },
});

export default ExerciseLogScreen;
