import './TextImage.scss';
import { Button } from '../Button/Button';

/**
 * Component to format text and image side-by-side.
 * @param {String} props.text - The text to be displayed.
 * @param {String} props.imageSource - The source of the image that will be displayed.
 * @param {String} props.imageAlt - The alternate text describing the image.
 * @param {String} props.subheader - The subheader for this component.
 * Button parameters:
 * @param {Boolean} props.hasButton - Tells component if a button is necessary
 * @param {String} props.buttonText - The text to be displayed on the button
 * @param {string} props.buttonLink - The link this button directs users to.
 * @returns {JSX.Element}
 */

export const TextImage = (props) => {

    return (
        <div className='text-image-section'>
            <h2 className='subheader'>{props.subheader}</h2>
            <div className='text-image'>
                <img className='image' src={props.imageSource} alt={props.imageAlt} />
                <div className='text-button'>
                    <p className='text'>{props.text}</p>
                    {props.hasButton && <Button className='button' buttonLink={props.buttonLink} buttonText={props.buttonText} />}
                </div>
            </div>
        </div>
    );
}