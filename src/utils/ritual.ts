import { ritualContent } from '../content/ritualContent';
import { RitualContentItem } from '../types/models';

export const pickRandomRitualContent = (
  excludedId?: string | null
): RitualContentItem => {
  const eligibleItems = ritualContent.filter((item) => item.id !== excludedId);
  const pool = eligibleItems.length > 0 ? eligibleItems : ritualContent;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
};

