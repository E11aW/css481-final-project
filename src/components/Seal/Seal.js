import './Seal.scss';
import { useRef } from 'react';

/**
 * Seal component to display a customized seal image for each member with fun facts.
 * @param {String} props.imageSource - The source of the seal image that will be displayed.
 * @param {String} props.imageAlt - The alternate text describing the seal image.
 * @param {Array} props.funFacts - An array of fun facts about the member.
 * @returns {JSX.Element}
 */

export const Seal = (props) => {
    const funFactRef = useRef(null);

    const displayFunFact = () => {
        // Select a random fun fact from the array
        let index = Math.floor(Math.random() * props.funFacts.length);

        if (funFactRef.current) {
            funFactRef.current.textContent = props.funFacts[index];
        }
    }

    return (
        <div className='seal-section'>
            <div className='fun-facts'>
                <p className='fun-fact' ref={funFactRef}></p>
            </div>
            <img className='seal-image' src={props.imageSource} alt={props.imageAlt} onClick={displayFunFact} />
        </div>
    );
}