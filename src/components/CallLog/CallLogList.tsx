import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { CallLogItem } from './CallLogItem';
import { GroupedCallLog, CallType } from '../../services/CallLogService';
import { ActionService } from '../../services/ActionService';
import { useLanguage } from '../../services/LanguageContext';

interface CallLogListProps {
  groupedLogs: GroupedCallLog[];
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteLog: (id: string) => void;
  onSelectContact?: (phone: string, name?: string) => void;
}

type FilterTab = 'ALL' | 'MISSED' | 'INCOMING' | 'OUTGOING';

export const CallLogList: React.FC<CallLogListProps> = ({
  groupedLogs,
  isLoading,
  onRefresh,
  onDeleteLog,
  onSelectContact,
}) => {
  const { t } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredLogs = useMemo(() => {
    let list = groupedLogs;

    // Filter by Tab
    if (activeFilter === 'MISSED') {
      list = list.filter(
        (item) => item.primaryType === 'MISSED' || item.primaryType === 'REJECTED'
      );
    } else if (activeFilter === 'INCOMING') {
      list = list.filter((item) => item.primaryType === 'INCOMING');
    } else if (activeFilter === 'OUTGOING') {
      list = list.filter((item) => item.primaryType === 'OUTGOING');
    }

    // Filter by search query
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (item) =>
          (item.name && item.name.toLowerCase().includes(q)) ||
          item.phoneNumber.includes(q)
      );
    }

    return list;
  }, [groupedLogs, activeFilter, searchQuery]);

  const handleCall = (phoneNumber: string) => {
    ActionService.placeCall(phoneNumber);
  };

  const handleWhatsApp = (phoneNumber: string) => {
    ActionService.openWhatsApp(phoneNumber);
  };

  const handleFilterChange = (tab: FilterTab) => {
    ActionService.triggerHaptic('selection');
    setActiveFilter(tab);
  };

  const getFilterLabel = (tab: FilterTab) => {
    switch (tab) {
      case 'ALL':
        return t('filterAll');
      case 'MISSED':
        return t('filterMissed');
      case 'INCOMING':
        return t('filterIncoming');
      case 'OUTGOING':
        return t('filterOutgoing');
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchCalls')}
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

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'MISSED', 'INCOMING', 'OUTGOING'] as FilterTab[]).map((tab) => {
          const isSelected = activeFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => handleFilterChange(tab)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isSelected && styles.filterChipTextActive,
                ]}
              >
                {getFilterLabel(tab)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Call Log List */}
      {isLoading && groupedLogs.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>{t('loadingCalls')}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item) => item.key + item.latestTimestamp}
          renderItem={({ item }) => (
            <CallLogItem
              group={item}
              onCall={handleCall}
              onWhatsApp={handleWhatsApp}
              onDelete={onDeleteLog}
              onSelectContact={onSelectContact}
            />
          )}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={['#2563EB']} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyTitle}>{t('noCallsFound')}</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? t('noCallsQuery')
                  : t('emptyCallHistory')}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingBottom: 80,
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
    lineHeight: 18,
  },
});
