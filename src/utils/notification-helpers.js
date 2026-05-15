import { schedule, isEnabled, TEMPLATES } from '../services/notification.service';

export const DAYS_MAP = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
};

export function dailyAt(hour = 10, minute = 0) {
  return { type: 'timeInterval', seconds: 86400, repeats: true };
}

export function weeklyOn(weekday, hour = 10, minute = 0) {
  return {
    type: 'weekday',
    weekday,
    hour,
    minute,
    repeats: true,
  };
}

export async function scheduleDailyReminder(hour, minute) {
  if (!isEnabled()) return;
  await schedule(
    TEMPLATES.STYLE_REMINDER.title,
    TEMPLATES.STYLE_REMINDER.body,
    dailyAt(hour, minute),
  );
}

export async function scheduleNoOutfitReminder(hour, minute) {
  if (!isEnabled()) return;
  await schedule(
    TEMPLATES.NO_OUTFIT_TODAY.title,
    TEMPLATES.NO_OUTFIT_TODAY.body,
    dailyAt(hour, minute),
  );
}

export async function scheduleWeeklyStats(weekday, hour, minute) {
  if (!isEnabled()) return;
  await schedule(
    TEMPLATES.MOST_USED_WEEK.title,
    TEMPLATES.MOST_USED_WEEK.body,
    weeklyOn(weekday, hour, minute),
  );
}

export async function scheduleOutfitIdea(weekday, hour, minute) {
  if (!isEnabled()) return;
  await schedule(
    TEMPLATES.OUTFIT_IDEA.title,
    TEMPLATES.OUTFIT_IDEA.body,
    weeklyOn(weekday, hour, minute),
  );
}
