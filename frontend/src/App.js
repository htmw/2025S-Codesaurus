import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Container } from 'react-bootstrap';
import Footer from './components/Footer/Footer';
import HomePage from "./components/HomePage/HomePage";
import ThemePage from "./components/ThemePage/ThemePage";
import StoryPage from "./components/StoryPage/StoryPage";
import GameSession from "./components/GameSessionPage/GameSessionPage"
import ChatWindow from './components/ChatWindow/chat-window';
import './App.css';

function App() {

  return (
    <Router>
      <div className="app-wrapper">

        {/* Home Screen */}
        <Container className="home-screen" fluid>
          <Routes>
            {/* Default Route */}

            <Route path="/" element={<HomePage />} />

            <Route path="/themes" element={<ThemePage />} />
            <Route path="/stories" element={<StoryPage />} />
            <Route path="/gameSession" element={<GameSession />} />
            <Route path="/chatwindow" element={<ChatWindow />} />

          </Routes>
        </Container>

        {/* Footer */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
