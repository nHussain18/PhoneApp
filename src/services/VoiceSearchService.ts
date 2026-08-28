import { NativeModules, Platform } from 'react-native';

const { VoiceSearchModule } = NativeModules;

export const VoiceSearchService = {
  isAvailable(): boolean {
    return Platform.OS === 'android' && !!VoiceSearchModule;
  },

  async startVoiceSearch(language: 'en' | 'hi' = 'hi'): Promise<string> {
    if (!this.isAvailable()) {
      return '';
    }

    try {
      const languageCode = language === 'hi' ? 'hi-IN' : 'en-IN';
      const result = await VoiceSearchModule.startSpeechRecognition(languageCode);
      return typeof result === 'string' ? result.trim() : '';
    } catch (e) {
      console.warn('VoiceSearchService error:', e);
      return '';
    }
  },
};
