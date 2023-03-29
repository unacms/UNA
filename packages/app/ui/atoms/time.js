import React, { useState, useEffect }  from 'react'
import { parseISO, format, formatDistance } from 'date-fns';

import { Text} from 'app/design/typography'
import { View } from 'app/design/view'

export default function ElementTime(props) {
    const [date, setDate] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setDate(new Date());
        }, 60000);
        return () => clearInterval(interval);
    }, []);
    
    let s = props.ts
    if (!isNaN(props.ts)){
        let d = new Date(props.ts * 1000);
        let now = new Date();
        const diffDays = Math.abs(now - d) / (1000 * 60 * 60 * 24); 
        if (diffDays < 1){
            s = formatDistance(d, date, { addSuffix: false })
            s = s.replace('about', '').replace('hours', 'h').replace('hour', 'h').replace('minutes', 'm').replace('minute', 'm');
        }
        else{
            s = d.toLocaleString();
        }
    }

    return <Text className="leading-5 text-gray-600 dark:text-gray-400">{s}</Text>
}
