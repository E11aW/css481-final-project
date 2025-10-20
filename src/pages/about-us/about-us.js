import './about-us.scss';
import { MaxWidth } from '../../components/MaxWidth/MaxWidth';
import { FlipCard } from '../../components/FlipCard/FlipCard';

export const AboutUs = () => {
  return (
    <main className="about-us">
      <MaxWidth>
        <h1>About Us</h1>
        <FlipCard
          name="Test Name"
          imageSrc="https://via.placeholder.com/150"
          backDescription="This is a description on the back of the card."
        />
      </MaxWidth>
    </main>
  );
}
