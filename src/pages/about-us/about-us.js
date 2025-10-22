import './about-us.scss';
import { MaxWidth } from '../../components/MaxWidth/MaxWidth';
import { CardGrid } from '../../components/CardGrid/CardGrid';
import EllaImage from '../../assets/AboutUs/Ella-Williams.jpg';
import MaxxImage from '../../assets/AboutUs/Maxx-McArthur.jpg';
import ClaytonImage from '../../assets/AboutUs/Clayton-McArthur.jpg'

export const AboutUs = () => {
  return (
    <main className="about-us">
      <MaxWidth>
        <h1>About Us</h1>
        <h2>Our Mission</h2>
        <p className='mission-paragraph'>Example mission paragrah here.</p>
        <CardGrid
          subheader='Our Team'
          members={[
            { image: ClaytonImage, name: 'Clayton McArthur', description: 'Hi, I’m a CSSE student at the University of Washington Bothell and President of TrickFire Robotics, an 100+ member engineering club. I enjoy building software that interacts with the hardware level, interacts with the network, and interacts with large data sets. I strive to be a good team player and leader.' },
            { image: EllaImage, name: 'Ella Williams', description: 'I am an undergraduate student at the University of Washington Bothell working towards a Bachelor of Science in Computer Science and Software Engineering. I work on campus and am a very active member of our campus\'s robotics team: TrickFire Robotics. I am well-versed in a wide variety of programming languages, including both frontend and backend.' },
            { image: '/images/team/member3.jpg', name: 'Ishaan Shete', description: 'Send me your description.' },
            { image: MaxxImage, name: 'Maxx McArthur', description: 'I am a fourth year student at University of Washington Bothell pursuing a Computer Science/Software Engineering bachelors degree. I am proficient in C++ and I am currently working on rounding out my other coding skills and languages. I have used VScode, Docker, Keil Uvision5, Unbuntu, GitHub, PostgreSQL, and many more software systems extensively.' },
          ]}
        />

      </MaxWidth>
    </main>
  );
}
