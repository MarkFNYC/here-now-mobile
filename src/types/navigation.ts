import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Root Stack Navigator
export type RootStackParamList = {
  Auth: undefined;
  ProfileCreation: undefined;
  Main: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: undefined;
  Activities: undefined;
  Chats: undefined;
  Profile: undefined;
};

// Auth Stack Navigator
export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  AuthCallback: undefined;
};

// Profile Creation Stack Navigator
export type ProfileCreationStackParamList = {
  PhotoUpload: { editMode?: boolean };
  BioEntry: { editMode?: boolean };
  ActivityTags: { editMode?: boolean };
  Neighbourhood: { editMode?: boolean };
};

// Profile Stack Navigator
export type ProfileStackParamList = {
  Profile: undefined;
  NotificationSettings: undefined;
};

// Navigation prop types
export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type ActivitiesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Activities'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type ChatsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Chats'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;
