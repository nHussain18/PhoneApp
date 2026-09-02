import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ActionService } from '../../services/ActionService';
import { GroupedCallLog } from '../../services/CallLogService';
import { useLanguage } from '../../services/LanguageContext';
import { VoiceSearchService } from '../../services/VoiceSearchService';
import { AppIcon } from '../Common/AppIcon';
import { CallLogItem } from './CallLogItem';

interface CallLogListProps {
  groupedLogs: GroupedCallLog[];
  isLoading: boolean;
  onRefresh: () => void;
  onDeleteLog: (id: string) => void;
  onSelectContact?: (phone: string, name?: string) => void;
  onScrollDirectionChange?: (isScrollingDown: boolean, isAtTop: boolean) => void;
  contentPaddingBottom?: number;
}

type FilterTab = 'ALL' | 'MISSED' | 'INCOMING' | 'OUTGOING';

export const CallLogList: React.FC<CallLogListProps> = ({
  groupedLogs,
  isLoading,
  onRefresh,
  onDeleteLog,
  onSelectContact,
  onScrollDirectionChange,
  contentPaddingBottom = 80,
}) => {
  const { t, language } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isListening, setIsListening] = useState<boolean>(false);
  const lastOffsetY = useRef<number>(0);

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

  const handleVoiceSearch = async () => {
    ActionService.triggerHaptic('impactMedium');
    setIsListening(true);
    const spokenText = await VoiceSearchService.startVoiceSearch(language);
    setIsListening(false);

    if (spokenText) {
      ActionService.triggerHaptic('success');
      setSearchQuery(spokenText);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const isAtTop = currentOffset <= 15;
    const diff = currentOffset - lastOffsetY.current;

    if (isAtTop) {
      onScrollDirectionChange?.(false, true);
    } else if (Math.abs(diff) > 8) {
      const isScrollingDown = diff > 0;
      onScrollDirectionChange?.(isScrollingDown, false);
    }
    lastOffsetY.current = currentOffset;
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <AppIcon name="search-outline" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder={isListening ? t('listening') : t('searchCalls')}
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearch}>
            <AppIcon name="close" size={16} color="#94A3B8" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.micButton, isListening && styles.micButtonActive]}
          onPress={handleVoiceSearch}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <AppIcon name={isListening ? 'mic' : 'mic-outline'} size={20} color={isListening ? '#DC2626' : '#64748B'} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
      contentContainerStyle={styles.filterRow}
      showsHorizontalScrollIndicator={false}
      horizontal
      >
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
      </ScrollView>

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
          onScroll={handleScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={onRefresh} colors={['#2563EB']} />
          }
          contentContainerStyle={[styles.listContent, { paddingBottom: contentPaddingBottom }]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <AppIcon name="call-outline" size={48} color="#94A3B8" style={{ alignSelf: 'center', marginBottom: 8 }} />
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
  filterRow: {
    gap:5,
    paddingHorizontal: 16,
    maxHeight: 36
  },
  filterChip: {
    height: 32,
    justifyContent:'center',
    paddingHorizontal: 12,
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
    fontSize: 11,
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
