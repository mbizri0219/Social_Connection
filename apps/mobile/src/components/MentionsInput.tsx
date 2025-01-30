import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Collaborator } from '../services/collaborationService';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onMentionsChanged: (mentions: string[]) => void;
  collaborators: Collaborator[];
  placeholder?: string;
  multiline?: boolean;
}

interface MentionData {
  id: string;
  name: string;
  position: number;
}

export const MentionsInput = ({
  value,
  onChangeText,
  onMentionsChanged,
  collaborators,
  placeholder,
  multiline,
}: Props) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionQuery, setSuggestionQuery] = useState('');
  const [mentions, setMentions] = useState<MentionData[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);

  const handleTextChange = (text: string) => {
    onChangeText(text);
    const lastChar = text[cursorPosition - 1];
    const prevChar = text[cursorPosition - 2];

    if (lastChar === '@' && (!prevChar || prevChar === ' ')) {
      setShowSuggestions(true);
      setSuggestionQuery('');
    } else if (showSuggestions) {
      const atIndex = text.lastIndexOf('@', cursorPosition - 1);
      if (atIndex >= 0) {
        const query = text.slice(atIndex + 1, cursorPosition);
        setSuggestionQuery(query);
      } else {
        setShowSuggestions(false);
      }
    }

    // Update mentions list
    const updatedMentions = mentions.filter(mention => {
      const mentionText = `@${collaborators.find(c => c.id === mention.id)?.name}`;
      return text.includes(mentionText);
    });
    setMentions(updatedMentions);
    onMentionsChanged(updatedMentions.map(m => m.id));
  };

  const handleSelectionChange = (event: any) => {
    setCursorPosition(event.nativeEvent.selection.start);
  };

  const filteredCollaborators = collaborators.filter(collaborator =>
    collaborator.name.toLowerCase().includes(suggestionQuery.toLowerCase())
  );

  const insertMention = (collaborator: Collaborator) => {
    const atIndex = value.lastIndexOf('@', cursorPosition - 1);
    if (atIndex >= 0) {
      const before = value.slice(0, atIndex);
      const after = value.slice(cursorPosition);
      const mentionText = `@${collaborator.name} `;
      const newText = before + mentionText + after;

      setMentions([
        ...mentions,
        {
          id: collaborator.id,
          name: collaborator.name,
          position: atIndex,
        },
      ]);

      onChangeText(newText);
      onMentionsChanged([...mentions, { id: collaborator.id, name: collaborator.name, position: atIndex }].map(m => m.id));
    }

    setShowSuggestions(false);
    Keyboard.dismiss();
  };

  const renderSuggestions = () => {
    if (!showSuggestions) return null;

    return (
      <View style={styles.suggestionsContainer}>
        <ScrollView style={styles.suggestionsList}>
          {filteredCollaborators.map(collaborator => (
            <TouchableOpacity
              key={collaborator.id}
              style={styles.suggestionItem}
              onPress={() => insertMention(collaborator)}
            >
              <Text style={styles.suggestionName}>{collaborator.name}</Text>
              <Text style={styles.suggestionEmail}>{collaborator.email}</Text>
            </TouchableOpacity>
          ))}
          {filteredCollaborators.length === 0 && (
            <Text style={styles.noSuggestions}>No matches found</Text>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput]}
        value={value}
        onChangeText={handleTextChange}
        onSelectionChange={handleSelectionChange}
        placeholder={placeholder}
        multiline={multiline}
      />
      {renderSuggestions()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  multilineInput: {
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  suggestionsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '100%',
    maxHeight: 200,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsList: {
    padding: 8,
  },
  suggestionItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  suggestionEmail: {
    fontSize: 12,
    color: '#666',
  },
  noSuggestions: {
    padding: 12,
    textAlign: 'center',
    color: '#666',
  },
}); 