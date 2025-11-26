import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ChatsScreen from '../screens/ChatsScreen';
import RequestsScreen from '../screens/RequestsScreen';
import ChatScreen from '../screens/ChatScreen';

export type ChatsStackParamList = {
  ChatsList: undefined;
  Requests: undefined;
  Chat: { connectionId: string; userId: string };
};

const Stack = createNativeStackNavigator<ChatsStackParamList>();

export default function ChatsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ChatsList" component={ChatsScreen} />
      <Stack.Screen 
        name="Requests" 
        component={RequestsScreen}
        options={{
          headerShown: true,
          title: 'Connection Requests',
        }}
      />
      <Stack.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          headerShown: true,
          title: 'Chat',
        }}
      />
    </Stack.Navigator>
  );
}

