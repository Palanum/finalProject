
import { Routes, Route } from 'react-router-dom';

import NavBar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';
import Home from './pages/Home';



function App() {
  return (
    <div className="App">
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/api/message" element={<p>API Message</p>} />
        <Route path="/api/health" element={<p>API Health</p>} />
        <Route path="*" element={<p>404 Not Found</p>} />
      </Routes>
      <Footer/>
    </div>
  );
}

export default App;
