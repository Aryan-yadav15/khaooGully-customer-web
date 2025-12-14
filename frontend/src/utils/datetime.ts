const DATE_TIME_LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

const IST_TIME_ZONE = 'Asia/Kolkata';
const IST_OFFSET_MINUTES = 330; // UTC+05:30

type DateTimeLocalParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

function parseDateTimeLocalParts(value: string): DateTimeLocalParts | null {
  const match = DATE_TIME_LOCAL_RE.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute)
  ) {
    return null;
  }

  return { year, month, day, hour, minute };
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function isoToIstParts(iso: string): DateTimeLocalParts | null {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value;

  const year = Number(get('year'));
  const month = Number(get('month'));
  const day = Number(get('day'));
  const hour = Number(get('hour'));
  const minute = Number(get('minute'));

  if ([year, month, day, hour, minute].some((v) => Number.isNaN(v))) return null;
  return { year, month, day, hour, minute };
}

// Kept for backward compatibility: interpret datetime-local as IST and return the corresponding instant.
export function parseDateTimeLocal(value: string): Date | null {
  const parts = parseDateTimeLocalParts(value);
  if (!parts) return null;
  const utcMs = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - IST_OFFSET_MINUTES * 60_000;
  const date = new Date(utcMs);
  return Number.isNaN(date.getTime()) ? null : date;
}

// Convert an API ISO timestamptz string into a value safe for <input type="datetime-local" />
export function isoToDateTimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const parts = isoToIstParts(iso);
  if (!parts) return '';
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}T${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

// Convert a datetime-local string (interpreted as local time) into an ISO UTC string
export function dateTimeLocalToIso(value: string): string {
  const date = parseDateTimeLocal(value);
  if (!date) {
    throw new Error(`Invalid datetime-local value: ${value}`);
  }
  return date.toISOString();
}

export function formatLocalTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: IST_TIME_ZONE });
}
