import './ImageOverlay.scss'

/**
 * Component that overlays text over an image that spans full width of the screen
 * @param {String} props.text - The text to be displayed over the image.
 * @param {String} props.imageSource - The source of the image that will be displayed.
 * @param {String} props.imageAlt - The alternate text describing the image.
 * @returns {JSX.Element}
 */

export const ImageOverlay = (props) => {
    return (
        <div className='overlay-section'>
            <img className='background-image' src={props.imageSource} alt={props.imageAlt} />
            <p className='text'>{props.text}</p>
        </div>
    )
}