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

export function ContentMore({ content, embed, numberOfLines, textStyle, openSmall, textClassName, showLink = true }) {
    
    let linkContent = '';
    if (showLink && embed) {
        linkContent = embed;
    }

    const handleShowMore = () => {
        setShowFull(!showFull);
    }
    let shortHtml = truncateHTML(content, 350);
    
    let showButton = false;
    if (content && shortHtml && shortHtml.trim() != content.trim())
        showButton = true;

    if (showButton){
        const lastIndex = shortHtml.lastIndexOf('</p>');
        if (lastIndex !== -1) {
            shortHtml = shortHtml.slice(0, lastIndex) + '... <a href="javascript">Show more</a></p>' + shortHtml.slice(lastIndex + 4);
        }
    }

    const [showFull, setShowFull] = useState(openSmall);
    if (!showFull) {
        if (showButton){
            return (<Pressable onPress={(e) => { handleShowMore(); e.preventDefault() }} >
                <HtmlMemo data={shortHtml + linkContent} htmlStyles={textStyle} />
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