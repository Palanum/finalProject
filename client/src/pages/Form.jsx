import React, { useState, useContext } from 'react'
import './Form.css'
import '../components/button.css'
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

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

    console.log('Response status:', res.status);

    const text = await res.text();  // read raw response text first
    console.log('Raw response:', text);

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
    navigate('/profile');
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

        {error && <p style={{color: 'red'}}>{error}</p>}

        <div className="flex just-center">
          <button type="submit" className="btn green-btn">
            เข้าสู่ระบบ
          </button>
        </div>
          
        <div className="flex gap-1 just-center">
          <p>ยังไม่มีบัญชีใช่ไหม</p>
          <Link to="/register">สมัครสมาชิก</Link>
        </div>
      </form>
    </div>
  );
}
function Register() {
  const navigate = useNavigate();

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
          nickname: form.username,  // or add nickname field if you want
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Registration failed');
      } else {
        // Registration successful - navigate or do something
        navigate('/login');
      }
    } catch (err) {
      setError('Server error');
    }
  };

  return (
    <div className="login-form-section">
      <form className="flex flex-column gap-1 form" onSubmit={handleSubmit}>
        <h2 className="heading">สมัครสมาชิก</h2>

        <div className="flex flex-column gap-1">
          <label htmlFor="username">ชื่อผู้ใช้</label>
          <input
            type="text"
            id="username"
            placeholder="ชื่อผู้ใช้"
            value={form.username}
            onChange={() => handleChange}
            required
          />
        </div>

        <div className="flex flex-column gap-1">
          <label htmlFor="email">E-mail</label>
          <input
            type="email"
            id="email"
            placeholder="E-mail"
            value={form.email}
            onChange={()=>handleChange}
            required
          />
        </div>

        <div className="flex flex-column gap-1">
          <label htmlFor="password">รหัสผ่าน</label>
          <input
            type="password"
            id="password"
            placeholder="รหัสผ่าน"
            value={form.password}
            onChange={()=>handleChange}
            required
          />
        </div>

        <div className="flex flex-column gap-1">
          <label htmlFor="confirmPassword">ยืนยันรหัสผ่าน</label>
          <input
            type="password"
            id="confirmPassword"
            placeholder="ยืนยันรหัสผ่าน"
            value={form.confirmPassword}
            onChange={()=>handleChange}
            required
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="flex just-center">
          <button type="submit" className="btn green-btn">
            สมัครสมาชิก
          </button>
        </div>

        <div className="flex gap-1 just-center">
          <p>มีบัญชีแล้วใช่ไหม</p>
          <Link to="/login">เข้าสู่ระบบ</Link>
        </div>
      </form>
    </div>
  );
}
export {Login,Register} 