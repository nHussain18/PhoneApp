import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { PhoneContact } from '../../services/ContactsService';
import { FavoritesGrid } from '../Favorites/FavoritesGrid';
import { ContactDetailsModal } from './ContactDetailsModal';
import { CreateContactModal } from './CreateContactModal';
import { ActionService } from '../../services/ActionService';
import { useLanguage } from '../../services/LanguageContext';

interface ContactsListProps {
  contacts: PhoneContact[];
  isLoading: boolean;
  onRefresh: () => void;
  onFavoriteToggled?: () => void;
}

export const ContactsList: React.FC<ContactsListProps> = ({
  contacts,
  isLoading,
  onRefresh,
  onFavoriteToggled,
}) => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<PhoneContact | null>(null);
  const [isCreateContactVisible, setIsCreateContactVisible] = useState<boolean>(false);

  const favorites = useMemo(() => {
    return contacts.filter((c) => c.isFavorite);
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }
    const q = searchQuery.toLowerCase().trim();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phoneNumbers.some((p) => p.number.includes(q))
    );
  }, [contacts, searchQuery]);

  const handleCall = (phoneNumber: string, e?: any) => {
    if (e) e.stopPropagation();
    ActionService.placeCall(phoneNumber);
  };

  const handleWhatsApp = (phoneNumber: string, e?: any) => {
    if (e) e.stopPropagation();
    ActionService.openWhatsApp(phoneNumber);
  };

  const renderContactItem = ({ item }: { item: PhoneContact }) => {
    const initial = item.name ? item.name.charAt(0).toUpperCase() : '#';
    const primaryPhone = item.phoneNumbers[0]?.number || '';

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => setSelectedContact(item)}
        activeOpacity={0.7}
      >
        {item.imageUri ? (
          <Image source={{ uri: item.imageUri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        )}

        <View style={styles.contactInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.contactName} numberOfLines={1}>
              {item.name}
            </Text>
            {item.isFavorite && <Text style={styles.starIcon}>⭐</Text>}
          </View>
          <Text style={styles.contactPhone} numberOfLines={1}>
            {primaryPhone}
          </Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.whatsAppButton}
            onPress={(e) => handleWhatsApp(primaryPhone, e)}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Text style={styles.btnIcon}>💬</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.callButton}
            onPress={(e) => handleCall(primaryPhone, e)}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Text style={styles.btnIcon}>📞</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header & New Contact Button */}
      <View style={styles.topActionRow}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={t('searchContacts')}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
              <Text style={styles.clearSearchText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.newContactBtn}
          onPress={() => {
            ActionService.triggerHaptic('selection');
            setIsCreateContactVisible(true);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.newContactBtnText}>{t('createContact')}</Text>
        </TouchableOpacity>
      </View>

      {/* Speed Dial / Favorites Row */}
      {!searchQuery && (
        <FavoritesGrid
          favorites={favorites}
          onSelectContact={(c) => setSelectedContact(c)}
        />
      )}

      {/* Main Contacts List */}
      {isLoading && contacts.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>{t('loadingContacts')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContactItem}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={['#2563EB']} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>👤</Text>
              <Text style={styles.emptyTitle}>{t('noContactsFound')}</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? t('noContactsQuery')
                  : t('noContactsDevice')}
              </Text>
            </View>
          }
        />
      )}

      {/* Contact Details Modal */}
      <ContactDetailsModal
        contact={selectedContact}
        visible={!!selectedContact}
        onClose={() => setSelectedContact(null)}
        onFavoriteToggled={onFavoriteToggled}
      />

      {/* Create Contact Modal */}
      <CreateContactModal
        visible={isCreateContactVisible}
        onClose={() => setIsCreateContactVisible(false)}
        onContactCreated={onRefresh}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  newContactBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newContactBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  clearSearch: {
    padding: 4,
  },
  clearSearchText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 80,
    paddingTop: 4,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    flexShrink: 1,
  },
  starIcon: {
    fontSize: 12,
  },
  contactPhone: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 8,
  },
  whatsAppButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnIcon: {
    fontSize: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
  },
});
