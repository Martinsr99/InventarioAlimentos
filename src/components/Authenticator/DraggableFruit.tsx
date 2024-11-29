import React, { useState, useRef, useEffect } from 'react';
import { useSpring, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';

interface DraggableFruitProps {
    src: string;
    className: string;
    initialDelay?: number;
    disableInteraction?: boolean;
}

const DraggableFruit: React.FC<DraggableFruitProps> = ({ 
    src, 
    className, 
    initialDelay = 0,
    disableInteraction = false 
}) => {
    const [isDragging, setIsDragging] = useState(false);
    const [hasBeenDragged, setHasBeenDragged] = useState(false);
    const positionRef = useRef({ x: 0, y: 0 });
    const velocityRef = useRef({ vx: 0, vy: 0 });
    const isMovingRef = useRef(false);
    const lastMoveTimeRef = useRef(Date.now());
    const fruitRef = useRef<HTMLImageElement>(null);
    
    const [{ transform }, api] = useSpring(() => ({
        transform: 'translate(0px, 0px)',
        config: { tension: 10, friction: 5 }
    }));

    // Function to handle bouncing
    const handleBounce = (position: { x: number, y: number }, velocity: { vx: number, vy: number }) => {
        const fruitElement = fruitRef.current;
        if (!fruitElement) return { position, velocity };

        const fruitWidth = fruitElement.offsetWidth;
        const fruitHeight = fruitElement.offsetHeight;
        const maxX = window.innerWidth - fruitWidth;
        const maxY = window.innerHeight - fruitHeight;
        const BOUNCE_FACTOR = 0.8;

        let newX = position.x;
        let newY = position.y;
        let newVx = velocity.vx;
        let newVy = velocity.vy;

        if (newX <= 0) {
            newX = 0;
            newVx = Math.abs(velocity.vx) * BOUNCE_FACTOR;
        } else if (newX >= maxX) {
            newX = maxX;
            newVx = -Math.abs(velocity.vx) * BOUNCE_FACTOR;
        }

        if (newY <= 0) {
            newY = 0;
            newVy = Math.abs(velocity.vy) * BOUNCE_FACTOR;
        } else if (newY >= maxY) {
            newY = maxY;
            newVy = -Math.abs(velocity.vy) * BOUNCE_FACTOR;
        }

        return {
            position: { x: newX, y: newY },
            velocity: { vx: newVx, vy: newVy }
        };
    };

    // Initial animation setup
    useEffect(() => {
        const setupInitialMovement = () => {
            const startPositions = [
                { x: -40, y: -40 },
                { x: window.innerWidth, y: -40 },
                { x: window.innerWidth/2, y: -40 },
                { x: -40, y: window.innerHeight/2 },
                { x: window.innerWidth, y: window.innerHeight/2 },
            ];

            const classNumber = parseInt(className.split('-')[1]) - 1;
            const startPos = startPositions[classNumber] || startPositions[0];
            
            positionRef.current = startPos;
            api.start({
                transform: `translate(${startPos.x}px, ${startPos.y}px)`,
                immediate: true
            });

            setTimeout(() => {
                isMovingRef.current = true;
                const angle = Math.random() * Math.PI * 2;
                velocityRef.current = {
                    vx: Math.cos(angle) * 3,
                    vy: Math.sin(angle) * 3
                };
                startAnimation();
            }, initialDelay);
        };

        setupInitialMovement();
    }, []);

    const startAnimation = () => {
        const animate = () => {
            if (!isMovingRef.current) return;

            const nextX = positionRef.current.x + velocityRef.current.vx * 16;
            const nextY = positionRef.current.y + velocityRef.current.vy * 16;

            const { position, velocity } = handleBounce(
                { x: nextX, y: nextY },
                velocityRef.current
            );

            velocityRef.current = velocity;
            positionRef.current = position;

            api.start({
                transform: `translate(${position.x}px, ${position.y}px)`,
                immediate: true
            });

            if (Math.abs(velocity.vx) > 0.1 || Math.abs(velocity.vy) > 0.1) {
                requestAnimationFrame(animate);
            } else {
                isMovingRef.current = false;
                lastMoveTimeRef.current = Date.now();
            }
        };

        requestAnimationFrame(animate);
    };

    // Check for inactivity and start random movement
    useEffect(() => {
        const checkInactivity = () => {
            const now = Date.now();
            const inactiveTime = now - lastMoveTimeRef.current;
            
            if (!isDragging && !isMovingRef.current && inactiveTime > 3000) {
                isMovingRef.current = true;
                const angle = Math.random() * Math.PI * 2;
                velocityRef.current = {
                    vx: Math.cos(angle) * 3,
                    vy: Math.sin(angle) * 3
                };
                startAnimation();
            }
        };

        const intervalId = setInterval(checkInactivity, 1000);
        return () => clearInterval(intervalId);
    }, [isDragging]);

    const bind = useDrag(({ 
        down, 
        movement: [mx, my],
        velocity: [vx, vy],
        last,
        first,
        event
    }) => {
        if (disableInteraction) return;
        
        if (first) {
            setHasBeenDragged(true);
            isMovingRef.current = false;
            const el = event.target as HTMLElement;
            const style = window.getComputedStyle(el);
            const matrix = new DOMMatrix(style.transform);
            positionRef.current = {
                x: matrix.m41,
                y: matrix.m42
            };
        }

        if (down) {
            setIsDragging(true);
            const newX = positionRef.current.x + mx;
            const newY = positionRef.current.y + my;
            const { position } = handleBounce(
                { x: newX, y: newY },
                { vx: 0, vy: 0 }
            );
            api.start({
                transform: `translate(${position.x}px, ${position.y}px)`,
                immediate: true
            });
        } else if (last) {
            setIsDragging(false);
            isMovingRef.current = true;
            // Restored original velocity multiplier
            velocityRef.current = { vx: vx * 5, vy: vy * 5 };
            startAnimation();
        }
    });

    return (
        <animated.img
            {...bind()}
            ref={fruitRef}
            src={src}
            alt=""
            className={`fruit ${className} ${isDragging ? 'dragging' : ''} ${hasBeenDragged ? 'dragged' : ''}`}
            style={{
                transform,
                touchAction: 'none',
                cursor: disableInteraction ? 'default' : (isDragging ? 'grabbing' : 'grab'),
                pointerEvents: disableInteraction ? 'none' : 'auto',
                userSelect: 'none',
                willChange: 'transform'
            }}
        />
    );
};

export default DraggableFruit;
