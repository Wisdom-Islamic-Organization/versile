import { differenceInDays } from 'date-fns';
import { getFormattedDate } from './leaderboard';

// Define the start date in IST
const START_DATE = new Date('2025-03-03T00:00:00+05:30');

export function getTodayWordIndex(): number {
  // Get today's date in IST format
  const today = getFormattedDate(new Date());
  const startDate = getFormattedDate(START_DATE);
  
  // Parse dates for comparison
  const todayParts = today.split('-').map(Number);
  const startParts = startDate.split('-').map(Number);
  
  // Create Date objects with the same timezone
  const todayDate = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
  const startDateObj = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  
  // Calculate days since start date
  const diffDays = differenceInDays(todayDate, startDateObj);
  return Math.max(0, diffDays) + 1; // Ensure we don't get negative numbers
} 