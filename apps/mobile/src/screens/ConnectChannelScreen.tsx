import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { initiateOAuth } from '../utils/oauth';
import { env } from '../config/env';
import { useAuth } from '../hooks/useAuth';
import { handleTokenRefresh, isTokenExpired } from '../utils/tokenRefresh';
import * as SecureStore from 'expo-secure-store';

// Import platform icons statically
const twitterIcon = require('../../assets/icons/twitter.png');
const instagramIcon = require('../../assets/icons/instagram.png');
const linkedinIcon = require('../../assets/icons/linkedin.png');
const facebookIcon = require('../../assets/icons/facebook.png');
const youtubeIcon = require('../../assets/icons/youtube.png');
const tiktokIcon = require('../../assets/icons/tiktok.png');
const pinterestIcon = require('../../assets/icons/pinterest.png');
const threadsIcon = require('../../assets/icons/threads.png');

type Props = NativeStackScreenProps<RootStackParamList, 'ConnectChannel'>;

type ConnectionState = {
  [key: string]: {
    isConnecting: boolean;
    error: string | null;
  };
};

interface ConnectionResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  profile: {
    id: string;
    name: string;
    picture?: string;
  };
}

interface PlatformFeatures {
  canPost: boolean;
  canSchedule: boolean;
  maxMediaFiles: number;
  supportedMediaTypes: string[];
  characterLimit?: number;
  analytics: string[];
  additionalFeatures: string[];
}

export interface SocialPlatform {
  id: string;
  name: string;
  icon: any;
  features: PlatformFeatures;
  config: {
    platform: string;
    clientId: string;
    clientSecret: string;
    authUrl: string;
    tokenUrl: string;
    scopes: string[];
  };
}

export const SOCIAL_PLATFORMS: SocialPlatform[] = [
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: twitterIcon,
    features: {
      canPost: true,
      canSchedule: true,
      maxMediaFiles: 4,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
      characterLimit: 280,
      analytics: ['impressions', 'engagements', 'likes', 'retweets', 'replies'],
      additionalFeatures: ['polls', 'threads', 'spaces'],
    },
    config: {
      platform: 'twitter',
      clientId: env.TWITTER_CLIENT_ID,
      clientSecret: env.TWITTER_CLIENT_SECRET,
      authUrl: 'https://twitter.com/i/oauth2/authorize',
      tokenUrl: 'https://api.twitter.com/2/oauth2/token',
      scopes: ['tweet.read', 'tweet.write', 'users.read'],
    }
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: instagramIcon,
    features: {
      canPost: true,
      canSchedule: true,
      maxMediaFiles: 10,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      characterLimit: 2200,
      analytics: ['reach', 'impressions', 'saves', 'shares', 'profile_visits'],
      additionalFeatures: ['stories', 'reels', 'carousel'],
    },
    config: {
      platform: 'instagram',
      clientId: env.INSTAGRAM_CLIENT_ID,
      clientSecret: env.INSTAGRAM_CLIENT_SECRET,
      authUrl: 'https://api.instagram.com/oauth/authorize',
      tokenUrl: 'https://api.instagram.com/oauth/access_token',
      scopes: ['basic', 'comments', 'relationships'],
    }
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: linkedinIcon,
    features: {
      canPost: true,
      canSchedule: true,
      maxMediaFiles: 9,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'],
      characterLimit: 3000,
      analytics: ['impressions', 'clicks', 'reactions', 'shares', 'comments'],
      additionalFeatures: ['articles', 'newsletters', 'documents'],
    },
    config: {
      platform: 'linkedin',
      clientId: env.LINKEDIN_CLIENT_ID,
      clientSecret: env.LINKEDIN_CLIENT_SECRET,
      authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
      tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
      scopes: ['r_liteprofile', 'w_member_social'],
    }
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: facebookIcon,
    features: {
      canPost: true,
      canSchedule: true,
      maxMediaFiles: 10,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4', 'video/quicktime'],
      characterLimit: 63206,
      analytics: ['reach', 'engagement', 'page_views', 'reactions', 'shares'],
      additionalFeatures: ['stories', 'live_video', 'events', 'groups'],
    },
    config: {
      platform: 'facebook',
      clientId: env.FACEBOOK_CLIENT_ID,
      clientSecret: env.FACEBOOK_CLIENT_SECRET,
      authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
      tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
      scopes: ['public_profile', 'pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
    }
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: youtubeIcon,
    features: {
      canPost: true,
      canSchedule: true,
      maxMediaFiles: 1,
      supportedMediaTypes: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
      analytics: ['views', 'watch_time', 'subscribers', 'likes', 'comments'],
      additionalFeatures: ['playlists', 'shorts', 'live_streaming', 'chapters'],
    },
    config: {
      platform: 'youtube',
      clientId: env.YOUTUBE_CLIENT_ID,
      clientSecret: env.YOUTUBE_CLIENT_SECRET,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/youtube.readonly',
        'https://www.googleapis.com/auth/youtube.upload',
        'https://www.googleapis.com/auth/youtube.force-ssl'
      ],
    }
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: tiktokIcon,
    features: {
      canPost: true,
      canSchedule: false,
      maxMediaFiles: 1,
      supportedMediaTypes: ['video/mp4'],
      characterLimit: 2200,
      analytics: ['views', 'likes', 'comments', 'shares', 'profile_views'],
      additionalFeatures: ['duets', 'stitches', 'effects', 'sounds'],
    },
    config: {
      platform: 'tiktok',
      clientId: env.TIKTOK_CLIENT_ID,
      clientSecret: env.TIKTOK_CLIENT_SECRET,
      authUrl: 'https://www.tiktok.com/auth/authorize/',
      tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
      scopes: ['user.info.basic', 'video.list', 'video.upload'],
    }
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    icon: pinterestIcon,
    features: {
      canPost: true,
      canSchedule: true,
      maxMediaFiles: 1,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      characterLimit: 500,
      analytics: ['impressions', 'saves', 'clicks', 'outbound_clicks'],
      additionalFeatures: ['boards', 'rich_pins', 'idea_pins', 'shopping'],
    },
    config: {
      platform: 'pinterest',
      clientId: env.PINTEREST_CLIENT_ID,
      clientSecret: env.PINTEREST_CLIENT_SECRET,
      authUrl: 'https://www.pinterest.com/oauth/',
      tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
      scopes: ['boards:read', 'pins:read', 'pins:write'],
    }
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: threadsIcon,
    features: {
      canPost: true,
      canSchedule: false,
      maxMediaFiles: 10,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      characterLimit: 500,
      analytics: ['likes', 'replies', 'reposts', 'reach'],
      additionalFeatures: ['quote_posts', 'mentions', 'voice_threads'],
    },
    config: {
      platform: 'threads',
      clientId: env.THREADS_CLIENT_ID,
      clientSecret: env.THREADS_CLIENT_SECRET,
      authUrl: 'https://www.threads.net/oauth/authorize',
      tokenUrl: 'https://www.threads.net/oauth/access_token',
      scopes: ['basic'],
    }
  }
];

