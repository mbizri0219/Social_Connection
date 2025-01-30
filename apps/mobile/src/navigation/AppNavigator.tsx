import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { ConnectChannelScreen } from '../screens/ConnectChannelScreen';
import { ManageConnectionsScreen } from '../screens/ManageConnectionsScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import { PlatformComparisonScreen } from '../screens/PlatformComparisonScreen';
import { CreatePostScreen } from '../screens/CreatePostScreen';
import { useAuth } from '../hooks/useAuth';
import { ActivityIndicator, View } from 'react-native';
import { RootStackParamList, MainTabParamList } from './types';
import { Ionicons } from '@expo/vector-icons';
import { CustomTabBar } from './CustomTabBar';
import { ConnectionProvider } from '../contexts/ConnectionContext';
import { AnalyticsScreen } from '../screens/AnalyticsScreen';
import { ContentCalendarScreen } from '../screens/ContentCalendarScreen';
import { PostInsightsScreen } from '../screens/PostInsightsScreen';
import { TeamManagementScreen } from '../screens/TeamManagementScreen';
import { MessagesScreen } from '../screens/MessagesScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#eee',
          paddingTop: 8,
          height: 60,
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'home' : 'home-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="ContentCalendar" 
        component={ContentCalendarScreen}
        options={{
          title: 'Calendar',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'calendar' : 'calendar-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Messages" 
        component={MessagesScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Analytics" 
        component={AnalyticsScreen}
        options={{
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons 
              name={focused ? 'bar-chart' : 'bar-chart-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused, color }) => (
            <Ionicons 
              name={focused ? 'person' : 'person-outline'} 
              size={24} 
              color={color} 
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export const AppNavigator = () => {
  // Temporarily force user to be logged in
  // const { user, loading } = useAuth();
  const loading = false;
  const user = { id: '1' }; // Mock user object

  if (loading) {
    return null;
  }

  return (
    <ConnectionProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* This section will now be shown since user is mocked */}
        <>
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen 
            name="ConnectChannel" 
            component={ConnectChannelScreen}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen
            name="PlatformComparison"
            component={PlatformComparisonScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="CreatePost"
            component={CreatePostScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="ManageConnections" 
            component={ManageConnectionsScreen}
            options={{
              presentation: 'card',
            }}
          />
          <Stack.Screen 
            name="EditProfile" 
            component={EditProfileScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="PostInsights" 
            component={PostInsightsScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="TeamManagement" 
            component={TeamManagementScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen
            name="Messages"
            component={MessagesScreen}
            options={{
              headerShown: false,
            }}
          />
        </>
      </Stack.Navigator>
    </ConnectionProvider>
  );
}; 