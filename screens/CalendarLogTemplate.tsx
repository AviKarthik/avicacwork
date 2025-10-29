import React from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';

type CalendarDay = {
  key: string;
  label: string;
  date: Date | null;
  dateKey: string | null;
  isCurrentMonth: boolean;
  hasEntry: boolean;
  isToday: boolean;
};

type PickerOption = {
  label: string;
  value: string | number;
};

type FieldValue = string | number | boolean;

type BaseField = {
  key: string;
  label: string;
};

type PickerField = BaseField & {
  type: 'picker';
  options: PickerOption[];
  defaultValue: string | number;
};

type NumberField = BaseField & {
  type: 'number';
  placeholder?: string;
  unit?: string;
};

type ToggleField = BaseField & {
  type: 'toggle';
  trueLabel?: string;
  falseLabel?: string;
};

type FieldDefinition = PickerField | NumberField | ToggleField;

type Config = {
  categoryKey: string;
  collectionName: string;
  title: string;
  accentColor: string;
  instructions: string;
  fields: FieldDefinition[];
  formatSummary: (values: Record<string, FieldValue>) => string;
  formatDayValue: (values: Record<string, FieldValue>) => string;
};

type EntryData = {
  values: Record<string, FieldValue>;
};

type EntryMap = Record<string, EntryData | undefined>;

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatMonthKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function formatMonthLabel(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

function buildCalendarDays(currentMonth: Date, entries: EntryMap): CalendarDay[] {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: CalendarDay[] = [];

  for (let i = 0; i < firstWeekday; i += 1) {
    cells.push({
      key: `leading-${i}`,
      label: '',
      date: null,
      dateKey: null,
      isCurrentMonth: false,
      hasEntry: false,
      isToday: false,
    });
  }

  const todayKey = formatDateKey(new Date());

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const dateKey = formatDateKey(date);
    cells.push({
      key: `day-${dateKey}`,
      label: String(day),
      date,
      dateKey,
      isCurrentMonth: true,
      hasEntry: Boolean(entries[dateKey]),
      isToday: dateKey === todayKey,
    });
  }

  while (cells.length % 7 !== 0) {
    const idx = cells.length;
    cells.push({
      key: `trailing-${idx}`,
      label: '',
      date: null,
      dateKey: null,
      isCurrentMonth: false,
      hasEntry: false,
      isToday: false,
    });
  }

  return cells;
}

