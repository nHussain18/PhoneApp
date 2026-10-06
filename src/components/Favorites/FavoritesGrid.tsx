import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PhoneContact } from '../../services/ContactsService';
import { useLanguage } from '../../services/LanguageContext';
import { ContactListItem } from '../Contacts/ContactListItem';

interface FavoritesGridProps {
  favorites: PhoneContact[];
  onSelectContact: (contact: PhoneContact) => void;
  onCall?: (phoneNumber: string) => void;
  onWhatsApp?: (phoneNumber: string) => void;
  hasOtherContacts?: boolean;
}

export const FavoritesGrid: React.FC<FavoritesGridProps> = ({
  favorites,
  onSelectContact,
  onCall,
  onWhatsApp,
  hasOtherContacts = false,
}) => {
  const { t } = useLanguage();
  if (!favorites || favorites.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>{t('favoritesTitle')}</Text>
      <View style={styles.list}>
        {favorites.map((contact) => (
          <ContactListItem
            key={`fav-${contact.id}`}
            contact={contact}
            onSelect={onSelectContact}
            onCall={onCall}
            onWhatsApp={onWhatsApp}
          />
        ))}
      </View>
      {hasOtherContacts && (
        <Text style={[styles.sectionHeader, styles.contactsHeader]}>
          {t('contacts')}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
    paddingBottom: 2,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  contactsHeader: {
    marginTop: 10,
    marginBottom: 8,
  },
  list: {
    width: '100%',
  },
});
