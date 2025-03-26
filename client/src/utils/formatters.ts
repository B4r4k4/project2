/**
 * Formats a number to a readable format (e.g., 1,000 -> 1K)
 * @param num - Number to format
 * @returns Formatted string
 */
export const formatNumber = (num: number): string => {
  if (num === 0) return '0';
  
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  } else if (Number.isInteger(num)) {
    return num.toString();
  } else {
    return num.toFixed(1);
  }
};

/**
 * Formats time in seconds to a MM:SS format
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins}:${secs < 10 ? '0' + secs : secs}`;
};

/**
 * Truncates an address string for display
 * @param address - Full address
 * @param start - Number of chars to keep at start
 * @param end - Number of chars to keep at end
 * @returns Truncated address
 */
export const truncateAddress = (
  address: string = '',
  start: number = 6,
  end: number = 4
): string => {
  if (!address) return '';
  if (address.length <= start + end) return address;
  
  return `${address.slice(0, start)}...${address.slice(-end)}`;
};

/**
 * Formats a date to relative time (e.g., "2 days ago")
 * @param date - Date to format
 * @returns Formatted relative time
 */
export const formatRelativeTime = (date: Date | string): string => {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const seconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);
  
  // Define time intervals
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60,
  };
  
  if (seconds < 60) {
    return 'just now';
  }
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
};