function createStyles(accentColor: string) {
  return StyleSheet.create({
    gradient: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: 24,
      paddingBottom: 48,
      paddingTop: 72,
      gap: 24,
    },
    heading: {
      fontSize: 30,
      fontWeight: 'bold',
      color: accentColor,
      letterSpacing: 3,
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    instructions: {
      fontSize: 16,
      color: 'rgba(255,255,255,0.75)',
      textAlign: 'center',
      letterSpacing: 0.6,
    },
    monthHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: 'rgba(15, 32, 39, 0.72)',
      borderRadius: 18,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: accentColor,
      shadowColor: accentColor,
      shadowOpacity: 0.25,
      shadowOffset: { width: 0, height: 8 },
      shadowRadius: 12,
    },
    monthLabel: {
      fontSize: 18,
      color: '#FFFFFF',
      letterSpacing: 1,
    },
    controlButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: accentColor,
      backgroundColor: 'rgba(24, 28, 47, 0.85)',
    },
    controlButtonText: {
      color: accentColor,
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 1,
    },
    weekdayRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 4,
    },
    weekday: {
      width: `${100 / 7}%`,
      textAlign: 'center',
      color: 'rgba(255,255,255,0.7)',
      fontSize: 13,
      letterSpacing: 1,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderRadius: 18,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: 'rgba(0, 234, 255, 0.18)',
    },
    dayCell: {
      width: `${100 / 7}%`,
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 12,
      paddingHorizontal: 6,
      backgroundColor: 'rgba(24, 28, 47, 0.92)',
      borderColor: 'rgba(0, 234, 255, 0.08)',
      borderWidth: 0.5,
    },
    inactiveCell: {
      opacity: 0.35,
    },
    dayLabel: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    dayValue: {
      marginTop: 4,
      fontSize: 13,
      color: accentColor,
      fontWeight: '600',
      letterSpacing: 0.4,
    },
    todayRing: {
      position: 'absolute',
      top: 6,
      left: '50%',
      width: 36,
      height: 36,
      marginLeft: -18,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: accentColor,
      opacity: 0.6,
    },
    entryDot: {
      marginTop: 6,
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: accentColor,
    },
    summaryPanel: {
      backgroundColor: 'rgba(24, 28, 47, 0.78)',
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: 'rgba(0, 234, 255, 0.2)',
      gap: 12,
    },
    summaryHeading: {
      fontSize: 18,
      fontWeight: '700',
      color: accentColor,
      letterSpacing: 1,
    },
    entryRow: {
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.08)',
      paddingBottom: 10,
    },
    entryRowLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    entryDate: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '600',
      marginBottom: 6,
    },
    entryNote: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.85)',
      lineHeight: 20,
    },
    emptyNote: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.5)',
      fontStyle: 'italic',
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalCard: {
      width: '100%',
      borderRadius: 20,
      padding: 24,
      backgroundColor: 'rgba(24, 28, 47, 0.95)',
      borderWidth: 1,
      borderColor: accentColor,
      gap: 18,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#FFFFFF',
      letterSpacing: 1,
    },
    fieldStack: {
      gap: 16,
    },
    fieldGroup: {
      gap: 8,
    },
    fieldLabel: {
      fontSize: 16,
      color: '#FFFFFF',
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    pickerWrapper: {
      borderWidth: 1,
      borderColor: 'rgba(0, 234, 255, 0.35)',
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: 'rgba(15, 32, 39, 0.9)',
    },
    picker: {
      color: '#FFFFFF',
      backgroundColor: 'rgba(15, 32, 39, 0.9)',
    },
    pickerItem: {
      color: '#FFFFFF',
    },
    numberInput: {
      borderWidth: 1,
      borderColor: 'rgba(0, 234, 255, 0.35)',
      borderRadius: 14,
      paddingHorizontal: 16,
      paddingVertical: 12,
      color: '#FFFFFF',
      fontSize: 15,
      backgroundColor: 'rgba(15, 32, 39, 0.85)',
    },
    unitText: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.65)',
    },
    numberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 4,
    },
    toggleLabels: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.7)',
    },
    modalButtons: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    modalButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: accentColor,
      backgroundColor: 'rgba(0, 234, 255, 0.12)',
    },
    modalButtonSecondary: {
      borderColor: 'rgba(255,255,255,0.35)',
      backgroundColor: 'transparent',
    },
    modalButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
      letterSpacing: 1,
    },
    errorText: {
      color: '#ff6b6b',
      fontSize: 14,
    },
  });
}

