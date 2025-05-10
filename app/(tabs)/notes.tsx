import {
    StyleSheet,
    Text,
    View,
    SafeAreaView,
    TextInput,
    ScrollView,
    Alert,
    Keyboard,
    TouchableWithoutFeedback,
    TouchableOpacity
} from 'react-native'
import React, { useState, useEffect } from 'react'

import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';

const Notes = () => {

    const [note, setNote] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date());
    const dateKey = format(selectedDate, "MMM dd");

    useEffect(() => {
        const loadNote = async () => {
            try {
                const saved = await AsyncStorage.getItem(`note-${dateKey}`);
                if (saved) setNote(saved);
                else setNote("");
            } catch (e) {
                console.error("Failed To Load Notes", e)
            }
        };
        loadNote();
    }, [dateKey]);

    useEffect(() => {
        const saveNote = async () => {
            try {
                await AsyncStorage.setItem(`note-${dateKey}`, note);
            } catch (e) {
                console.error("Failed to Save Note", e)
            }
        }
        saveNote();
    }, [note]);

    const changeDate = (days: number) => {
        setSelectedDate(prev => {
            const newDate = new Date(prev);
            newDate.setDate(prev.getDate() + days);
            return newDate;
        });
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <SafeAreaView style={styles.container}>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 20 }}>
                    <TouchableOpacity onPress={() => changeDate(-1)}>
                        <Text style={{ color: "#fff", fontSize: 28 }}>◀</Text>
                    </TouchableOpacity>

                    <Text style={{ color: "#fff", marginHorizontal: 15, fontSize: 20 }}>
                        {format(selectedDate, "yyyy-MM-dd")}
                    </Text>

                    <TouchableOpacity onPress={() => changeDate(1)}>
                        <Text style={{ color: "#fff", fontSize: 28 }}>▶</Text>
                    </TouchableOpacity>
                </View>
                <Text style={styles.headerText}>Notes for {dateKey}</Text>
                <ScrollView style={styles.inputWrapper}>
                    <TextInput
                        style={styles.input}
                        multiline
                        placeholder="Write about your day..."
                        placeholderTextColor="#aaa"
                        value={note}
                        onChangeText={setNote}
                    />
                </ScrollView>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    );
}

export default Notes

const styles = StyleSheet.create({
    container: {
        backgroundColor: "#111",
        flex: 1,
        height: "100%",
        justifyContent: "flex-start",
        alignItems: "center",
    },
    headerText: {
        marginTop: 30,
        color: "#fff",
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 20,
    },
    inputWrapper: {
        flex: 1,
    },
    input: {
        backgroundColor: "#222",
        color: "#fff",
        fontSize: 16,
        padding: 15,
        borderRadius: 10,
        minHeight: 400,
        width: 350,
        textAlignVertical: "top",
    }
});