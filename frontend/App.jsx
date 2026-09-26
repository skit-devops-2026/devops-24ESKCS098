import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import BucketList from './pages/BucketList';
import WallOfFame from './pages/WallOfFame';

function App() {
  return (
    <div className="bg-background text-on-background font-hanken min-h-screen">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bucket-list" element={<BucketList />} />
        <Route path="/wall-of-fame" element={<WallOfFame />} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
