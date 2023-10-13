import { useState, useEffect } from 'react';
import { formatDistance } from 'date-fns';
import { Text } from 'app/design/typography';
import { useTranslation } from 'react-i18next';

function formatDate(date, t) {
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const month = t(monthNames[date.getMonth()]);
    let year = date.getYear() - 100;
    if ((new Date()).getYear() == date.getYear())
        year ='';
    return `${day} ${month} ${year}`;
}

export default function ElementTime(props) {
    const { t } = useTranslation();
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setDate(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    let s = props.ts;
    if (!isNaN(props.ts)) {
        let d = new Date(props.ts * 1000);
    let now = new Date();
    const diffDays = Math.abs(now - d) / (1000 * 60 * 60 * 24);
    
    if (diffDays < 1) {
        s = formatDistance(d, date, { addSuffix: false }).trim();
        s = s.replace(/\s+/g, '').replace('about', '').replace('lessthanaminute', t('Now')).replace('hours', t('h')).replace('hour', t('h')).replace('minutes', t('m')).replace('minute', t('m')).trim();
    } else {
        s = formatDate(d, t).trim();
    }
  }

  const { stylesName } = props;
  return <Text className={ stylesName || "text-neutral-600 dark:text-neutral-400 text-xs"}>{s}</Text>;
}
