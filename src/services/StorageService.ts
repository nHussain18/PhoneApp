import { createMMKV } from 'react-native-mmkv';

export type SupportedLanguage = 'en' | 'hi';

export const storage = createMMKV({
  id: 'phoneapp-storage',
});

const KEYS = {
  LANGUAGE: '@phoneapp_language',
  FAVORITES: '@phoneapp_favorites_ids',
  CONTACT_NOTE_PREFIX: '@contact_note_',
};

export const StorageService = {
  // Language
  getLanguage(defaultLang: 'en' | 'hi' = 'en'): 'en' | 'hi' {
    const saved = storage.getString(KEYS.LANGUAGE);
    return saved === 'hi' || saved === 'en' ? saved : defaultLang;
  },

  setLanguage(lang: 'en' | 'hi'): void {
    storage.set(KEYS.LANGUAGE, lang);
  },

  // Favorites
  getFavorites(): string[] {
    const raw = storage.getString(KEYS.FAVORITES);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  setFavorites(ids: string[]): void {
    storage.set(KEYS.FAVORITES, JSON.stringify(ids));
  },

  toggleFavorite(id: string): string[] {
    const favs = this.getFavorites();
    const set = new Set(favs);
    if (set.has(id)) {
      set.delete(id);
    } else {
      set.add(id);
    }
    const updated = Array.from(set);
    this.setFavorites(updated);
    return updated;
  },

  // Contact Notes
  getContactNote(contactId: string): string {
    return storage.getString(`${KEYS.CONTACT_NOTE_PREFIX}${contactId}`) || '';
  },

  setContactNote(contactId: string, note: string): void {
    const key = `${KEYS.CONTACT_NOTE_PREFIX}${contactId}`;
    if (!note || note.trim().length === 0) {
      storage.remove(key);
    } else {
      storage.set(key, note.trim());
    }
  },
};
