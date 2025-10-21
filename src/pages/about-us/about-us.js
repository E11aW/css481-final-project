import './about-us.scss';
import { MaxWidth } from '../../components/MaxWidth/MaxWidth';
import { FlipCard } from '../../components/FlipCard/FlipCard';
import { CardGrid } from '../../components/CardGrid/CardGrid';

export const AboutUs = () => {
  return (
    <main className="about-us">
      <MaxWidth>
        <h1>About Us</h1>
        <CardGrid
          members={[
            { image: '/images/team/member1.jpg', name: 'Alice Johnson', description: 'Lead Developer with a passion for creating intuitive user experiences.' },
            { image: '/images/team/member2.jpg', name: 'Bob Smith', description: 'Backend Engineer specializing in scalable server-side applications.' },
            { image: '/images/team/member3.jpg', name: 'Catherine Lee', description: 'UI/UX Designer focused on crafting visually appealing designs.' },
            { image: '/images/team/member4.jpg', name: 'David Kim', description: 'Full Stack Developer with expertise in both frontend and backend technologies.' },
          ]}
        />

      </MaxWidth>
    </main>
  );
}
