import { Stack } from 'expo-router';
import { Platform, View } from 'react-native';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#1E1E1E',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          contentStyle: {
            backgroundColor: '#121212',
          },
        }}
      >
        <Stack.Screen 
          name="(tabs)" 
          options={{ 
            headerShown: false,
            animation: 'fade',
          }} 
        />
        <Stack.Screen 
          name="bet/[id]" 
          options={{ 
            headerShown: false,
            presentation: 'card',
            animation: 'slide_from_right',
          }} 
        />
      </Stack>
      {/* Add safe area padding at bottom for all screens */}
      <View style={{ 
        height: Platform.OS === 'ios' ? 90 : 70, 
        backgroundColor: '#121212' 
      }} />
    </View>
  );
}