export const ConnectChannelScreen = ({ navigation }: Props) => {
  const [connectionState, setConnectionState] = useState<ConnectionState>({});
  const { token } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const triggerShake = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleConnect = async (platform: SocialPlatform) => {
    if (!token) {
      triggerShake();
      Alert.alert('Error', 'You must be logged in to connect social accounts');
      return;
    }

    setConnectionState(prev => ({
      ...prev,
      [platform.id]: { isConnecting: true, error: null }
    }));

    try {
      const result = await initiateOAuth(platform.config);
      
      if (result.type === 'success' && result.params?.code) {
        try {
          const response = await fetch(`${env.API_URL}/auth/${platform.id}/callback`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              code: result.params.code,
              state: result.params.state,
            }),
          });

          if (response.ok) {
            const data: ConnectionResponse = await response.json();
            
            // Store connection data in secure storage
            const connectionData = {
              accessToken: data.access_token,
              refreshToken: data.refresh_token,
              expiresAt: Date.now() + (data.expires_in * 1000),
              profile: data.profile,
            };

            try {
              await SecureStore.setItemAsync(
                `connection_${platform.id}`,
                JSON.stringify(connectionData)
              );

              // Set up refresh token handler
              const checkTokenExpiration = () => {
                if (isTokenExpired(connectionData.expiresAt)) {
                  handleTokenRefresh(
                    platform.id,
                    connectionData.refreshToken,
                    token,
                    async (newTokens) => {
                      const updatedData = {
                        ...connectionData,
                        accessToken: newTokens.access_token,
                        refreshToken: newTokens.refresh_token || connectionData.refreshToken,
                        expiresAt: Date.now() + (newTokens.expires_in * 1000),
                      };
                      await SecureStore.setItemAsync(
                        `connection_${platform.id}`,
                        JSON.stringify(updatedData)
                      );
                    },
                    (error) => {
                      console.error('Token refresh failed:', error);
                      // Handle failed refresh (e.g., prompt user to reconnect)
                      Alert.alert(
                        'Connection Error',
                        'Your connection has expired. Please reconnect your account.',
                        [
                          {
                            text: 'Reconnect',
                            onPress: () => handleConnect(platform),
                          },
                          {
                            text: 'Cancel',
                            style: 'cancel',
                          },
                        ]
                      );
                    }
                  );
                }
              };

              // Check token expiration every minute
              const tokenCheckInterval = setInterval(checkTokenExpiration, 60000);

              // Success animation
              Animated.sequence([
                Animated.timing(scaleAnim, {
                  toValue: 1.05,
                  duration: 100,
                  useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                  toValue: 1,
                  duration: 100,
                  useNativeDriver: true,
                }),
              ]).start(() => {
                Alert.alert(
                  'Success',
                  `Successfully connected to ${platform.name}!`,
                  [{ 
                    text: 'OK',
                    onPress: () => {
                      navigation.goBack();
                      // Clean up interval when navigating away
                      clearInterval(tokenCheckInterval);
                    }
                  }]
                );
              });
            } catch (error) {
              throw new Error('Failed to store connection data');
            }
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to connect account');
          }
        } catch (error) {
          throw new Error('Failed to connect with server');
        }
      } else if (result.params?.error) {
        throw new Error(result.params.error);
      }
    } catch (error) {
      triggerShake();
      setConnectionState(prev => ({
        ...prev,
        [platform.id]: {
          isConnecting: false,
          error: error instanceof Error ? error.message : 'Failed to connect account'
        }
      }));

      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to connect account'
      );
    } finally {
      setConnectionState(prev => ({
        ...prev,
        [platform.id]: { ...prev[platform.id], isConnecting: false }
      }));
    }
  };

  const renderPlatformButton = (platform: SocialPlatform) => {
    const state = connectionState[platform.id] || { isConnecting: false, error: null };

    const renderFeatureIndicators = () => (
      <View style={styles.featureIndicators}>
        {platform.features.canSchedule && (
          <Ionicons name="calendar" size={12} color="#007AFF" style={styles.featureIcon} />
        )}
        {platform.features.maxMediaFiles > 1 && (
          <Ionicons name="images" size={12} color="#007AFF" style={styles.featureIcon} />
        )}
        {platform.features.supportedMediaTypes.includes('video/mp4') && (
          <Ionicons name="videocam" size={12} color="#007AFF" style={styles.featureIcon} />
        )}
      </View>
    );

    return (
      <Animated.View
        key={platform.id}
        style={[
          styles.platformButton,
          state.error && styles.platformButtonError,
          {
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              {
                translateX: shakeAnimation.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-20, 0, 20],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.platformButtonContent}>
          <TouchableOpacity
            onPress={() => handleConnect(platform)}
            disabled={state.isConnecting}
            style={styles.platformButtonTouchable}
          >
            {state.isConnecting ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Connecting...</Text>
              </View>
            ) : (
              <>
                <Image source={platform.icon} style={styles.platformIcon} />
                <Text style={styles.platformName}>{platform.name}</Text>
                {renderFeatureIndicators()}
                {state.error && (
                  <Text style={styles.errorText}>Tap to retry</Text>
                )}
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.createPostButton}
            onPress={() => navigation.navigate('CreatePost', { platformId: platform.id })}
          >
            <Ionicons name="create-outline" size={16} color="#007AFF" />
            <Text style={styles.createPostText}>Create Post</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View 
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [-20, 0],
            })}],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Connect Channel</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.subtitle}>Social Media Platforms</Text>
          <TouchableOpacity
            style={styles.compareButton}
            onPress={() => navigation.navigate('PlatformComparison')}
          >
            <Ionicons name="information-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.compareButtonText}>Compare</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.grid}>
          {SOCIAL_PLATFORMS.map(renderPlatformButton)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  content: {
    padding: 16,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    color: '#000',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  platformButton: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  platformButtonError: {
    borderColor: '#ff6b6b',
    borderWidth: 1,
    backgroundColor: '#fff5f5',
  },
  platformIcon: {
    width: 36,
    height: 36,
    marginBottom: 8,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: '#ff6b6b',
    marginTop: 4,
  },
  platformButtonTouchable: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  featureIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  featureIcon: {
    marginHorizontal: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  compareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  compareButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  platformButtonContent: {
    flex: 1,
    width: '100%',
  },
  createPostButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f8ff',
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 8,
  },
  createPostText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
  },
}); 