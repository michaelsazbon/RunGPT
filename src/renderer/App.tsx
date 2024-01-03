import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import './App.css';
import Home from './components/Home';
import Settings from './components/Settings';
import Connections from './components/Connections';
import Header from './components/Header';
import ChatGPT from './components/ChatGPT';

import "bootstrap/dist/js/bootstrap.bundle.min";

export default function App() {
  return (
    <Router>
      <div>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/gpttask/:id?" element={<ChatGPT />} />
          <Route path="/setting" element={<Settings />} />
        </Routes>
      </div>
    </Router>
  );
}
