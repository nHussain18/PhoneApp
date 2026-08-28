import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

export type CallType =
  | 'INCOMING'
  | 'OUTGOING'
  | 'MISSED'
  | 'VOICEMAIL'
  | 'REJECTED'
  | 'BLOCKED'
  | 'ANSWERED_EXTERNALLY'
  | 'UNKNOWN';

export interface CallLogEntry {
  id: string;
  phoneNumber: string;
  name?: string;
  type: CallType;
  timestamp: number;
  duration: number; // in seconds
  isRead: boolean;
  simId?: string;
}

export interface GroupedCallLog {
  key: string;
  phoneNumber: string;
  name?: string;
  latestTimestamp: number;
  totalDuration: number;
  count: number;
  primaryType: CallType;
  entries: CallLogEntry[];
}

const { CallLogModule } = NativeModules;
const eventEmitter = CallLogModule ? new NativeEventEmitter(CallLogModule) : null;

export const CallLogService = {
  isAvailable(): boolean {
    return Platform.OS === 'android' && CallLogModule != null;
  },

  async getCallLogs(limit = 200): Promise<CallLogEntry[]> {
    if (!this.isAvailable()) {
      return [];
    }
    try {
      const logs = await CallLogModule.getCallLogs(limit);
      return logs || [];
    } catch (e) {
      console.warn('CallLogService.getCallLogs error:', e);
      return [];
    }
  },

  async deleteCallLog(id: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await CallLogModule.deleteCallLog(id);
    } catch (e) {
      console.error('CallLogService.deleteCallLog error:', e);
      return false;
    }
  },

  async clearAllCallLogs(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      return await CallLogModule.clearAllCallLogs();
    } catch (e) {
      console.error('CallLogService.clearAllCallLogs error:', e);
      return false;
    }
  },

  async makePhoneCall(phoneNumber: string): Promise<boolean> {
    if (!phoneNumber) return false;
    if (!this.isAvailable()) {
      return false;
    }
    try {
      return await CallLogModule.makePhoneCall(phoneNumber);
    } catch (e) {
      console.error('CallLogService.makePhoneCall error:', e);
      return false;
    }
  },

  onCallLogChanged(callback: () => void) {
    if (!eventEmitter) return { remove: () => {} };
    return eventEmitter.addListener('onCallLogChanged', callback);
  },

  /**
   * Groups consecutive or same-day calls by phone number/contact.
   */
  groupCallLogs(entries: CallLogEntry[]): GroupedCallLog[] {
    if (!entries || entries.length === 0) return [];

    const grouped: GroupedCallLog[] = [];
    let currentGroup: GroupedCallLog | null = null;

    for (const entry of entries) {
      const normalizedNum = entry.phoneNumber.replace(/\s+/g, '').replace(/[-()]/g, '');
      const groupKey = normalizedNum || entry.phoneNumber;

      // Group consecutive calls from same number
      if (currentGroup && currentGroup.key === groupKey) {
        currentGroup.entries.push(entry);
        currentGroup.count += 1;
        currentGroup.totalDuration += entry.duration;
        if (entry.name && !currentGroup.name) {
          currentGroup.name = entry.name;
        }
      } else {
        if (currentGroup) {
          grouped.push(currentGroup);
        }
        currentGroup = {
          key: groupKey,
          phoneNumber: entry.phoneNumber,
          name: entry.name || undefined,
          latestTimestamp: entry.timestamp,
          totalDuration: entry.duration,
          count: 1,
          primaryType: entry.type,
          entries: [entry],
        };
      }
    }

    if (currentGroup) {
      grouped.push(currentGroup);
    }

    return grouped;
  },

  formatDuration(seconds: number, lang: 'en' | 'hi' = 'en'): string {
    if (!seconds || seconds <= 0) return lang === 'hi' ? '0 सेकंड' : '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (lang === 'hi') {
      if (hrs > 0) return `${hrs} घंटे ${mins} मि ${secs} से`;
      if (mins > 0) return `${mins} मि ${secs} से`;
      return `${secs} सेकंड`;
    }

    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  },

  formatTimestamp(timestamp: number, lang: 'en' | 'hi' = 'en'): string {
    if (!timestamp || timestamp <= 0) return '';
    const date = new Date(timestamp);
    const now = new Date();

    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return lang === 'hi' ? `आज, ${timeStr}` : `Today, ${timeStr}`;
    }
    if (isYesterday) {
      return lang === 'hi' ? `कल, ${timeStr}` : `Yesterday, ${timeStr}`;
    }

    const isThisYear = date.getFullYear() === now.getFullYear();
    const dateStr = date.toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: isThisYear ? undefined : 'numeric',
    });

    return `${dateStr}, ${timeStr}`;
  },
};
