import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type SupportedLanguage = 'en' | 'hi';

const LANGUAGE_STORAGE_KEY = '@phoneapp_language_pref';

export const translations = {
  en: {
    appTitle: 'Phone',
    recents: 'Recents',
    contacts: 'Contacts',
    filterAll: 'All',
    filterMissed: 'Missed',
    filterIncoming: 'Incoming',
    filterOutgoing: 'Outgoing',
    searchCalls: 'Search calls by name or number...',
    searchContacts: 'Search contacts...',
    favoritesTitle: '⭐ Favorites & Speed Dial',
    call: 'Call',
    whatsApp: 'WhatsApp',
    sms: 'Message',
    delete: 'Delete',
    cancel: 'Cancel',
    saveNote: 'Save Note',
    edit: 'Edit',
    addNote: '+ Add Note',
    notePlaceholder: 'e.g. Work, Family, Plumber, Invoice due...',
    noNotes: 'No notes added for this contact yet.',
    personalNotesTitle: 'Personal Notes / Tags',
    phoneNumbersTitle: 'Phone Numbers',
    contactDetails: 'Contact Details',
    callDetails: 'Call Details',
    today: 'Today',
    yesterday: 'Yesterday',
    matches: 'Matches',
    noCallsFound: 'No Calls Found',
    noCallsQuery: 'No call history matches your search query.',
    emptyCallHistory: 'Your recent call history is empty.',
    noContactsFound: 'No Contacts Found',
    noContactsQuery: 'No contacts match your search query.',
    noContactsDevice: 'No contacts found on your device.',
    deleteCallPrompt: 'Remove this call entry from history?',
    deleteCallTitle: 'Delete Call Log',
    permWarning: '⚠️ Tap to grant Call Log & Contacts permissions',
    loadingCalls: 'Loading call history...',
    loadingContacts: 'Loading contacts...',
    incomingCall: 'Incoming',
    outgoingCall: 'Outgoing',
    missedCall: 'Missed',
    declinedCall: 'Declined',
    blockedCall: 'Blocked',
    langToggle: 'हिन्दी',
    settingsTitle: 'Settings',
    selectLanguage: 'Language / भाषा',
    english: 'English',
    hindi: 'हिन्दी (Hindi)',
    permissionsTitle: 'App Permissions',
    callLogPerm: 'Call History Access',
    contactsPerm: 'Contacts Access',
    granted: 'Granted',
    notGranted: 'Missing',
    grantPerms: 'Grant Missing Permissions',
    dangerZone: 'Data Management',
    clearAllLogs: 'Clear All Call History',
    clearAllLogsPrompt: 'Are you sure you want to clear all call logs from your phone? This action cannot be undone.',
    allLogsCleared: 'Call history cleared successfully.',
    appVersion: 'PhoneApp Version',
    aboutApp: 'Senior & Family Friendly Phone Hub',
    createContact: '+ New Contact',
    createNewContact: 'Create New Contact',
    firstName: 'First Name',
    lastName: 'Last Name (Optional)',
    phoneNumberLabel: 'Phone Number',
    contactSaved: 'Contact saved successfully.',
    saveContact: 'Save Contact',
    addContact: 'Add Contact',
    fillRequired: 'Please enter a name and phone number.',
    voiceSearch: 'Voice Search',
    listening: 'Listening...',
    allLetters: 'All',
    speakContactName: 'Speak a contact name...',
  },
  hi: {
    appTitle: 'फ़ोन',
    recents: 'कॉल हिस्ट्री',
    contacts: 'संपर्क (Contacts)',
    filterAll: 'सभी',
    filterMissed: 'मिस्ड कॉल',
    filterIncoming: 'आए हुए कॉल',
    filterOutgoing: 'किए गए कॉल',
    searchCalls: 'नाम या नंबर से खोजें...',
    searchContacts: 'संपर्क खोजें...',
    favoritesTitle: '⭐ पसंदीदा (स्पीड डायल)',
    call: 'कॉल',
    whatsApp: 'व्हाट्सएप',
    sms: 'मैसेज',
    delete: 'हटाएं',
    cancel: 'रद्द करें',
    saveNote: 'नोट सेव करें',
    edit: 'बदलें',
    addNote: '+ नोट जोड़ें',
    notePlaceholder: 'जैसे: काम, परिवार, प्लंबर, ज़रूरी...',
    noNotes: 'इस संपर्क के लिए कोई नोट नहीं है।',
    personalNotesTitle: 'पर्सनल नोट / जानकारी',
    phoneNumbersTitle: 'फ़ोन नंबर',
    contactDetails: 'संपर्क विवरण',
    callDetails: 'कॉल का विवरण',
    today: 'आज',
    yesterday: 'कल',
    matches: 'मिलते-जुलते संपर्क',
    noCallsFound: 'कोई कॉल नहीं मिली',
    noCallsQuery: 'आपकी खोज से कोई कॉल नहीं मिली।',
    emptyCallHistory: 'कॉल हिस्ट्री खाली है।',
    noContactsFound: 'कोई संपर्क नहीं मिला',
    noContactsQuery: 'आपकी खोज से कोई संपर्क नहीं मिला।',
    noContactsDevice: 'फ़ोन में कोई संपर्क नहीं मिला।',
    deleteCallPrompt: 'क्या आप इस कॉल रिकॉर्ड को हटाना चाहते हैं?',
    deleteCallTitle: 'कॉल हटाएं',
    permWarning: '⚠️ कॉल हिस्ट्री और संपर्क देखने की अनुमति दें',
    loadingCalls: 'कॉल लोड हो रहे हैं...',
    loadingContacts: 'संपर्क लोड हो रहे हैं...',
    incomingCall: 'आया हुआ',
    outgoingCall: 'किया गया',
    missedCall: 'मिस्ड',
    declinedCall: 'काटा गया',
    blockedCall: 'ब्लॉक',
    langToggle: 'English',
    settingsTitle: 'सेटिंग्स (Settings)',
    selectLanguage: 'भाषा चुनें (Language)',
    english: 'English (अंग्रेज़ी)',
    hindi: 'हिन्दी (Hindi)',
    permissionsTitle: 'अनुमतियाँ (Permissions)',
    callLogPerm: 'कॉल हिस्ट्री अनुमति',
    contactsPerm: 'संपर्क अनुमति',
    granted: 'स्वीकृत (चालू)',
    notGranted: 'अनुमति नहीं है',
    grantPerms: 'अनुमति चालू करें',
    dangerZone: 'डेटा प्रबंधन',
    clearAllLogs: 'सारी कॉल हिस्ट्री साफ़ करें',
    clearAllLogsPrompt: 'क्या आप सभी कॉल हिस्ट्री रिकॉर्ड्स हटाना चाहते हैं? यह वापस नहीं लाया जा सकता।',
    allLogsCleared: 'कॉल हिस्ट्री साफ़ कर दी गई है।',
    appVersion: 'फ़ोन ऐप वर्शन',
    aboutApp: 'आसान और सरल फ़ैमिली फ़ोन ऐप',
    createContact: '+ नया संपर्क',
    createNewContact: 'नया संपर्क जोड़ें',
    firstName: 'पहला नाम',
    lastName: 'उपनाम (वैकल्पिक)',
    phoneNumberLabel: 'फ़ोन नंबर',
    contactSaved: 'संपर्क सफलतापूर्वक सेव हो गया।',
    saveContact: 'संपर्क सेव करें',
    addContact: 'संपर्क जोड़ें',
    fillRequired: 'कृपया नाम और फ़ोन नंबर दर्ज करें।',
    voiceSearch: 'बोलकर खोजें',
    listening: 'सुन रहे हैं...',
    allLetters: 'सभी',
    speakContactName: 'संपर्क का नाम बोलिए...',
  },
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextProps {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextProps>({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: TranslationKey) => translations.en[key] || key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    loadSavedLanguage();
  }, []);

  const loadSavedLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'hi' || saved === 'en') {
        setLanguageState(saved);
      }
    } catch (e) {
      console.warn('Error loading language pref:', e);
    }
  };

  const setLanguage = async (lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Error saving language pref:', e);
    }
  };

  const toggleLanguage = () => {
    const nextLang: SupportedLanguage = language === 'en' ? 'hi' : 'en';
    setLanguage(nextLang);
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations.en;
    return dict[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
