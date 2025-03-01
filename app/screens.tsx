import { Stack } from 'expo-router';

export default function ScreensLayout() {
  // This layout is used for the /screens/* routes
  // Instead of redirecting, we'll render a Stack navigator
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    />
  );
} 