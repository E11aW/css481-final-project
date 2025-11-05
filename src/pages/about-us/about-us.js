import './about-us.scss';
import { MaxWidth } from '../../components/MaxWidth/MaxWidth';
import { TextImage } from '../../components/TextImage/TextImage';
import EllaSeal from '../../assets/AboutUs/EllaSeal.png';
import MaxxSeal from '../../assets/AboutUs/MaxxSeal.png';
import ClaytonSeal from '../../assets/AboutUs/ClaytonSeal.png'
import IshaanSeal from '../../assets/AboutUs/IshaanSeal.png';

export const AboutUs = () => {
  return (
    <main className='about-us'>
      <MaxWidth>
        <h1>About Us</h1>
        <h2>Our Mission</h2>
        <p className='mission-paragraph'>Tip of the Iceberg focuses on spreading awareness on global warming and ice caps melting in an interactive and engaging way. This website includes multiple pages that share important data and statistics on these topics, using up-to-date information that demonstrates the true situation of global warming. We are striving to use data that goes deeper than the “tip of the iceberg”. Our game called “Save the Seal” interactively shares this data by presenting information about global warming to players as they roll through the game!</p>
        <h2>Our Team</h2>
        <p>Click the seals for fun facts about our members!</p>
        <TextImage
          imageSource={ClaytonSeal}
          imageAlt='Clayton McArthur'
          text='Hi, I’m a CSSE student at the University of Washington Bothell and President of TrickFire Robotics, an 100+ member engineering club. I enjoy building software that interacts with the hardware level, interacts with the network, and interacts with large data sets. I strive to be a good team player and leader.'
          hasButton={false}
          funFacts={['Send me fun facts']}
        />
        <TextImage
          imageSource={EllaSeal}
          imageAlt='Ella Williams'
          text='I am an undergraduate student at the University of Washington Bothell working towards a Bachelor of Science in Computer Science and Software Engineering. I work on campus and am a very active member of our campus’s robotics team: TrickFire Robotics. I am well-versed in a wide variety of programming languages, including both frontend and backend.'
          hasButton={false}
          funFacts={['I have a pet cornsnake', 'I like doing arts and crafts', 'I know what Pokemon is', 'I have loved dragons my entire life', 'I am such a workaholic', 'I am a very chaotic seal', 'I turned everyone into seals', 'I hate deserts, minus cacti of course']}
        />
        <TextImage
          imageSource={IshaanSeal}
          imageAlt='Ishaan Shete'
          text='Hi, I’m a CSSE student at UW Bothell set to graduate in June 2026. I love collaborating on full-stack apps and machine learning projects. I have also been playing the Tabla (drum-like instrument) for 18+ years and enjoying competing in all kinds of physical sports.'
          hasButton={false}
          funFacts={['I speak 7 languages', 'I’ve been playing Tabla (drum-like) instrument for 18+ yrs', 'I like playing all sports']}
        />
        <TextImage
          imageSource={MaxxSeal}
          imageAlt='Maxx McArthur'
          text='I am a fourth year student at University of Washington Bothell pursuing a Computer Science/Software Engineering bachelors degree. I am proficient in C++ and I am currently working on rounding out my other coding skills and languages. I have used VScode, Docker, Keil Uvision5, Unbuntu, GitHub, PostgreSQL, and many more software systems extensively.'
          hasButton={false}
          funFacts={['I graduated high school at 16', 'I have been snowboarding for 8 years', 'I have only been coding for 2 years']}
        />
      </MaxWidth>
    </main>
  );
}