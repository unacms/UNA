'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { View } from 'app/design/view';
import { Button } from "app/design/controls";

export default function Gallery({ items, autoscroll }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [nextIndex, setNextIndex] = useState(null);
    const [slideDirection, setSlideDirection] = useState(0); // -1 for left, 1 for right
    const [trackOffset, setTrackOffset] = useState(0); // 0 or -50
    const [isPaused, setIsPaused] = useState(false);
    const containerRef = useRef(null);

    // Animation duration in ms
    const animationDuration = 500;

    const goLeft = useCallback(() => {
        if (isTransitioning || items.length <= 1) return;
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        
        // For left: start at -50% (showing current), animate to 0% (showing prev)
        setNextIndex(prevIndex);
        setSlideDirection(-1);
        setTrackOffset(-50); // Start showing current card (right side)
        
        // Trigger reflow then start animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                setIsTransitioning(true);
                setTrackOffset(0); // Animate to show prev card (left side)
            });
        });
        
        setTimeout(() => {
            setCurrentIndex(prevIndex);
            setNextIndex(null);
            setIsTransitioning(false);
            setTrackOffset(0);
        }, animationDuration + 50);
    }, [isTransitioning, items.length, currentIndex]);

    const goRight = useCallback(() => {
        if (isTransitioning || items.length <= 1) return;
        const next = (currentIndex + 1) % items.length;
        
        // For right: start at 0% (showing current), animate to -50% (showing next)
        setNextIndex(next);
        setSlideDirection(1);
        setTrackOffset(0); // Start showing current card (left side)
        setIsTransitioning(true);
        
        // Animate to show next card
        requestAnimationFrame(() => {
            setTrackOffset(-50);
        });
        
        setTimeout(() => {
            setCurrentIndex(next);
            setNextIndex(null);
            setIsTransitioning(false);
            setTrackOffset(0);
        }, animationDuration + 50);
    }, [isTransitioning, items.length, currentIndex]);

    // Autoscroll
    useEffect(() => {
        if (!autoscroll || isPaused || items.length <= 1) return;
        
        const interval = typeof autoscroll === 'number' ? autoscroll : 5000;
        const timer = setInterval(() => {
            goRight();
        }, interval);

        return () => clearInterval(timer);
    }, [autoscroll, isPaused, currentIndex, items.length, goRight]);

    // Handle swipe gestures
    const touchStartX = useRef(0);
    const handleTouchStart = (e) => {
        touchStartX.current = e.touches[0].clientX;
        setIsPaused(true);
    };

    const handleTouchEnd = (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX.current - touchEndX;
        
        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                goRight();
            } else {
                goLeft();
            }
        }
        setIsPaused(false);
    };

    // Track style - slides both cards together
    const trackStyle = {
        display: 'flex',
        gap: '1.5rem',
        width: '200%', // Two slides side by side
        transform: `translateX(${trackOffset}%)`,
        transition: isTransitioning 
            ? `transform ${animationDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)` 
            : 'none',
    };

    // Determine which slides to show
    const getVisibleSlides = () => {
        if (nextIndex !== null) {
            if (slideDirection === 1) {
                // Going right: current on left, next on right
                return [currentIndex, nextIndex];
            } else {
                // Going left: prev on left, current on right
                return [nextIndex, currentIndex];
            }
        }
        // Not transitioning: show current slide
        return [currentIndex, (currentIndex + 1) % items.length];
    };

    const visibleSlides = getVisibleSlides();

    // Hide navigation if only one item
    const showNavigation = items.length > 1;

    return (
        <View 
            ref={containerRef}
            className='p-2 overflow-hidden'
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
        >
            <div style={trackStyle}>
                <div style={{ width: '50%', flexShrink: 0 }}>
                    {items[visibleSlides[0]]}
                </div>
                <div style={{ width: '50%', flexShrink: 0 }}>
                    {items[visibleSlides[1]]}
                </div>
            </div>
            {showNavigation && (
                <>
                    <View className='absolute left-4 top-4 pl-px z-10'>
                        <Button variant="default" rounded size="sm" onPress={goLeft} startDecorator="ChevronLeft" />
                    </View>
                    <View className='absolute top-4 right-4 pr-px z-10'>
                        <Button variant="default" rounded size="sm" onPress={goRight} startDecorator="ChevronRight" />
                    </View>
                </>
            )}
        </View>
    );
}
