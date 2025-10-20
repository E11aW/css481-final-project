import './FlipCard.scss';
import React, { useState } from 'react';

/**
 * FlipCard component that displays content on both the front and back sides. 
 * It flips when the user hovers their mouse over the card.
 * @component
 * @param {String} props.name - The name to display on the front side of the card.
 * @param {String} props.imageSrc - The source URL of the image to display on the front side of the card above name.
 * @param {String} props.backDescription - The description text to display on the back side of the card.
 * @returns {JSX.Element}
 */
export const FlipCard = (props) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div className={`flip-card ${isFlipped ? 'flipped' : ''}`}
            onMouseEnter={() => setIsFlipped(true)}
            onMouseLeave={() => setIsFlipped(false)}
        >
            <div className="flip-card-inner">
                <div className="front">
                    <img src={props.imageSrc} alt={props.name} className="card-image" />
                    <h2 className='card-name'>{props.name}</h2>
                </div>
                <div className='back'>
                    <p className='back-description'>{props.backDescription}</p>
                </div>
            </div>
        </div>
    );
}