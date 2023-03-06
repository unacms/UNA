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

    const s = formatDistance(new Date(props.ts * 1000), date, { addSuffix: true })
    return <Text className="leading-5 text-gray-600 dark:text-gray-400">{s}</Text>
}
