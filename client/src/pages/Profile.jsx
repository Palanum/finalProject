import React ,{ useState, useContext, useEffect} from 'react'
import { useLocation } from 'react-router-dom';
import './Profile.css'
import { AuthContext } from '../context/AuthContext';
import { Changepass } from "./Form";
const Profile = () => {
    const { user } = useContext(AuthContext);
    const [showChangePass, setShowChangePass] = useState(false);
     const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace('#', ''));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location]);

  return (
    <div className="flex">
        <div className='profile-sidebar'>
            <div className='sidebar-container po-stick'>
                <ul className='flex flex-column gap-2'>
                    <li><a href="#profile">โปรไฟล์</a></li>
                    <li><a href="#favorite">รายการโปรด</a></li>
                    <li><a href="#myRecipe">สูตรของฉัน</a></li>
                    <li><a href="#alarm">การแจ้งเตือน</a></li>
                </ul>
            </div>
        </div>
        <div className='profile-container'>
            <section id='profile' className='profile-section'>
                <h3>โปรไฟล์ของฉัน</h3>
                {user ? (
                <div className="profile-dashboard">
                    <div className="profile-info">
                    <p><strong>ชื่อผู้ใช้:</strong> {user.username}</p>
                    <p><strong>อีเมล:</strong> {user.email}</p>
                    </div>
                    <button
                        className="btn"
                        onClick={() => setShowChangePass(!showChangePass)}
                    >
                        เปลี่ยนรหัสผ่าน
                    </button>
                    {showChangePass && (
                        <div className="changepass-form-wrapper">
                        <Changepass />
                        </div>
                    )}
                </div>
                ) : (
                <p>กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์ของคุณ</p>
                )}
            </section>
            <section id='favorite' className='favorite-section'>
                <h1>favorite shown here</h1>
            </section>
            <section id='myRecipe' className='myRecipe-section'>
                <h1>myRecipe shown here</h1>
            </section>
            <section id='alarm' className='alarm-section'>
                <h1>alarm shown here</h1>
            </section>
        </div>
    </div>
  )
}

export default Profile