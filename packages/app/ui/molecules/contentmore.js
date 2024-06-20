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

export function ContentMore({ content, embed, numberOfSymbols = 350, textStyle, openSmall, showLink = true, showLess = false }) {
    const [showFull, setShowFull] = useState(openSmall);

    let linkContent = '';
    if (showLink && embed) {
        linkContent = embed;
    }

    let shortHtml = truncateHTML(content, numberOfSymbols);

    let showButton = false;
    if (content && shortHtml && shortHtml.trim() != content.trim())
        showButton = true;

    if (showButton) {
        const lastIndex = shortHtml.lastIndexOf('</p>');
        if (lastIndex !== -1) {
            shortHtml = shortHtml.slice(0, lastIndex) + (showLess ? '...' : '... <span class="link">Show more</a>') + '</p>' + shortHtml.slice(lastIndex + 4);
        }
    }


    const handleToggle = (e) => {
        setShowFull((prevShowFull) => !prevShowFull);
        e.preventDefault();
    };

    if (showButton) {
        return (
            <Pressable onPress={handleToggle}>
                <HtmlMemo data={showFull ? content + linkContent : shortHtml + linkContent} htmlStyles={textStyle} />
                {showLess && (
                    <Button
                        variant="link"
                        size="base"
                        title={showFull ? "Show less" : "Show more"}
                    />
                )}
            </Pressable>
        );
    }

    return <HtmlMemo data={content + linkContent} htmlStyles={textStyle} />;

}