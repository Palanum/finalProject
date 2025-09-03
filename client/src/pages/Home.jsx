import React, { useState, useEffect } from 'react'
import './Home.css';  // CSS file for styling
import { Normalbtn, Sharebtn } from '../components/Button';
import { Row, Col, Card, Tag } from "antd";
import axios from 'axios';

function Home() {
  const [textSearch, setTextSearch] = useState('');
  const { Meta } = Card;
  const [recipes, setRecipes] = useState([]);

  useEffect(() => {
    fetch("/api/home")
      .then((res) => res.json())
      .then((data) => setRecipes(data))
      .catch((err) => console.error("Error fetching recipes:", err));
  }, []);
  return (
    <div className="home-container">
      <section className='flex flex-column align-center just-center full-width main-section gap-1 p-3'>
        <h1 className='text-center'>ค้นพบสูตรอาหารแสนอร่อย ทุกวัน ทุกมื้อ</h1>
        <p className='sub-text text-center'>เรารวมสูตรอาหารต่างๆ ที่อร่อยและดีต่อสุขภาพให้คุณได้เลือกสรรค์ รวมถึงแชร์สูตรอาหารส่วนตัวไว้ที่นี้แล้ว</p>
        <div className="flex flex-column align-center gap-1 mt-3">
          <input type="text" id='searchRecipe' value={textSearch} onChange={(e) => setTextSearch(e.target.value)} style={{ width: '50ch' }} className='normal-input round' placeholder='ค้นหาสูตร เช่น ไข่เจียว, หมูกรอบ หรือวัตถุดิบ เช่น หมู, ไก่, แครอท' />
          <Normalbtn NavLink={textSearch.trim() ? `/search?q=${encodeURIComponent(textSearch)}` : ""} styleValue='green' text="ค้นหา" />
        </div>
      </section>
      <section className='card-section flex flex-column gap-1 align-center pt-3 pb-3'>
        <h3>สูตรอาหารแนะนำประจำวันนี้</h3>
        <Row gutter={[16, 16]} className='full-width p-3' justify="center">
          {recipes.map((recipe) => (
            <Col
              key={recipe.RecipeID}
              xs={12}  // 2 per row on extra-small screens
              sm={12}  // 2 per row on small screens
              md={8}    // 3 per row on medium+
              lg={6}    // 4 columns on large desktop

            >
              <div className="full-height flex">

                <Card
                  hoverable
                  className="flex flex-column flex-1"
                  cover={
                    <img
                      alt={recipe.Title}
                      src={recipe.ImageURL || "/placeholder.png"}
                      className='card-cover'
                    />
                  }
                  onClick={() =>
                    (window.location.href = `/recipes/${recipe.RecipeID}`)
                  }
                >
                  <Meta
                    title={<span className="main-text">{recipe.Title}</span>}
                    description={`เวลา: ${recipe.time || "N/A"} นาที`}
                  />
                  <div className='card-tags-container flex flex-wrap gap-1 mt-2'>
                    {recipe.categories.map((cat, i) => (
                      <Tag key={i} bordered={false} className='card-tag green-tag'>
                        {cat}
                      </Tag>
                    ))}
                  </div>
                  <div className='sub-text mt-2'>
                    <strong className='bold-text'>ชื่อผู้โพส :</strong> {recipe.user?.username}
                  </div>
                </Card>
              </div>
            </Col>
          ))}
        </Row>
        <Normalbtn NavLink={"/recipes"} styleValue='green' text="เพิ่มเติม" />
      </section>
      <section className='share-container flex flex-column gap-1 align-center p-3'>
        <h3>มีสูตรเด็ดของคุณใช่ไหม?</h3>
        <p className='sub-text'>แชร์ให้เพื่อนๆ ได้ลองทำกันเลย!</p>
        <Sharebtn />
      </section>
    </div>
  );
}

export default Home;