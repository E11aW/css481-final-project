import './home.scss';
import { MaxWidth } from '../../components/MaxWidth/MaxWidth';

export const Homepage = () => {
  return (
    <main className="homepage">
      <MaxWidth>
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h1>🎉 Homepage is running!</h1>
          <p>If you see this, your app is working correctly.</p>
          </div>
        </MaxWidth>
    </main>
  );
}
