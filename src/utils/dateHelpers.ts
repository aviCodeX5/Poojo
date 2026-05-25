import { format, parseISO } from 'date-fns';

export const formatDate = (date: any, formatStr: string = 'dd MMM yyyy') => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date?.toDate ? date.toDate() : new Date(date);
  return format(d, formatStr);
};

export const formatTime = (date: any) => {
  return formatDate(date, 'hh:mm a');
};

export const getYear = (date: any) => {
  const d = typeof date === 'string' ? parseISO(date) : date?.toDate ? date.toDate() : new Date(date);
  return d.getFullYear();
};
