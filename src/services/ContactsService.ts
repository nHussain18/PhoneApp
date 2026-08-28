import * as Contacts from 'expo-contacts/legacy';
import { StorageService } from './StorageService';

export interface PhoneContact {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phoneNumbers: { number: string; label?: string }[];
  imageUri?: string;
  isFavorite?: boolean;
  t9Representation: string;
  t9Representations?: string[];
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

// Devanagari to Latin Transliteration Table
const DEVANAGARI_TO_LATIN: { [key: string]: string } = {
  // Independent Vowels
  'अ': 'a', 'आ': 'aa', 'इ': 'i', 'ई': 'ee', 'उ': 'u', 'ऊ': 'oo', 'ऋ': 'ri',
  'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au', 'अं': 'an', 'अः': 'ah',
  // Consonants
  'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ng',
  'च': 'ch', 'छ': 'chh', 'ज': 'j', 'झ': 'jh', 'ञ': 'ny',
  'ट': 't', 'ठ': 'th', 'ड': 'd', 'ढ': 'dh', 'ण': 'n',
  'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n',
  'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm',
  'य': 'y', 'र': 'r', 'ल': 'l', 'व': 'v',
  'श': 'sh', 'ष': 'sh', 'स': 's', 'ह': 'h',
  'क्ष': 'ksh', 'त्र': 'tr', 'ज्ञ': 'gy',
  'ड़': 'd', 'ढ़': 'dh', 'फ़': 'f', 'ज़': 'z', 'क़': 'q', 'ख़': 'kh', 'ग़': 'g',
  // Dependent Vowel Signs (Matras)
  'ा': 'a', 'ि': 'i', 'ी': 'ee', 'ु': 'u', 'ू': 'oo', 'ृ': 'ri',
  'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au', 'ं': 'n', 'ँ': 'n',
  '्': '', // Virama / Halant
  'ः': 'h',
};

// Direct Indian Mobile Keypad Hindi Varna Mapping
const DEVANAGARI_DIRECT_KEYPAD: { [key: string]: string } = {
  'अ': '2', 'आ': '2', 'इ': '2', 'ई': '2', 'क': '2', 'ख': '2', 'ग': '2', 'घ': '2', 'ङ': '2', 'ा': '2', 'ि': '2', 'ी': '2',
  'उ': '3', 'ऊ': '3', 'ऋ': '3', 'च': '3', 'छ': '3', 'ज': '3', 'झ': '3', 'ञ': '3', 'ु': '3', 'ू': '3',
  'ए': '4', 'ऐ': '4', 'ट': '4', 'ठ': '4', 'ड': '4', 'ढ': '4', 'ण': '4', 'े': '4', 'ै': '4',
  'ओ': '5', 'औ': '5', 'त': '5', 'थ': '5', 'द': '5', 'ध': '5', 'न': '5', 'ो': '5', 'ौ': '5',
  'प': '6', 'फ': '6', 'ब': '6', 'भ': '6', 'म': '6',
  'य': '7', 'र': '7', 'ल': '7', 'व': '7',
  'श': '8', 'ष': '8', 'स': '8', 'ह': '8',
  'क्ष': '9', 'त्र': '9', 'ज्ञ': '9', 'ड़': '9', 'ढ़': '9', 'ज़': '9', 'फ़': '9',
};

// Set of Devanagari Consonants
const DEVANAGARI_CONSONANTS = new Set([
  'क', 'ख', 'ग', 'घ', 'ङ',
  'च', 'छ', 'ज', 'झ', 'ञ',
  'ट', 'ठ', 'ड', 'ढ', 'ण',
  'त', 'थ', 'द', 'ध', 'न',
  'प', 'फ', 'ब', 'भ', 'म',
  'य', 'र', 'ल', 'व',
  'श', 'ष', 'स', 'ह',
  'क्ष', 'त्र', 'ज्ञ',
  'ड़', 'ढ़', 'फ़', 'ज़', 'क़', 'ख़', 'ग़',
]);

// Set of Dependent Matras
const DEVANAGARI_MATRAS = new Set([
  'ा', 'ि', 'ी', 'ु', 'ू', 'ृ', 'े', 'ै', 'ो', 'ौ', 'ं', 'ँ', 'ः', '्',
]);

export function stringToT9(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .split('')
    .map((char) => T9_MAP[char] || char)
    .join('');
}

export function transliterateDevanagari(text: string): string[] {
  if (!text) return [];

  let fullTransliteration = '';
  let compactTransliteration = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = i + 1 < text.length ? text[i + 1] : null;

    if (DEVANAGARI_CONSONANTS.has(char)) {
      const latinConsonant = DEVANAGARI_TO_LATIN[char] || '';
      compactTransliteration += latinConsonant;

      if (!nextChar) {
        // Last char of word
        fullTransliteration += latinConsonant;
      } else if (nextChar === '्') {
        // Halant suppresses vowel
        fullTransliteration += latinConsonant;
        i++; // skip halant in next loop
      } else if (DEVANAGARI_MATRAS.has(nextChar)) {
        // Explicit matra will supply the vowel
        fullTransliteration += latinConsonant;
      } else if (DEVANAGARI_CONSONANTS.has(nextChar) || nextChar === ' ') {
        // Followed by another consonant -> add inherent 'a'
        fullTransliteration += latinConsonant + 'a';
      } else {
        fullTransliteration += latinConsonant + 'a';
      }
    } else if (DEVANAGARI_TO_LATIN[char] !== undefined) {
      fullTransliteration += DEVANAGARI_TO_LATIN[char];
      compactTransliteration += DEVANAGARI_TO_LATIN[char];
    } else {
      fullTransliteration += char;
      compactTransliteration += char;
    }
  }

