import { afterEach, describe, expect, it, vi } from 'vitest';

import { ago, dateFormat, dayLabel, daysBefore, exactTime, inboxTime, longDate, longTime, mediumDate, monthYear, timeLabel } from './dates';
import { setLanguageForTest } from './i18n';

afterEach(async () => {
    vi.useRealTimers();
    await setLanguageForTest('system');
});

// local times, so the tests read the same in any zone
const at = (y: number, m: number, d: number, h = 12, min = 0) => new Date(y, m - 1, d, h, min);
const NOW = at(2026, 11, 18, 15, 30);

describe('dates', () => {
    it('makes a formatter once for the same options and locale', () => {
        const a = dateFormat({ weekday: 'short' });
        expect(dateFormat({ weekday: 'short' })).toBe(a);
        expect(dateFormat({ weekday: 'long' })).not.toBe(a);
        expect(dateFormat({ weekday: 'short' }, 'de')).not.toBe(a);
    });

    it('says how long ago', () => {
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
        expect(ago(new Date(NOW.getTime() - 3 * 3600_000).toISOString())).toBe('3 hours ago');
        expect(ago(new Date(NOW.getTime() - 86_400_000).toISOString())).toBe('yesterday');
        expect(ago(NOW.toISOString())).toBe('now');
    });

    it('says how long ago in the language in use', async () => {
        await setLanguageForTest('ru');
        vi.useFakeTimers();
        vi.setSystemTime(NOW);
        expect(ago(new Date(NOW.getTime() - 86_400_000).toISOString())).toBe('вчера');
    });

    it('writes the exact time as the locale does, to the second', () => {
        const d = at(2026, 11, 6, 9, 14);
        expect(exactTime(d.toISOString())).toBe(d.toLocaleString('en-US'));
    });

    it('writes long and medium dates', () => {
        const d = at(2026, 11, 6, 9, 14);
        expect(longTime(d.toISOString())).toBe('November 6, 2026 at 9:14 AM');
        expect(longDate(d.toISOString())).toBe('November 6, 2026');
        expect(monthYear(d.toISOString())).toBe('November 2026');
        expect(mediumDate(d)).toBe('Nov 6, 2026');
        expect(mediumDate(d, true)).toBe('Nov 6, 2026, 9:14 AM');
        expect(timeLabel(d.toISOString())).toBe('9:14 AM');
    });

    it('gives nothing for what is no date', () => {
        expect(longDate(null)).toBeNull();
        expect(longDate('')).toBeNull();
        expect(longDate('soon')).toBeNull();
        expect(monthYear('soon')).toBeNull();
    });

    it('counts calendar days, not 24 hours', () => {
        expect(daysBefore(at(2026, 11, 17, 23, 59), NOW)).toBe(1);
        expect(daysBefore(at(2026, 11, 18, 0, 1), NOW)).toBe(0);
    });

    it('labels a day: today, yesterday, a weekday within the week, then the date', () => {
        expect(dayLabel(at(2026, 11, 18, 1).toISOString(), NOW)).toBe('Today');
        expect(dayLabel(at(2026, 11, 17).toISOString(), NOW)).toBe('Yesterday');
        expect(dayLabel(at(2026, 11, 14).toISOString(), NOW)).toBe('Saturday');
        expect(dayLabel(at(2026, 11, 3).toISOString(), NOW)).toBe('November 3');
        expect(dayLabel(at(2025, 11, 3).toISOString(), NOW)).toBe('November 3, 2025');
    });

    it('writes an inbox time: the time today, then yesterday, the weekday, the date', () => {
        expect(inboxTime(at(2026, 11, 18, 9, 14).toISOString(), NOW)).toBe('09:14 AM');
        expect(inboxTime(at(2026, 11, 17).toISOString(), NOW)).toBe('Yesterday');
        expect(inboxTime(at(2026, 11, 14).toISOString(), NOW)).toBe('Sat');
        expect(inboxTime(at(2026, 11, 3).toISOString(), NOW)).toBe('Nov 3');
        expect(inboxTime(at(2025, 11, 3).toISOString(), NOW)).toBe('Nov 3, 2025');
    });
});
