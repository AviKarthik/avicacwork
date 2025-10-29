import { createCalendarLogScreen } from './CalendarLogTemplate';

const glassOptions = Array.from({ length: 17 }, (_, index) => ({
  label: `${index} glass${index === 1 ? '' : 'es'}`,
  value: index,
}));

const WaterLogScreen = createCalendarLogScreen({
  categoryKey: 'water',
  collectionName: 'waterLogs',
  title: 'Water Log',
  accentColor: '#00eaff',
  instructions: 'Click on the date you would like to log your water on.',
  fields: [
    {
      type: 'picker',
      key: 'glasses',
      label: 'How many glasses did you drink?',
      options: glassOptions,
      defaultValue: 0,
    },
  ],
  formatSummary: (values) => {
    const amount = Number(values.glasses ?? 0);
    if (!amount) {
      return 'No water logged yet';
    }
    return `${amount} glass${amount === 1 ? '' : 'es'} of water`;
  },
  formatDayValue: (values) => {
    const amount = Number(values.glasses ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      return '';
    }
    return `${amount} gls`;
  },
});

export default WaterLogScreen;
