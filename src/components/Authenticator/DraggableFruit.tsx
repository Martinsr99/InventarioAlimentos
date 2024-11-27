import React, { useState, useRef } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface DraggableFruitProps {
    src: string;
    className: string;
    initialDelay?: number;
}

const DraggableFruit: React.FC<DraggableFruitProps> = ({ src, className }) => {
    const [isDragging, setIsDragging] = useState(false);
    const prevTransformRef = useRef({ x: 0, y: 0 });
    
    const [{ transform }, api] = useSpring(() => ({
        transform: 'translate(0px, 0px)',
        config: { tension: 300, friction: 20 }
    }));

    const bind = useDrag(({ 
        down, 
        movement: [mx, my], 
        velocity: [vx, vy],
        last,
        first,
        event
    }) => {
        if (first) {
            // Get current CSS transform when starting drag
            const el = event.target as HTMLElement;
            const style = window.getComputedStyle(el);
            const matrix = new DOMMatrix(style.transform);
            prevTransformRef.current = {
                x: matrix.m41,
                y: matrix.m42
            };
        }

        setIsDragging(down);

        const newX = prevTransformRef.current.x + mx;
        const newY = prevTransformRef.current.y + my;

        if (down) {
            // Direct movement while dragging
            api.start({
                transform: `translate(${newX}px, ${newY}px)`,
                immediate: true
            });
        } else if (last) {
            // On release
            const velocity = Math.sqrt(vx * vx + vy * vy);
            const VELOCITY_THRESHOLD = 0.2;

            if (velocity > VELOCITY_THRESHOLD) {
                // Apply throw physics
                const velocityMultiplier = 200;
                const throwX = newX + vx * velocityMultiplier;
                const throwY = newY + vy * velocityMultiplier;

                api.start({
                    transform: `translate(${throwX}px, ${throwY}px)`,
                    config: {
                        velocity: velocity,
                        decay: true
                    },
                    onRest: () => {
                        const el = event.target as HTMLElement;
                        const style = window.getComputedStyle(el);
                        const matrix = new DOMMatrix(style.transform);
                        prevTransformRef.current = {
                            x: matrix.m41,
                            y: matrix.m42
                        };
                        setIsDragging(false);
                    }
                });
            } else {
                // Stay at current position
                prevTransformRef.current = { x: newX, y: newY };
                api.start({
                    transform: `translate(${newX}px, ${newY}px)`,
                    immediate: true
                });
                setIsDragging(false);
            }
        }
    });

    return (
        <animated.img
            {...bind()}
            src={src}
            alt=""
            className={`fruit ${className} ${isDragging ? 'dragging' : ''}`}
            style={{
                transform,
                touchAction: 'none',
                cursor: isDragging ? 'grabbing' : 'grab',
                pointerEvents: 'auto',
                userSelect: 'none'
            }}
        />
    );
};

export default DraggableFruit;
