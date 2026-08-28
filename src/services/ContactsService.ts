import * as Contacts from 'expo-contacts/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PhoneContact {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phoneNumbers: { number: string; label?: string }[];
  imageUri?: string;
  isFavorite?: boolean;
  t9Representation: string;
}

export interface T9SearchResult {
  contact: PhoneContact;
  matchedNumber?: string;
  matchType: 'name' | 'number';
  matchIndices?: [number, number]; // [start, end]
}

const T9_MAP: { [key: string]: string } = {
  a: '2', b: '2', c: '2',
  d: '3', e: '3', f: '3',
  g: '4', h: '4', i: '4',
  j: '5', k: '5', l: '5',
  m: '6', n: '6', o: '6',
  p: '7', q: '7', r: '7', s: '7',
  t: '8', u: '8', v: '8',
  w: '9', x: '9', y: '9', z: '9',
};

const FAVORITES_STORAGE_KEY = '@phoneapp_favorites_ids';

export function stringToT9(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split('')
    .map((char) => T9_MAP[char] || char)
    .join('');
}

let cachedContacts: PhoneContact[] = [];

export const ContactsService = {
  async requestPermission(): Promise<boolean> {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      console.warn('Error requesting contacts permission:', e);
      return false;
    }
  },

  async hasPermission(): Promise<boolean> {
    try {
      const { status } = await Contacts.getPermissionsAsync();
      return status === 'granted';
    } catch (e) {
      return false;
    }
  },

  async loadContacts(forceRefresh = false): Promise<PhoneContact[]> {
    if (cachedContacts.length > 0 && !forceRefresh) {
      return cachedContacts;
    }

    const hasPerm = await this.hasPermission();
    if (!hasPerm) {
      const granted = await this.requestPermission();
      if (!granted) return [];
    }

    try {
      const { data } = await Contacts.getContactsAsync({
        fields: [
          Contacts.Fields.PhoneNumbers,
          Contacts.Fields.Image,
          Contacts.Fields.FirstName,
          Contacts.Fields.LastName,
        ],
        sort: Contacts.SortTypes.FirstName,
      });

      const favorites = await this.getFavoriteIds();
      const favSet = new Set(favorites);

      const parsed: PhoneContact[] = [];

      for (const item of data) {
        if (!item.name || !item.phoneNumbers || item.phoneNumbers.length === 0) {
          continue;
        }

        const validNumbers = item.phoneNumbers
          .filter((p) => p.number && p.number.trim().length > 0)
          .map((p) => ({
            number: p.number!.trim(),
            label: p.label || 'Mobile',
          }));

        if (validNumbers.length === 0) continue;

        parsed.push({
          id: item.id,
          name: item.name,
          firstName: item.firstName,
          lastName: item.lastName,
          phoneNumbers: validNumbers,
          imageUri: item.image?.uri,
          isFavorite: favSet.has(item.id),
          t9Representation: stringToT9(item.name),
        });
      }

      cachedContacts = parsed;
      return parsed;
    } catch (e) {
      console.error('Error fetching contacts:', e);
      return [];
    }
  },

  searchT9(queryDigits: string, contacts: PhoneContact[] = cachedContacts): T9SearchResult[] {
    if (!queryDigits || queryDigits.trim().length === 0) {
      return [];
    }

    const query = queryDigits.trim();
    const results: T9SearchResult[] = [];

    for (const contact of contacts) {
      // 1. Check Name via T9 representation
      const nameIndex = contact.t9Representation.indexOf(query);
      if (nameIndex !== -1) {
        results.push({
          contact,
          matchedNumber: contact.phoneNumbers[0]?.number,
          matchType: 'name',
          matchIndices: [nameIndex, nameIndex + query.length],
        });
        continue;
      }

      // 2. Check phone numbers directly
      let matchedNum: string | null = null;
      let numIndex = -1;

      for (const p of contact.phoneNumbers) {
        const cleanNum = p.number.replace(/\D/g, '');
        const idx = cleanNum.indexOf(query);
        if (idx !== -1) {
          matchedNum = p.number;
          numIndex = idx;
          break;
        }
      }

      if (matchedNum) {
        results.push({
          contact,
          matchedNumber: matchedNum,
          matchType: 'number',
          matchIndices: [numIndex, numIndex + query.length],
        });
      }
    }

    return results.slice(0, 50); // limit top 50 results
  },

  async getFavoriteIds(): Promise<string[]> {
    try {
      const raw = await AsyncStorage.getItem(FAVORITES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  async toggleFavorite(contactId: string): Promise<boolean> {
    try {
      const current = await this.getFavoriteIds();
      const set = new Set(current);
      let isFav = false;

      if (set.has(contactId)) {
        set.delete(contactId);
        isFav = false;
      } else {
        set.add(contactId);
        isFav = true;
      }

      await AsyncStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(Array.from(set)));

      // Update cached contacts
      cachedContacts = cachedContacts.map((c) =>
        c.id === contactId ? { ...c, isFavorite: isFav } : c
      );

      return isFav;
    } catch (e) {
      console.error('Error toggling favorite:', e);
      return false;
    }
  },

  async createContact(firstName: string, lastName: string, phoneNumber: string): Promise<string | null> {
    try {
      const contactObj: Contacts.Contact = {
        contactType: Contacts.ContactTypes.Person,
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumbers: [
          {
            number: phoneNumber.trim(),
            label: 'mobile',
            isPrimary: true,
          },
        ],
      };

      const contactId = await Contacts.addContactAsync(contactObj);
      // Invalidate cache
      cachedContacts = [];
      return contactId;
    } catch (e) {
      console.error('Error creating contact:', e);
      return null;
    }
  },

  async presentSystemContactForm(initialPhone?: string, initialName?: string): Promise<void> {
    try {
      await Contacts.presentFormAsync(null, {
        contactType: Contacts.ContactTypes.Person,
        name: initialName || '',
        firstName: initialName || '',
        phoneNumbers: initialPhone
          ? [{ number: initialPhone, label: 'mobile', isPrimary: true }]
          : [],
      });
      // Invalidate cache so next fetch refreshes
      cachedContacts = [];
    } catch (e) {
      console.error('Error presenting system contact form:', e);
    }
  },
};
