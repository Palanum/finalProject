import './button.css';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'

/* import all the icons in Free Solid, Free Regular, and Brands styles */
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)

function Loginbtn() {
    const navigate = useNavigate();
  return (
    <button className='btn green-btn' onClick={() => navigate('/login')}>
        login <FontAwesomeIcon icon="fa-solid fa-arrow-right-to-bracket" />
    </button>
  );
}
function Sharebtn() {
    const navigate = useNavigate();
  return (
    <button className='btn white-btn' onClick={() => navigate('/share')}>
        แชร์สูตรของฉัน +
    </button>
  );
}
function Normalbtn({ NavLink, styleValue, text }) {
  const navigate = useNavigate();
  const stylebtn = styleValue === 'green' ? 'green-btn' : 'white-btn';

  return (
    <button className={`btn ${stylebtn}`} onClick={() => navigate(NavLink)}>
      {text}
    </button>
  );
}

export { Loginbtn, Sharebtn, Normalbtn };