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
    if (shortHtml != content)
        showButton = true;
    const [showFull, setShowFull] = useState(openSmall);
    /*
    <Text  className={textClassName} htmlStyles={textStyle} numberOfLines={numberOfLines} >
                        {stripTags(content)}
                    </Text>*/
    if (!showFull) {
        return (
            <>
                <HtmlMemo data={shortHtml + linkContent} htmlStyles={textStyle} />
                {showButton && <Pressable onPress={(e) => { handleShowMore(); e.preventDefault() }} ><View className=" items-start w-full  py-2  "><Button
                    title="More"
                    startDecorator="ArrowFatLineDown"
                    size="xs"
                    solid
                    rounded
                    variant="outline"
                /></View></Pressable>}
            </>
        )
    }
    else {
        return (
            <HtmlMemo data={content + linkContent} htmlStyles={textStyle} />
        )
    }
}