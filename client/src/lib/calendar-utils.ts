export function getMonthDays(date: Date): { date: Date; isCurrentMonth: boolean }[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  
  const days: { date: Date; isCurrentMonth: boolean }[] = [];
  
  // Add days from previous month to fill the first week
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  const startDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0
  for (let i = startDay - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, prevMonthLastDay - i), isCurrentMonth: false });
  }
  
  // Add days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({ date: new Date(year, month, i), isCurrentMonth: true });
  }
  
  // Add days from next month to fill the last week
  const remainingDays = 42 - days.length; // 6 weeks * 7 days
  for (let i = 1; i <= remainingDays; i++) {
    days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
  }
  
  return days;
}

export function getWeekDays(date: Date): Date[] {
  const dayOfWeek = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(monday);
    day.setDate(monday.getDate() + i);
    days.push(day);
  }
  
  return days;
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export function formatMonthYear(date: Date, language: 'en' | 'de' = 'en'): string {
  return date.toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatWeekRange(startDate: Date, language: 'en' | 'de' = 'en'): string {
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 6);
  
  const locale = language === 'de' ? 'de-DE' : 'en-US';
  const start = startDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  const end = endDate.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
  
  return `${start} - ${end}`;
}

export function getTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 9; hour < 19; hour++) {
    slots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  return slots;
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function isPastDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
}

export function addMonths(date: Date, months: number): Date {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

export function addWeeks(date: Date, weeks: number): Date {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + weeks * 7);
  return newDate;
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function startOfWeek(date: Date): Date {
  const dayOfWeek = date.getDay();
  const monday = new Date(date);
  monday.setDate(date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
  return monday;
}
