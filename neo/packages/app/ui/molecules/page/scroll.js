import React, { useRef, useState, useEffect, useCallback } from 'react';
import { View, Row, Pressable, ScrollView } from 'app/design/view'
import { NeoButton } from 'app/design/controls'
import { Text } from 'app/design/typography'
import { useTranslation } from 'react-i18next'

export default function ScrollControl({ horisontal, children, step, initialValue, leftButton, rightButton, title }) {
    const { t } = useTranslation();
    // Use ref to access ScrollView
    const scrollViewRef = useRef(null);
    const [offset, setOffset] = useState({ offset: 0, contentWidth: 0, scrollViewWidth: 0 });

    const scrollToX = useCallback((x, animated = true) => {
        const node = scrollViewRef.current;
        if (!node?.scrollTo) return;

        if ('scrollLeft' in node) {
            node.scrollTo({
                left: x,
                behavior: animated ? 'smooth' : 'auto',
            });
            return;
        }

        node.scrollTo({
            x,
            animated,
        });
    }, []);

    useEffect(() => {
        if (scrollViewRef.current) {
            if (initialValue > 0) {
                scrollToX(initialValue, true);
            }
            else {
                scrollToX(1, false);

                scrollToX(0, false);
            }
        }
    }, [initialValue, scrollToX]);

    const handleScroll = (event) => {
        const nativeEvent = event.nativeEvent;
        const scrollTarget = event.currentTarget;
        const offsetX = nativeEvent?.contentOffset?.x ?? scrollTarget?.scrollLeft ?? 0;
        const contentWidth = nativeEvent?.contentSize?.width ?? scrollTarget?.scrollWidth ?? 0;
        const scrollViewWidth = nativeEvent?.layoutMeasurement?.width ?? scrollTarget?.clientWidth ?? 0;
        setOffset(prevOffset => {
            if (prevOffset.offset !== offsetX || prevOffset.contentWidth !== contentWidth || prevOffset.scrollViewWidth !== scrollViewWidth) {
                return { offset: offsetX, contentWidth, scrollViewWidth };
            }
            return prevOffset;
        });
    };

    const scrollUp = useCallback(() => {
        scrollToX(Math.max(0, offset.offset - step), true);
    }, [offset.offset, scrollToX, step]);

    const scrollDown = useCallback(() => {
        scrollToX(Math.min(offset.offset + step, offset.contentWidth - offset.scrollViewWidth), true);
    }, [offset.offset, offset.contentWidth, offset.scrollViewWidth, scrollToX, step]);

    return (
        <View className='w-full'>
            {title && <Row className='w-full justify-between items-center'><Text>{title}</Text><Row className="gap-x-2">
                <NeoButton disabled={offset.offset == 0} controlSize="small" borderShape="circle" image="ChevronLeft" accessibilityLabel={t('Previous')} onPress={scrollUp} />
                <NeoButton disabled={!(offset.offset + offset.scrollViewWidth < offset.contentWidth)} controlSize="small" borderShape="circle" image="ChevronRight" accessibilityLabel={t('Next')} onPress={scrollDown} />
            </Row></Row>}
            <ScrollView ref={scrollViewRef} horizontal={true}
                onScroll={handleScroll}
                scrollEventThrottle={32}
                showsHorizontalScrollIndicator={false}

            >
                {children}
            </ScrollView>
            {(!title && offset.offset > 0) && (
                <View className="absolute w-12 h-full bg-gradient-to-r to-transparent from-card/50 px-1 justify-center duration-500">
                    {leftButton ? <Pressable onPress={scrollUp}>{leftButton}</Pressable> : <NeoButton style="glass" controlSize="small" borderShape="circle" image="ChevronLeft" accessibilityLabel={t('Scroll left')} onPress={scrollUp} />}
                </View>)
            }
            {(!title && offset.offset + offset.scrollViewWidth < offset.contentWidth) && (
                <View className="absolute w-12 right-0 h-full bg-gradient-to-l to-transparent from-card/50 px-1 justify-center duration-500 items-end">
                    {rightButton ? <Pressable onPress={scrollDown}>{rightButton}</Pressable> : <NeoButton style="glass" controlSize="small" borderShape="circle" image="ChevronRight" accessibilityLabel={t('Scroll right')} onPress={scrollDown} />}
                </View>)}
        </View>
    );
};

