import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';
import { CallLogService } from './CallLogService';

export const ActionService = {
  async placeCall(phoneNumber: string): Promise<boolean> {
    if (!phoneNumber) return false;
    this.triggerHaptic('impactMedium');

    if (CallLogService.isAvailable()) {
      const success = await CallLogService.makePhoneCall(phoneNumber);
      if (success) return true;
    }

    // Fallback to standard Linking URL
    try {
      const clean = phoneNumber.replace(/[^0-9+*#]/g, '');
      const url = `tel:${clean}`;
      return await Linking.openURL(url);
    } catch (e) {
      console.warn('Error opening dialer:', e);
      return false;
    }
  },

  async openWhatsApp(phoneNumber: string, message = ''): Promise<boolean> {
    if (!phoneNumber) return false;
    this.triggerHaptic('selection');

    // Clean phone number: remove all non-digits except leading plus
    let clean = phoneNumber.replace(/[^0-9]/g, '');

    // If local 10 digit Indian number without country code, add 91 if desired or keep as-is
    if (clean.length === 10) {
      clean = `91${clean}`;
    }

    const encodedMsg = encodeURIComponent(message);
    const url = message
      ? `https://wa.me/${clean}?text=${encodedMsg}`
      : `https://wa.me/${clean}`;

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        await Linking.openURL(`https://wa.me/${clean}`);
        return true;
      }
    } catch (e) {
      console.warn('Error opening WhatsApp:', e);
      return false;
    }
  },

  async sendSms(phoneNumber: string, message = ''): Promise<boolean> {
    if (!phoneNumber) return false;
    this.triggerHaptic('selection');

    const clean = phoneNumber.replace(/[^0-9+]/g, '');
    const url = message
      ? `sms:${clean}?body=${encodeURIComponent(message)}`
      : `sms:${clean}`;

    try {
      return await Linking.openURL(url);
    } catch (e) {
      console.warn('Error opening SMS:', e);
      return false;
    }
  },

  triggerHaptic(
    type: 'impactLight' | 'impactMedium' | 'impactHeavy' | 'selection' | 'success' = 'selection'
  ) {
    try {
      switch (type) {
        case 'impactLight':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'impactMedium':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'impactHeavy':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'selection':
          Haptics.selectionAsync();
          break;
        case 'success':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    } catch (e) {
      // Haptics not available on some platforms/emulators
    }
  },
};
