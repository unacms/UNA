import { Text } from 'app/design/typography'
import { useState, useMemo } from 'react';
import { stripTags } from 'app/lib/util';
import { View, Pressable } from 'app/design/view';
import Html from 'app/ui/atoms/html';
import { appSetting, linkify2, truncateHTML } from 'app/lib/util';
import { Button } from 'app/design/controls'

function HtmlMemo({ data }) {
    const computedData = useMemo(() => {
        return <Html data={data} />
    }, [data])
    return computedData
}

export function ContentMore({ content, numberOfLines, textStyle, openSmall, textClassName, showLink = true }) {

    let link = '';
    let linkContent = '';
    if (showLink) {
        link = linkify2(content)
        if (link) {
            linkContent = '<br><div class="bx-embed-link" source="' + link + '">' + link + '</div>'
        }
    }

    const handleShowMore = () => {
        setShowFull(!showFull);
    }
    const shortHtml = truncateHTML(content, 350);
    let showButton = false;
    if (shortHtml.trim() != content.trim())
        showButton = true;

    console.log("shortHtml", shortHtml, content)
    const [showFull, setShowFull] = useState(openSmall);
    if (!showFull) {
        if (showButton){
            return (<Pressable onPress={(e) => { handleShowMore(); e.preventDefault() }} >
                <HtmlMemo data={shortHtml + linkContent + '... <a href="javascript">Show more</a>'} htmlStyles={textStyle} />
            </Pressable>);
        }
        else{
            return <HtmlMemo data={shortHtml + linkContent} htmlStyles={textStyle} />
        }
        
    }
    else {
        return (
            <HtmlMemo data={content + linkContent} htmlStyles={textStyle} />
        )
    }
}