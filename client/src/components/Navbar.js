import './NavBar.css';
import logo from '../assets/images/rezcook_logo.png';
import { Loginbtn } from './Button';
function NavBar() {
  return (
    <nav className="nav-bar">
      <div className="nav-content">
        <h1 className="nav-logo"><img src={logo} className="App-logo" alt="logo" /></h1>
        <ul className="nav-links">
          <li><a href="/">Home</a></li>
          <li><a href="/recipes">Recipes</a></li>
          <li><a href="/profile">Profile</a></li>
          <li><Loginbtn/></li>
        </ul>
      </div>
    </nav>
  );
}

export default NavBar;
