import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PhotoUploadScreen from '../screens/PhotoUploadScreen';
import BioEntryScreen from '../screens/BioEntryScreen';
import ActivityTagsScreen from '../screens/ActivityTagsScreen';
import NeighbourhoodScreen from '../screens/NeighbourhoodScreen';
import { ProfileCreationStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<ProfileCreationStackParamList>();

export default function ProfileCreationNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="PhotoUpload" component={PhotoUploadScreen} />
      <Stack.Screen name="BioEntry" component={BioEntryScreen} />
      <Stack.Screen name="ActivityTags" component={ActivityTagsScreen} />
      <Stack.Screen name="Neighbourhood" component={NeighbourhoodScreen} />
    </Stack.Navigator>
  );
}

