import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFetch } from '../hooks/useFetch';
import useSWR from 'swr';
import { CompositeScreenProps } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { RootStackParamList, MainTabParamList } from '../navigation/types';
import { useNavigation } from '@react-navigation/native';
import { colors, typography, spacing, borderRadius, commonStyles } from '../styles/theme';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  NativeStackScreenProps<RootStackParamList>
>;

type Integration = {
  id: string;
  name: string;
  identifier: string;
  picture: string;
  disabled: boolean;
};

type Post = {
  id: string;
  content: string;
  publishDate: string;
  integration: Integration;
};

export const HomeScreen = ({ navigation }: Props) => {
  const fetch = useFetch();
  const [refreshing, setRefreshing] = React.useState(false);

  const loadIntegrations = React.useCallback(async () => {
    const response = await fetch('/integrations/list');
    const data = await response.json();
    return data.integrations;
  }, []);

  const loadPosts = React.useCallback(async () => {
    const response = await fetch('/posts');
    const data = await response.json();
    return data.posts;
  }, []);

  const { data: integrations, isLoading: isLoadingIntegrations, mutate: mutateIntegrations } = useSWR<Integration[]>(
    '/integrations/list',
    loadIntegrations,
    {
      fallbackData: [],
    }
  );

  const { data: posts, isLoading: isLoadingPosts, mutate: mutatePosts } = useSWR<Post[]>(
    '/posts',
    loadPosts,
    {
      fallbackData: [],
    }
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([mutateIntegrations(), mutatePosts()]);
    setRefreshing(false);
  }, [mutateIntegrations, mutatePosts]);

  const activeIntegrations = integrations?.filter(integration => !integration.disabled) || [];

  const handleConnectChannel = () => {
    navigation.navigate('ConnectChannel');
  };

  return (
    <SafeAreaView style={commonStyles.screenContainer}>
      <ScrollView 
        style={styles.scrollContent}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
          <TouchableOpacity 
            style={commonStyles.primaryButton}
            onPress={handleConnectChannel}
          >
            <Text style={commonStyles.primaryButtonText}>Connect Channel</Text>
          </TouchableOpacity>
        </View>

        {isLoadingIntegrations || isLoadingPosts ? (
          <View style={commonStyles.contentContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            {activeIntegrations.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[commonStyles.heading2, styles.emptyText]}>No channels connected</Text>
                <TouchableOpacity 
                  style={commonStyles.primaryButton}
                  onPress={handleConnectChannel}
                >
                  <Text style={commonStyles.primaryButtonText}>Connect a Channel</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={commonStyles.contentContainer}>
                <View style={styles.channelsContainer}>
                  <Text style={commonStyles.heading3}>Your Channels</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.channelsList}>
                    {activeIntegrations.map((integration) => (
                      <View key={integration.id} style={styles.channelItem}>
                        <Image
                          source={{ uri: integration.picture }}
                          style={styles.channelImage}
                        />
                        <Text style={styles.channelName}>{integration.name}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>

                <View style={styles.postsContainer}>
                  <Text style={commonStyles.heading3}>Recent Posts</Text>
                  {posts?.map((post) => (
                    <View key={post.id} style={styles.postItem}>
                      <View style={styles.postHeader}>
                        <Image
                          source={{ uri: post.integration.picture }}
                          style={styles.postAuthorImage}
                        />
                        <View>
                          <Text style={styles.postAuthorName}>{post.integration.name}</Text>
                          <Text style={commonStyles.caption}>
                            {new Date(post.publishDate).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <Text style={commonStyles.bodyText}>{post.content}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.h1,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: typography.fontFamily,
  },
  channelsContainer: {
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  channelsList: {
    flexGrow: 0,
    marginTop: spacing.md,
  },
  channelItem: {
    marginRight: spacing.md,
    alignItems: 'center',
    width: 80,
    backgroundColor: colors.surfaceHover,
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  channelImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.round,
    marginBottom: spacing.sm,
  },
  channelName: {
    fontSize: typography.tiny,
    textAlign: 'center',
    color: colors.text,
  },
  postsContainer: {
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  postItem: {
    padding: spacing.md,
    backgroundColor: colors.surfaceHover,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  postAuthorImage: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
    marginRight: spacing.sm,
  },
  postAuthorName: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    backgroundColor: colors.surface,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
  },
  emptyText: {
    marginBottom: spacing.md,
    textAlign: 'center',
  },
}); 