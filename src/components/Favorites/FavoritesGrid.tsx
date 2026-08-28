import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { PhoneContact } from '../../services/ContactsService';
import { ActionService } from '../../services/ActionService';
import { useLanguage } from '../../services/LanguageContext';

interface FavoritesGridProps {
  favorites: PhoneContact[];
  onSelectContact: (contact: PhoneContact) => void;
}

export const FavoritesGrid: React.FC<FavoritesGridProps> = ({
  favorites,
  onSelectContact,
}) => {
  const { t } = useLanguage();
  if (!favorites || favorites.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>{t('favoritesTitle')}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {favorites.map((contact) => {
          const initial = contact.name ? contact.name.charAt(0).toUpperCase() : '#';
          const primaryPhone = contact.phoneNumbers[0]?.number || '';

          return (
            <TouchableOpacity
              key={contact.id}
              style={styles.card}
              onPress={() => onSelectContact(contact)}
              activeOpacity={0.7}
            >
              {contact.imageUri ? (
                <Image source={{ uri: contact.imageUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initial}</Text>
                </View>
              )}

              <Text style={styles.nameText} numberOfLines={1}>
                {contact.name}
              </Text>

              <TouchableOpacity
                style={styles.callButton}
                onPress={() => ActionService.placeCall(primaryPhone)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.callIcon}>📞</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  scrollList: {
    paddingHorizontal: 16,
    gap: 14,
  },
  card: {
    width: 76,
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    shadowColor: '#2563EB',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginBottom: 6,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  nameText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    textAlign: 'center',
    width: '100%',
    marginBottom: 4,
  },
  callButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callIcon: {
    fontSize: 12,
  },
});
