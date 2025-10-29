import { createCalendarLogScreen } from './CalendarLogTemplate';

const DietLogScreen = createCalendarLogScreen({
  categoryKey: 'diet',
  collectionName: 'dietLogs',
  title: 'Diet Log',
  accentColor: '#7f00ff',
  instructions: 'Click on the date you would like to log your diet on.',
  fields: [
    {
      type: 'number',
      key: 'calories',
      label: 'How many calories did you consume?',
      placeholder: 'Enter total calories',
      unit: 'kcal',
    },
  ],
  formatSummary: (values) => {
    const raw = values.calories;
    const calories = typeof raw === 'number' ? raw : Number(raw ?? 0);
    if (!calories) {
      return 'No calories logged yet';
    }
    return `${calories} kcal`;
  },
  formatDayValue: (values) => {
    const raw = values.calories;
    const calories = typeof raw === 'number' ? raw : Number(raw ?? 0);
    if (!Number.isFinite(calories) || calories <= 0) {
      return '';
    }
    return `${calories}k`;
  },
});

export default DietLogScreen;
