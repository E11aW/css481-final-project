import './about-us.scss';
import { MaxWidth } from '../../components/MaxWidth/MaxWidth';
import { CardGrid } from '../../components/CardGrid/CardGrid';
import EllaImage from '../../assets/AboutUs/Ella-Williams.jpg';

export const AboutUs = () => {
  return (
    <main className="about-us">
      <MaxWidth>
        <h1>About Us</h1>
        <CardGrid
          subheader='Our Team'
          members={[
            { image: '/images/team/member3.jpg', name: 'Clayton McArthur', description: 'Send me your description.' },
            { image: EllaImage, name: 'Ella Williams', description: 'I am an undergraduate student at the University of Washington Bothell working towards a Bachelor of Science in Computer Science and Software Engineering. I work on campus and am a very active member of our campus\'s robotics team: TrickFire Robotics. I am well-versed in a wide variety of programming languages, including both frontend and backend.' },
            { image: '/images/team/member3.jpg', name: 'Ishaan Shete', description: 'Send me your description.' },
            { image: '/images/team/member4.jpg', name: 'Maxx McArthur', description: 'Send me your description.' },
          ]}
        />

      </MaxWidth>
    </main>
  );
}
