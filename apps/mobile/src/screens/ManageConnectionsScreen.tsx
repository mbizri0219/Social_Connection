import React, { useEffect, useState, useRef } from 'react';
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
import { useAuth } from '../hooks/useAuth';
import { env } from '../config/env';

type Props = NativeStackScreenProps<RootStackParamList, 'ManageConnections'>;

interface Connection {
  id: string;
  name: string;
  picture?: string;
  profile?: string;
  providerIdentifier: string;
}

export const ManageConnectionsScreen = ({ navigation }: Props) => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const loadingSpinValue = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start fade-in animation when component mounts
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Start infinite rotation for loading spinner
    const spinAnimation = Animated.loop(
      Animated.timing(loadingSpinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    if (loading) {
      spinAnimation.start();
    } else {
      spinAnimation.stop();
    }

    return () => {
      spinAnimation.stop();
    };
  }, [loading]);

  const spin = loadingSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

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

  const fetchConnections = async () => {
    try {
      const response = await fetch(`${env.API_URL}/auth/connections`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConnections(data);
      } else {
        throw new Error('Failed to fetch connections');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load connected accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async (connection: Connection) => {
    Alert.alert(
      'Disconnect Account',
      `Are you sure you want to disconnect ${connection.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(
                `${env.API_URL}/auth/connections/${connection.id}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                  },
                }
              );

              if (response.ok) {
                // Fade out animation before removing
                Animated.timing(fadeAnim, {
                  toValue: 0,
                  duration: 200,
                  useNativeDriver: true,
                }).start(() => {
                  setConnections(prev => 
                    prev.filter(conn => conn.id !== connection.id)
                  );
                  // Fade back in
                  Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                  }).start();
                });
                Alert.alert('Success', 'Account disconnected successfully');
              } else {
                throw new Error('Failed to disconnect account');
              }
            } catch (error) {
              triggerShake();
              Alert.alert('Error', 'Failed to disconnect account');
            }
          },
        },
      ]
    );
  };

  const renderConnection = (connection: Connection) => (
    <Animated.View
      key={connection.id}
      style={[
        styles.connectionCard,
        {
          opacity: fadeAnim,
          transform: [
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
      <View style={styles.connectionInfo}>
        {connection.picture ? (
          <Image 
            source={{ uri: connection.picture }} 
            style={styles.profilePicture}
          />
        ) : (
          <View style={[styles.profilePicture, styles.placeholderPicture]}>
            <Ionicons name="person" size={24} color="#666" />
          </View>
        )}
        <View style={styles.connectionDetails}>
          <Text style={styles.connectionName}>{connection.name}</Text>
          {connection.profile && (
            <Text style={styles.profileName}>@{connection.profile}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity
        onPress={() => handleDisconnect(connection)}
        style={styles.disconnectButton}
      >
        <Ionicons name="trash-outline" size={20} color="#ff4444" />
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Connected Accounts</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('ConnectChannel')}
          style={styles.addButton}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sync" size={48} color="#007AFF" />
          </Animated.View>
          <Text style={styles.loadingText}>Loading connections...</Text>
        </Animated.View>
      ) : connections.length === 0 ? (
        <Animated.View 
          style={[
            styles.emptyContainer,
            { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })}] }
          ]}
        >
          <Ionicons name="link" size={48} color="#666" />
          <Text style={styles.emptyText}>No connected accounts</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('ConnectChannel')}
            style={styles.connectButton}
          >
            <Text style={styles.connectButtonText}>Connect Account</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.ScrollView 
          style={[styles.content, { opacity: fadeAnim }]}
          contentContainerStyle={styles.contentContainer}
        >
          {connections.map(renderConnection)}
        </Animated.ScrollView>
      )}
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
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 24,
  },
  connectButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 12,
  },
  connectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  placeholderPicture: {
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionDetails: {
    marginLeft: 12,
    flex: 1,
  },
  connectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  profileName: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  disconnectButton: {
    padding: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  contentContainer: {
    padding: 16,
  },
}); 