import React,{useState} from 'react'
import './Home.css';  // CSS file for styling
import { Normalbtn,Sharebtn } from '../components/Button';
function Home() {
  const [textSearch, setTextSearch] = useState('');

  return (
      <div className="home-container">
            <section className='flex flex-column align-center just-center full-width main-section gap-1 p-3'>
              <h1 className='text-center'>ค้นพบสูตรอาหารแสนอร่อย ทุกวัน ทุกมื้อ</h1>
              <p className='sub-text text-center'>เรารวมสูตรอาหารต่างๆ ที่อร่อยและดีต่อสุขภาพให้คุณได้เลือกสรรค์ รวมถึงแชร์สูตรอาหารส่วนตัวไว้ที่นี้แล้ว</p>
              <div className="flex flex-column align-center gap-1 mt-3">
                <input type="text" id='searchRecipe' value={textSearch} onChange={(e) => setTextSearch(e.target.value)} style={{ width: '50ch' }} className='normal-input round' placeholder='ค้นหาสูตร เช่น ไข่เจียว, หมูกรอบ หรือวัตถุดิบ เช่น หมู, ไก่, แครอท'/>
                <Normalbtn  NavLink={textSearch.trim() ? `/search?q=${encodeURIComponent(textSearch)}` : ""} styleValue='green' text="ค้นหา" />
              </div>
            </section>
            <section className='card-section flex flex-column gap-1 align-center pt-3 pb-3'>
              <h3>สูตรอาหารแนะนำประจำวันนี้</h3>
              <div className="card-container">
                <div className='card'>
                    <p>card appeared here</p>
                </div>
              </div>
              <Normalbtn  NavLink={"/recipes"} styleValue='green' text="เพิ่มเติม" />
            </section>
            <section className='share-container flex flex-column gap-1 align-center p-3'>
              <h3>มีสูตรเด็ดของคุณใช่ไหม?</h3>
              <p className='sub-text'>แชร์ให้เพื่อนๆ ได้ลองทำกันเลย!</p>
              <Sharebtn/>
            </section>
      </div>
  );
}

export default Home;