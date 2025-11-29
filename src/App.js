import './App.scss';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout/Layout';
/* Importing pages */
import { AboutUs } from './pages/about-us/about-us';
import  Data  from "./pages/data/data";
import { Game } from './pages/game/game';
import  Homepage  from './pages/homepage/home';
import { ScrollToTop } from './components/ScrollToTop/ScrollToTop'

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Layout />} >
          <Route index element={<Homepage />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/data" element={<Data />} />
          <Route path="/game" element={<Game />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;