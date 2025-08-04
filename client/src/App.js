import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'

/* import all the icons in Free Solid, Free Regular, and Brands styles */
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

import NavBar from './components/Navbar';

import './App.css';

library.add(fas, far, fab)

function App() {
  const [apiMessage, setApiMessage] = useState("");

  useEffect(() => {
    fetch('/api/message')
      .then(res => res.json())
      .then(data => setApiMessage(data.msg))
      .catch(err => console.error("Error fetching:", err));
  }, []);

  return (
    <div className="App">
      <NavBar />
      <header className="App-header">
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <p>
          {apiMessage ? apiMessage : "Loading..."}
          <FontAwesomeIcon icon="fa-solid fa-house" />
        </p>
        
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
