import React  from 'react'

import { Text} from 'app/design/typography'
import { View } from 'app/design/view'

//import Moment from 'react-moment';
//import moment from 'moment/min/moment-with-locales';

export default function ElementTime(props) {
    return <View><Text>TODO:datetime</Text></View>;
/*
    moment.updateLocale('en', {
        relativeTime : {
            future: "in %s",
            past:   "%s",
            s  : '1m',
            ss : '%ds',
            m:  "1m",
            mm: "%dm",
            h:  "1h",
            hh: "%dh",
            d:  "1d",
            dd: "%dd",
            w:  "1w",
            ww: "%dw",
            M:  "4w",
            MM: function(number) {
                var weeks = number*4;
                return weeks + ' ' + (weeks > 1 ? 'w' : 'w');
            },
            y:  "1y",
            yy: "%dy"
        }
    });

   Moment.globalMoment = moment;
   Moment.globalLocale = 'en';

    return (
        <Moment fromNow ago {...props}>{new Date(props.ts * 1000).toUTCString()}</Moment>
    );
*/
}
