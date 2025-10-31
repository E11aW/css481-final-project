import './home.scss';
import { MaxWidth } from '../../components/MaxWidth/MaxWidth';
import { TextImage } from '../../components/TextImage/TextImage';
import { ImageOverlay } from '../../components/ImageOverlay/ImageOverlay';
import { Button } from '../../components/Button/Button';
import { CardGrid } from '../../components/CardGrid/CardGrid';
import Placeholder from '../../assets/Home/placeholder.png';
import GraphPlaceholder from '../../assets/Home/graph_placeholder.png'
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
        <h2 className='subheader-need-padding'>Game</h2>
        <div className='game-section'>
          <Button className='game-button'
            buttonText='Play Game'
            buttonLink='/game'
          />
        </div>
        <CardGrid
          subheader='Data'
          members={[
            { image: GraphPlaceholder, name: 'Graph1', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed iaculis sed risus in ultricies. Mauris vitae malesuada tellus. Ut sed urna dignissim diam viverra efficitur non vel lacus. Aliquam accumsan quis nulla eu fringilla. Vivamus tempus ante non ligula pulvinar, id gravida purus ultrices. Etiam sed auctor neque, et tristique augue. Cras eget lorem diam. In porta bibendum neque, non.' },
            { image: GraphPlaceholder, name: 'Graph2', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed iaculis sed risus in ultricies. Mauris vitae malesuada tellus. Ut sed urna dignissim diam viverra efficitur non vel lacus. Aliquam accumsan quis nulla eu fringilla. Vivamus tempus ante non ligula pulvinar, id gravida purus ultrices. Etiam sed auctor neque, et tristique augue. Cras eget lorem diam. In porta bibendum neque, non.' },
            { image: GraphPlaceholder, name: 'Graph3', description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed iaculis sed risus in ultricies. Mauris vitae malesuada tellus. Ut sed urna dignissim diam viverra efficitur non vel lacus. Aliquam accumsan quis nulla eu fringilla. Vivamus tempus ante non ligula pulvinar, id gravida purus ultrices. Etiam sed auctor neque, et tristique augue. Cras eget lorem diam. In porta bibendum neque, non.' },
          ]}

        />
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
