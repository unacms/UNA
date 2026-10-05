import { useState, useMemo, useRef } from 'react';
import { View, Pressable } from 'app/design/view';
import { Text } from 'app/design/typography';
import Html from 'app/ui/atoms/html';
import { truncateHTML } from 'app/lib/util';
import { useSessionPref, setSessionPref } from 'app/context/prefs'
import { Platform } from 'react-native'

const isWeb = Platform.OS === 'web'

const TOGGLE_CLASS =
    'text-foreground text-sm font-semibold web:hover:underline web:cursor-pointer'

function HtmlMemo({ data, customClassName, lineClamp, innerRef }) {
    const computedData = useMemo(() => {
        const className = lineClamp && isWeb
            ? `${customClassName || ''} line-clamp-${lineClamp}`
            : customClassName;

        return <Html
            customClassName={className}
            data={data}
            innerRef={innerRef}
        />
    }, [data, customClassName, lineClamp, innerRef])

    return computedData
}

export function ContentMore({
    content,
    embed,
    numberOfSymbols = 600,
    numberOfLines = 5,
    openSmall,
    customClassName,
    showLink = true,
    showLess = false,
    id = false,
}) {
    // Blocks the user already expanded this session arrive after hydration, so
    // SSR and the first client render agree. A local toggle (once the user
    // pressed the link) wins over the stored value.
    const expandedItems = useSessionPref('expandedItems');
    const wasExpanded = !!id && expandedItems.includes(id);
    const [toggled, setToggled] = useState(null);
    const showFull = toggled ?? (openSmall || wasExpanded);
    const contentRef = useRef(null);

    let linkContent = '';
    if (showLink && embed) {
        linkContent = embed;
    }

    // Character limit as backstop (~100–120 chars per line).
    const effectiveMaxChars = Math.min(numberOfSymbols, numberOfLines * 120);
    const shortHtml = truncateHTML(content, effectiveMaxChars, numberOfLines);
    const showButton = content && shortHtml && shortHtml.trim() !== content.trim();

    const setExpanded = (expanded) => {
        if (id) {
            setSessionPref(
                'expandedItems',
                expanded
                    ? [...expandedItems, id]
                    : expandedItems.filter((item) => item !== id)
            );
        }
        setToggled(expanded);
    };

    let displayContent = showFull ? content : shortHtml;

    // Inline "See more" only while collapsed. Collapse is a separate control.
    if (showButton && !showFull) {
        const seeMore = ` <span class="${TOGGLE_CLASS}">See more</span>`;
        const lastIndex = displayContent.lastIndexOf('</p>');
        if (lastIndex !== -1) {
            displayContent =
                displayContent.slice(0, lastIndex) +
                '... ' +
                seeMore +
                '</p>' +
                displayContent.slice(lastIndex + 4);
        } else {
            displayContent += '... ' + seeMore;
        }
    }

    displayContent += linkContent;

    const html = (
        <HtmlMemo
            data={displayContent}
            customClassName={customClassName}
            lineClamp={null}
            innerRef={contentRef}
        />
    );

    return (
        <View className="max-w-full">
            {showButton && !showFull ? (
                <Pressable className="max-w-full web:cursor-default" onPress={() => setExpanded(true)}>
                    {html}
                </Pressable>
            ) : (
                <View className="max-w-full">{html}</View>
            )}
            {showButton && showFull && showLess ? (
                <Pressable className="self-start web:cursor-pointer" onPress={() => setExpanded(false)}>
                    <Text className={TOGGLE_CLASS}>See less</Text>
                </Pressable>
            ) : null}
        </View>
    );
}
