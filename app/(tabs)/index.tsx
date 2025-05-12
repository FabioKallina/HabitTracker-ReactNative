import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ViewStyle,
  Alert
} from "react-native";

import { format } from "date-fns";

import * as Haptics from "expo-haptics";

import { Ionicons } from "@expo/vector-icons"

import AsyncStorage from "@react-native-async-storage/async-storage";

import DateTimePicker from "@react-native-community/datetimepicker"

const habitsList = [
  "Wake up 8:00AM",
  "Gym",
  "Cardio",
  "Stretch",
  "Drink 4L of Water",
  "Read 30 Pages",
  "No Alcohol",
  "10,000 Steps",
  "Diet",
  "Sleep by 10:30PM",
];

const START_DATE = new Date(2025, 4, 9) //Months are 0-indexed so 5th month = 4
const STORAGE_KEY = "habitData";

const getNextNDates = (n: number, startDate: Date): Date[] => {

  const dates: Date[] = [];

  for (let i = 0; i < n; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    dates.push(date);
  }

  return dates;

}

export default function HomeScreen() {

  const [newHabit, setNewHabit] = useState("");

  const [habitData, setHabitData] = useState<Record<string, Record<string, number>>>({});

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const loadStartDate = async () => {
      const saved = await AsyncStorage.getItem("habitStartDate");
      if (saved) setStartDate(new Date(saved));
      else setStartDate(new Date());
    };
    loadStartDate();
  }, []);

  const onDateChange = async (event, selected) => {
    setShowPicker(false);
    if (selected) {
      setStartDate(selected);
      await AsyncStorage.setItem("habitStartDate", selected.toISOString());
    }
  };

  useEffect(() => {
    if (!startDate) return;

    const loadHabits = async () => {
      try {
        const storedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (storedData) {
          const parsed = JSON.parse(storedData);

          // Ensure storedData has all dates based on current startDate
          const days = getNextNDates(30, startDate).map(date => format(date, "MM dd"));
          let isIncomplete = false;

          for (const habit of habitsList) {
            for (const date of days) {
              if (!parsed?.[habit]?.hasOwnProperty(date)) {
                isIncomplete = true;
                break;
              }
            }
            if (isIncomplete) break;
          }

          if (isIncomplete) {
            console.log("Old data is missing some dates, regenerating...");
            await AsyncStorage.removeItem(STORAGE_KEY); // Clear old data
          } else {
            setHabitData(parsed);
            return; // ✅ Valid data, exit early
          }
        }

        // If no data or it was incomplete, generate fresh data
        const days = getNextNDates(30, startDate).map(date => format(date, "MM dd"));

        const initialData = habitsList.reduce((acc: Record<string, Record<string, number>>, habit) => {
          acc[habit] = days.reduce((dayAcc: Record<string, number>, date) => {
            dayAcc[date] = 0;
            return dayAcc;
          }, {});
          return acc;
        }, {});

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
        setHabitData(initialData);
      } catch (e) {
        console.error("Failed to load or initialize habit data", e);
      }
    };

    loadHabits();
  }, [startDate]);

  const toggleHabit = (habit: string, date: string) => {
    setHabitData(prev => {
      const currentValue = prev[habit]?.[date] ?? 0;
      const nextValue = (currentValue + 1) % 4;

      return {
        ...prev,
        [habit]: {
          ...prev[habit],
          [date]: nextValue,
        }
      };
    });
  };

  const getStateStyle = (state: number): ViewStyle => {

    switch (state) {
      case 0:
        return styles.unspecified;
      case 1:
        return styles.missed;
      case 2:
        return styles.partial;
      case 3:
        return styles.complete;
      default:
        return styles.unspecified;
    }

  };

  const dates = startDate ? getNextNDates(30, startDate || START_DATE) : [];
  const dateKeys = dates.map(date => format(date, "MM dd"));

  useEffect(() => {
    const saveHabits = async () => {
      try {
        await AsyncStorage.setItem("habitData", JSON.stringify(habitData))
      } catch (e) {
        console.error("Failed to save habit", e)
      }
    }
    saveHabits();
  }, [habitData]);

  /* useEffect(() => {
  AsyncStorage.clear(); // ⚠️ This will delete all saved habit data
}, []); */

  if (!startDate || Object.keys(habitData).length === 0) {
    return <Text style={{ color: "#333", textAlign: "center", marginTop: 40 }}>Loading...</Text>;
  }

  return (
    <>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>

          <Text style={styles.title}>Habit Tracker</Text>

          <View style={styles.legendContainer}>

            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.unspecified]} />
              <Text style={styles.legendText}>Not Specified</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.missed]} />
              <Text style={styles.legendText}>Missed</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.partial]} />
              <Text style={styles.legendText}>Partial</Text>
            </View>

            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.complete]} />
              <Text style={styles.legendText}>Complete</Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginBottom: 15, gap: 10 }}>
            <TouchableOpacity onPress={() => setShowPicker(!showPicker)} style={{ marginLeft: 10 }}>
              <Ionicons name="calendar-outline" size={22} color="#fff" />
            </TouchableOpacity>

            <Text style={{ color: "#888", fontSize: 14 }}>Pick a Start Date</Text>

            {showPicker && (
              <DateTimePicker
                value={startDate || new Date()}
                mode="date"
                display="default"
                onChange={onDateChange}
              />
            )}
          </View>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Add a new habit..."
              placeholderTextColor="#333"
              value={newHabit}
              onChangeText={(setNewHabit)}
            />
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {

                if (newHabit.trim() === "" || habitData[newHabit]) {
                  Alert.alert("Invalid habit", "This habit already exists");
                  return;
                }

                const newEntry = dateKeys.reduce((acc: Record<string, number>, date) => {
                  acc[date] = 0;
                  return acc;
                }, {});

                setHabitData(prev => ({
                  ...prev,
                  [newHabit]: newEntry
                }));
                setNewHabit("");

              }}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 60 }}>
          <View style={{ flexDirection: "row" }}>
            {/* Fixed Habit Labels */}
            <View>
              <View style={[styles.habitColumnHeader, { height: 55 }]}>
                <Text style={styles.habitColumn}>Habits:</Text>
              </View>
              {Object.keys(habitData).map((habit) => (
                <View key={habit} style={[styles.habitColumnHeader, { height: 47, marginBottom: 4 }]}>
                  <TouchableOpacity
                    style={styles.removeHabitBtn}
                    onPress={() => {
                      setHabitData(prev => {
                        const updated = { ...prev };
                        delete updated[habit];
                        return updated;
                      });
                    }}
                  >
                    <Ionicons name="close" size={16} color="#fa5252" />
                  </TouchableOpacity>
                  <Text style={styles.habitColumn}>{habit}</Text>
                </View>
              ))}
            </View>

            {/* Scrollable Grid */}
            <ScrollView horizontal>
              <View>
                <View style={styles.headerRow}>
                  {dates.map((dateObj) => {
                    const formattedDate = format(dateObj, "MMM dd");
                    const dayName = format(dateObj, "E");
                    const [month, day] = formattedDate.split(" ");
                    return (
                      <View key={formattedDate} style={styles.dateCellAligned}>
                        <Text style={styles.dayLabel}>{dayName}</Text>
                        <Text style={styles.monthLabel}>{month}</Text>
                        <Text style={styles.dateCell}>{day}</Text>
                      </View>
                    );
                  })}
                </View>

                {Object.keys(habitData).map((habit) => (
                  <View style={styles.gridRow} key={habit}>
                    {dateKeys.map((date) => (
                      <TouchableOpacity
                        key={date}
                        style={[styles.cell, getStateStyle(habitData?.[habit]?.[date] ?? 0)]}
                        onPress={() => {
                          toggleHabit(habit, date);
                          Haptics.selectionAsync();
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>

        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#111',
  },
  container: {
    padding: 16,
    backgroundColor: '#111',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: "#fff",
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  habitColumnHeader: {
    width: 155,
    justifyContent: 'flex-start',
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
  },
  habitColumn: {
    fontWeight: 'bold',
    fontSize: 14,
    color: "#fff",
  },
  dateCellAligned: {
    width: 47,
    height: 55,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 1,
  },
  dayLabel: {
    fontWeight: 'bold',
    fontSize: 12,
    color: '#999',
    lineHeight: 12,
  },
  monthLabel: {
    fontSize: 12,
    color: '#777',
    lineHeight: 12,
  },
  dateCell: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 12,
    color: "#999"
  },
  cell: {
    width: 47,
    height: 47,
    marginHorizontal: 1,
    borderRadius: 3,
  },
  unspecified: {
    backgroundColor: '#ccc', // gray
  },
  missed: {
    backgroundColor: '#f44336', // red
  },
  partial: {
    backgroundColor: '#ffeb3b', // yellow
  },
  complete: {
    backgroundColor: '#4caf50', // green
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 6,
    marginVertical: 4,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 3,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: '#888',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    backgroundColor: '#111',
  },
  scrollContainer: {
    paddingHorizontal: 16,
    backgroundColor: '#111',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 32,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  addButton: {
    height: 32,
    backgroundColor: '#2196f3',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginLeft: 8,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  removeHabitBtn: {},
});
