import { Text } from 'app/design/typography'
import { useState, useMemo } from 'react';
import { Pressable } from 'app/design/view';
import Html from 'app/ui/atoms/html';
import { truncateHTML } from 'app/lib/util';
import { storageSet, storageGet } from 'app/lib/util'

function HtmlMemo({ data }) {
    const computedData = useMemo(() => {
        return <Html data={data} />
    }, [data])
    return computedData
}

export function ContentMore({ content, embed, numberOfSymbols = 350, textStyle, openSmall, showLink = true, showLess = false, id=false }) {
    let initedValue = openSmall;
    if (id){
        let a = storageGet('layout:shmo', '');
        if (a){
            if (a.includes(id))
                initedValue = true;
        }
    }
    const [showFull, setShowFull] = useState(initedValue);

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
            shortHtml = shortHtml.slice(0, lastIndex) + (showLess ? '...' : '... <span class="text-primary">Show more</span>') + '</p>' + shortHtml.slice(lastIndex + 4);
        }
    }

    const handleToggle = (e) => {
        if (id){
            let sm = storageGet('layout:shmo', '');
            if (!sm){
                sm = [];
            }
            sm.filter(item => item !== id);
            if (!showFull)
                sm.push(id);
            else
            sm = sm.filter(item => item !== id);
            storageSet('layout:shmo', '', sm)
        }
        setShowFull((prevShowFull) => !prevShowFull);
        //e.preventDefault(); commented by links in html text
    };

    if (showButton) {
        return (
            <Pressable onPress={handleToggle}>
                <HtmlMemo data={showFull ? content + linkContent : shortHtml + linkContent} htmlStyles={textStyle} />
                {showLess && (
                    <Text className="text-primary dark:text-primary text-base" >{showFull ? "Show less" : "Show more"}</Text>
                )}
            </Pressable>
        );
    }

    return <HtmlMemo data={content + linkContent} htmlStyles={textStyle} />;

}