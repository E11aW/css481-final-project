import './home.scss';
import { MaxWidth } from '../../components/MaxWidth/MaxWidth';
import { TextImage } from '../../components/TextImage/TextImage';
import { ImageOverlay } from '../../components/ImageOverlay/ImageOverlay';
import Placeholder from '../../assets/Home/placeholder.png';
import Glacier from '../../assets/Home/glacier.jpg'
import { Button } from '../../components/Button/Button';

export const Homepage = () => {
  return (
    <main className="homepage">
      <MaxWidth>
        <ImageOverlay
          imageAlt='Glacier'
          imageSource={Glacier}
          text='Website Title'
        />
        <div className='game-section'>
          <Button className='game-button'
            buttonText='Game'
            buttonLink='/game'
          />
        </div>
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
