import './NavBar.css';
import logo from '../assets/images/rezcook_logo.png';
import { Loginbtn,Sharebtn } from './Button';
import { Link } from 'react-router-dom';
import { useEffect, useState, useRef, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'

/* import all the icons in Free Solid, Free Regular, and Brands styles */
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)

export default function NavBar({ isLoggedIn}) {
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > 64 && currentScrollY > lastScrollY) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <nav className={`nav-bar ${showNavbar ? 'visible' : 'hidden'}`}>
  <div className="nav-content">
    {/* Left group */}
    <ul className="nav-group nav-left">
      <li><Link to="/">หน้าหลัก</Link></li>
      <li><Link to="/recipes">ค้นหา <FontAwesomeIcon icon="fa-solid fa-magnifying-glass" /></Link></li>
    </ul>

    {/* Center logo */}
    <div className="flex-1 logo-container">
      <Link to="/">
        <div className="nav-logo">
            <img src={logo} className="App-logo" alt="logo" />
        </div>
      </Link>
    </div>
    {/* Right group */}
    <ul className="nav-group nav-right">
      <li><Sharebtn /></li>
      {isLoggedIn ? (
        <>
          <li><Link to="/profile#alarm"><FontAwesomeIcon icon="fa-solid fa-bell" /></Link></li>
          <li><ProfileMenu/></li>
        </>
      ) : (
        <li><Loginbtn /></li>
      )}
    </ul>
  </div>
</nav>
  );
}

function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();
  const { logout } = useContext(AuthContext);
  const toggleMenu = () => setOpen(!open);

  // Close dropdown if clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="profile-menu-wrapper" ref={menuRef}>
      <button onClick={toggleMenu} className="profile-button">
        <FontAwesomeIcon icon="fa-solid fa-user" />
      </button>

      {open && (
        <ul className="profile-dropdown">
          <li><Link to="/profile#profile">My Profile</Link></li>
          <li><Link to="/profile#favorite">Favorite</Link></li>
          <li><Link to="/profile#myRecipe">My Recipes</Link></li>
          <li><Link to="/profile#alarm">Notifications</Link></li>
          <li><Link to="/" onClick={() => { logout() }}>Log out</Link></li>
        </ul>
      )}
    </div>
  );
}
