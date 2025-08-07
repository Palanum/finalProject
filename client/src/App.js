
import { Routes, Route } from 'react-router-dom';

import NavBar from './components/Navbar';
import Footer from './components/Footer';
import './App.css';
import Home from './pages/Home';
import { Login, Register } from './pages/Form'
import Profile from "./pages/Profile";
import Search from './pages/Search';

function App() {
  const isLoggedIn = true;
  return (
    <div className="App">
      <NavBar isLoggedIn={isLoggedIn}/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile/> }/>
        <Route path="/login" element={<Login/>} />
        <Route path="/register" element={<Register/>} />
        <Route path="/recipes" element={<p>seracj recipes page</p>} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<p>404 Not Found</p>} />
      </Routes>
      <Footer/>
    </div>
  );
}

export default App;
