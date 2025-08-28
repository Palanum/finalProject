import './Button.css';
import { useNavigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'

/* import all the icons in Free Solid, Free Regular, and Brands styles */
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)

function Loginbtn() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <button
      className='btn green-btn'
      onClick={() => navigate('/login', { state: { from: location } })}
    >
      login <FontAwesomeIcon icon="fa-solid fa-arrow-right-to-bracket" />
    </button>
  );
}

function Sharebtn() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  // console.log('Current location in Sharebtn:', location);
  const handleShare = () => {
    if (user) {
      navigate('/share');
    } else {
      navigate('/login', { state: { from: { pathname: '/share' } } });
    }
  };

  return (
    <button className='btn white-btn' onClick={handleShare}>
      แชร์สูตรของฉัน +
    </button>
  );
}

function Normalbtn({ NavLink, styleValue, text }) {
  const stylebtn = styleValue === 'green' ? 'green-btn' : 'white-btn';
  const navigate = useNavigate();
  const handleClick = () => {
    if (NavLink) {
      navigate(NavLink);
    }
  };
  return (
    <button className={`btn ${stylebtn}`} onClick={() => handleClick}>
      {text}
    </button>
  );
}

export { Loginbtn, Sharebtn, Normalbtn };