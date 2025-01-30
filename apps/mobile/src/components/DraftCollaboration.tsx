import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collaborationService, Collaborator, Comment } from '../services/collaborationService';
import { useAuth } from '../hooks/useAuth';
import { websocketService, WebSocketMessage } from '../services/websocketService';
import { MentionsInput } from './MentionsInput';
import { notificationService } from '../services/notificationService';

interface Props {
  visible: boolean;
  onClose: () => void;
  draftId: string;
}

export const DraftCollaboration = ({ visible, onClose, draftId }: Props) => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'collaborators' | 'comments'>('collaborators');
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<'editor' | 'viewer'>('editor');
  const [newComment, setNewComment] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);

  useEffect(() => {
    if (visible && token) {
      loadData();
      websocketService.connect(token);
      websocketService.subscribe(draftId, handleWebSocketMessage);
    }

    return () => {
      if (visible) {
        websocketService.unsubscribe(draftId, handleWebSocketMessage);
      }
    };
  }, [visible, token]);

  const loadData = async () => {
    if (!token) return;

    setLoading(true);
    try {
      const [collabData, commentData] = await Promise.all([
        collaborationService.getCollaborators(draftId, token),
        collaborationService.getComments(draftId, token),
      ]);
      setCollaborators(collabData);
      setComments(commentData);
    } catch (error) {
      console.error('Error loading collaboration data:', error);
      Alert.alert('Error', 'Failed to load collaboration data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleWebSocketMessage = (message: WebSocketMessage) => {
    switch (message.type) {
      case 'comment_added':
        setComments(prevComments => [...prevComments, message.data]);
        scrollViewRef.current?.scrollToEnd();
        break;
      case 'comment_updated':
        setComments(prevComments =>
          prevComments.map(c =>
            c.id === message.data.id
              ? { ...c, content: message.data.content, updatedAt: message.data.updatedAt }
              : c
          )
        );
        break;
      case 'comment_deleted':
        setComments(prevComments =>
          prevComments.filter(c => c.id !== message.data.id)
        );
        break;
      case 'collaborator_added':
        setCollaborators(prevCollaborators => [...prevCollaborators, message.data]);
        break;
      case 'collaborator_removed':
        setCollaborators(prevCollaborators =>
          prevCollaborators.filter(c => c.id !== message.data.id)
        );
        break;
      case 'role_updated':
        setCollaborators(prevCollaborators =>
          prevCollaborators.map(c =>
            c.id === message.data.id ? { ...c, role: message.data.role } : c
          )
        );
        break;
    }
  };

  const handleAddCollaborator = async () => {
    if (!token) return;

    if (!newEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    try {
      const collaborator = await collaborationService.addCollaborator(
        draftId,
        newEmail.trim(),
        newRole,
        token
      );

      if (collaborator) {
        setCollaborators([...collaborators, collaborator]);
        setNewEmail('');
        Alert.alert('Success', 'Collaborator added successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add collaborator');
    }
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (!token) return;

    Alert.alert(
      'Remove Collaborator',
      'Are you sure you want to remove this collaborator?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await collaborationService.removeCollaborator(
              draftId,
              collaboratorId,
              token
            );

            if (success) {
              setCollaborators(collaborators.filter(c => c.id !== collaboratorId));
              Alert.alert('Success', 'Collaborator removed successfully');
            } else {
              Alert.alert('Error', 'Failed to remove collaborator');
            }
          },
        },
      ]
    );
  };

  const handleUpdateRole = async (collaboratorId: string, newRole: 'editor' | 'viewer') => {
    if (!token) return;

    const success = await collaborationService.updateCollaboratorRole(
      draftId,
      collaboratorId,
      newRole,
      token
    );

    if (success) {
      setCollaborators(
        collaborators.map(c =>
          c.id === collaboratorId ? { ...c, role: newRole } : c
        )
      );
      Alert.alert('Success', 'Role updated successfully');
    } else {
      Alert.alert('Error', 'Failed to update role');
    }
  };

  const handleAddComment = async () => {
    if (!token || !user) return;
    if (!newComment.trim()) return;

    try {
      const comment = await collaborationService.addComment(
        draftId,
        newComment.trim(),
        mentionedUsers,
        token
      );

      if (comment) {
        // Send notifications to mentioned users
        for (const mentionedUserId of mentionedUsers) {
          const mentionedUser = collaborators.find(c => c.id === mentionedUserId);
          if (mentionedUser && mentionedUser.id !== user.id) {
            await notificationService.sendMentionNotification(
              token,
              draftId,
              comment.id,
              mentionedUser.id,
              { id: user.id, name: user.name || user.email }
            );
          }
        }

        setComments([...comments, comment]);
        setNewComment('');
        setMentionedUsers([]);
        scrollViewRef.current?.scrollToEnd();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to add comment');
    }
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    if (!token || !user) return;

    try {
      const success = await collaborationService.updateComment(
        draftId,
        commentId,
        content,
        token
      );

      if (success) {
        // Send notifications to newly mentioned users
        const previousComment = comments.find(c => c.id === commentId);
        const previousMentions = previousComment ? 
          extractMentions(previousComment.content) : [];
        const newMentions = mentionedUsers.filter(
          id => !previousMentions.includes(id)
        );

        for (const mentionedUserId of newMentions) {
          const mentionedUser = collaborators.find(c => c.id === mentionedUserId);
          if (mentionedUser && mentionedUser.id !== user.id) {
            await notificationService.sendMentionNotification(
              token,
              draftId,
              commentId,
              mentionedUser.id,
              { id: user.id, name: user.name || user.email }
            );
          }
        }

        setComments(
          comments.map(c =>
            c.id === commentId
              ? { ...c, content, updatedAt: new Date().toISOString() }
              : c
          )
        );
        setEditingComment(null);
        setNewComment('');
        setMentionedUsers([]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update comment');
    }
  };

  const extractMentions = (content: string): string[] => {
    const mentions = content.match(/@(\w+)/g) || [];
    return mentions
      .map(mention => {
        const username = mention.slice(1);
        const user = collaborators.find(c => c.name === username);
        return user?.id;
      })
      .filter((id): id is string => id !== undefined);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!token) return;

    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await collaborationService.deleteComment(
              draftId,
              commentId,
              token
            );

            if (success) {
              setComments(comments.filter(c => c.id !== commentId));
            } else {
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  const renderCommentText = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return (
      <Text style={styles.commentContent}>
        {parts.map((part, index) => {
          if (part.startsWith('@')) {
            const username = part.slice(1);
            const isValidMention = collaborators.some(c => c.name === username);
            return isValidMention ? (
              <Text key={index} style={styles.mentionText}>
                {part}
              </Text>
            ) : (
              <Text key={index}>{part}</Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  const renderCollaborators = () => (
    <View style={styles.section}>
      <View style={styles.addCollaborator}>
        <TextInput
          style={styles.emailInput}
          placeholder="Enter email address"
          value={newEmail}
          onChangeText={setNewEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <View style={styles.roleSelector}>
          <TouchableOpacity
            style={[
              styles.roleButton,
              newRole === 'editor' && styles.roleButtonActive,
            ]}
            onPress={() => setNewRole('editor')}
          >
            <Text
              style={[
                styles.roleButtonText,
                newRole === 'editor' && styles.roleButtonTextActive,
              ]}
            >
              Editor
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.roleButton,
              newRole === 'viewer' && styles.roleButtonActive,
            ]}
            onPress={() => setNewRole('viewer')}
          >
            <Text
              style={[
                styles.roleButtonText,
                newRole === 'viewer' && styles.roleButtonTextActive,
              ]}
            >
              Viewer
            </Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCollaborator}
        >
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.collaboratorList}>
        {collaborators.map((collaborator) => (
          <View key={collaborator.id} style={styles.collaboratorItem}>
            <View style={styles.collaboratorInfo}>
              {collaborator.picture ? (
                <Image
                  source={{ uri: collaborator.picture }}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitials}>
                    {collaborator.name.split(' ').map(n => n[0]).join('')}
                  </Text>
                </View>
              )}
              <View style={styles.collaboratorDetails}>
                <Text style={styles.collaboratorName}>{collaborator.name}</Text>
                <Text style={styles.collaboratorEmail}>{collaborator.email}</Text>
              </View>
            </View>
            <View style={styles.collaboratorActions}>
              <TouchableOpacity
                style={styles.roleTag}
                onPress={() =>
                  handleUpdateRole(
                    collaborator.id,
                    collaborator.role === 'editor' ? 'viewer' : 'editor'
                  )
                }
              >
                <Text style={styles.roleTagText}>{collaborator.role}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveCollaborator(collaborator.id)}
              >
                <Ionicons name="close-circle" size={24} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );

  const renderComments = () => (
    <View style={styles.section}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.commentsList}
        contentContainerStyle={styles.commentsContent}
      >
        {comments.map(comment => (
          <View key={comment.id} style={styles.commentItem}>
            <View style={styles.commentHeader}>
              <Image
                source={comment.userPicture ? { uri: comment.userPicture } : require('../../assets/default-avatar.png')}
                style={styles.commentAvatar}
              />
              <View style={styles.commentMeta}>
                <Text style={styles.commentAuthor}>{comment.userName}</Text>
                <Text style={styles.commentTime}>
                  {new Date(comment.createdAt).toLocaleString()}
                </Text>
              </View>
              {comment.userId === user?.id && (
                <View style={styles.commentActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingComment(comment.id);
                      setNewComment(comment.content);
                    }}
                  >
                    <Ionicons name="pencil" size={16} color="#666" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteComment(comment.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="trash" size={16} color="#ff4444" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {editingComment === comment.id ? (
              <View style={styles.editCommentContainer}>
                <MentionsInput
                  value={newComment}
                  onChangeText={setNewComment}
                  onMentionsChanged={setMentionedUsers}
                  collaborators={collaborators}
                  placeholder="Edit your comment..."
                  multiline
                />
                <View style={styles.editCommentActions}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingComment(null);
                      setNewComment('');
                    }}
                    style={styles.cancelButton}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleUpdateComment(comment.id, newComment)}
                    style={styles.saveButton}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              renderCommentText(comment.content)
            )}
          </View>
        ))}
      </ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={styles.addCommentContainer}>
          <MentionsInput
            value={newComment}
            onChangeText={setNewComment}
            onMentionsChanged={setMentionedUsers}
            collaborators={collaborators}
            placeholder="Write a comment..."
            multiline
          />
          <TouchableOpacity
            onPress={handleAddComment}
            style={[styles.addButton, !newComment.trim() && styles.addButtonDisabled]}
            disabled={!newComment.trim()}
          >
            <Ionicons name="send" size={24} color={newComment.trim() ? '#007AFF' : '#999'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Collaboration</Text>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'collaborators' && styles.activeTab]}
            onPress={() => setActiveTab('collaborators')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'collaborators' && styles.activeTabText,
              ]}
            >
              Collaborators
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'comments' && styles.activeTab]}
            onPress={() => setActiveTab('comments')}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === 'comments' && styles.activeTabText,
              ]}
            >
              Comments
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          activeTab === 'collaborators' ? renderCollaborators() : renderComments()
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 16,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    flex: 1,
  },
  addCollaborator: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  emailInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  roleButton: {
    flex: 1,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    borderRadius: 8,
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  roleButtonText: {
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  collaboratorList: {
    flex: 1,
  },
  collaboratorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  collaboratorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f8ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarInitials: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  collaboratorDetails: {
    flex: 1,
  },
  collaboratorName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  collaboratorEmail: {
    fontSize: 14,
    color: '#666',
  },
  collaboratorActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleTag: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  roleTagText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  removeButton: {
    padding: 4,
  },
  commentsList: {
    flex: 1,
  },
  commentsContent: {
    padding: 16,
  },
  commentItem: {
    marginBottom: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  commentMeta: {
    flex: 1,
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 14,
  },
  commentTime: {
    fontSize: 12,
    color: '#666',
  },
  commentActions: {
    flexDirection: 'row',
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  commentContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  mentionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  editCommentContainer: {
    marginTop: 8,
  },
  editCommentActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelButton: {
    marginRight: 12,
    padding: 6,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 4,
    padding: 6,
    paddingHorizontal: 12,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  addButton: {
    marginLeft: 12,
    padding: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
}); 