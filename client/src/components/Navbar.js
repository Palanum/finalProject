import './NavBar.css';
import logo from '../assets/images/rezcook_logo.png';
import { Loginbtn } from './Button';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

function NavBar() {
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY) {
        // Scrolling down
        setShowNavbar(false);
      } else {
        // Scrolling up
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [lastScrollY]);

  return (
    <nav className={`nav-bar ${showNavbar ? 'visible' : 'hidden'}`}>
      <div className="nav-content">
        <h1 className="nav-logo">
          <img src={logo} className="App-logo" alt="logo" />
        </h1>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>
          <li><Link to="/recipes">Recipes</Link></li>
          <li><Link to="/profile">Profile</Link></li>
          <li><Loginbtn /></li>
        </ul>
      </div>
    </nav>
  );
}

export default NavBar;