  const results = new Set<string>();
  if (fullTransliteration) results.add(fullTransliteration.toLowerCase());
  if (compactTransliteration) results.add(compactTransliteration.toLowerCase());
  return Array.from(results);
}

export function devanagariDirectT9(text: string): string {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (DEVANAGARI_DIRECT_KEYPAD[char]) {
      result += DEVANAGARI_DIRECT_KEYPAD[char];
    } else if (T9_MAP[char.toLowerCase()]) {
      result += T9_MAP[char.toLowerCase()];
    }
  }
  return result;
}

export function getAllT9Representations(name: string): string[] {
  if (!name) return [];
  const set = new Set<string>();

  // 1. Direct standard Latin T9
  const directT9 = stringToT9(name);
  if (directT9) set.add(directT9);

  // 2. Phonetic transliteration T9 (with inherent vowels e.g. रमेश -> ramesh -> 726374, पापा -> papa -> 7272)
  const transliterations = transliterateDevanagari(name);
  for (const trans of transliterations) {
    const t9 = stringToT9(trans);
    if (t9) set.add(t9);
  }

  // 3. Indian Hindi Mobile Varna Keypad mapping
  const directHindiT9 = devanagariDirectT9(name);
  if (directHindiT9) set.add(directHindiT9);

  return Array.from(set);
}

export function getContactRootLetter(name: string): string {
  if (!name || name.trim().length === 0) return '#';
  const clean = name.trim();
  const firstChar = clean[0];

  if (DEVANAGARI_CONSONANTS.has(firstChar)) {
    return firstChar;
  }
  if (DEVANAGARI_TO_LATIN[firstChar]) {
    return firstChar;
  }

  return firstChar.toUpperCase();
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
          t9Representations: getAllT9Representations(item.name),
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
      // 1. Check Name via all T9 representations (Latin, Devanagari phonetic, Devanagari direct)
      let nameMatched = false;
      const allReps = contact.t9Representations && contact.t9Representations.length > 0
        ? contact.t9Representations
        : [contact.t9Representation];

      for (const rep of allReps) {
        const nameIndex = rep.indexOf(query);
        if (nameIndex !== -1) {
          results.push({
            contact,
            matchedNumber: contact.phoneNumbers[0]?.number,
            matchType: 'name',
            matchIndices: [nameIndex, nameIndex + query.length],
          });
          nameMatched = true;
          break;
        }
      }

      if (nameMatched) continue;

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
    return StorageService.getFavorites();
  },

  async toggleFavorite(contactId: string): Promise<boolean> {
    try {
      const updatedFavorites = StorageService.toggleFavorite(contactId);
      const isFav = updatedFavorites.includes(contactId);

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
