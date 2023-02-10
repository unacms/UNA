import { parseISO, format } from 'date-fns';
import { Text } from 'app/design/typography';

export default function Date({ dateString }) {
  const date = parseISO(dateString);
  return <Text>{format(date, 'LLLL d, yyyy HH:mm:ss')}</Text>
  //return <time dateTime={dateString}>{format(date, 'LLLL d, yyyy HH:mm:ss')}</time>;
}
