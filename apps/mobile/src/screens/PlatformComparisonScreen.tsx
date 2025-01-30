import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { SOCIAL_PLATFORMS, SocialPlatform } from './ConnectChannelScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'PlatformComparison'>;

type ComparisonCategory = 'posting' | 'media' | 'analytics' | 'features';

export const PlatformComparisonScreen = ({ navigation }: Props) => {
  const [selectedCategory, setSelectedCategory] = useState<ComparisonCategory>('posting');

  const categories: { id: ComparisonCategory; label: string; icon: string }[] = [
    { id: 'posting', label: 'Posting', icon: 'create' },
    { id: 'media', label: 'Media', icon: 'images' },
    { id: 'analytics', label: 'Analytics', icon: 'bar-chart' },
    { id: 'features', label: 'Features', icon: 'apps' },
  ];

  const renderPlatformComparison = (platform: SocialPlatform) => {
    const getComparisonContent = () => {
      switch (selectedCategory) {
        case 'posting':
          return (
            <>
              <View style={styles.featureRow}>
                <Ionicons
                  name={platform.features.canPost ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={platform.features.canPost ? '#4cd964' : '#ff6b6b'}
                />
                <Text style={styles.featureText}>Create Posts</Text>
              </View>
              <View style={styles.featureRow}>
                <Ionicons
                  name={platform.features.canSchedule ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={platform.features.canSchedule ? '#4cd964' : '#ff6b6b'}
                />
                <Text style={styles.featureText}>Schedule Posts</Text>
              </View>
              {platform.features.characterLimit && (
                <View style={styles.featureRow}>
                  <Ionicons name="text" size={20} color="#007AFF" />
                  <Text style={styles.featureText}>
                    {platform.features.characterLimit} characters
                  </Text>
                </View>
              )}
            </>
          );

        case 'media':
          return (
            <>
              <View style={styles.featureRow}>
                <Ionicons name="images" size={20} color="#007AFF" />
                <Text style={styles.featureText}>
                  Up to {platform.features.maxMediaFiles} files
                </Text>
              </View>
              <View style={styles.mediaTypes}>
                {platform.features.supportedMediaTypes.map((type, index) => (
                  <View key={index} style={styles.mediaType}>
                    <Ionicons
                      name={type.includes('video') ? 'videocam' : 'image'}
                      size={16}
                      color="#666"
                    />
                    <Text style={styles.mediaTypeText}>
                      {type.split('/')[1].toUpperCase()}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          );

        case 'analytics':
          return (
            <View style={styles.analyticsList}>
              {platform.features.analytics.map((metric, index) => (
                <View key={index} style={styles.metricItem}>
                  <Ionicons name="analytics" size={16} color="#007AFF" />
                  <Text style={styles.metricText}>
                    {metric.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </Text>
                </View>
              ))}
            </View>
          );

        case 'features':
          return (
            <View style={styles.featuresList}>
              {platform.features.additionalFeatures.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons name="star" size={16} color="#007AFF" />
                  <Text style={styles.featureItemText}>
                    {feature.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')}
                  </Text>
                </View>
              ))}
            </View>
          );
      }
    };

    return (
      <View style={styles.platformCard}>
        <View style={styles.platformHeader}>
          <Image source={platform.icon} style={styles.platformIcon} />
          <Text style={styles.platformName}>{platform.name}</Text>
        </View>
        <View style={styles.comparisonContent}>
          {getComparisonContent()}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.title}>Platform Comparison</Text>
      </View>

      <View style={styles.categoryTabs}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryTab,
              selectedCategory === category.id && styles.categoryTabActive,
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <Ionicons
              name={category.icon as any}
              size={20}
              color={selectedCategory === category.id ? '#007AFF' : '#666'}
            />
            <Text
              style={[
                styles.categoryLabel,
                selectedCategory === category.id && styles.categoryLabelActive,
              ]}
            >
              {category.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content}>
        {SOCIAL_PLATFORMS.map(platform => renderPlatformComparison(platform))}
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
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  categoryTabs: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#f8f8f8',
  },
  categoryTab: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  categoryTabActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  categoryLabelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  platformCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  platformHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  platformIcon: {
    width: 32,
    height: 32,
    marginRight: 12,
  },
  platformName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  comparisonContent: {
    marginTop: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  mediaTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  mediaType: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  mediaTypeText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  analyticsList: {
    marginTop: 8,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  featuresList: {
    marginTop: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
}); 