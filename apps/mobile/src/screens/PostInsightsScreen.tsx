import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { env } from '../config/env';
import { LineChart } from 'react-native-chart-kit';

type Props = NativeStackScreenProps<RootStackParamList, 'PostInsights'>;

interface PostInsight {
  id: string;
  platform: string;
  content: string;
  mediaUrls?: string[];
  publishedAt: string;
  metrics: {
    likes: number;
    comments: number;
    shares: number;
    reach: number;
    impressions: number;
    clicks: number;
    engagement: number;
  };
  hourlyEngagement: {
    hour: string;
    value: number;
  }[];
  demographicData: {
    ageGroups: {
      label: string;
      percentage: number;
    }[];
    genderSplit: {
      label: string;
      percentage: number;
    }[];
    topLocations: {
      location: string;
      percentage: number;
    }[];
  };
}

export const PostInsightsScreen = ({ route, navigation }: Props) => {
  const { postId } = route.params;
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<PostInsight | null>(null);

  const fetchInsights = async () => {
    try {
      const response = await fetch(`${env.API_URL}/posts/${postId}/insights`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch post insights');
      }

      const data = await response.json();
      setInsights(data);
    } catch (error) {
      console.error('Error fetching post insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [postId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInsights();
  };

  const renderMetricCard = (title: string, value: number, icon: string, subtitle?: string) => (
    <View style={styles.metricCard}>
      <Ionicons name={icon as any} size={24} color="#007AFF" />
      <Text style={styles.metricValue}>{value.toLocaleString()}</Text>
      <Text style={styles.metricTitle}>{title}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </View>
  );

  const renderEngagementChart = () => {
    if (!insights?.hourlyEngagement) return null;

    const data = {
      labels: insights.hourlyEngagement.map(h => h.hour),
      datasets: [{
        data: insights.hourlyEngagement.map(h => h.value),
      }],
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.sectionTitle}>Engagement Over Time</Text>
        <LineChart
          data={data}
          width={Dimensions.get('window').width - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>
    );
  };

  const renderDemographics = () => {
    if (!insights?.demographicData) return null;

    return (
      <View style={styles.demographicsContainer}>
        <Text style={styles.sectionTitle}>Audience Demographics</Text>
        
        <View style={styles.demographicSection}>
          <Text style={styles.subsectionTitle}>Age Groups</Text>
          {insights.demographicData.ageGroups.map((group, index) => (
            <View key={index} style={styles.barContainer}>
              <Text style={styles.barLabel}>{group.label}</Text>
              <View style={styles.barWrapper}>
                <View style={[styles.bar, { width: `${group.percentage}%` }]} />
                <Text style={styles.barValue}>{group.percentage}%</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.demographicSection}>
          <Text style={styles.subsectionTitle}>Gender Distribution</Text>
          <View style={styles.genderContainer}>
            {insights.demographicData.genderSplit.map((item, index) => (
              <View key={index} style={styles.genderItem}>
                <Text style={styles.genderLabel}>{item.label}</Text>
                <Text style={styles.genderValue}>{item.percentage}%</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.demographicSection}>
          <Text style={styles.subsectionTitle}>Top Locations</Text>
          {insights.demographicData.topLocations.map((location, index) => (
            <View key={index} style={styles.locationItem}>
              <Text style={styles.locationName}>{location.location}</Text>
              <Text style={styles.locationValue}>{location.percentage}%</Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!insights) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#ff3b30" />
        <Text style={styles.errorText}>Failed to load insights</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Post Insights</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.postPreview}>
          <View style={styles.platformIndicator}>
            <Ionicons
              name={insights.platform.toLowerCase() === 'twitter' ? 'logo-twitter' : 'share-social'}
              size={20}
              color="#007AFF"
            />
            <Text style={styles.platformText}>{insights.platform}</Text>
          </View>
          <Text style={styles.postContent}>{insights.content}</Text>
          {insights.mediaUrls && insights.mediaUrls.length > 0 && (
            <ScrollView horizontal style={styles.mediaScroll}>
              {insights.mediaUrls.map((url, index) => (
                <Image
                  key={index}
                  source={{ uri: url }}
                  style={styles.mediaPreview}
                />
              ))}
            </ScrollView>
          )}
          <Text style={styles.postDate}>
            Posted {new Date(insights.publishedAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Reach',
            insights.metrics.reach,
            'eye-outline',
            'Unique viewers'
          )}
          {renderMetricCard(
            'Impressions',
            insights.metrics.impressions,
            'bar-chart-outline',
            'Total views'
          )}
          {renderMetricCard(
            'Engagement',
            insights.metrics.engagement,
            'heart-outline',
            `${(insights.metrics.engagement * 100).toFixed(2)}%`
          )}
          {renderMetricCard(
            'Clicks',
            insights.metrics.clicks,
            'finger-print-outline',
            'Link clicks'
          )}
        </View>

        {renderEngagementChart()}
        {renderDemographics()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  postPreview: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  platformIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  platformText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  postContent: {
    fontSize: 16,
    marginBottom: 12,
  },
  mediaScroll: {
    marginBottom: 12,
  },
  mediaPreview: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  postDate: {
    color: '#666',
    fontSize: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  metricCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  metricTitle: {
    fontSize: 14,
    color: '#666',
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  chartContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  demographicsContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  demographicSection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#666',
  },
  barContainer: {
    marginBottom: 8,
  },
  barLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  barWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bar: {
    height: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  barValue: {
    marginLeft: 8,
    fontSize: 12,
    color: '#666',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  genderItem: {
    alignItems: 'center',
  },
  genderLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  genderValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  locationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 14,
  },
  locationValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
}); 