import React from 'react'
import './Home.css';  // CSS file for styling

function Home() {
  return (
      <div className="home-container">
            <section className='flex flex-column align-center just-center full-width main-section'>
              <h2>Welcome to Rezcooking!</h2>
              <p className='sub-text'>Explore delicious recipes and share your own.</p>
            </section>
      </div>
  );
}

export default Home;