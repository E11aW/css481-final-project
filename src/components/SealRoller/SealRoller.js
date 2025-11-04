import './SealRoller.scss';
import StillSeal from '../../assets/Game/SealSprite.png';
import RollingSeal from '../../assets/Game/RollSprite.png';
import { useState, useEffect, useRef } from 'react';

export const SealRoller = () => {
    // Controllers for animation frames
    const [sealPosition, setSealPosition] = useState({ x: 100, y: 100 });
    const [isRolling, setIsRolling] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [facingRight, setFacingRight] = useState(true); // Track direction

    // References
    const targetPositionRef = useRef({ x: 100, y: 100 });
    const sealPositionRef = useRef(sealPosition);
    const velocityRef = useRef({ x: 0, y: 0 });
    const requestRef = useRef(null);
    const sectionRef = useRef(null);

    // Set seal speed
    const speed = 0.15;
    // Set bounce values
    const spring = 0.08; // spring tightness
    const damping = 0.85; // slowing after bounce
    const stopThreshold = 8;
    const sealSize = 100;

    // Center seal on initial render
    useEffect(() => {
        if (sectionRef.current) {
            const rect = sectionRef.current.getBoundingClientRect();
            const startX = rect.width / 2 - sealSize / 2;
            const startY = rect.height / 2 - sealSize / 2;

            setSealPosition({ x: startX, y: startY });
            sealPositionRef.current = { x: startX, y: startY };
            targetPositionRef.current = { x: startX, y: startY };
        }
    }, []);

    // Mouse tracking
    useEffect(() => {
        const handleMouseMove = (event) => {
            if (!sectionRef.current) return;
            const rect = sectionRef.current.getBoundingClientRect();
            const x = event.clientX - rect.left - sealSize / 2;
            const y = event.clientY - rect.top - sealSize / 2;

            if (x >= 0 && x <= rect.width - sealSize && y >= 0 && y <= rect.height - sealSize) {
                targetPositionRef.current = { x: x, y: y };
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    // Movement animation loop
    useEffect(() => {
        const animate = () => {
            const seal = sealPositionRef.current;
            const target = targetPositionRef.current;
            const velocity = velocityRef.current;

            // Calculate distance to target
            const dx = target.x - seal.x;
            const dy = target.y - seal.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Flip direction if moving horizontally
            if (Math.abs(dx) > 10) {
                setFacingRight(dx > 0);
            }

            // Spring physics for bounce effect after rolling
            velocity.x = (velocity.x * damping) + (dx * spring);
            velocity.y = (velocity.y * damping) + (dy * spring);

            seal.x += velocity.x * speed;
            seal.y += velocity.y * speed;

            if (sectionRef.current) {
                const rect = sectionRef.current.getBoundingClientRect();
                // Boundary checks
                seal.x = Math.max(0, Math.min(seal.x, rect.width - sealSize));
                seal.y = Math.max(0, Math.min(seal.y, rect.height - sealSize));
            }

            sealPositionRef.current = { x: seal.x, y: seal.y };
            setSealPosition({ x: seal.x, y: seal.y });

            // Rotation and rolling
            if (distance > stopThreshold) {
                setIsRolling(true);
                // Rotate based on current facing direction
                setRotation((r) => (r + (facingRight ? 12 : -12)) % 360);
            } else {
                // Snap to stop
                velocity.x = 0;
                velocity.y = 0;
                setIsRolling(false);
                setRotation((r) => {
                    const targetAngle = facingRight ? Math.ceil(r / 360) * 360 : Math.floor(r / 360) * 360;
                    const difference = targetAngle - r;
                    return Math.abs(difference) < 0.5 ? targetAngle : difference * 0.05 + r;
                });
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [facingRight]);

    return (
        <div className='seal-section' ref={sectionRef}>
            <img
                src={isRolling ? RollingSeal : StillSeal}
                className={`seal-image ${isRolling ? 'rolling' : ''}`}
                alt='Seal'
                // Include some styling here for position and rotation
                style={{
                    left: `${sealPosition.x}px`,
                    top: `${sealPosition.y}px`,
                    width: `${sealSize}px`,
                    height: `${sealSize}px`,
                    transform: `
                        scaleX(${facingRight ? 1 : -1})
                        rotate(${rotation}deg) 
                        scale(${isRolling ? 1 : 1.1})
                    `,
                    transformOrigin: 'center',
                    transition: isRolling ? 'none' : 'transform 0.5s ease-out', // bounce ease
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
}

