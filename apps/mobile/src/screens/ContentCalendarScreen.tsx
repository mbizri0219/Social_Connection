import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, commonStyles } from '../styles/theme';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../hooks/useAuth';

interface Post {
  id: string;
  content: string;
  scheduledAt: string;
  platform: {
    id: string;
    name: string;
    icon: string;
  };
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
}

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ContentCalendarScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const fetch = useFetch();
  const { accessToken } = useAuth();

  const loadPosts = async () => {
    try {
      const response = await fetch('/posts/scheduled', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch scheduled posts');
      }

      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching scheduled posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    loadPosts();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
  }, []);

  const handleCreatePost = () => {
    navigation.navigate('CreatePost', { platformId: '' });
  };

  const renderPost = (post: Post) => {
    const date = dayjs(post.scheduledAt);
    const isToday = date.isSame(dayjs(), 'day');
    const isTomorrow = date.isSame(dayjs().add(1, 'day'), 'day');
    
    let dateText = date.format('MMM D');
    if (isToday) dateText = 'Today';
    if (isTomorrow) dateText = 'Tomorrow';

    return (
      <TouchableOpacity
        key={post.id}
        style={styles.postCard}
        onPress={() => navigation.navigate('CreatePost', { 
          platformId: post.platform.id,
          editPostId: post.id 
        })}
        activeOpacity={0.7}
      >
        <View style={styles.postHeader}>
          <View style={styles.platformInfo}>
            <Ionicons name={post.platform.icon as any} size={24} color={colors.primary} />
            <Text style={styles.platformName}>{post.platform.name}</Text>
          </View>
          <View style={[styles.statusBadge, post.status === 'DRAFT' && styles.draftBadge]}>
            <Text style={styles.statusText}>{post.status.toLowerCase()}</Text>
          </View>
        </View>
        <Text style={styles.postContent} numberOfLines={2}>
          {post.content}
        </Text>
        <View style={styles.postFooter}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={styles.scheduleText}>{dateText} at {date.format('h:mm A')}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={commonStyles.screenContainer}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={commonStyles.screenContainer}>
      <View style={styles.header}>
        <Text style={commonStyles.heading1}>Content Calendar</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={handleCreatePost}
        >
          <Ionicons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Scheduled Posts</Text>
            <Text style={styles.emptySubtitle}>
              Create your first post by tapping the + button above
            </Text>
          </View>
        ) : (
          posts.map(renderPost)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  createButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surfaceHover,
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
    padding: spacing.xl,
    minHeight: 400,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: typography.h2,
    fontWeight: 'bold',
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  postCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  statusBadge: {
    backgroundColor: colors.success + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  draftBadge: {
    backgroundColor: colors.warning + '20',
  },
  statusText: {
    color: colors.success,
    fontSize: typography.small,
    textTransform: 'capitalize',
  },
  postContent: {
    color: colors.text,
    fontSize: typography.body,
    marginBottom: spacing.md,
  },
  postFooter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleText: {
    color: colors.textSecondary,
    fontSize: typography.small,
    marginLeft: spacing.xs,
  },
}); 