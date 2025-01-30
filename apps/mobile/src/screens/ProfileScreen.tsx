import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Animated,
  Easing,
  RefreshControl,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import * as SecureStore from 'expo-secure-store';
import { SOCIAL_PLATFORMS, SocialPlatform } from '../screens/ConnectChannelScreen';
import { isTokenExpired } from '../utils/tokenRefresh';
import { colors, typography, spacing, borderRadius, commonStyles } from '../styles/theme';

type Props = NativeStackScreenProps<RootStackParamList>;

interface ConnectionData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  profile: {
    id: string;
    name: string;
    picture?: string;
  };
}

interface User {
  id: string;
  name?: string;
  email: string;
  picture?: string;
  bio?: string;
}

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

export const ProfileScreen = ({ navigation }: Props) => {
  const { user, logout } = useAuth();
  const [connections, setConnections] = useState<{[key: string]: ConnectionData}>({});
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const pulseAnims = useRef<{ [key: string]: Animated.Value }>({}).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const spinAnim = useRef(new Animated.Value(0)).current;
  const swipeAnims = useRef<{ [key: string]: Animated.Value }>({}).current;
  const swipeableRefs = useRef<{ [key: string]: any }>({});

  useEffect(() => {
    // Entrance animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    loadConnections();
  }, []);

  const loadConnections = async () => {
    setIsLoadingConnections(true);
    const loadedConnections: {[key: string]: ConnectionData} = {};

    try {
      // Load all connections from secure storage
      await Promise.all(
        SOCIAL_PLATFORMS.map(async (platform: SocialPlatform) => {
          const data = await SecureStore.getItemAsync(`connection_${platform.id}`);
          if (data) {
            loadedConnections[platform.id] = JSON.parse(data);
          }
        })
      );
      setConnections(loadedConnections);
    } catch (error) {
      console.error('Failed to load connections:', error);
    } finally {
      setIsLoadingConnections(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const startPulseAnimation = (platformId: string) => {
    if (!pulseAnims[platformId]) {
      pulseAnims[platformId] = new Animated.Value(1);
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnims[platformId], {
          toValue: 1.5,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnims[platformId], {
          toValue: 1,
          duration: 1000,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startSpinAnimation = () => {
    spinAnim.setValue(0);
    Animated.timing(spinAnim, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    startSpinAnimation();

    try {
      await loadConnections();
      
      // Refresh token status for all connections
      const refreshPromises = Object.entries(connections).map(async ([platformId, data]) => {
        if (isTokenExpired(data.expiresAt)) {
          // Start pulsing animation for expired tokens
          startPulseAnimation(platformId);
        }
      });

      await Promise.all(refreshPromises);
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const renderRefreshIcon = () => {
    const spin = spinAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });

    return (
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Ionicons name="sync" size={24} color={colors.primary} />
      </Animated.View>
    );
  };

  const renderSettingsItem = (
    icon: string,
    title: string,
    onPress: () => void,
    color: string = colors.text
  ) => (
    <TouchableOpacity 
      style={styles.settingsItem} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingsItemLeft}>
        <Ionicons name={icon as any} size={24} color={color} style={styles.settingsIcon} />
        <Text style={[styles.settingsItemText, { color }]}>{title}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );

  const createSwipeHandler = (platformId: string) => {
    if (!swipeAnims[platformId]) {
      swipeAnims[platformId] = new Animated.Value(0);
    }

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Only allow left swipe
        const x = Math.min(0, gestureState.dx);
        swipeAnims[platformId].setValue(x);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -SWIPE_THRESHOLD) {
          // Swipe to delete
          Animated.timing(swipeAnims[platformId], {
            toValue: -SCREEN_WIDTH,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            handleDeleteConnection(platformId);
          });
        } else {
          // Reset position
          Animated.spring(swipeAnims[platformId], {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    });
  };

  const handleDeleteConnection = async (platformId: string) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId);
    if (!platform) return;

    Alert.alert(
      'Remove Connection',
      `Are you sure you want to disconnect ${platform.name}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Reset position
            Animated.spring(swipeAnims[platformId], {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          },
        },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await SecureStore.deleteItemAsync(`connection_${platformId}`);
              
              // Animate removal
              Animated.sequence([
                Animated.timing(swipeAnims[platformId], {
                  toValue: -SCREEN_WIDTH,
                  duration: 250,
                  useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                // Update state after animation
                setConnections(prev => {
                  const next = { ...prev };
                  delete next[platformId];
                  return next;
                });
                
                // Reset animations
                swipeAnims[platformId].setValue(0);
                fadeAnim.setValue(1);
              });
            } catch (error) {
              console.error('Failed to delete connection:', error);
              Alert.alert('Error', 'Failed to disconnect account');
              
              // Reset position on error
              Animated.spring(swipeAnims[platformId], {
                toValue: 0,
                useNativeDriver: true,
              }).start();
            }
          },
        },
      ]
    );
  };

  const renderConnectionItem = ([platformId, data]: [string, ConnectionData], index: number) => {
    const platform = SOCIAL_PLATFORMS.find((p: SocialPlatform) => p.id === platformId);
    const isExpired = isTokenExpired(data.expiresAt);

    if (isExpired && !pulseAnims[platformId]) {
      startPulseAnimation(platformId);
    }

    if (!platform) return null;

    const panResponder = createSwipeHandler(platformId);

    return (
      <Animated.View
        key={platformId}
        ref={ref => swipeableRefs.current[platformId] = ref}
        {...panResponder.panHandlers}
        style={[
          styles.connectionItem,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateX: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50 * (index + 1), 0],
                }),
              },
              {
                translateX: swipeAnims[platformId] || new Animated.Value(0),
              },
            ],
          },
        ]}
      >
        <View style={styles.connectionInfo}>
          <Image source={platform.icon} style={styles.platformIcon} />
          <View style={styles.connectionDetails}>
            <Text style={styles.platformName}>{platform.name}</Text>
            <Text style={styles.profileName}>@{data.profile.name}</Text>
          </View>
        </View>
        <Animated.View
          style={[
            styles.statusIndicator,
            {
              backgroundColor: isExpired ? '#ff6b6b' : '#4cd964',
              transform: [{
                scale: isExpired ? (pulseAnims[platformId] || new Animated.Value(1)) : 1,
              }],
            },
          ]}
        />
        <View style={styles.deleteIndicator}>
          <Ionicons name="trash-outline" size={24} color="#ff4444" />
        </View>
      </Animated.View>
    );
  };

  const renderConnectionStatus = () => {
    if (isLoadingConnections) {
      return (
        <Animated.View 
          style={[
            styles.loadingContainer,
            { opacity: fadeAnim }
          ]}
        >
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Loading connections...</Text>
        </Animated.View>
      );
    }

    const connectedPlatforms = Object.entries(connections);

    if (connectedPlatforms.length === 0) {
      return (
        <Animated.View
          style={[
            styles.emptyConnectionsContainer,
            {
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              }],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.emptyConnectionsButton}
            onPress={() => navigation.navigate('ConnectChannel')}
          >
            <Ionicons name="add-circle-outline" size={24} color={colors.primary} />
            <Text style={styles.emptyConnectionsText}>Connect your first account</Text>
          </TouchableOpacity>
        </Animated.View>
      );
    }

    return (
      <Animated.View 
        style={[
          styles.connectionsContainer,
          { opacity: fadeAnim }
        ]}
      >
        {connectedPlatforms.map((entry, index) => renderConnectionItem(entry, index))}
        
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            }],
          }}
        >
          <TouchableOpacity
            style={styles.addMoreButton}
            onPress={() => navigation.navigate('ConnectChannel')}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
            <Text style={styles.addMoreText}>Add more</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    );
  };

  const handleEditProfile = () => {
    if (!user) return;
    
    navigation.navigate('EditProfile', {
      profile: {
        name: user.name,
        bio: user.bio,
        picture: user.picture,
      }
    });
  };

  const handleConnectChannel = () => {
    navigation.navigate('ConnectChannel');
  };

  return (
    <SafeAreaView style={commonStyles.screenContainer}>
      <ScrollView
        style={styles.scrollContent}
        refreshControl={
          <RefreshControl 
            refreshing={isRefreshing} 
            onPress={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={styles.header}>
          <Text style={commonStyles.heading1}>Profile</Text>
          {renderRefreshIcon()}
        </View>

        <View style={commonStyles.contentContainer}>
          <View style={styles.profileSection}>
            <Image
              source={{ uri: user?.picture || require('../../assets/default-avatar.png') }}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={commonStyles.heading2}>{user?.name || 'User'}</Text>
              <Text style={[commonStyles.bodyText, styles.emailText]}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[commonStyles.heading3, styles.sectionTitle]}>Account Settings</Text>
            <View style={styles.card}>
              {renderSettingsItem(
                'person-outline',
                'Edit Profile',
                handleEditProfile
              )}
              {renderSettingsItem(
                'people-outline',
                'Team Management',
                () => navigation.navigate('TeamManagement')
              )}
              {renderSettingsItem(
                'log-out-outline',
                'Logout',
                handleLogout,
                colors.error
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[commonStyles.heading3, styles.sectionTitle]}>Connected Accounts</Text>
            <View style={styles.card}>
              {isLoadingConnections ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                SOCIAL_PLATFORMS.map((platform) => {
                  const connection = connections[platform.id];
                  const isExpired = connection && isTokenExpired(connection.expiresAt);
                  const pulseAnim = pulseAnims[platform.id] || new Animated.Value(1);
                  const swipeAnim = swipeAnims[platform.id] || new Animated.Value(0);

                  return (
                    <Animated.View
                      key={platform.id}
                      ref={ref => swipeableRefs.current[platform.id] = ref}
                      style={[
                        styles.connectionItem,
                        {
                          transform: [{ translateX: swipeAnim }],
                        },
                      ]}
                      {...createSwipeHandler(platform.id).panHandlers}
                    >
                      <View style={styles.connectionContent}>
                        <View style={styles.connectionLeft}>
                          <Image
                            source={platform.icon}
                            style={styles.platformIcon}
                          />
                          <View>
                            <Text style={commonStyles.bodyText}>{platform.name}</Text>
                            {connection && (
                              <Text style={commonStyles.caption}>
                                {connection.profile.name}
                              </Text>
                            )}
                          </View>
                        </View>
                        {connection ? (
                          <Animated.View
                            style={[
                              styles.connectionStatus,
                              {
                                transform: [{ scale: pulseAnim }],
                              },
                            ]}
                          >
                            <View
                              style={[
                                styles.statusDot,
                                {
                                  backgroundColor: isExpired
                                    ? colors.warning
                                    : colors.success,
                                },
                              ]}
                            />
                            <Text
                              style={[
                                styles.statusText,
                                {
                                  color: isExpired
                                    ? colors.warning
                                    : colors.success,
                                },
                              ]}
                            >
                              {isExpired ? 'Expired' : 'Connected'}
                            </Text>
                          </Animated.View>
                        ) : (
                          <TouchableOpacity
                            style={commonStyles.secondaryButton}
                            onPress={handleConnectChannel}
                          >
                            <Text style={commonStyles.secondaryButtonText}>Connect</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </Animated.View>
                  );
                })
              )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.round,
    marginRight: spacing.md,
  },
  profileInfo: {
    flex: 1,
  },
  emailText: {
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsIcon: {
    marginRight: spacing.md,
  },
  settingsItemText: {
    fontSize: typography.body,
    fontWeight: '500',
  },
  connectionItem: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  connectionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  connectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  platformIcon: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.md,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.round,
  },
  statusText: {
    fontSize: typography.small,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyConnectionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
  },
  emptyConnectionsText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.primary,
  },
  connectionsContainer: {
    paddingHorizontal: spacing.md,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginTop: spacing.md,
  },
  addMoreText: {
    marginLeft: 8,
    fontSize: 16,
    color: colors.primary,
  },
  emptyConnectionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  deleteIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: colors.surface,
    borderTopRightRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 