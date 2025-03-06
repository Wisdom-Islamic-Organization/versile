import { differenceInDays, startOfDay } from 'date-fns';

// Helper function to get date in IST (GMT+5:30)
function getISTDate(date: Date): Date {
  // Convert to IST (GMT+5:30)
  return new Date(date.getTime() + (5.5 * 60 * 60 * 1000));
}

// Define the start date in IST
const START_DATE = startOfDay(getISTDate(new Date('2025-03-03')));

export function getTodayWordIndex(): number {
  // Get current date in IST
  const today = startOfDay(getISTDate(new Date()));
  
  // Calculate days since start date
  const diffDays = differenceInDays(today, START_DATE);
  return Math.max(0, diffDays) + 1; // Ensure we don't get negative numbers
} 