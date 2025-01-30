import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius, commonStyles } from '../styles/theme';
import { useFetch } from '../hooks/useFetch';
import { useAuth } from '../hooks/useAuth';
import { env } from '../config/env';
import dayjs from 'dayjs';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { DraftCollaboration } from '../components/DraftCollaboration';
import { draftService } from '../services/draftService';

interface Message {
  id: string;
  from: 'BUYER' | 'SELLER';
  content: string;
  special?: string;
  groupId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

interface User {
  id: string;
  name?: string;
  picture?: {
    id: string;
    path: string;
  };
}

interface MessageGroup {
  id: string;
  buyerId: string;
  sellerId: string;
  buyer: User;
  seller: User;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface Post {
  id: string;
  content: string;
  scheduledAt: string;
  updatedAt: string;
  platform: {
    id: string;
    name: string;
    icon: string;
  };
}

interface Draft {
  id: string;
  content: string;
  platform: {
    id: string;
    name: string;
    icon: string;
  };
  mediaUrls?: string[];
  lastModified: string;
  collaborators?: {
    id: string;
    name: string;
    email: string;
    picture?: string;
  }[];
  status: 'draft' | 'review' | 'approved';
  comments?: {
    id: string;
    userId: string;
    userName: string;
    content: string;
    createdAt: string;
  }[];
  scheduledFor?: string;
}

const schema = yup.object({
  message: yup.string().required('Message is required'),
});

type FormData = {
  message: string;
};

type TabType = 'messages' | 'drafts';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const MessagesScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { accessToken } = useAuth();
  const fetch = useFetch();
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<MessageGroup[]>([]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [currentMessages, setCurrentMessages] = useState<MessageGroup | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('messages');
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null);
  const [showCollaboration, setShowCollaboration] = useState(false);
  const [draftFilter, setDraftFilter] = useState<'all' | 'review' | 'approved'>('all');
  const [showTemplates, setShowTemplates] = useState(false);
  const autoSaveInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastAutoSave = useRef<string | null>(null);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema),
  });

  const fetchMessageGroups = async () => {
    try {
      const response = await fetch('/messages/groups', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch message groups');
      }

      const data = await response.json();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching message groups:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMessages = async (groupId: string) => {
    try {
      const response = await fetch(`/messages/${groupId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setCurrentMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchDrafts = async () => {
    try {
      const response = await fetch('/posts/drafts', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch drafts');
      }

      const data = await response.json();
      setDrafts(data);
    } catch (error) {
      console.error('Error fetching drafts:', error);
      Alert.alert('Error', 'Failed to load drafts');
    }
  };

  useEffect(() => {
    if (activeTab === 'messages') {
      fetchMessageGroups();
    } else {
      fetchDrafts();
    }
  }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (activeTab === 'messages') {
      if (selectedGroup) {
        await fetchMessages(selectedGroup);
      } else {
        await fetchMessageGroups();
      }
    } else {
      await fetchDrafts();
    }
    setRefreshing(false);
  };

  const onSubmit = async (data: FormData) => {
    if (!selectedGroup) return;

    try {
      const response = await fetch(`/messages/${selectedGroup}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: data.message }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      await fetchMessages(selectedGroup);
      reset();
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this draft?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${env.API_URL}/posts/drafts/${draftId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${accessToken}`,
                },
              });

              if (!response.ok) {
                throw new Error('Failed to delete draft');
              }

              await fetchDrafts();
              Alert.alert('Success', 'Draft deleted successfully');
            } catch (error) {
              console.error('Error deleting draft:', error);
              Alert.alert('Error', 'Failed to delete draft');
            }
          },
        },
      ]
    );
  };

  const handleSubmitForReview = async (draftId: string) => {
    try {
      const response = await fetch(`${env.API_URL}/posts/drafts/${draftId}/review`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to submit draft for review');
      }

      await fetchDrafts();
      Alert.alert('Success', 'Draft submitted for review');
    } catch (error) {
      console.error('Error submitting draft:', error);
      Alert.alert('Error', 'Failed to submit draft for review');
    }
  };

  const renderMessageGroup = (group: MessageGroup) => {
    const lastMessage = group.messages[0];
    const isSelected = selectedGroup === group.id;

    return (
      <TouchableOpacity
        key={group.id}
        style={[
          styles.messageGroup,
          isSelected && styles.selectedMessageGroup,
        ]}
        onPress={() => setSelectedGroup(group.id)}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: group.seller.picture?.path || require('../../assets/default-avatar.png') }}
          style={styles.avatar}
        />
        <View style={styles.messageGroupInfo}>
          <Text style={styles.userName}>{group.seller.name || 'Unknown'}</Text>
          {lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {lastMessage.content}
            </Text>
          )}
        </View>
        <Text style={styles.messageTime}>
          {dayjs(group.updatedAt).format('MMM D')}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderMessage = (message: Message) => {
    const isSender = message.from === 'BUYER';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isSender ? styles.sentMessage : styles.receivedMessage,
        ]}
      >
        <View style={[styles.messageBubble, isSender ? styles.sentBubble : styles.receivedBubble]}>
          <Text style={styles.messageText}>{message.content}</Text>
          <Text style={styles.messageTimestamp}>
            {dayjs(message.createdAt).format('h:mm A')}
          </Text>
        </View>
      </View>
    );
  };

  const renderDraftCard = (draft: Draft) => {
    return (
      <View key={draft.id} style={styles.draftCard}>
        <View style={styles.draftHeader}>
          <View style={styles.platformInfo}>
            <Ionicons name={draft.platform.icon as any} size={24} color={colors.primary} />
            <Text style={styles.platformName}>{draft.platform.name}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>{draft.status}</Text>
          </View>
        </View>

        <Text style={styles.draftContent} numberOfLines={3}>
          {draft.content}
        </Text>

        {draft.mediaUrls && draft.mediaUrls.length > 0 && (
          <ScrollView horizontal style={styles.mediaScroll}>
            {draft.mediaUrls.map((url, index) => (
              <Image
                key={index}
                source={{ uri: url }}
                style={styles.mediaPreview}
              />
            ))}
          </ScrollView>
        )}

        {draft.collaborators && draft.collaborators.length > 0 && (
          <View style={styles.collaborators}>
            <Text style={styles.collaboratorsLabel}>Collaborators:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {draft.collaborators.map((collaborator) => (
                <View key={collaborator.id} style={styles.collaborator}>
                  {collaborator.picture ? (
                    <Image
                      source={{ uri: collaborator.picture }}
                      style={styles.collaboratorAvatar}
                    />
                  ) : (
                    <View style={styles.collaboratorInitials}>
                      <Text style={styles.initialsText}>
                        {collaborator.name.split(' ').map(n => n[0]).join('')}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.collaboratorName}>{collaborator.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.draftFooter}>
          <Text style={styles.lastModified}>
            Last modified {dayjs(draft.lastModified).format('MMM D, YYYY')}
          </Text>
          <View style={styles.draftActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                setSelectedDraft(draft);
                setShowCollaboration(true);
              }}
            >
              <Ionicons name="people" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Collaborate</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('CreatePost', {
                platformId: draft.platform.id,
                editPostId: draft.id,
              })}
            >
              <Ionicons name="pencil" size={20} color={colors.primary} />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>

            {draft.status === 'draft' && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleSubmitForReview(draft.id)}
              >
                <Ionicons name="send" size={20} color={colors.primary} />
                <Text style={styles.actionButtonText}>Review</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={() => handleDeleteDraft(draft.id)}
            >
              <Ionicons name="trash" size={20} color={colors.error} />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>

        {draft.comments && draft.comments.length > 0 && (
          <View style={styles.comments}>
            <Text style={styles.commentsLabel}>Latest Comments:</Text>
            {draft.comments.slice(0, 2).map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <Text style={styles.commentAuthor}>{comment.userName}</Text>
                <Text style={styles.commentContent}>{comment.content}</Text>
                <Text style={styles.commentDate}>
                  {dayjs(comment.createdAt).format('MMM D, YYYY')}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderDraftFilters = () => (
    <View style={styles.filterTabs}>
      <TouchableOpacity
        style={[styles.filterTab, draftFilter === 'all' && styles.filterTabActive]}
        onPress={() => setDraftFilter('all')}
      >
        <Text style={[styles.filterText, draftFilter === 'all' && styles.filterTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterTab, draftFilter === 'review' && styles.filterTabActive]}
        onPress={() => setDraftFilter('review')}
      >
        <Text style={[styles.filterText, draftFilter === 'review' && styles.filterTextActive]}>
          In Review
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.filterTab, draftFilter === 'approved' && styles.filterTabActive]}
        onPress={() => setDraftFilter('approved')}
      >
        <Text style={[styles.filterText, draftFilter === 'approved' && styles.filterTextActive]}>
          Approved
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'messages' && styles.activeTab]}
        onPress={() => setActiveTab('messages')}
      >
        <Text style={[styles.tabText, activeTab === 'messages' && styles.activeTabText]}>
          Messages
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'drafts' && styles.activeTab]}
        onPress={() => setActiveTab('drafts')}
      >
        <Text style={[styles.tabText, activeTab === 'drafts' && styles.activeTabText]}>
          Drafts
        </Text>
      </TouchableOpacity>
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.header}>
          <Text style={commonStyles.heading1}>Messages</Text>
          {activeTab === 'drafts' && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => navigation.navigate('CreatePost', { platformId: '' })}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>

        {renderTabs()}

        <View style={styles.content}>
          {!selectedGroup ? (
            <ScrollView
              style={styles.groupsList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor={colors.primary}
                />
              }
            >
              {activeTab === 'messages' ? (
                groups.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="chatbubbles-outline" size={64} color={colors.textSecondary} />
                    <Text style={styles.emptyTitle}>No Messages Yet</Text>
                    <Text style={styles.emptySubtitle}>
                      Your messages will appear here when you start chatting with sellers or buyers
                    </Text>
                  </View>
                ) : (
                  groups.map(renderMessageGroup)
                )
              ) : (
                <>
                  {renderDraftFilters()}
                  {drafts.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="document-outline" size={64} color={colors.textSecondary} />
                      <Text style={styles.emptyTitle}>No Drafts</Text>
                      <Text style={styles.emptySubtitle}>
                        Your draft posts will appear here
                      </Text>
                      <TouchableOpacity
                        style={styles.createButton}
                        onPress={() => navigation.navigate('CreatePost', { platformId: '' })}
                      >
                        <Text style={styles.createButtonText}>Create Draft</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    drafts
                      .filter(draft => draftFilter === 'all' || draft.status === draftFilter)
                      .map(renderDraftCard)
                  )}
                </>
              )}
            </ScrollView>
          ) : (
            <View style={styles.chatContainer}>
              <View style={styles.chatHeader}>
                <TouchableOpacity
                  onPress={() => setSelectedGroup(null)}
                  style={styles.backButton}
                >
                  <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                {currentMessages && (
                  <>
                    <Image
                      source={{
                        uri: currentMessages.seller.picture?.path ||
                          require('../../assets/default-avatar.png'),
                      }}
                      style={styles.chatAvatar}
                    />
                    <Text style={styles.chatName}>
                      {currentMessages.seller.name || 'Unknown'}
                    </Text>
                  </>
                )}
              </View>

              <ScrollView
                ref={scrollViewRef}
                style={styles.messagesContainer}
                contentContainerStyle={styles.messagesContent}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={colors.primary}
                  />
                }
              >
                {currentMessages?.messages.map(renderMessage)}
              </ScrollView>

              <View style={styles.inputContainer}>
                <Controller
                  control={control}
                  name="message"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={styles.input}
                      placeholder="Type a message..."
                      placeholderTextColor={colors.textMuted}
                      value={value}
                      onChangeText={onChange}
                      multiline
                    />
                  )}
                />
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSubmit(onSubmit)}
                >
                  <Ionicons name="send" size={24} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      {selectedDraft && (
        <DraftCollaboration
          visible={showCollaboration}
          onClose={() => {
            setShowCollaboration(false);
            setSelectedDraft(null);
          }}
          draftId={selectedDraft.id}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
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
  content: {
    flex: 1,
  },
  groupsList: {
    flex: 1,
  },
  messageGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedMessageGroup: {
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.round,
  },
  messageGroupInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
  },
  lastMessage: {
    color: colors.textSecondary,
    fontSize: typography.small,
    marginTop: spacing.xs,
  },
  messageTime: {
    color: colors.textMuted,
    fontSize: typography.tiny,
  },
  chatContainer: {
    flex: 1,
    backgroundColor: colors.surface,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  chatAvatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
  },
  chatName: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: '600',
    marginLeft: spacing.md,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: spacing.md,
  },
  messageContainer: {
    marginVertical: spacing.xs,
    flexDirection: 'row',
  },
  sentMessage: {
    justifyContent: 'flex-end',
  },
  receivedMessage: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
  },
  sentBubble: {
    backgroundColor: colors.primary,
  },
  receivedBubble: {
    backgroundColor: colors.surfaceHover,
  },
  messageText: {
    color: colors.text,
    fontSize: typography.body,
  },
  messageTimestamp: {
    color: colors.textSecondary,
    fontSize: typography.tiny,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceHover,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: colors.text,
    fontSize: typography.body,
    maxHeight: 100,
  },
  sendButton: {
    marginLeft: spacing.sm,
    padding: spacing.xs,
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
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: typography.body,
    fontWeight: '500',
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: '600',
  },
  draftCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  draftHeader: {
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
  draftStatus: {
    color: colors.warning,
    fontSize: typography.small,
    fontWeight: '500',
  },
  draftContent: {
    color: colors.text,
    fontSize: typography.body,
    marginBottom: spacing.sm,
  },
  draftDate: {
    color: colors.textSecondary,
    fontSize: typography.small,
  },
  filterTabs: {
    flexDirection: 'row',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  filterTab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  filterTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  filterText: {
    fontSize: typography.body,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  mediaScroll: {
    marginVertical: spacing.sm,
  },
  mediaPreview: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  collaborators: {
    marginVertical: spacing.sm,
  },
  collaboratorsLabel: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  collaborator: {
    alignItems: 'center',
    marginRight: spacing.md,
  },
  collaboratorAvatar: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    marginBottom: spacing.xs,
  },
  collaboratorInitials: {
    width: 32,
    height: 32,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surfaceHover,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  initialsText: {
    fontSize: typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  collaboratorName: {
    fontSize: typography.tiny,
    color: colors.textSecondary,
  },
  comments: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentsLabel: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  comment: {
    marginBottom: spacing.sm,
  },
  commentAuthor: {
    fontSize: typography.small,
    fontWeight: '600',
    color: colors.text,
  },
  commentContent: {
    fontSize: typography.small,
    color: colors.text,
    marginVertical: spacing.xs,
  },
  commentDate: {
    fontSize: typography.tiny,
    color: colors.textSecondary,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.round,
    marginTop: spacing.lg,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: typography.body,
    fontWeight: '600',
  },
  addButton: {
    padding: spacing.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    marginLeft: spacing.md,
  },
  actionButtonText: {
    marginLeft: spacing.xs,
    color: colors.primary,
    fontSize: typography.small,
  },
  deleteButton: {
    marginLeft: spacing.md,
  },
  deleteButtonText: {
    color: colors.error,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.round,
    backgroundColor: colors.surfaceHover,
  },
  statusText: {
    fontSize: typography.tiny,
    color: colors.primary,
    textTransform: 'capitalize',
  },
  draftFooter: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  lastModified: {
    fontSize: typography.small,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  draftActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
}); 