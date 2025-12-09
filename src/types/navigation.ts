import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { CompositeNavigationProp, NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// Root Stack Navigator
export type RootStackParamList = {
  Auth: undefined;
  ProfileCreation: undefined;
  Main: undefined;
};

// Home Stack Navigator
export type HomeStackParamList = {
  HomeFeed: undefined;
  UserProfile: { userId: string };
};

// Chats Stack Navigator
export type ChatsStackParamList = {
  ChatsList: undefined;
  Requests: undefined;
  Chat: { connectionId: string; userId: string };
};

// Profile Stack Navigator
export type ProfileStackParamList = {
  ProfileMain: undefined;
  NotificationSettings: undefined;
  EditPhoto: { editMode: boolean };
  EditBio: { editMode: boolean };
  EditNeighbourhood: { editMode: boolean };
};

// Activities Stack Navigator
export type ActivitiesStackParamList = {
  ActivitiesList: undefined;
  ActivityDetail: { activityId: string };
  ActivityChat: { activityId: string };
};

// Main Tab Navigator
export type MainTabParamList = {
  Home: NavigatorScreenParams<HomeStackParamList> | undefined;
  Plans: undefined;
  Activities: NavigatorScreenParams<ActivitiesStackParamList> | undefined;
  Chats: NavigatorScreenParams<ChatsStackParamList> | undefined;
  Profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
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

// Navigation prop types
export type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type PlansScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Plans'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type ActivitiesScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Activities'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type ActivityDetailScreenNavigationProp = CompositeNavigationProp<
  NativeStackNavigationProp<ActivitiesStackParamList, 'ActivityDetail'>,
  CompositeNavigationProp<
    BottomTabNavigationProp<MainTabParamList, 'Activities'>,
    NativeStackNavigationProp<RootStackParamList>
  >
>;

export type ChatsScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Chats'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;
