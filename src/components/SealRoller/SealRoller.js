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

    // Set seal speed
    const speed = 0.15;
    // Set bounce values
    const spring = 0.08; // spring tightness
    const damping = 0.85; // slowing after bounce
    const stopThreshold = 8;

    // Mouse tracking
    useEffect(() => {
        const handleMouseMove = (event) => {
            const section = document.querySelector('.seal-section');
            const rect = section.getBoundingClientRect();

            if ( // Checks if seal is within section bounds
                event.clientX >= rect.left && event.clientX <= rect.right &&
                event.clientY >= rect.top && event.clientY <= rect.bottom
            ) {
                targetPositionRef.current = { x: event.clientX - 50, y: event.clientY - 50 };
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

            sealPositionRef.current = { x: seal.x, y: seal.y };
            setSealPosition({ x: seal.x, y: seal.y });

            // Rotation and sprite switching
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
                    return Math.abs(difference) < 0.5 ? targetAngle : difference * 0.5 + r;
                });
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [facingRight]);


    return (
        <div className='seal-section'>
            <img
                src={isRolling ? RollingSeal : StillSeal}
                className={`seal-image ${isRolling ? 'rolling' : ''}`}
                alt='Seal'
                // Include some styling here for position and rotation
                style={{
                    position: 'fixed',
                    left: `${sealPosition.x}px`,
                    top: `${sealPosition.y}px`,
                    width: '100px',
                    height: '100px',
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

