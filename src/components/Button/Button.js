import './Button.scss';

/**
 * Button component that directs users to other pages/resources.
 * @component
 * @param {String} props.buttonText - The text to be displayed on the button
 * @param {string} props.buttonLink - The link this button directs users to.
 * @returns {JSX.Element}
 */

export const Button = (props) => {
    return (
        <button className='button'><a className='button-text' href={props.buttonLink} target='_blank'>{props.buttonText}</a></button>
    )
}