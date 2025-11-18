import './IcebergTitle.scss';
import BlueIceberg from '../../assets/Home/blue-iceberg.png'

/**
 * Seal component to display a customized seal image for each member with fun facts.
 * @param {String} props.title - The title to be displayed next to the image.
 * @param {String} props.subtitle - The subtitle to be displayed next to the image.
 * @returns {JSX.Element}
 */

export const IcebergTitle = (props) => {
    return (
        <div className='iceberg-title-section'>
            <div className='titles'>
                <h1 className='iceberg-title'>{props.title}</h1>
                <p className='iceberg-subtitle'>{props.subtitle}</p>
            </div>
            <img className='blue-iceberg' src={BlueIceberg} alt='Blue Iceberg' />
        </div>
    );
};