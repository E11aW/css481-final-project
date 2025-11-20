import './home.scss';
import { MaxWidth } from '../../components/MaxWidth/MaxWidth';
import { TextImage } from '../../components/TextImage/TextImage';
import { IcebergTitle } from '../../components/IcebergTitle/IcebergTitle';
import { SealRoller } from '../../components/SealRoller/SealRoller';
import { Button } from '../../components/Button/Button';
import D3HeatMap from '../../components/D3HeatMap/D3HeatMap';
import GroupPhoto from '../../assets/Home/group-photo.jpg';
import pointsJson from '../../back-end/antarctica_points.json'
import MapofAntartica from '../../assets/Home/Map-of-Antarctica.png'

export const Homepage = () => {

  const pts = pointsJson.points.map(p => ({ nx: p.nx, ny: p.ny, value: p.value }));

  return (
    <main className="homepage">
      <MaxWidth>
        <IcebergTitle
          title='Tip of the Iceberg'
          subtitle='Going deeper on the impacts of global warming'
        />
        <h2 className='game-subheader'>Game</h2>
        <SealRoller />
        <h2 className='subheader-need-padding'>Data</h2>
        <h3 className='heat-map-subheader'>Antarctica Heat Map</h3>
        <div className="mw-900">
          <D3HeatMap
            imageSrc={MapofAntartica}
            points={pts}
            normalized={true}
            cellSize={28}
          />
          <Button className='button' buttonLink='/data' buttonText='More Data!' />
        </div>
        <h2 className='about-us-subheader'>About Us</h2>
        <TextImage
          text='We are a small team of 4 developers working to spread awareness about climate change and its impacts on arctic habitats. We all attend the University of Washington Bothell and completed this website as our final project for a Web Developing class. Our goal was to improve our frontend skills, connecting that with backend data to create a website that is visually interesting while also presenting the important data.'
          imageSource={GroupPhoto}
          imageAlt='Development Team'
          hasButton={true}
          buttonText='Learn More!'
          buttonLink='/about-us'
        />
      </MaxWidth>
    </main>
  );
}
