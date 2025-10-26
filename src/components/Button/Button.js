import './Button.scss';
import { Link } from 'react-router-dom';

/**
 * Button component that directs users to other pages/resources.
 * @component
 * @param {String} props.buttonText - The text to be displayed on the button
 * @param {string} props.buttonLink - The link this button directs users to.
 * @returns {JSX.Element}
 */

export const Button = (props) => {
    return (
        <Link to={props.buttonLink} className="button">
            {props.buttonText}
        </Link>
    );
};