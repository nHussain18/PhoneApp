import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { PhoneContact, ContactsService } from '../../services/ContactsService';
import { StorageService } from '../../services/StorageService';
import { ActionService } from '../../services/ActionService';
import { useLanguage } from '../../services/LanguageContext';

interface ContactDetailsModalProps {
  contact: PhoneContact | null;
  visible: boolean;
  onClose: () => void;
  onFavoriteToggled?: () => void;
}

export const ContactDetailsModal: React.FC<ContactDetailsModalProps> = ({
  contact,
  visible,
  onClose,
  onFavoriteToggled,
}) => {
  const { t } = useLanguage();
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [isEditingNote, setIsEditingNote] = useState<boolean>(false);

  useEffect(() => {
    if (contact) {
      setIsFavorite(!!contact.isFavorite);
      const savedNote = StorageService.getContactNote(contact.id);
      setNote(savedNote);
    }
  }, [contact]);

  const handleSaveNote = () => {
    if (!contact) return;
    StorageService.setContactNote(contact.id, note.trim());
    setIsEditingNote(false);
    ActionService.triggerHaptic('success');
  };

  const handleToggleFav = async () => {
    if (!contact) return;
    ActionService.triggerHaptic('impactMedium');
    const nextState = await ContactsService.toggleFavorite(contact.id);
    setIsFavorite(nextState);
    if (onFavoriteToggled) onFavoriteToggled();
  };

  if (!contact) return null;

  const initial = contact.name ? contact.name.charAt(0).toUpperCase() : '#';
  const primaryPhone = contact.phoneNumbers[0]?.number || '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleToggleFav} style={styles.favButton}>
              <Text style={styles.favIcon}>{isFavorite ? '⭐' : '☆'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Avatar & Name */}
            <View style={styles.profileHeader}>
              {contact.imageUri ? (
                <Image source={{ uri: contact.imageUri }} style={styles.largeAvatar} />
              ) : (
                <View style={styles.largeAvatarPlaceholder}>
                  <Text style={styles.largeAvatarText}>{initial}</Text>
                </View>
              )}
              <Text style={styles.profileName}>{contact.name}</Text>
              <Text style={styles.profileSubtext}>{t('contactDetails')}</Text>
            </View>

            {/* Quick Action Grid */}
            <View style={styles.quickActionRow}>
              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => ActionService.placeCall(primaryPhone)}
              >
                <View style={[styles.actionCircle, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={styles.actionIcon}>📞</Text>
                </View>
                <Text style={styles.actionLabel}>{t('call')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => ActionService.openWhatsApp(primaryPhone)}
              >
                <View style={[styles.actionCircle, { backgroundColor: '#D1FAE5' }]}>
                  <Text style={styles.actionIcon}>💬</Text>
                </View>
                <Text style={styles.actionLabel}>{t('whatsApp')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionCard}
                onPress={() => ActionService.sendSms(primaryPhone)}
              >
                <View style={[styles.actionCircle, { backgroundColor: '#E0F2FE' }]}>
                  <Text style={styles.actionIcon}>✉️</Text>
                </View>
                <Text style={styles.actionLabel}>{t('sms')}</Text>
              </TouchableOpacity>
            </View>

            {/* Phone Numbers List */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('phoneNumbersTitle')}</Text>
              {contact.phoneNumbers.map((p, idx) => (
                <View key={idx.toString()} style={styles.phoneRow}>
                  <View style={styles.phoneLeft}>
                    <Text style={styles.phoneLabel}>{p.label || 'Mobile'}</Text>
                    <Text style={styles.phoneNumber}>{p.number}</Text>
                  </View>

                  <View style={styles.phoneActions}>
                    <TouchableOpacity
                      style={styles.miniButton}
                      onPress={() => ActionService.openWhatsApp(p.number)}
                    >
                      <Text style={styles.miniIcon}>💬</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.miniButton, { backgroundColor: '#DCFCE7' }]}
                      onPress={() => ActionService.placeCall(p.number)}
                    >
                      <Text style={styles.miniIcon}>📞</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Notes / Tags Section */}
            <View style={styles.section}>
              <View style={styles.noteHeader}>
                <Text style={styles.sectionTitle}>{t('personalNotesTitle')}</Text>
                {!isEditingNote && (
                  <TouchableOpacity onPress={() => setIsEditingNote(true)}>
                    <Text style={styles.editNoteText}>{note ? t('edit') : t('addNote')}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {isEditingNote ? (
                <View>
                  <TextInput
                    style={styles.noteInput}
                    placeholder={t('notePlaceholder')}
                    placeholderTextColor="#94A3B8"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    autoFocus
                  />
                  <View style={styles.noteBtnRow}>
                    <TouchableOpacity
                      style={styles.noteCancelBtn}
                      onPress={() => setIsEditingNote(false)}
                    >
                      <Text style={styles.noteCancelText}>{t('cancel')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.noteSaveBtn} onPress={handleSaveNote}>
                      <Text style={styles.noteSaveText}>{t('saveNote')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <Text style={styles.noteContent}>
                  {note || t('noNotes')}
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: 'bold',
  },
  favButton: {
    padding: 6,
  },
  favIcon: {
    fontSize: 22,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: 12,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },
  largeAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  largeAvatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },
  profileSubtext: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginVertical: 16,
  },
  actionCard: {
    alignItems: 'center',
  },
  actionCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionIcon: {
    fontSize: 22,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  section: {
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  phoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  phoneLeft: {
    flex: 1,
  },
  phoneLabel: {
    fontSize: 11,
    color: '#64748B',
    textTransform: 'capitalize',
  },
  phoneNumber: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginTop: 2,
  },
  phoneActions: {
    flexDirection: 'row',
    gap: 8,
  },
  miniButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniIcon: {
    fontSize: 15,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editNoteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563EB',
  },
  noteContent: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  noteInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    minHeight: 60,
    marginTop: 6,
  },
  noteBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  noteCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  noteCancelText: {
    fontSize: 12,
    color: '#64748B',
  },
  noteSaveBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 6,
  },
  noteSaveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
