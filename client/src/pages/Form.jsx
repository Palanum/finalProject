import React, { useState, useContext } from 'react'
import './Form.css'
import '../components/Button.css'
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const from = location.state?.from?.pathname || "/";
  // console.log('Redirecting to:', from);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      // console.log('Response status:', res.status);

      const text = await res.text();  // read raw response text first
      // console.log('Raw response:', text);

      if (!text) {
        setError('Empty response from server');
        return;
      }

      let data;
      try {
        data = JSON.parse(text);  // parse only if text exists
      } catch {
        setError('Invalid JSON response from server');
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      login(data.user);
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login fetch error:', err);
      setError('Network error');
    }
  };


  return (
    <div className="login-form-section">
      <form onSubmit={handleSubmit} className="flex flex-column gap-1 form">
        <h2 className="heading">เข้าสู่ระบบ</h2>

        <div className="flex flex-column gap-1">
          <label htmlFor="username">ชื่อผู้ใช้</label>
          <input
            type="text"
            id="username"
            placeholder="ชื่อผู้ใช้"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        <div className="flex flex-column gap-1">
          <label htmlFor="password">รหัสผ่าน</label>
          <input
            type="password"
            id="password"
            placeholder="รหัสผ่าน"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="flex just-center">
          <button type="submit" className="btn green-btn">
            เข้าสู่ระบบ
          </button>
        </div>

        <div className="flex gap-1 just-center align-center">
          <p>ยังไม่มีบัญชีใช่ไหม</p>
          <Link to="/register">สมัครสมาชิก</Link>
        </div>
      </form>
    </div>
  );
}

function Register() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {

        login(data.user);
        // Registration successful - navigate or do something
        navigate('/');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <div className="login-form-section">
      <form className="flex flex-column gap-2 form" onSubmit={handleSubmit}>
        <h2 className="heading text-center">สมัครสมาชิก</h2>

        <div className="flex align-center gap-1">
          <label className='flex-1' htmlFor="username">ชื่อผู้ใช้</label>
          <input
            type="text"
            id="username"
            placeholder="ชื่อผู้ใช้"
            value={form.username}
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex align-center gap-1">
          <label className='flex-1' htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
            placeholder="E-mail"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex align-center gap-1">
          <label className='flex-1' htmlFor="password">รหัสผ่าน</label>
          <input
            type="password"
            id="password"
            placeholder="รหัสผ่าน"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>

        <div className="flex align-center gap-1">
          <label className='flex-1' htmlFor="confirmPassword">ยืนยันรหัสผ่าน</label>
          <input
            type="password"
            id="confirmPassword"
            placeholder="ยืนยันรหัสผ่าน"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="flex just-center">
          <button type="submit" className="btn green-btn">
            สมัครสมาชิก
          </button>
        </div>

        <div className="flex gap-1 just-center align-center">
          <p>มีบัญชีแล้วใช่ไหม</p>
          <Link to="/login">เข้าสู่ระบบ</Link>
        </div>
      </form>
    </div>
  );
}

function Changepass() {
  return (
    <div className="change-pass-form-section">
      <form className="flex flex-column gap-1 form">
        <h2 className="heading">เปลี่ยนรหัสผ่าน</h2>
        <div className="flex flex-column gap-1">
          <label htmlFor="oldPassword">รหัสผ่านเก่า</label>
          <input
            type="password"
            id="oldPassword"
            placeholder="รหัสผ่านเก่า"
            required
          />
        </div>
        <div className="flex flex-column gap-1">
          <label htmlFor="newPassword">รหัสผ่านใหม่</label>
          <input
            type="password"
            id="newPassword"
            placeholder="รหัสผ่านใหม่"
            required
          />
        </div>

        <div className="flex just-center">
          <button type="submit" className="btn green-btn">
            เปลี่ยนรหัสผ่าน
          </button>
        </div>
      </form>
    </div>
  );
}

export { Login, Register, Changepass } 