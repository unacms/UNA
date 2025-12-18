import { Text } from 'app/design/typography'
import { useState, useMemo, useRef, useEffect } from 'react';
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
    const [isOverflowing, setIsOverflowing] = useState(false);
    const contentRef = useRef(null);

    let linkContent = '';
    if (showLink && embed) {
        linkContent = embed;
    }

    // Hybrid approach: Use character limit as backstop to prevent extreme cases
    // Estimate: ~100-120 chars per line on average
    const maxCharsBasedOnLines = numberOfLines * 120;
    const effectiveMaxChars = Math.min(numberOfSymbols, maxCharsBasedOnLines);
    
    let shortHtml = truncateHTML(content, effectiveMaxChars);
    
    // Detect overflow on web using CSS line-clamp
    useEffect(() => {
        if (isWeb && contentRef.current && !showFull) {
            const element = contentRef.current;
            const isContentOverflowing = element.scrollHeight > element.clientHeight;
            setIsOverflowing(isContentOverflowing);
        }
    }, [content, showFull, numberOfLines]);

    // Determine if we should show the "See more" button
    let showButton = false;
    if (isWeb) {
        // On web, use CSS overflow detection
        showButton = isOverflowing;
    } else {
        // On native, use character-based truncation result
        showButton = content && shortHtml && shortHtml.trim() !== content.trim();
    }

    // Add "Show more" inline for native (character-based truncation)
    if (showButton && !isWeb && !showFull) {
        const lastIndex = shortHtml.lastIndexOf('</p>');
        if (lastIndex !== -1) {
            shortHtml = shortHtml.slice(0, lastIndex) + 
                '... <span class="text-primary">Show more</span>' + 
                '</p>' + shortHtml.slice(lastIndex + 4);
        }
    }

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

    const displayContent = isWeb 
        ? content + linkContent 
        : (showFull ? content + linkContent : shortHtml + linkContent);

    return (
        <View>
            <Pressable onPress={showButton ? handleToggle : undefined}>
                <HtmlMemo 
                    data={displayContent}
                    customClassName={customClassName}
                    lineClamp={isWeb && !showFull ? numberOfLines : null}
                    innerRef={contentRef}
                />
            </Pressable>
            {showButton && showLess && (
                <Pressable onPress={handleToggle}>
                    <Text className="text-primary dark:text-primary text-base mt-1">
                        {showFull ? "Show less" : "Show more"}
                    </Text>
                </Pressable>
            )}
        </View>
    );
}
