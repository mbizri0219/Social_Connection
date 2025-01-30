import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SocialPlatform } from '../screens/ConnectChannelScreen';

interface PostPreviewProps {
  visible: boolean;
  onClose: () => void;
  platform: SocialPlatform;
  content: {
    text: string;
    media: {
      uri: string;
      type: string;
    }[];
    scheduledFor?: Date;
  };
}

export const PostPreview = ({ visible, onClose, platform, content }: PostPreviewProps) => {
  const renderTwitterPreview = () => (
    <View style={styles.twitterCard}>
      <View style={styles.twitterHeader}>
        <View style={styles.twitterProfile}>
          <View style={styles.twitterAvatar} />
          <View>
            <Text style={styles.twitterName}>Your Name</Text>
            <Text style={styles.twitterHandle}>@yourhandle</Text>
          </View>
        </View>
        <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
      </View>
      <Text style={styles.twitterText}>{content.text}</Text>
      {content.media.length > 0 && (
        <View style={[
          styles.twitterMedia,
          content.media.length === 1 && styles.twitterMediaSingle,
          content.media.length === 3 && styles.twitterMediaThree,
          content.media.length === 4 && styles.twitterMediaFour,
        ]}>
          {content.media.map((media, index) => (
            <Image
              key={index}
              source={{ uri: media.uri }}
              style={[
                styles.twitterMediaItem,
                content.media.length === 1 && styles.twitterMediaItemSingle,
              ]}
            />
          ))}
        </View>
      )}
      <View style={styles.twitterFooter}>
        <Text style={styles.twitterTime}>
          {content.scheduledFor
            ? `Scheduled for ${content.scheduledFor.toLocaleString()}`
            : 'Now'}
        </Text>
      </View>
    </View>
  );

  const renderInstagramPreview = () => (
    <View style={styles.instagramCard}>
      <View style={styles.instagramHeader}>
        <View style={styles.instagramProfile}>
          <View style={styles.instagramAvatar} />
          <Text style={styles.instagramName}>Your Name</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={20} color="#000" />
      </View>
      {content.media.length > 0 && (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={styles.instagramMedia}
        >
          {content.media.map((media, index) => (
            <Image
              key={index}
              source={{ uri: media.uri }}
              style={styles.instagramMediaItem}
            />
          ))}
        </ScrollView>
      )}
      <View style={styles.instagramActions}>
        <Ionicons name="heart-outline" size={24} color="#000" />
        <Ionicons name="chatbubble-outline" size={24} color="#000" />
        <Ionicons name="paper-plane-outline" size={24} color="#000" />
      </View>
      <View style={styles.instagramCaption}>
        <Text style={styles.instagramUsername}>Your Name</Text>
        <Text style={styles.instagramText}>{content.text}</Text>
      </View>
    </View>
  );

  const renderLinkedInPreview = () => (
    <View style={styles.linkedinCard}>
      <View style={styles.linkedinHeader}>
        <View style={styles.linkedinProfile}>
          <View style={styles.linkedinAvatar} />
          <View>
            <Text style={styles.linkedinName}>Your Name</Text>
            <Text style={styles.linkedinTitle}>Your Title</Text>
            <Text style={styles.linkedinTime}>
              {content.scheduledFor
                ? `Scheduled for ${content.scheduledFor.toLocaleString()}`
                : 'Now'}
            </Text>
          </View>
        </View>
      </View>
      <Text style={styles.linkedinText}>{content.text}</Text>
      {content.media.length > 0 && (
        <View style={styles.linkedinMedia}>
          {content.media.map((media, index) => (
            <Image
              key={index}
              source={{ uri: media.uri }}
              style={styles.linkedinMediaItem}
            />
          ))}
        </View>
      )}
      <View style={styles.linkedinActions}>
        <View style={styles.linkedinAction}>
          <Ionicons name="thumbs-up-outline" size={20} color="#666" />
          <Text style={styles.linkedinActionText}>Like</Text>
        </View>
        <View style={styles.linkedinAction}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.linkedinActionText}>Comment</Text>
        </View>
        <View style={styles.linkedinAction}>
          <Ionicons name="share-outline" size={20} color="#666" />
          <Text style={styles.linkedinActionText}>Share</Text>
        </View>
      </View>
    </View>
  );

  const renderPreview = () => {
    switch (platform.id) {
      case 'twitter':
        return renderTwitterPreview();
      case 'instagram':
        return renderInstagramPreview();
      case 'linkedin':
        return renderLinkedInPreview();
      default:
        return (
          <View style={styles.genericPreview}>
            <Image source={platform.icon} style={styles.genericIcon} />
            <Text style={styles.genericText}>{content.text}</Text>
            {content.media.length > 0 && (
              <ScrollView horizontal style={styles.genericMedia}>
                {content.media.map((media, index) => (
                  <Image
                    key={index}
                    source={{ uri: media.uri }}
                    style={styles.genericMediaItem}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        );
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Preview</Text>
            <View style={styles.modalHeaderRight} />
          </View>
          <ScrollView style={styles.previewContainer}>
            {renderPreview()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalHeaderRight: {
    width: 32,
  },
  previewContainer: {
    padding: 16,
  },
  // Twitter styles
  twitterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  twitterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  twitterProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  twitterAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
    marginRight: 12,
  },
  twitterName: {
    fontSize: 16,
    fontWeight: '600',
  },
  twitterHandle: {
    fontSize: 14,
    color: '#666',
  },
  twitterText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  twitterMedia: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginBottom: 12,
  },
  twitterMediaSingle: {
    flexWrap: 'nowrap',
  },
  twitterMediaThree: {
    height: 300,
  },
  twitterMediaFour: {
    height: 300,
  },
  twitterMediaItem: {
    flex: 1,
    height: 200,
    borderRadius: 12,
    backgroundColor: '#eee',
  },
  twitterMediaItemSingle: {
    height: 300,
  },
  twitterFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  twitterTime: {
    fontSize: 14,
    color: '#666',
  },
  // Instagram styles
  instagramCard: {
    backgroundColor: '#fff',
    marginBottom: 16,
  },
  instagramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
  },
  instagramProfile: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  instagramAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eee',
    marginRight: 12,
  },
  instagramName: {
    fontSize: 14,
    fontWeight: '600',
  },
  instagramMedia: {
    width: '100%',
    height: width,
  },
  instagramMediaItem: {
    width: width,
    height: width,
  },
  instagramActions: {
    flexDirection: 'row',
    padding: 12,
    gap: 16,
  },
  instagramCaption: {
    padding: 12,
  },
  instagramUsername: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  instagramText: {
    fontSize: 14,
    lineHeight: 20,
  },
  // LinkedIn styles
  linkedinCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  linkedinHeader: {
    marginBottom: 12,
  },
  linkedinProfile: {
    flexDirection: 'row',
  },
  linkedinAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#eee',
    marginRight: 12,
  },
  linkedinName: {
    fontSize: 16,
    fontWeight: '600',
  },
  linkedinTitle: {
    fontSize: 14,
    color: '#666',
  },
  linkedinTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  linkedinText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  linkedinMedia: {
    marginBottom: 12,
  },
  linkedinMediaItem: {
    width: '100%',
    height: 300,
    borderRadius: 4,
    backgroundColor: '#eee',
    marginBottom: 2,
  },
  linkedinActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 12,
    justifyContent: 'space-around',
  },
  linkedinAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkedinActionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  // Generic preview styles
  genericPreview: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  genericIcon: {
    width: 32,
    height: 32,
    marginBottom: 12,
  },
  genericText: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
  },
  genericMedia: {
    height: 200,
  },
  genericMediaItem: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginRight: 8,
  },
}); 