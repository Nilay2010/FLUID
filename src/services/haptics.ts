/**
 * Native tactile haptic feedback utility using the Web Vibration API (navigator.vibrate).
 * Respects user preference in Settings -> Device Permissions and safely degrades on unsupported browsers.
 */
export const triggerHaptic = (
  pattern: 'light' | 'medium' | 'heavy' | 'double' | 'refresh' | 'success' | number | number[] = 'light'
): void => {
  try {
    if (typeof window === 'undefined' || !('vibrate' in navigator)) return;
    if (localStorage.getItem('fluid_haptics_enabled') === 'false') return;

    switch (pattern) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(20);
        break;
      case 'heavy':
        navigator.vibrate(35);
        break;
      case 'double':
        navigator.vibrate([15, 40, 25]);
        break;
      case 'refresh':
        navigator.vibrate([12, 30, 15]);
        break;
      case 'success':
        navigator.vibrate([10, 35, 20]);
        break;
      default:
        navigator.vibrate(pattern);
        break;
    }
  } catch {
    // Ignore vibration errors on restricted devices or unsupported contexts
  }
};
