import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ActivitiesScreen from '../screens/ActivitiesScreen';
import ActivityDetailScreen from '../screens/ActivityDetailScreen';
import ActivityChatScreen from '../screens/ActivityChatScreen';
import ActivityCreationScreen from '../screens/ActivityCreationScreen';

export type ActivitiesStackParamList = {
  ActivitiesList: undefined;
  ActivityDetail: { activityId: string };
  ActivityChat: { activityId: string };
  ActivityCreation: undefined;
};

const Stack = createNativeStackNavigator<ActivitiesStackParamList>();

export default function ActivitiesStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ActivitiesList" component={ActivitiesScreen} />
      <Stack.Screen 
        name="ActivityDetail" 
        component={ActivityDetailScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ActivityChat" 
        component={ActivityChatScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="ActivityCreation" 
        component={ActivityCreationScreen}
        options={{
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}

