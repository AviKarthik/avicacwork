import { createCalendarLogScreen } from './CalendarLogTemplate';

const hourOptions = Array.from({ length: 13 }, (_, index) => ({
  label: `${index} hour${index === 1 ? '' : 's'}`,
  value: index,
}));

const SleepLogScreen = createCalendarLogScreen({
  categoryKey: 'sleep',
  collectionName: 'sleepLogs',
  title: 'Sleep Log',
  accentColor: '#64ffda',
  instructions: 'Click on the date you would like to log your sleep on.',
  fields: [
    {
      type: 'picker',
      key: 'hours',
      label: 'How many hours did you sleep?',
      options: hourOptions,
      defaultValue: 0,
    },
  ],
  formatSummary: (values) => {
    const hours = Number(values.hours ?? 0);
    if (!hours) {
      return 'No sleep logged yet';
    }
    return `${hours} hour${hours === 1 ? '' : 's'} of sleep`;
  },
  formatDayValue: (values) => {
    const hours = Number(values.hours ?? 0);
    if (!Number.isFinite(hours) || hours <= 0) {
      return '';
    }
    return `${hours}h`;
  },
});

export default SleepLogScreen;
