import './CardGrid.scss';
import { FlipCard } from '../FlipCard/FlipCard';

/**
 * CardGrid component that arranges its children flipcards in a responsive grid layout.
 * @component
 * @param {string[]} props.members - The FlipCard components to be displayed in the grid.
 * @returns {JSX.Element}
 */

export const CardGrid = (props) => {
    const displayedMembers = props.members;
    return (
        <div className='card-grid'>
            {displayedMembers.map((member, index) => (
                <FlipCard
                    key={index}
                    name={member.name}
                    imageSrc={member.image}
                    backDescription={member.description}
                />
            ))}
        </div>
    )
}