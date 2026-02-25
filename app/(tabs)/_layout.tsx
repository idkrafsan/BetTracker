import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#2196F3',
        tabBarInactiveTintColor: '#888',
tabBarStyle: {
  backgroundColor: '#1E1E1E',
  borderTopColor: '#333',
  borderTopWidth: 1,
  paddingBottom: Platform.OS === 'ios' ? 30 : 20, // More padding
  paddingTop: 10,
  height: Platform.OS === 'ios' ? 90 : 80,
  paddingHorizontal: 10,
  // Keep at bottom but with safe area
  bottom: 0,
  left: 0,
  right: 0,
  position: 'absolute',
  elevation: 8,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
},
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: Platform.OS === 'ios' ? 10 : 5,
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'ios' ? 12 : 8,
        },
        tabBarItemStyle: {
          paddingVertical: 5,
        },
        headerStyle: {
          backgroundColor: '#1E1E1E',
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: '#333',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
        headerTitleAlign: 'center',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Add Bet',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}