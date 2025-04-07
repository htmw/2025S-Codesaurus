import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Container } from 'react-bootstrap';
import Footer from './components/Footer/Footer';
import HomePage from "./components/HomePage/HomePage";
import ThemePage from "./components/ThemePage/ThemePage";
import StoryPage from "./components/StoryPage/StoryPage";
import GameSession from "./components/GameSessionPage/GameSessionPage"
import ChatWindow from './components/ChatWindow/chat-window';
import CharacterPage from "./components/CharacterPage/CharacterPage";
import TextToSpeechPage from "./components/tts/TextToSpechPage.js";
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {

  return (
    <Router>
      <div className="app-wrapper">

        {/* Home Screen */}
        <Container className="home-screen p-0" fluid>
          <Routes>
            {/* Default Route */}

            <Route path="/" element={<HomePage />} />

            <Route path="/themes" element={<ThemePage />} />
            <Route path="/stories" element={<StoryPage />} />
            <Route path="/character" element={<CharacterPage />} />
            <Route path="/gameSession" element={<GameSession />} />
            <Route path="/chatwindow" element={<ChatWindow />} />
            <Route path="/tts" element={<TextToSpeechPage />} />

          </Routes>
        </Container>

        {/* Footer */}
        {/* <Footer /> */}
      </div>
    </Router>
  );
}

export default App;
