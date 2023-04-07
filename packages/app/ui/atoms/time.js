import React, { useState, useEffect } from 'react';
import { parseISO, format, formatDistance } from 'date-fns';

import { Text } from 'app/design/typography';


function formatDate(date) {
  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}

export default function ElementTime(props) {
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
      s = s.replace(/\s+/g, '').replace('about', '').replace('hours', 'h').replace('hour', 'h').replace('minutes', 'm').replace('minute', 'm');
    } else {
      s = formatDate(d);
    }
  }

  return <Text className="text-neogray-500 leading-5 text-base">{s}</Text>;
}
