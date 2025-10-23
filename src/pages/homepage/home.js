import './home.scss';
import { MaxWidth } from '../../components/MaxWidth/MaxWidth';
import { TextImage } from '../../components/TextImage/TextImage';
import Placeholder from '../../assets/Home/placeholder.png';

export const Homepage = () => {
  return (
    <main className="homepage">
      <MaxWidth>
        <h1>Website Ttile</h1>
        <TextImage
          subheader='About Us'
          text='We are a small team of 4 developers working to spread awareness about climate change and its impacts on arctic habitats. We all attend the University of Washington Bothell and completed this website as our final project for a Web Developing class. Our goal was to improve our frontend skills, connecting that with backend data to create a website that is visually interesting while also presenting the important data.'
          imageSource={Placeholder}
          imageAlt='Placeholder'
          hasButton={true}
          buttonText='Learn More!'
          buttonLink='/about-us'
        />
      </MaxWidth>
    </main>
  );
}
