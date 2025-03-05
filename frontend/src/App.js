import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Container } from 'react-bootstrap';
import Footer from './components/Footer/Footer';
import HomePage from "./components/HomePage/HomePage";
import ThemePage from "./components/ThemePage/ThemePage";
import StoryPage from "./components/StoryPage/StoryPage";



import './App.css';

function App() {

  return (
    <Router>
      <div className="app-wrapper">

        {/* Home Screen */}
        <Container className="home-screen" fluid>
          <Routes>
            Default Route

            <Route path="/" element={ <HomePage /> }/>
            
            <Route path="/theme-selection" element={<ThemePage />} />
            <Route path="/storie-selection" element={<StoryPage />} />

          </Routes>
        </Container>

        {/* Footer */}
        <Footer />
      </div>
    </Router>
  );
}

export default App;
