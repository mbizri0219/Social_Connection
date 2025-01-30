import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../hooks/useAuth';
import { env } from '../config/env';

interface PlatformStats {
  id: string;
  name: string;
  icon: string;
  followers: number;
  followersGrowth: number;
  engagement: number;
  engagementGrowth: number;
  impressions: number;
  impressionsGrowth: number;
}

export const AnalyticsScreen = () => {
  const { accessToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats[]>([]);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${env.API_URL}/analytics`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const renderPlatformCard = (platform: PlatformStats) => (
    <View key={platform.id} style={styles.platformCard}>
      <View style={styles.platformHeader}>
        <View style={styles.platformInfo}>
          <Ionicons name={platform.icon as any} size={24} color={colors.primary} />
          <Text style={styles.platformName}>{platform.name}</Text>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Followers</Text>
          <Text style={styles.statValue}>{formatNumber(platform.followers)}</Text>
          <View style={[styles.growthBadge, platform.followersGrowth >= 0 ? styles.positiveGrowth : styles.negativeGrowth]}>
            <Text style={styles.growthText}>
              {platform.followersGrowth >= 0 ? '+' : ''}{platform.followersGrowth}%
            </Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Engagement</Text>
          <Text style={styles.statValue}>{platform.engagement}%</Text>
          <View style={[styles.growthBadge, platform.engagementGrowth >= 0 ? styles.positiveGrowth : styles.negativeGrowth]}>
            <Text style={styles.growthText}>
              {platform.engagementGrowth >= 0 ? '+' : ''}{platform.engagementGrowth}%
            </Text>
          </View>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Impressions</Text>
          <Text style={styles.statValue}>{formatNumber(platform.impressions)}</Text>
          <View style={[styles.growthBadge, platform.impressionsGrowth >= 0 ? styles.positiveGrowth : styles.negativeGrowth]}>
            <Text style={styles.growthText}>
              {platform.impressionsGrowth >= 0 ? '+' : ''}{platform.impressionsGrowth}%
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

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
        <Text style={commonStyles.heading1}>Analytics</Text>
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
        {stats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="analytics-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Analytics Available</Text>
            <Text style={styles.emptySubtitle}>
              Connect your social media accounts to view analytics
            </Text>
          </View>
        ) : (
          stats.map(renderPlatformCard)
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
  platformCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  platformHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
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
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.small,
    marginBottom: spacing.xs,
  },
  statValue: {
    color: colors.text,
    fontSize: typography.h3,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  growthBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  positiveGrowth: {
    backgroundColor: colors.success + '20',
  },
  negativeGrowth: {
    backgroundColor: colors.error + '20',
  },
  growthText: {
    fontSize: typography.tiny,
    color: colors.text,
  },
}); 