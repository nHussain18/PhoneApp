import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { CallLogService, GroupedCallLog, CallType } from '../../services/CallLogService';
import { ActionService } from '../../services/ActionService';
import { useLanguage } from '../../services/LanguageContext';

interface CallLogItemProps {
  group: GroupedCallLog;
  onCall: (phone: string) => void;
  onWhatsApp: (phone: string) => void;
  onDelete: (id: string) => void;
  onSelectContact?: (phone: string, name?: string) => void;
}

export const CallLogItem: React.FC<CallLogItemProps> = ({
  group,
  onCall,
  onWhatsApp,
  onDelete,
  onSelectContact,
}) => {
  const { t, language } = useLanguage();
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const getCallTypeInfo = (type: CallType) => {
    switch (type) {
      case 'INCOMING':
        return { icon: '↙️', label: t('incomingCall'), color: '#16A34A' };
      case 'OUTGOING':
        return { icon: '↗️', label: t('outgoingCall'), color: '#2563EB' };
      case 'MISSED':
        return { icon: '🚫', label: t('missedCall'), color: '#DC2626' };
      case 'REJECTED':
        return { icon: '⛔', label: t('declinedCall'), color: '#EA580C' };
      case 'BLOCKED':
        return { icon: '🛑', label: t('blockedCall'), color: '#4B5563' };
      default:
        return { icon: '📞', label: t('call'), color: '#64748B' };
    }
  };

  const typeInfo = getCallTypeInfo(group.primaryType);
  const isMissed = group.primaryType === 'MISSED' || group.primaryType === 'REJECTED';

  const handleDeleteItem = (id: string, e?: any) => {
    if (e) e.stopPropagation();
    Alert.alert(t('deleteCallTitle'), t('deleteCallPrompt'), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('delete'),
        style: 'destructive',
        onPress: () => onDelete(id),
      },
    ]);
  };

  const displayName = group.name || group.phoneNumber;
  const initial = (group.name || group.phoneNumber || '#').charAt(0).toUpperCase();

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity
        style={styles.mainRow}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <TouchableOpacity
          style={[styles.avatar, { backgroundColor: isMissed ? '#FEE2E2' : '#EFF6FF' }]}
          onPress={() => onSelectContact && onSelectContact(group.phoneNumber, group.name)}
        >
          <Text style={[styles.avatarText, { color: isMissed ? '#DC2626' : '#2563EB' }]}>
            {initial}
          </Text>
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.nameText, isMissed && styles.nameTextMissed]}
              numberOfLines={1}
            >
              {displayName}
            </Text>
            {group.count > 1 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{group.count}</Text>
              </View>
            )}
          </View>

          <View style={styles.subRow}>
            <Text style={styles.typeIcon}>{typeInfo.icon}</Text>
            <Text style={styles.timestampText}>
              {CallLogService.formatTimestamp(group.latestTimestamp, language)}
            </Text>
            {group.totalDuration > 0 && (
              <Text style={styles.durationText}>
                • {CallLogService.formatDuration(group.totalDuration, language)}
              </Text>
            )}
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.whatsAppButton}
            onPress={() => onWhatsApp(group.phoneNumber)}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Text style={styles.actionIcon}>💬</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.callButton}
            onPress={() => onCall(group.phoneNumber)}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Text style={styles.actionIcon}>📞</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Expanded Details List */}
      {isExpanded && (
        <View style={styles.expandedContainer}>
          <Text style={styles.expandedTitle}>{t('callDetails')} ({group.entries.length})</Text>
          {group.entries.map((entry) => {
            const subType = getCallTypeInfo(entry.type);
            return (
              <View key={entry.id} style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <Text style={styles.detailIcon}>{subType.icon}</Text>
                  <View>
                    <Text style={styles.detailType}>
                      {subType.label}{' '}
                      {entry.duration > 0
                        ? `(${CallLogService.formatDuration(entry.duration, language)})`
                        : ''}
                    </Text>
                    <Text style={styles.detailTime}>
                      {CallLogService.formatTimestamp(entry.timestamp, language)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.detailDelete}
                  onPress={(e) => handleDeleteItem(entry.id, e)}
                >
                  <Text style={styles.deleteText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    flexShrink: 1,
  },
  nameTextMissed: {
    color: '#DC2626',
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 4,
  },
  typeIcon: {
    fontSize: 11,
  },
  timestampText: {
    fontSize: 12,
    color: '#64748B',
  },
  durationText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
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
  actionIcon: {
    fontSize: 16,
  },
  expandedContainer: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: 12,
  },
  expandedTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF2F7',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailIcon: {
    fontSize: 12,
  },
  detailType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  detailTime: {
    fontSize: 11,
    color: '#64748B',
  },
  detailDelete: {
    padding: 6,
  },
  deleteText: {
    fontSize: 14,
  },
});
