import { differenceInDays, startOfDay } from 'date-fns';

const START_DATE = startOfDay(new Date('2025-03-03'));

export function getTodayWordIndex(): number {
  const today = startOfDay(new Date());
  const diffDays = differenceInDays(today, START_DATE);
  return Math.max(0, diffDays) + 1; // Ensure we don't get negative numbers
} 