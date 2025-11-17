import './SealRoller.scss';
import StillSeal from '../../assets/Game/SealSprite.png';
import RollingSeal from '../../assets/Game/RollSprite.png';
import background from '../../assets/Home/sealBackground.png';
import SnowBall from '../../assets/Home/snowball.png';
import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

/**
 * SealRoller component that features an animated seal that follows the user's mouse cursor within 
 * a set section of the screen, stopping when the user leaves that section. Clicking the seal also takes
 * the user to the game page.
 * @returns {JSX.Element}
 */
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

    // Snowball references and values
    const snowballSize = 50;
    const [snowballPosition, setSnowballPosition] = useState({ x: 70, y: 100 });
    const snowballRef = useRef(snowballPosition);
    const snowballVelocityRef = useRef({ x: 0, y: 0 });

    // Center seal on initial render
    useEffect(() => {
        if (sectionRef.current) {
            const rect = sectionRef.current.getBoundingClientRect();
            const startX = rect.width / 2 - sealSize / 2;
            const startY = rect.height / 2 - sealSize / 2;

            // Place seal at start
            setSealPosition({ x: startX, y: startY });
            sealPositionRef.current = { x: startX, y: startY };
            targetPositionRef.current = { x: startX, y: startY };
            // Place snowball next to seal
            setSnowballPosition({ x: startX - 80, y: startY });
            snowballRef.current = { x: startX - 80, y: startY };
            snowballVelocityRef.current = { x: 0, y: 0 };
        }
    }, []);

    // Mouse tracking
    useEffect(() => {
        const handlePointer = (clientX, clientY) => {
            if (!sectionRef.current) return;
            const rect = sectionRef.current.getBoundingClientRect();
            const x = clientX - rect.left - sealSize / 2;
            const y = clientY - rect.top - sealSize / 2;

            if (x >= 0 && x <= rect.width - sealSize && y >= 0 && y <= rect.height - sealSize) {
                targetPositionRef.current = { x: x, y: y };
            }
        };

        // Used by mobile movement to allow for screen scrolling outside rolling seal section
        const isInsideSection = (clientX, clientY) => {
            if (!sectionRef.current) return false;
            const rect = sectionRef.current.getBoundingClientRect();
            return (
                clientX >= rect.left && clientX <= rect.right &&
                clientY >= rect.top && clientY <= rect.bottom
            );
        };

        const handleTouchMove = (event) => {
            const touch = event.touches[0];
            if (isInsideSection(touch.clientX, touch.clientY)) {

                handlePointer(touch.clientX, touch.clientY);
                // Stop page from scrolling inside the section
                event.preventDefault();
            }
        };
        const handleMouseMove = (event) => {
            handlePointer(event.clientX, event.clientY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('touchmove', handleTouchMove);
        }
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
                setRotation((r) => r + 12);
            } else {
                // Snap to stop
                velocity.x = 0;
                velocity.y = 0;
                setIsRolling(false);
                setRotation((r) => {
                    const targetAngle = Math.round(r / 360) * 360;
                    const difference = targetAngle - r;
                    return Math.abs(difference) < 0.5 ? targetAngle : difference * 0.05 + r;
                });
            }

            // Snowball interaction and movement, referencing seal movement
            const ball = snowballRef.current;
            const ballVelocity = snowballVelocityRef.current;

            // Move snowball if it has velocity
            ball.x += ballVelocity.x;
            ball.y += ballVelocity.y;
            // Friction to slow snowball down
            ballVelocity.x *= 0.94;
            ballVelocity.y *= 0.94;

            // Collision with seal detection logic
            const sealCenterX = seal.x + sealSize * 0.5;
            const sealCenterY = seal.y + sealSize * 0.5;
            const ballCenterX = ball.x + snowballSize * 0.5;
            const ballCenterY = ball.y + snowballSize * 0.5;

            // Distance between seal and snowball centers
            const cx = ballCenterX - sealCenterX;
            const cy = ballCenterY - sealCenterY;
            const dist = Math.sqrt(cx * cx + cy * cy);
            const minDist = sealSize * 0.45 + snowballSize * 0.5;

            // Check for collision
            if (dist < minDist) {
                // Normalize collision direction
                const nx = cx / (dist || 1);
                const ny = cy / (dist || 1);

                // Prevent snowball from getting stuck under the seal
                const pushAmount = minDist - dist;
                ball.x += nx * pushAmount;
                ball.y += ny * pushAmount;

                const sealSpeed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                const impulse = Math.min(sealSpeed * 0.3, 6);

                ballVelocity.x += nx * impulse;
                ballVelocity.y += ny * impulse;
            }

            // Check bounds of snowball, bouncing off walls
            if (sectionRef.current) {
                const rect = sectionRef.current.getBoundingClientRect();

                // Left wall
                if (ball.x <= 0) {
                    ball.x = 0;
                    ballVelocity.x = -ballVelocity.x;
                }
                // Right wall
                if (ball.x >= rect.width - snowballSize) {
                    ball.x = rect.width - snowballSize;
                    ballVelocity.x = -ballVelocity.x;
                }
                // Top wall
                if (ball.y <= 0) {
                    ball.y = 0;
                    ballVelocity.y = -ballVelocity.y;
                }
                // Bottom wall
                if (ball.y >= rect.height - snowballSize) {
                    ball.y = rect.height - snowballSize;
                    ballVelocity.y = -ballVelocity.y;
                }
            }

            // Set snowball position
            snowballRef.current = { x: ball.x, y: ball.y };
            setSnowballPosition({ x: ball.x, y: ball.y });
            snowballVelocityRef.current = ballVelocity;

            requestRef.current = requestAnimationFrame(animate);
        };

        requestRef.current = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(requestRef.current);
    }, [facingRight]);

    return (
        <div className='seal-roll-section' ref={sectionRef} style={{ backgroundImage: `url(${background})` }}>
            <img
                src={SnowBall}
                className='snowball'
                alt='snowball'
                style={{
                    width: `${snowballSize}px`,
                    height: `${snowballSize}px`,
                    left: `${snowballPosition.x}px`,
                    top: `${snowballPosition.y}px`,
                    transition: isRolling ? 'none' : 'transform 0.2s',
                }}
            />
            <p className='overlay'>Click the seal to play our game!</p>
            <Link to="/game">
                <img
                    src={isRolling ? RollingSeal : StillSeal}
                    className={`seal-roll-image ${isRolling ? 'rolling' : ''}`}
                    alt='Seal'
                    // Include some styling here for position and rotation
                    style={{
                        width: `${sealSize}px`,
                        height: `${sealSize}px`,
                        transform: `
                            translate(${sealPosition.x}px, ${sealPosition.y}px)
                            scaleX(${facingRight ? 1 : -1})
                            rotate(${rotation}deg) 
                            scale(${isRolling ? 1 : 1.1})
                        `,
                        transition: isRolling ? 'none' : 'transform 0.5s ease-out', // bounce ease
                    }}
                />
            </Link>
        </div>
    );
}