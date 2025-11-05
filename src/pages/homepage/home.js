import './home.scss';
import { MaxWidth } from '../../components/MaxWidth/MaxWidth';
import { TextImage } from '../../components/TextImage/TextImage';
import { ImageOverlay } from '../../components/ImageOverlay/ImageOverlay';
import { SealRoller } from '../../components/SealRoller/SealRoller';
import Placeholder from '../../assets/Home/placeholder.png';
import Glacier from '../../assets/Home/glacier.jpg'

export const Homepage = () => {
  return (
    <main className="homepage">
      <ImageOverlay
        imageAlt='Glacier'
        imageSource={Glacier}
        text='Tip of the Iceberg'
      />
      <MaxWidth>
        <h3 className='slogan'>Going deeper on the impacts of global warming</h3>
        <h2 className='subheader-need-padding'>Game</h2>
        <SealRoller />
        <h2 className='subheader-need-padding'>Data</h2>
        <h2 className='about-us-subheader'>About Us</h2>
        <TextImage
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
