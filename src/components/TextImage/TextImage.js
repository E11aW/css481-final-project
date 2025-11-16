import './TextImage.scss';
import { Button } from '../Button/Button';
import { Seal } from '../Seal/Seal';


/**
 * Component to format text and image side-by-side.
 * @param {String} props.text - The text to be displayed.
 * @param {String} props.imageSource - The source of the image that will be displayed.
 * @param {String} props.imageAlt - The alternate text describing the image.
 * Button parameters:
 * @param {Boolean} props.hasButton - Tells component if a button is necessary
 * @param {String} props.buttonText - The text to be displayed on the button
 * @param {string} props.buttonLink - The link this button directs users to.
 * Seal parameter:
 * @param {Array} props.funFacts - An array of fun facts about the member.
 * @param {string} props.LinkedIn - Links the seal's name to that member's LinkedIn
 * @returns {JSX.Element}
 */

export const TextImage = (props) => {
    return (
        <div className='text-image-section'>
            <div className='text-image'>

                {props.funFacts ? ( // if fun facts are provided, render Seal component instead of normal image
                    <Seal
                        imageSource={props.imageSource}
                        imageAlt={`${props.imageAlt} as a seal`}
                        funFacts={props.funFacts}
                    />
                ) : (
                    <img className='image' src={props.imageSource} alt={props.imageAlt} />
                )}
                <div className='text-button'>
                    {props.funFacts && <h3 className='seal-name'><a href={props.LinkedIn} target='_blank' rel='noreferrer'>{props.imageAlt}</a></h3>}
                    <p className='text'>{props.text}</p>
                    {props.hasButton && <Button className='button' buttonLink={props.buttonLink} buttonText={props.buttonText} />}
                </div>
            </div>
        </div>
    );
}