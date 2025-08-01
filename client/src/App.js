import { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

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
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <p>
          {apiMessage ? apiMessage : "Loading..."}
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
