import React from 'react'
import './Form.css'
import { Normalbtn } from "../components/Button";
import { Link } from 'react-router-dom';
function Login() {
  return (
    <div className='login-form-section'>
        <form className='flex flex-column gap-1 form'>
            <h2 className='heading'>เข้าสู่ระบบ</h2>
            <div className="flex flex-column gap-1">
                <label htmlFor="username">ชื่อผู้ใช้</label>
                <input type="text" id='username' placeholder='ชื่อผู้ใช้' required/>
            </div>
            <div className="flex flex-column gap-1">
                <label htmlFor="password">รหัสผ่าน</label>
                <input type="password" id="password" placeholder='รหัสผ่าน' required/>
            </div>
            <div className="flex just-center">
              <Normalbtn  NavLink="/login" styleValue="green" text="เข้าสู่ระบบ" />
            </div>
            <div className="flex gap-1 just-center">
                <p>ยังไม่มีบัญชีใช่ไหม</p>
                <Link to="/register">สมัครสมาชิก</Link>
            </div>
        </form>
    </div>
  )
}
function Register() {
  return (
    <div className='login-form-section'>
        <form className='flex flex-column gap-1 form'>
            <h2 className='heading'>สมัครสมาชิก</h2>
            <div className="flex flex-column gap-1">
                <label htmlFor="username">ชื่อผู้ใช้</label>
                <input type="text" id='username' placeholder='ชื่อผู้ใช้' required/>
            </div>
            <div className="flex flex-column gap-1">
                <label htmlFor="eMail">E-mail</label>
                <input type="e-mail" id='eMail' placeholder='E-mail'required/>
            </div>
            <div className="flex flex-column gap-1">
                <label htmlFor="password">รหัสผ่าน</label>
                <input type="password" id="password" placeholder='รหัสผ่าน' required/>
                <input type="password" id="password" placeholder='ยืนยันรหัสผ่าน'required/>
            </div>
            <div className="flex just-center">
              <Normalbtn  NavLink={"/login"} styleValue='green' text="สมัครสมาชิก" />
            </div>
            <div className="flex gap-1 just-center">
                <p>มีบัญชีแล้วใช่ไหม</p>
                <Link to="/login">เข้าสู่ระบบ</Link>
            </div>
        </form>
    </div>
  )
}
export {Login,Register} 