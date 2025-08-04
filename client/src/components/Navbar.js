import './NavBar.css';
import logo from '../assets/images/rezcook_logo.png';
import { Loginbtn } from './Button';

import { Link} from 'react-router-dom';
function NavBar() {
  return (
      <nav className="nav-bar">
        <div className="nav-content">
          <h1 className="nav-logo"><img src={logo} className="App-logo" alt="logo" /></h1>
          <ul className="nav-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/recipes">Recipes</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><Loginbtn/></li>
          </ul>
      </div>
    </nav>
  );
}

export default NavBar;
