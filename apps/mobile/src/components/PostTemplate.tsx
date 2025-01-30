import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { templateService } from '../services/templateService';

export interface Template {
  id: string;
  name: string;
  content: string;
  variables: string[];
  platformIds: string[];
}

interface PostTemplateProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: Template) => void;
  onSaveAsTemplate: (content: string) => void;
  currentContent: string;
  platformId: string;
}

export const PostTemplate = ({
  visible,
  onClose,
  onSelectTemplate,
  onSaveAsTemplate,
  currentContent,
  platformId,
}: PostTemplateProps) => {
  const [templates, setTemplates] = React.useState<Template[]>([]);
  const [showNewTemplate, setShowNewTemplate] = React.useState(false);
  const [newTemplateName, setNewTemplateName] = React.useState('');
  const [searchQuery, setSearchQuery] = React.useState('');

  React.useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const loadedTemplates = await templateService.getTemplates();
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      Alert.alert('Error', 'Please enter a template name');
      return;
    }

    const variables = templateService.parseVariables(currentContent);
    const newTemplate: Template = {
      id: Date.now().toString(),
      name: newTemplateName,
      content: currentContent,
      variables,
      platformIds: [platformId],
    };

    try {
      await templateService.saveTemplate(newTemplate);
      await loadTemplates();
      setShowNewTemplate(false);
      setNewTemplateName('');
      Alert.alert('Success', 'Template saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    Alert.alert(
      'Delete Template',
      'Are you sure you want to delete this template?',
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
              await templateService.deleteTemplate(templateId);
              await loadTemplates();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete template');
            }
          },
        },
      ]
    );
  };

  const handleSelectTemplate = async (template: Template) => {
    if (template.variables.length > 0) {
      // Show variable input modal
      const variables: Record<string, string> = {};
      template.variables.forEach(variable => {
        variables[variable] = '';
      });

      // Create dynamic form for variables
      Alert.alert(
        'Fill Template Variables',
        'Please enter values for the template variables:',
        template.variables.map(variable => ({
          text: variable,
          onPress: () => {
            Alert.prompt(
              `Enter value for ${variable}`,
              undefined,
              (value) => {
                variables[variable] = value;
                if (Object.values(variables).every(v => v)) {
                  const filledContent = templateService.fillTemplate(template, variables);
                  onSelectTemplate({ ...template, content: filledContent });
                }
              }
            );
          },
        }))
      );
    } else {
      onSelectTemplate(template);
    }
  };

  const filteredTemplates = React.useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesPlatform = template.platformIds.includes(platformId);
      return matchesSearch && matchesPlatform;
    });
  }, [templates, searchQuery, platformId]);

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
            <Text style={styles.modalTitle}>Templates</Text>
            <TouchableOpacity
              onPress={() => setShowNewTemplate(true)}
              style={styles.addButton}
            >
              <Ionicons name="add" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search templates..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView style={styles.templateList}>
            {filteredTemplates.map(template => (
              <View key={template.id} style={styles.templateItem}>
                <TouchableOpacity
                  style={styles.templateContent}
                  onPress={() => handleSelectTemplate(template)}
                >
                  <Text style={styles.templateName}>{template.name}</Text>
                  <Text style={styles.templatePreview} numberOfLines={2}>
                    {template.content}
                  </Text>
                  {template.variables.length > 0 && (
                    <View style={styles.variablesContainer}>
                      {template.variables.map(variable => (
                        <View key={variable} style={styles.variableTag}>
                          <Text style={styles.variableText}>{variable}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeleteTemplate(template.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#ff3b30" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <Modal
            visible={showNewTemplate}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setShowNewTemplate(false)}
          >
            <View style={styles.newTemplateContainer}>
              <View style={styles.newTemplateContent}>
                <Text style={styles.newTemplateTitle}>Save as Template</Text>
                <TextInput
                  style={styles.templateNameInput}
                  placeholder="Template name"
                  value={newTemplateName}
                  onChangeText={setNewTemplateName}
                />
                <View style={styles.newTemplateButtons}>
                  <TouchableOpacity
                    style={[styles.newTemplateButton, styles.cancelButton]}
                    onPress={() => setShowNewTemplate(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.newTemplateButton, styles.saveButton]}
                    onPress={handleSaveTemplate}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};

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
  addButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  templateList: {
    padding: 16,
  },
  templateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  templateContent: {
    flex: 1,
  },
  templateName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  templatePreview: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  variablesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  variableTag: {
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  variableText: {
    fontSize: 12,
    color: '#007AFF',
  },
  deleteButton: {
    padding: 8,
  },
  newTemplateContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newTemplateContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '80%',
  },
  newTemplateTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  templateNameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  newTemplateButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  newTemplateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f8f8f8',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
}); 