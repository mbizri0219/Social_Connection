import AsyncStorage from '@react-native-async-storage/async-storage';
import { Template } from '../components/PostTemplate';

const TEMPLATES_STORAGE_KEY = '@postTemplates';

export const templateService = {
  async getTemplates(): Promise<Template[]> {
    try {
      const templatesJson = await AsyncStorage.getItem(TEMPLATES_STORAGE_KEY);
      return templatesJson ? JSON.parse(templatesJson) : [];
    } catch (error) {
      console.error('Failed to load templates:', error);
      return [];
    }
  },

  async saveTemplate(template: Template): Promise<void> {
    try {
      const templates = await this.getTemplates();
      const updatedTemplates = [...templates, template];
      await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
    } catch (error) {
      console.error('Failed to save template:', error);
      throw new Error('Failed to save template');
    }
  },

  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const templates = await this.getTemplates();
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
    } catch (error) {
      console.error('Failed to delete template:', error);
      throw new Error('Failed to delete template');
    }
  },

  async updateTemplate(template: Template): Promise<void> {
    try {
      const templates = await this.getTemplates();
      const updatedTemplates = templates.map(t => 
        t.id === template.id ? template : t
      );
      await AsyncStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(updatedTemplates));
    } catch (error) {
      console.error('Failed to update template:', error);
      throw new Error('Failed to update template');
    }
  },

  async searchTemplates(query: string, platformId: string): Promise<Template[]> {
    try {
      const templates = await this.getTemplates();
      return templates.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(query.toLowerCase());
        const matchesPlatform = template.platformIds.includes(platformId);
        return matchesSearch && matchesPlatform;
      });
    } catch (error) {
      console.error('Failed to search templates:', error);
      return [];
    }
  },

  parseVariables(content: string): string[] {
    const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(match => match.slice(2, -2).trim());
  },

  fillTemplate(template: Template, variables: Record<string, string>): string {
    let filledContent = template.content;
    Object.entries(variables).forEach(([key, value]) => {
      filledContent = filledContent.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, 'g'),
        value
      );
    });
    return filledContent;
  },
}; 