
import React from "react";
import { Tabs } from "expo-router";
import { Text, StyleSheet } from "react-native";

import { Ionicons } from "@expo/vector-icons";

const _layout = () => {
    return (
        <Tabs
            screenOptions={{
                tabBarStyle: {
                    backgroundColor: "#111",
                    height: 80,
                    paddingTop: 5,
                }
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: "Home",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <Ionicons 
                            name={focused ? "home" : "home-outline"}
                            size={25}
                            color={focused ? "#fff" : "#888"}
                        />
                    ),
                    tabBarLabel: ({ focused }) => (
                        <Text
                            style={{
                                fontSize: 15,
                                color: focused ? "#fff" : "#888",
                                fontWeight: focused ? "bold" : "normal"
                            }}
                        >
                            Home
                        </Text>
                    )
                }}
            />
            <Tabs.Screen
                name="notes"
                options={{
                    title: "Notes",
                    headerShown: false,
                    tabBarIcon: ({ focused }) => (
                        <Ionicons
                            name={focused ? "book" : "book-outline"}
                            size={25}
                            color={focused ? "#fff" : "#888"}
                        />
                    ),
                    tabBarLabel: ({ focused }) => (
                        <Text
                            style={{
                                fontSize: 15,
                                color: focused ? "#fff" : "#888",
                                fontWeight: focused ? "bold" : "normal"
                            }}
                        >
                            Notes
                        </Text>
                    )
                }}
            />
        </Tabs>
    )
}

export default _layout

const styles = StyleSheet.create({
    image: {
        width: 24, 
        height: 24, 
        tintColor: "rgba(93, 204, 255, 1)"
    },
    text: {
        fontSize: 12,
    }
})