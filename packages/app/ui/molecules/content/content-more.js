import { useState, useMemo, useRef } from 'react';
import { View, Pressable } from 'app/design/view';
import Html from 'app/ui/atoms/html';
import { truncateHTML } from 'app/lib/util';
import { useSessionPref, setSessionPref } from 'app/context/prefs'
import { Platform } from 'react-native'

const isWeb = Platform.OS === 'web'

function HtmlMemo({ data, customClassName, lineClamp, onOverflow, innerRef }) {
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
    numberOfSymbols = 600,  // Increased default as backstop
    numberOfLines = 5,      // Primary truncation method
    textStyle, 
    openSmall, 
    customClassName, 
    showLink = true, 
    showLess = false, 
    id = false 
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

    // Hybrid approach: Use character limit as backstop to prevent extreme cases
    // Estimate: ~100-120 chars per line on average
    const maxCharsBasedOnLines = numberOfLines * 120;
    const effectiveMaxChars = Math.min(numberOfSymbols, maxCharsBasedOnLines);
    
    let shortHtml = truncateHTML(content, effectiveMaxChars, numberOfLines);
    
    // Determine if we should show the "See more" button
    const showButton = content && shortHtml && shortHtml.trim() !== content.trim();

    const handleToggle = () => {
        if (id) {
            setSessionPref(
                'expandedItems',
                showFull ? expandedItems.filter((item) => item !== id) : [...expandedItems, id]
            );
        }
        setToggled(!showFull);
    };

    // Prepare toggle text
    const toggleText = showFull ? " " : "See more";
    const toggleHtml = ` <span class="text-foreground text-sm font-semibold web:hover:underline web:cursor-pointer">${toggleText}</span>`;

    let displayContent = showFull ? content : shortHtml;

    // Inject toggle into HTML for inline display
    if (showButton) {
        if (!showFull) {
            // Collapsed: add "Show more" inline
            const lastIndex = displayContent.lastIndexOf('</p>');
            if (lastIndex !== -1) {
                displayContent = displayContent.slice(0, lastIndex) + '... ' + toggleHtml + '</p>' + displayContent.slice(lastIndex + 4);
            } else {
                displayContent += '... ' + toggleHtml;
            }
        } else if (showFull && showLess) {
            // Expanded: add "See less" inline
            const lastIndex = displayContent.lastIndexOf('</p>');
            if (lastIndex !== -1) {
                displayContent = displayContent.slice(0, lastIndex) + toggleHtml + '</p>' + displayContent.slice(lastIndex + 4);
            } else {
                displayContent += toggleHtml;
            }
        }
    }

    displayContent += linkContent;

    const html = (
        <HtmlMemo
            data={displayContent}
            customClassName={customClassName}
            lineClamp={null} // Manual truncation used for inline toggle
            innerRef={contentRef}
        />
    );

    return (
        <View className=" max-w-full">
            {showButton ? (
                <Pressable className="max-w-full web:cursor-default" onPress={handleToggle}>
                    {html}
                </Pressable>
            ) : (
                <View className="max-w-full">{html}</View>
            )}
        </View>
    );
}
