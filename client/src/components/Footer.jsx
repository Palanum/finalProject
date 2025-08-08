import './Footer.css'
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'

/* import all the icons in Free Solid, Free Regular, and Brands styles */
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)

function Footer() {
  return (
    <div className="flex just-center align-center foot-container">
      <span className='credit-text'>© 2025 Rezcooking | ค้นพบสูตรอาหารแสนอร่อย ทุกวัน ทุกมื้อ</span>
    </div>
  );
}

export default Footer;