export function createCalendarLogScreen(config: Config) {
  const Screen: React.FC = () => {
    const { user } = useAuth();
    const [currentMonth, setCurrentMonth] = React.useState(() => {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1);
    });
    const monthKey = React.useMemo(() => formatMonthKey(currentMonth), [currentMonth]);
    const [entries, setEntries] = React.useState<EntryMap>({});
    const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
    const [modalVisible, setModalVisible] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const defaultFormState = React.useMemo(() => {
      const base: Record<string, FieldValue> = {};
      config.fields.forEach((field) => {
        if (field.type === 'picker') {
          base[field.key] = field.defaultValue;
        } else if (field.type === 'toggle') {
          base[field.key] = false;
        } else {
          base[field.key] = '';
        }
      });
      return base;
    }, [config.fields]);

    const [formValues, setFormValues] = React.useState<Record<string, FieldValue>>(defaultFormState);

    React.useEffect(() => {
      setFormValues(defaultFormState);
    }, [defaultFormState]);

    React.useEffect(() => {
      if (!user) {
        setEntries({});
        return undefined;
      }

      const colRef = collection(db, 'users', user.uid, config.collectionName);
      const monthQuery = query(colRef, where('month', '==', monthKey));
      const unsubscribe = onSnapshot(monthQuery, (snapshot) => {
        const next: EntryMap = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as { values?: Record<string, FieldValue> } | undefined;
          next[docSnap.id] = {
            values: data?.values ?? {},
          };
        });
        setEntries(next);
      });

      return unsubscribe;
    }, [user, monthKey, config.collectionName]);

    const styles = React.useMemo(() => createStyles(config.accentColor), [config.accentColor]);

    const days = React.useMemo(() => buildCalendarDays(currentMonth, entries), [currentMonth, entries]);

    const handlePrevMonth = React.useCallback(() => {
      setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }, []);

    const handleNextMonth = React.useCallback(() => {
      setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }, []);

    const openModalForDate = React.useCallback((date: Date | null, dateKey: string | null) => {
      if (!date || !dateKey) {
        return;
      }
      setSelectedDate(date);
      const existing = entries[dateKey]?.values ?? {};
      const nextValues: Record<string, FieldValue> = { ...defaultFormState };
      config.fields.forEach((field) => {
        const existingValue = existing[field.key];
        if (existingValue !== undefined) {
          if (field.type === 'number') {
            nextValues[field.key] = String(existingValue);
          } else if (field.type === 'toggle') {
            nextValues[field.key] = Boolean(existingValue);
          } else {
            nextValues[field.key] = existingValue;
          }
        }
      });
      setFormValues(nextValues);
      setError(null);
      setModalVisible(true);
    }, [entries, defaultFormState, config.fields]);

    const closeModal = React.useCallback(() => {
      setModalVisible(false);
      setSelectedDate(null);
      setTimeout(() => setFormValues(defaultFormState), 200);
    }, [defaultFormState]);

    const handleSave = React.useCallback(async () => {
      if (!user || !selectedDate) {
        return;
      }
      setSaving(true);
      setError(null);
      const dateKey = formatDateKey(selectedDate);
      const docRef = doc(db, 'users', user.uid, config.collectionName, dateKey);

      try {
        const payload: Record<string, FieldValue> = {};
        let hasMeaningfulData = false;

        config.fields.forEach((field) => {
          const raw = formValues[field.key];

          if (field.type === 'number') {
            const rawString = typeof raw === 'string' ? raw.trim() : String(raw ?? '').trim();
            if (rawString.length > 0) {
              const parsed = Number(rawString);
              if (Number.isFinite(parsed)) {
                payload[field.key] = parsed;
                if (parsed !== 0) {
                  hasMeaningfulData = true;
                }
              }
            }
          } else if (field.type === 'toggle') {
            const boolValue = Boolean(raw);
            payload[field.key] = boolValue;
            if (boolValue) {
              hasMeaningfulData = true;
            }
          } else {
            const value = raw ?? field.defaultValue;
            payload[field.key] = value;
            if (value !== field.defaultValue) {
              hasMeaningfulData = true;
            }
          }
        });

        const operation = hasMeaningfulData ? 'set' : 'delete';
        console.log(`Saving ${config.collectionName} entry`, { dateKey, operation, payload });

        if (!hasMeaningfulData) {
          await deleteDoc(docRef);
        } else {
          await setDoc(docRef, {
            values: payload,
            month: formatMonthKey(selectedDate),
            date: dateKey,
            category: config.categoryKey,
            updatedAt: serverTimestamp(),
          }, { merge: true });
        }

        closeModal();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error('Failed to save log entry', message, err);
        setError(`Could not save your entry. ${message}`);
      } finally {
        setSaving(false);
      }
    }, [user, selectedDate, formValues, config.fields, config.collectionName, config.categoryKey, closeModal]);

    const existingEntries = React.useMemo(() => {
      const keys = Object.keys(entries).sort();
      return keys.map((key) => ({ key, values: entries[key]?.values ?? {} }));
    }, [entries]);

    const renderField = React.useCallback((field: FieldDefinition) => {
      if (field.type === 'picker') {
        return (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={formValues[field.key] ?? field.defaultValue}
                onValueChange={(value) => {
                  setFormValues((prev) => ({ ...prev, [field.key]: value }));
                }}
                dropdownIconColor={config.accentColor}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {field.options.map((option) => (
                  <Picker.Item key={String(option.value)} label={option.label} value={option.value} />
                ))}
              </Picker>
            </View>
          </View>
        );
      }

      if (field.type === 'toggle') {
        const value = Boolean(formValues[field.key]);
        return (
          <View key={field.key} style={[styles.fieldGroup, styles.toggleRow]}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Switch
                value={value}
                onValueChange={(next) => {
                  setFormValues((prev) => ({ ...prev, [field.key]: next }));
                }}
                trackColor={{ false: 'rgba(255,255,255,0.25)', true: config.accentColor }}
                thumbColor={value ? '#0f2027' : '#f4f3f4'}
              />
              <Text style={styles.toggleLabels}>
                {value ? field.trueLabel ?? 'Yes' : field.falseLabel ?? 'No'}
              </Text>
            </View>
          </View>
        );
      }

      const value = formValues[field.key];
      return (
        <View key={field.key} style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <View style={styles.numberRow}>
            <TextInput
              style={[styles.numberInput, { flex: 1 }]}
              value={typeof value === 'string' ? value : String(value ?? '')}
              onChangeText={(text) => {
                if (/^\d*$/.test(text)) {
                  setFormValues((prev) => ({ ...prev, [field.key]: text }));
                }
              }}
              keyboardType="number-pad"
              placeholder={field.placeholder}
              placeholderTextColor="rgba(255,255,255,0.4)"
            />
            {field.unit && (
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.unitText}>{field.unit}</Text>
              </View>
            )}
          </View>
        </View>
      );
    }, [formValues, styles, config.accentColor]);

    return (
      <LinearGradient
        colors={["#181c2f", "#232a45", "#0f2027", "#2c5364"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.heading}>{config.title}</Text>
          <Text style={styles.instructions}>{config.instructions}</Text>

          <View style={styles.monthHeader}>
            <Pressable onPress={handlePrevMonth} style={styles.controlButton}>
              <Text style={styles.controlButtonText}>{'<'}</Text>
            </Pressable>
            <Text style={styles.monthLabel}>{formatMonthLabel(currentMonth)}</Text>
            <Pressable onPress={handleNextMonth} style={styles.controlButton}>
              <Text style={styles.controlButtonText}>{'>'}</Text>
            </Pressable>
          </View>

          <View>
            <View style={styles.weekdayRow}>
              {WEEKDAY_LABELS.map((label) => (
                <Text key={label} style={styles.weekday}>
                  {label}
                </Text>
              ))}
            </View>
            <View style={styles.grid}>
              {days.map((day) => {
                const entryValues = day.dateKey ? entries[day.dateKey]?.values : undefined;
                const dayValue = entryValues ? config.formatDayValue(entryValues) : '';
                return (
                  <Pressable
                    key={day.key}
                    style={[styles.dayCell, !day.isCurrentMonth && styles.inactiveCell]}
                    onPress={() => openModalForDate(day.date, day.dateKey)}
                    disabled={!day.date}
                  >
                    {day.isToday && <View style={styles.todayRing} />}
                    <Text style={styles.dayLabel}>{day.label}</Text>
                    {dayValue ? (
                      <Text style={styles.dayValue}>{dayValue}</Text>
                    ) : (
                      day.hasEntry && <View style={styles.entryDot} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.summaryPanel}>
            <Text style={styles.summaryHeading}>This Month</Text>
            {existingEntries.length === 0 && (
              <Text style={styles.emptyNote}>No logs yet. Tap a day to add one.</Text>
            )}
            {existingEntries.map((entry, index) => (
              <View
                key={entry.key}
                style={[styles.entryRow, index === existingEntries.length - 1 && styles.entryRowLast]}
              >
                <Text style={styles.entryDate}>{entry.key}</Text>
                <Text style={styles.entryNote}>{config.formatSummary(entry.values)}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <Modal
          transparent
          visible={modalVisible}
          animationType="fade"
          onRequestClose={closeModal}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>
                {selectedDate ? formatDateKey(selectedDate) : 'Select a day'}
              </Text>

              <View style={styles.fieldStack}>
                {config.fields.map((field) => renderField(field))}
              </View>

              {error && <Text style={styles.errorText}>{error}</Text>}
              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={closeModal}
                  disabled={saving}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={styles.modalButton}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalButtonText}>Save</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </LinearGradient>
    );
  };

  Screen.displayName = `${config.title.replace(/\s+/g, '')}Screen`;

  return Screen;
}
