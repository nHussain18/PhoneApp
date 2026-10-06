import React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { ActionService } from '../../services/ActionService';
import { PhoneContact } from '../../services/ContactsService';
import { AppIcon } from '../Common/AppIcon';

export interface ContactListItemProps {
  contact: PhoneContact;
  matchedNumber?: string;
  onSelect?: (contact: PhoneContact) => void;
  onCall?: (phoneNumber: string) => void;
  onWhatsApp?: (phoneNumber: string) => void;
}

export const ContactListItem: React.FC<ContactListItemProps> = ({
  contact,
  matchedNumber,
  onSelect,
  onCall,
  onWhatsApp,
}) => {
  const initial = contact.name ? contact.name.charAt(0).toUpperCase() : '#';
  const displayPhone = matchedNumber || contact.phoneNumbers[0]?.number || '';

  const handlePress = () => {
    ActionService.triggerHaptic('selection');
    if (onSelect) {
      onSelect(contact);
    }
  };

  const handleCallPress = (e: any) => {
    e.stopPropagation();
    ActionService.triggerHaptic('impactLight');
    if (onCall) {
      onCall(displayPhone);
    } else {
      ActionService.placeCall(displayPhone);
    }
  };

  const handleWhatsAppPress = (e: any) => {
    e.stopPropagation();
    ActionService.triggerHaptic('selection');
    if (onWhatsApp) {
      onWhatsApp(displayPhone);
    } else {
      ActionService.openWhatsApp(displayPhone);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.contactItem,
        contact.isFavorite && styles.favoriteContactItem,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {contact.imageUri ? (
        <Image source={{ uri: contact.imageUri }} style={styles.avatarImage} />
      ) : (
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      )}

      <View style={styles.contactInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.contactName} numberOfLines={1}>
            {contact.name || displayPhone}
          </Text>
          {contact.isFavorite && <AppIcon name="star" size={14} color="#EAB308" />}
        </View>
        <Text style={styles.contactPhone} numberOfLines={1}>
          {displayPhone}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCallPress}
          hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
        >
          <AppIcon name="call" size={18} color="#2563EB" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  favoriteContactItem: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 17,
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
  callButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
