import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import PhotoUploadScreen from '../screens/PhotoUploadScreen';
import BioEntryScreen from '../screens/BioEntryScreen';
import NeighbourhoodScreen from '../screens/NeighbourhoodScreen';

export type ProfileStackParamList = {
  ProfileMain: undefined;
  NotificationSettings: undefined;
  EditPhoto: { editMode: boolean };
  EditBio: { editMode: boolean };
  EditNeighbourhood: { editMode: boolean };
};

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          headerShown: true,
          headerTitle: 'Notification Settings',
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#111827',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
      <Stack.Screen
        name="EditPhoto"
        component={PhotoUploadScreen}
        options={{
          headerShown: true,
          headerTitle: 'Edit Photo',
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#111827',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
        initialParams={{ editMode: true }}
      />
      <Stack.Screen
        name="EditBio"
        component={BioEntryScreen}
        options={{
          headerShown: true,
          headerTitle: 'Edit Bio',
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#111827',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
        initialParams={{ editMode: true }}
      />
      <Stack.Screen
        name="EditNeighbourhood"
        component={NeighbourhoodScreen}
        options={{
          headerShown: true,
          headerTitle: 'Edit Neighbourhood',
          headerStyle: {
            backgroundColor: '#ffffff',
          },
          headerTintColor: '#111827',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
        initialParams={{ editMode: true }}
      />
    </Stack.Navigator>
  );
}

