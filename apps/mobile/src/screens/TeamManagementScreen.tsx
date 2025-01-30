import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { env } from '../config/env';

type Props = NativeStackScreenProps<RootStackParamList, 'TeamManagement'>;

interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending';
  picture?: string;
}

export const TeamManagementScreen = ({ navigation }: Props) => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'admin' | 'editor' | 'viewer'>('editor');

  const loadTeamMembers = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${env.API_URL}/team/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }

      const members: TeamMember[] = await response.json();
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
      Alert.alert('Error', 'Failed to load team members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTeamMembers();
  }, [token]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadTeamMembers();
  }, [token]);

  const handleInviteMember = async () => {
    if (!token || !inviteEmail) return;

    try {
      const response = await fetch(`${env.API_URL}/team/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to invite team member');
      }

      setInviteEmail('');
      loadTeamMembers();
      Alert.alert('Success', 'Invitation sent successfully');
    } catch (error) {
      console.error('Error inviting team member:', error);
      Alert.alert('Error', 'Failed to invite team member');
    }
  };

  const handleUpdateRole = async (memberId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    if (!token) return;

    try {
      const response = await fetch(`${env.API_URL}/team/members/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update role');
      }

      loadTeamMembers();
    } catch (error) {
      console.error('Error updating role:', error);
      Alert.alert('Error', 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!token) return;

    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this team member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await fetch(`${env.API_URL}/team/members/${memberId}`, {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (!response.ok) {
                throw new Error('Failed to remove team member');
              }

              loadTeamMembers();
            } catch (error) {
              console.error('Error removing team member:', error);
              Alert.alert('Error', 'Failed to remove team member');
            }
          },
        },
      ]
    );
  };

  const renderRoleSelector = (member: TeamMember) => (
    <View style={styles.roleSelector}>
      {['admin', 'editor', 'viewer'].map((role) => (
        <TouchableOpacity
          key={role}
          style={[
            styles.roleButton,
            member.role === role && styles.roleButtonActive,
          ]}
          onPress={() => handleUpdateRole(member.id, role as 'admin' | 'editor' | 'viewer')}
        >
          <Text
            style={[
              styles.roleButtonText,
              member.role === role && styles.roleButtonTextActive,
            ]}
          >
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
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
        <Text style={styles.title}>Team Management</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View style={styles.inviteSection}>
          <Text style={styles.sectionTitle}>Invite Team Member</Text>
          <View style={styles.inviteForm}>
            <TextInput
              style={styles.input}
              placeholder="Enter email address"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.roleSelector}>
              {['admin', 'editor', 'viewer'].map((role) => (
                <TouchableOpacity
                  key={role}
                  style={[
                    styles.roleButton,
                    selectedRole === role && styles.roleButtonActive,
                  ]}
                  onPress={() => setSelectedRole(role as 'admin' | 'editor' | 'viewer')}
                >
                  <Text
                    style={[
                      styles.roleButtonText,
                      selectedRole === role && styles.roleButtonTextActive,
                    ]}
                  >
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={[styles.inviteButton, !inviteEmail && styles.inviteButtonDisabled]}
              onPress={handleInviteMember}
              disabled={!inviteEmail}
            >
              <Text style={styles.inviteButtonText}>Send Invitation</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.teamSection}>
          <Text style={styles.sectionTitle}>Team Members</Text>
          {teamMembers.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <View style={styles.memberAvatar}>
                  {member.picture ? (
                    <Image source={{ uri: member.picture }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarText}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{member.name}</Text>
                  <Text style={styles.memberEmail}>{member.email}</Text>
                  {member.status === 'pending' && (
                    <View style={styles.pendingBadge}>
                      <Text style={styles.pendingText}>Pending</Text>
                    </View>
                  )}
                </View>
              </View>
              {renderRoleSelector(member)}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveMember(member.id)}
              >
                <Ionicons name="trash-outline" size={20} color="#ff3b30" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  inviteSection: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  teamSection: {
    padding: 16,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inviteForm: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#007AFF',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  inviteButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonDisabled: {
    opacity: 0.5,
  },
  inviteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  memberInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 14,
    color: '#666',
  },
  pendingBadge: {
    backgroundColor: '#FFE58F',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  pendingText: {
    fontSize: 12,
    color: '#D48806',
  },
  removeButton: {
    padding: 8,
  },
}); 