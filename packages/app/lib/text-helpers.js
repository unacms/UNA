import { Text } from 'app/design/typography'
import Link from 'app/ui/atoms/link'
import { appSetting as setting, UNA_URL } from 'app/config';

function replaceLinks(htmlString, hoverClass="") {
    const linkRegex = /<a [^>]*href="(.*?)".*?>(.*?)<\/a>/g;
    if (!htmlString)
        return htmlString;
    const parts = htmlString.split(linkRegex);

    return parts.map((part, index) => {
        if (index % 3 === 0) {
            // This part is not a link
            return <Text key={index}>{part}</Text>;
        } else if (index % 3 === 1) {
            // This part is a link URL
            const linkText = parts[index + 1];
            part = part.replace(UNA_URL, '/');
            return <Link className={hoverClass} key={index} href={part}><Text>{linkText}</Text></Link>;
        }
        // Skip link text parts because they're handled in the link URL parts
        return null;
    }).filter(Boolean);
}

function stripTagsWithLinks(s) {
    var allowed = ['a'];
    if (s)
        s = s.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, function (_, tag) {
            return allowed.includes(tag.toLowerCase()) ? _ : '';
        });

        s = s.replace(/\s\s+/g, ' ');

        return s.trim(); // Remove leading and trailing spaces

    return s;
}

export function linkedText(s, hoverClass) {
    return replaceLinks(stripTagsWithLinks(s), hoverClass)
}