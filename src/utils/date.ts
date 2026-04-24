import { DailyStats, LifetimeStats } from '../types/models';

const pad = (value: number) => `${value}`.padStart(2, '0');

export const todayDateKey = (date = new Date()) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

export const parseDateKey = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const normalizeDailyStats = (stats: DailyStats): DailyStats => {
  const currentKey = todayDateKey();
  if (stats.dateKey === currentKey) {
    return stats;
  }

  return {
    dateKey: currentKey,
    completedRituals: 0,
    bypassesUsed: 0,
  };
};

export const updateLifetimeForCompletion = (
  lifetime: LifetimeStats,
  completedDateKey: string
): LifetimeStats => {
  const lastKey = lifetime.lastCompletedDateKey;
  let nextStreak = lifetime.currentStreak;

  if (!lastKey) {
    nextStreak = 1;
  } else if (lastKey === completedDateKey) {
    nextStreak = lifetime.currentStreak || 1;
  } else {
    const lastDate = parseDateKey(lastKey);
    const currentDate = parseDateKey(completedDateKey);
    const diffDays = Math.round(
      (currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    nextStreak = diffDays === 1 ? lifetime.currentStreak + 1 : 1;
  }

  return {
    totalRituals: lifetime.totalRituals + 1,
    currentStreak: nextStreak,
    lastCompletedDateKey: completedDateKey,
  };
};

export const formatUnlockExpiry = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const minutesLabel = (minutes: number) =>
  `${minutes} min${minutes === 1 ? '' : ''}`;

