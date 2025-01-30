import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { SOCIAL_PLATFORMS, SocialPlatform } from './ConnectChannelScreen';
import { useAuth } from '../hooks/useAuth';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PostPreview } from '../components/PostPreview';
import { env } from '../config/env';
import { PostTemplate, Template } from '../components/PostTemplate';
import { draftService } from '../services/draftService';

type Props = NativeStackScreenProps<RootStackParamList, 'CreatePost'>;

interface PostContent {
  text: string;
  media: {
    uri: string;
    type: string;
    fileName?: string;
  }[];
  scheduledFor?: Date;
}

export const CreatePostScreen = ({ route, navigation }: Props) => {
  const { platformId, draftId } = route.params;
  const platform = SOCIAL_PLATFORMS.find(p => p.id === platformId)!;
  const { token } = useAuth();
  
  const [content, setContent] = useState<PostContent>({
    text: '',
    media: [],
  });
  const [isPosting, setIsPosting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const textInputRef = useRef<TextInput>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const autoSaveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAutoSave = useRef<string | null>(null);

  useEffect(() => {
    // Load existing draft if draftId is provided
    if (draftId) {
      loadDraft();
    } else {
      // Check for auto-saved content
      checkAutoSavedContent();
    }

    // Set up auto-save interval
    startAutoSave();

    // Clean up
    return () => {
      if (autoSaveInterval.current) {
        draftService.clearAutoSaveInterval(autoSaveInterval.current);
      }
    };
  }, []);

  const loadDraft = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${env.API_URL}/posts/drafts/${draftId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load draft');
      }

      const draft = await response.json();
      setContent(prev => ({
        ...prev,
        text: draft.content,
        media: draft.mediaUrls.map(uri => ({
          uri,
          type: 'image/jpeg',
        })),
        scheduledFor: draft.scheduledFor ? new Date(draft.scheduledFor) : undefined,
      }));
    } catch (error) {
      console.error('Error loading draft:', error);
      Alert.alert('Error', 'Failed to load draft');
    } finally {
      setLoading(false);
    }
  };

  const checkAutoSavedContent = async () => {
    const autoSavedDraft = await draftService.getAutoSaveDraft(platformId);
    if (autoSavedDraft) {
      Alert.alert(
        'Restore Draft',
        'Would you like to restore your unsaved draft?',
        [
          {
            text: 'No, Start Fresh',
            style: 'cancel',
            onPress: () => draftService.clearAutoSaveDraft(platformId),
          },
          {
            text: 'Yes, Restore',
            onPress: () => {
              setContent(prev => ({
                ...prev,
                text: autoSavedDraft.content,
                media: autoSavedDraft.mediaUrls ? autoSavedDraft.mediaUrls.map(uri => ({
                  uri,
                  type: 'image/jpeg',
                })) : [],
                scheduledFor: autoSavedDraft.scheduledFor ? new Date(autoSavedDraft.scheduledFor) : undefined,
              }));
              lastAutoSave.current = autoSavedDraft.lastModified;
            },
          },
        ]
      );
    }
  };

  const startAutoSave = () => {
    autoSaveInterval.current = draftService.createAutoSaveInterval(async () => {
      if (hasUnsavedChanges) {
        await handleAutoSave();
      }
    });
  };

  const handleAutoSave = async () => {
    if (!content.text.trim() && content.media.length === 0) return;

    const draft = {
      content: content.text,
      platform: platformId,
      mediaUrls: content.media.map((m: { uri: string }) => m.uri),
      lastModified: new Date().toISOString(),
      scheduledFor: content.scheduledFor?.toISOString(),
    };

    await draftService.saveAutoSaveDraft(draft);
    if (draft.lastModified) {
      lastAutoSave.current = draft.lastModified;
    }
    setHasUnsavedChanges(false);
  };

  const handleTextChange = (text: string) => {
    setContent(prev => ({ ...prev, text }));
    setCharacterCount(text.length);
    setHasUnsavedChanges(true);
  };

  const handleAddMedia = async () => {
    if (content.media.length >= platform.features.maxMediaFiles) {
      Alert.alert('Limit Reached', `${platform.name} allows up to ${platform.features.maxMediaFiles} media files`);
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant media library access to add photos or videos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const fileType = asset.type || 'image/jpeg';
      
      // Check if file type is supported
      if (!platform.features.supportedMediaTypes.includes(fileType)) {
        Alert.alert('Unsupported Format', `${platform.name} doesn't support this file type`);
        return;
      }

      setContent(prev => ({
        ...prev,
        media: [...prev.media, {
          uri: asset.uri,
          type: fileType,
          fileName: asset.fileName || 'media-file',
        }],
      }));
      setHasUnsavedChanges(true);
    }
  };

  const handleRemoveMedia = (index: number) => {
    setContent(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
    setHasUnsavedChanges(true);
  };

  const handleSchedule = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setContent(prev => ({ ...prev, scheduledFor: selectedDate }));
      setHasUnsavedChanges(true);
    }
  };

  const handlePost = async () => {
    if (!content.text.trim() && content.media.length === 0) {
      Alert.alert('Error', 'Please add some content to your post');
      return;
    }

    if (platform.features.characterLimit && characterCount > platform.features.characterLimit) {
      Alert.alert('Error', `Text exceeds ${platform.name}'s character limit`);
      return;
    }

    setIsPosting(true);

    try {
      // Create form data for media upload
      const formData = new FormData();
      formData.append('text', content.text);
      
      content.media.forEach((media, index) => {
        formData.append(`media_${index}`, {
          uri: media.uri,
          type: media.type,
          name: media.fileName,
        } as any);
      });

      if (content.scheduledFor) {
        formData.append('scheduledFor', content.scheduledFor.toISOString());
      }

      const response = await fetch(`${env.API_URL}/posts/${platform.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      if (response.ok) {
        Alert.alert(
          'Success',
          content.scheduledFor 
            ? 'Post scheduled successfully!'
            : 'Post published successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create post');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleSelectTemplate = (template: Template) => {
    setContent(prev => ({
      ...prev,
      text: template.content,
    }));
    setShowTemplates(false);
    setHasUnsavedChanges(true);
  };

  const handleSaveAsTemplate = (content: string) => {
    setShowTemplates(true);
    setHasUnsavedChanges(true);
  };

  const handleSaveDraft = async () => {
    if (!content.text.trim() && content.media.length === 0) {
      Alert.alert('Error', 'Please add some content to your post');
      return;
    }

    setSaving(true);
    try {
      const draft = {
        content: content.text,
        platform: platformId,
        mediaUrls: content.media.map(m => m.uri),
        lastModified: new Date().toISOString(),
        scheduledFor: content.scheduledFor?.toISOString(),
      };

      if (draftId) {
        const success = await draftService.updateDraftOnServer(draftId, draft, token);
        if (success) {
          await draftService.clearAutoSaveDraft(platformId);
          Alert.alert('Success', 'Draft updated successfully');
          navigation.goBack();
        }
      } else {
        const newDraftId = await draftService.saveDraftToServer(draft, token);
        if (newDraftId) {
          await draftService.clearAutoSaveDraft(platformId);
          Alert.alert('Success', 'Draft saved successfully');
          navigation.goBack();
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      Alert.alert('Error', 'Failed to save draft');
    } finally {
      setSaving(false);
    }
  };

  const renderMediaPreview = () => (
    <ScrollView
      horizontal
      style={styles.mediaPreview}
      contentContainerStyle={styles.mediaPreviewContent}
    >
      {content.media.map((media, index) => (
        <View key={index} style={styles.mediaItem}>
          <Image source={{ uri: media.uri }} style={styles.mediaImage} />
          <TouchableOpacity
            style={styles.removeMediaButton}
            onPress={() => handleRemoveMedia(index)}
          >
            <Ionicons name="close-circle" size={24} color="#ff6b6b" />
          </TouchableOpacity>
        </View>
      ))}
      {content.media.length < platform.features.maxMediaFiles && (
        <TouchableOpacity
          style={styles.addMediaButton}
          onPress={handleAddMedia}
        >
          <Ionicons name="add" size={32} color="#007AFF" />
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            if (hasUnsavedChanges) {
              Alert.alert(
                'Unsaved Changes',
                'Would you like to save your changes as a draft?',
                [
                  {
                    text: 'Discard',
                    style: 'destructive',
                    onPress: () => navigation.goBack(),
                  },
                  {
                    text: 'Save Draft',
                    onPress: handleSaveDraft,
                  },
                ]
              );
            } else {
              navigation.goBack();
            }
          }}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Image source={platform.icon} style={styles.platformIcon} />
          <Text style={styles.title}>
            {draftId ? 'Edit Draft' : 'New Draft'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setShowTemplates(true)}
            style={styles.templateButton}
          >
            <Ionicons name="document-text-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowPreview(true)}
            style={styles.previewButton}
          >
            <Ionicons name="eye-outline" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handlePost}
            disabled={isPosting}
            style={[
              styles.postButton,
              (isPosting || !content.text.trim()) && styles.postButtonDisabled,
            ]}
          >
            {isPosting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.postButtonText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          multiline
          placeholder={`What's on your mind?`}
          value={content.text}
          onChangeText={handleTextChange}
          maxLength={platform.features.characterLimit}
        />

        {platform.features.characterLimit && (
          <Text style={[
            styles.characterCount,
            characterCount > platform.features.characterLimit && styles.characterCountExceeded,
          ]}>
            {characterCount}/{platform.features.characterLimit}
          </Text>
        )}

        {renderMediaPreview()}

        {platform.features.canSchedule && (
          <View style={styles.scheduleSection}>
            <TouchableOpacity
              style={styles.scheduleButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={24} color="#007AFF" />
              <Text style={styles.scheduleButtonText}>
                {content.scheduledFor
                  ? `Scheduled for ${content.scheduledFor.toLocaleDateString()} ${content.scheduledFor.toLocaleTimeString()}`
                  : 'Schedule Post'
                }
              </Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={content.scheduledFor || new Date()}
                mode="datetime"
                display="default"
                onChange={handleSchedule}
                minimumDate={new Date()}
              />
            )}
          </View>
        )}
      </ScrollView>

      <PostTemplate
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSelectTemplate={handleSelectTemplate}
        onSaveAsTemplate={handleSaveAsTemplate}
        currentContent={content.text}
        platformId={platform.id}
      />

      <PostPreview
        visible={showPreview}
        onClose={() => setShowPreview(false)}
        platform={platform}
        content={content}
      />

      {hasUnsavedChanges && (
        <View style={styles.autoSaveIndicator}>
          <Text style={styles.autoSaveText}>
            {lastAutoSave.current
              ? `Last saved ${new Date(lastAutoSave.current).toLocaleTimeString()}`
              : 'Saving...'}
          </Text>
        </View>
      )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewButton: {
    padding: 8,
    marginRight: 8,
  },
  postButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  textInput: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  characterCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginBottom: 16,
  },
  characterCountExceeded: {
    color: '#ff6b6b',
  },
  mediaPreview: {
    maxHeight: 120,
    marginBottom: 16,
  },
  mediaPreviewContent: {
    paddingRight: 16,
  },
  mediaItem: {
    width: 100,
    height: 100,
    marginRight: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  removeMediaButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  addMediaButton: {
    width: 100,
    height: 100,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  scheduleSection: {
    marginTop: 16,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
  },
  scheduleButtonText: {
    marginLeft: 8,
    color: '#007AFF',
    fontSize: 16,
  },
  templateButton: {
    padding: 8,
    marginRight: 8,
  },
  autoSaveIndicator: {
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  autoSaveText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
}); 