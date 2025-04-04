import React, { useRef, forwardRef } from 'react';

export const SafeMenuTrigger = ({ children, className = '', ...rest }) => {
    const start = useRef({ x: 0, y: 0, time: 0 });

    const MAX_MOVEMENT = 5;
    const MAX_DURATION = 300;

    const handlePointerDownCapture = (e) => {
        start.current = {
            x: e.pageX,
            y: e.pageY,
            time: Date.now()
        };
    };

    const handlePointerDown = (e) => {
        const dx = Math.abs(e.pageX - start.current.x);
        const dy = Math.abs(e.pageY - start.current.y);
        const dt = Date.now() - start.current.time;

        const isLegitTap = dx < MAX_MOVEMENT && dy < MAX_MOVEMENT && dt < MAX_DURATION;

        if (!isLegitTap) {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    return (
        <div
            className={className}
            onPointerDownCapture={handlePointerDownCapture}
            onPointerDown={handlePointerDown}
            style={{ display: 'inline-block' }}
            {...rest}
        >
            {children}
        </div>
    );
};