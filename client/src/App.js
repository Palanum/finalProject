import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'

import { useNavigate } from 'react-router-dom';
/* import all the icons in Free Solid, Free Regular, and Brands styles */
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'



import NavBar from './components/Navbar';
import { Routes, Route, useLocation } from 'react-router-dom';
import './App.css';

library.add(fas, far, fab)

function App() {
  return (
    <div className="App">
      <NavBar />
      <Routes>
        <Route exact path="/api" element={<p>API Home</p>} />
        <Route exact path="/api/message" element={<p>API Message</p>} />
        <Route exact path="/api/health" element={<p>API Health</p>} />
      </Routes>
    </div>
  );
}

export default App;
