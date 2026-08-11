import * as RNLocalize from "react-native-localize";

const _fmtCache = new Map();

function getDateOrderByLocale(tag) {
    const lang = tag.toLowerCase();
    if (lang.startsWith("en-us")) return "M D, Y";
    if (lang.startsWith("zh") || lang.startsWith("ja") || lang.startsWith("ko")) return "Y M D";
    return "D M Y";
}

export const formatDate = (
    input,
    t,
    {
        inFuture = false,
        inPast = false,
        locale,                     // 'en-US' (not used for universality)
        month = 'short',            // 'numeric' | '2-digit' | 'short' | 'long' | ...
        showTime = false,
        showDate = true,
        hour12,                     // true/false | undefined (keeps locale default behavior)
        timeZone,                   // e.g. 'UTC' (not used for universality)
        yearPolicy = 'auto',        // 'auto' | 'always' | 'never'
    } = {}
) => {
    const date = input instanceof Date ? input : new Date(input);
    const localeTag = locale || RNLocalize.getLocales()?.[0]?.languageTag || "en-US";
    if (Number.isNaN(date.getTime())) return '';
    const nowYear = new Date().getFullYear();

    let rel = '';
    if (inFuture && showDate) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
        const dDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        rel = dDay.getTime() === today.getTime() ? t('Today ') : dDay.getTime() === tomorrow.getTime() ? t('Tomorrow ') : '';
    }

    if (inPast) {
        const now = new Date();
        const diffMs = date - now;
        const sec = Math.round(diffMs / 1000);
        const absSec = Math.abs(sec);
        if (absSec < 60)
            return t('Now');

        // Universal relative time formatting (same everywhere)
        const min = Math.round(sec / 60);
        if (Math.abs(min) < 60) {
            return `${Math.abs(min)}m`;
        }
        const hrs = Math.round(sec / 3600);
        if (Math.abs(hrs) < 24) {
            return `${Math.abs(hrs)}h`;
        }
        const days = Math.round(sec / (3600*24));
        if (Math.abs(days) < 31) {
            return `${Math.abs(days)}d`;
        }
        const weeks = Math.round(sec / (3600*24*7));
        if (Math.abs(weeks) < 24) {
            return `${Math.abs(weeks)}w`;
        }
    }

    return formatDateUniversal(date, {
        showDate,
        showTime,
        month,
        yearPolicy,
        nowYear,
        hour12,
        rel,
        localeTag
    });
};

// Universal date formatting function (same result everywhere)
function formatDateUniversal(date, {
    showDate,
    showTime,
    month,
    yearPolicy,
    nowYear,
    hour12,
    rel,
    localeTag, // added
}) {
    const parts = [];

    // --- DATE ---
    if (showDate && !rel) {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthLongNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        const dayStr = String(date.getDate()); // can use padStart(2,'0') for 2-digit
        const monthIndex = date.getMonth();

        let monthStr;
        if (month === 'short') monthStr = monthNames[monthIndex];
        else if (month === 'long') monthStr = monthLongNames[monthIndex];
        else if (month === 'numeric') monthStr = String(monthIndex + 1);
        else if (month === '2-digit') monthStr = String(monthIndex + 1).padStart(2, '0');
        else monthStr = monthNames[monthIndex];

        const needYear = (yearPolicy === 'always') || (yearPolicy === 'auto' && date.getFullYear() !== nowYear);
        const yearStr = String(date.getFullYear());

        const tokens = { D: dayStr, M: monthStr, Y: needYear ? yearStr : "" };

        // order + punctuation
        const pattern = getDateOrderByLocale(localeTag); // "M D, Y" etc
        const dateText = pattern
            .replace(/\bD\b/g, tokens.D)
            .replace(/\bM\b/g, tokens.M)
            .replace(/\bY\b/g, tokens.Y)
            // trim extra punctuation/spaces when year is hidden
            .replace(/\s+,/g, ",")
            .replace(/,\s*$/g, "")
            .replace(/\s+/g, " ")
            .trim();

        if (dateText) parts.push(dateText);
    }

    // --- TIME ---
    if (showTime) {
        let hours = date.getHours();
        const minutes = date.getMinutes();

        if (hour12) {
            const period = hours >= 12 ? 'PM' : 'AM';
            hours = hours % 12 || 12;
            parts.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`);
        } else {
            parts.push(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
        }
    }

    return (rel || "") + parts.join(" ");
}

export const formatDateInterval = (dateStart, dateEnd, t) => {
    const start = new Date(dateStart * 1000);
    const end = new Date(dateEnd * 1000);

    const isSingleDate = (start).toLocaleDateString() === (end).toLocaleDateString();
    const isSingleTime = (start).toLocaleTimeString() === (end).toLocaleTimeString();

    if (isSingleDate)
        if (isSingleTime)
            return formatDate(start, t, { inFuture: true, showTime: true, month: 'numeric' });
        else
            return formatDate(start, t, { inFuture: true, showTime: true, month: 'numeric' }) + ' - ' + formatDate(end, t, { inFuture: true, showTime: true, showDate: false, month: 'numeric' });
    else
        return formatDate(start, t, { inFuture: true, showTime: true, month: 'numeric' }) + ' - ' + formatDate(end, t, { inFuture: true, showTime: true, showDate: true, month: 'numeric' });

}
