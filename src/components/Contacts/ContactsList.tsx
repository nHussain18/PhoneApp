import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ActionService } from '../../services/ActionService';
import { PhoneContact, getContactRootLetter } from '../../services/ContactsService';
import { useLanguage } from '../../services/LanguageContext';
import { VoiceSearchService } from '../../services/VoiceSearchService';
import { AppIcon } from '../Common/AppIcon';
import { FavoritesGrid } from '../Favorites/FavoritesGrid';
import { ContactDetailsModal } from './ContactDetailsModal';
import { CreateContactModal } from './CreateContactModal';

interface ContactsListProps {
  contacts: PhoneContact[];
  isLoading: boolean;
  onRefresh: () => void;
  onFavoriteToggled?: () => void;
}

const HINDI_ALPHABETS = [
  'अ', 'आ', 'इ', 'ई', 'उ', 'ऊ', 'ए', 'ऐ', 'ओ', 'औ',
  'क', 'ख', 'ग', 'घ',
  'च', 'छ', 'ज', 'झ',
  'ट', 'ठ', 'ड', 'ढ',
  'त', 'थ', 'द', 'ध', 'न',
  'प', 'फ', 'ब', 'भ', 'म',
  'य', 'र', 'ल', 'व',
  'श', 'ष', 'स', 'ह',
  'क्ष', 'त्र', 'ज्ञ',
];

const ENGLISH_ALPHABETS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z',
];

export const ContactsList: React.FC<ContactsListProps> = ({
  contacts,
  isLoading,
  onRefresh,
  onFavoriteToggled,
}) => {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<PhoneContact | null>(null);
  const [isCreateContactVisible, setIsCreateContactVisible] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);

  // Dynamically compute only letters that actually exist in contacts
  const availableLetters = useMemo(() => {
    const letterSet = new Set<string>();
    for (const c of contacts) {
      const root = getContactRootLetter(c.name);
      if (root && root !== '#') {
        letterSet.add(root);
      }
    }

    const keys = Array.from(letterSet);
    keys.sort((a, b) => {
      const idxA = HINDI_ALPHABETS.indexOf(a);
      const idxB = HINDI_ALPHABETS.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });

    return keys;
  }, [contacts]);

  const favorites = useMemo(() => {
    return contacts.filter((c) => c.isFavorite);
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    let list = contacts;

    // Filter by Alphabet Quick-Jump letter
    if (selectedLetter) {
      list = list.filter((c) => {
        const root = getContactRootLetter(c.name);
        return root === selectedLetter;
      });
    }

    // Filter by search query (text or voice transcript)
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phoneNumbers.some((p) => p.number.includes(q))
      );
    }

    return list;
  }, [contacts, selectedLetter, searchQuery]);

  const handleVoiceSearch = async () => {
    ActionService.triggerHaptic('impactMedium');
    setIsListening(true);
    const spokenText = await VoiceSearchService.startVoiceSearch(language);
    setIsListening(false);

    if (spokenText) {
      ActionService.triggerHaptic('success');
      setSelectedLetter(null);
      setSearchQuery(spokenText);
    }
  };

  const handleLetterSelect = (letter: string | null) => {
    ActionService.triggerHaptic('selection');
    setSelectedLetter(letter);
    if (letter) {
      setSearchQuery('');
    }
  };

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
            {item.isFavorite && <AppIcon name="star" size={14} color="#EAB308" />}
          </View>
          <Text style={styles.contactPhone} numberOfLines={1}>
            {primaryPhone}
          </Text>
        </View>

        <View style={styles.actionRow}>
          {/* <TouchableOpacity
            style={styles.whatsAppButton}
            onPress={(e) => handleWhatsApp(primaryPhone, e)}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <AppIcon name="logo-whatsapp" size={18} color="#16A34A" />
          </TouchableOpacity> */}

          <TouchableOpacity
            style={styles.callButton}
            onPress={(e) => handleCall(primaryPhone, e)}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <AppIcon name="call" size={18} color="#2563EB" />
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
          <AppIcon name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder={isListening ? t('listening') : t('searchContacts')}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              if (text && selectedLetter) setSelectedLetter(null);
            }}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
              <AppIcon name="close" size={16} color="#94A3B8" />
            </TouchableOpacity>
          )}

          {/* Voice Search Button */}
          <TouchableOpacity
            style={[styles.micButton, isListening && styles.micButtonActive]}
            onPress={handleVoiceSearch}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <AppIcon name={isListening ? 'mic' : 'mic-outline'} size={18} color={isListening ? '#DC2626' : '#64748B'} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.newContactBtn}
          onPress={() => {
            ActionService.triggerHaptic('selection');
            setIsCreateContactVisible(true);
          }}
          activeOpacity={0.7}
        >
          {/* <Text style={styles.newContactBtnText}>{t('createContact')}</Text> */}
          <Text style={styles.newContactBtnText}>{'+'}</Text>
        </TouchableOpacity>
      </View>

      {/* Alphabet / Varnamala Quick-Jump Bar (Only Available Letters) */}
      {availableLetters.length > 0 && (
        <View style={styles.jumpBarContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.jumpScrollContent}
          >
            <TouchableOpacity
              style={[styles.jumpChip, !selectedLetter && styles.jumpChipActive]}
              onPress={() => handleLetterSelect(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.jumpChipText, !selectedLetter && styles.jumpChipTextActive]}>
                {t('allLetters')}
              </Text>
            </TouchableOpacity>

            {availableLetters.map((letter) => {
              const isSelected = selectedLetter === letter;
              return (
                <TouchableOpacity
                  key={letter}
                  style={[styles.jumpChip, isSelected && styles.jumpChipActive]}
                  onPress={() => handleLetterSelect(isSelected ? null : letter)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.jumpChipText, isSelected && styles.jumpChipTextActive]}>
                    {letter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Speed Dial / Favorites Row */}
      {!searchQuery && !selectedLetter && (
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
              <AppIcon name="person-outline" size={48} color="#94A3B8" style={{ alignSelf: 'center', marginBottom: 8 }} />
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
  micButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginLeft: 4,
  },
  micButtonActive: {
    backgroundColor: '#FEE2E2',
  },
  micIcon: {
    fontSize: 15,
  },
  jumpBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 4,
  },
  jumpScrollContent: {
    paddingHorizontal: 16,
    gap: 6,
  },
  jumpChip: {
    height: 38,
    minWidth: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpChipActive: {
    backgroundColor: '#2563EB',
  },
  jumpChipText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
  },
  jumpChipTextActive: {
    color: '#FFFFFF',
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
