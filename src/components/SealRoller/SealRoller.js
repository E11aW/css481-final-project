import './SealRoller.scss';
import StillSeal from '../../assets/Game/SealSprite.png';
import RollingSeal from '../../assets/Game/RollSprite.png';
import { useState, useEffect, useRef } from 'react';

export const SealRoller = () => {
    // Controllers for animation frames
    const [sealPosition, setSealPosition] = useState({ x: 100, y: 100 });
    const [isRolling, setIsRolling] = useState(false);
    const [rotation, setRotation] = useState(0);

    // References
    const targetPositionRef = useRef({ x: 100, y: 100 });
    const sealPositionRef = useRef(sealPosition);
    const velocityRef = useRef({ x: 0, y: 0 });
    const requestRef = useRef(null);

    // Set seal speed
    const speed = 0.15;
    // Set bounce values
    const spring = 0.1; // spring tightness
    const damping = 0.8; // slowing after bounce

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

            // Spring physics for bounce effect after rolling
            velocity.x = (velocity.x * damping) + (dx * spring);
            velocity.y = (velocity.y * damping) + (dy * spring);

            seal.x += velocity.x * speed;
            seal.y += velocity.y * speed;

            sealPositionRef.current = { x: seal.x, y: seal.y };
            setSealPosition({ x: seal.x, y: seal.y });

            // Rotation and sprite switching
            if (distance > 5) {
                setIsRolling(true);
                setRotation((r) => r + 12);
            } else {
                setIsRolling(false);
            }

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, []);


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
                    transform: `rotate(${rotation}deg) scale(${isRolling ? 1 : 1.1})`,
                    transition: isRolling ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)', // bounce ease
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
}

