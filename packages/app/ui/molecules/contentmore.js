import { Text } from 'app/design/typography'
import { useState, useMemo, useRef } from 'react';
import { View, Pressable } from 'app/design/view';
import Html from 'app/ui/atoms/html';
import { truncateHTML } from 'app/lib/util';
import { storageSet, storageGet } from 'app/lib/util'
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
    let initedValue = openSmall;
    if (id) {
        let a = storageGet('layout:shmo', '');
        if (a && a.includes(id)) {
            initedValue = true;
        }
    }
    
    const [showFull, setShowFull] = useState(initedValue);
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
            let sm = storageGet('layout:shmo', '') || [];
            if (!showFull) {
                sm.push(id);
            } else {
                sm = sm.filter(item => item !== id);
            }
            storageSet('layout:shmo', '', sm)
        }
        setShowFull(prev => !prev);
    };

    // Prepare toggle text
    const toggleText = showFull ? " " : "See more";
    const toggleHtml = ` <span class="text-foreground text-sm font-semibold web:hover:underline">${toggleText}</span>`;

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

    return (
        <View>
            <Pressable onPress={showButton ? handleToggle : undefined}>
                <HtmlMemo 
                    data={displayContent}
                    customClassName={customClassName}
                    lineClamp={null} // Manual truncation used for inline toggle
                    innerRef={contentRef}
                />
            </Pressable>
        </View>
    );
}
