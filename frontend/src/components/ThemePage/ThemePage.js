import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button } from "react-bootstrap"; // Importing react-bootstrap components
import "./ThemePage.css"; // Ensure this file exists


const ThemePage = () => {
    const [themes, setThemes] = useState([]);
    const [selectedTheme, setSelectedTheme] = useState(null);
    const navigate = useNavigate();

    const API_BASE_URL = "http://localhost:8081/api";
  
    // Fetch themes from the backend when the component mounts
    useEffect(() => {
        fetch(`${API_BASE_URL}/themes`)
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched themes:", data);
        setThemes(data);  // Set the fetched themes to state
      })
      .catch((error) => console.error("Error fetching themes:", error));
  }, []);
  
    // Handle theme selection
    const handleThemeSelect = (theme) => {
      setSelectedTheme(theme);
    };
  
    // Navigate to the stories page with the selected theme
    const handleContinue = () => {
      if (selectedTheme) {
        navigate(`/stories?theme=${selectedTheme._id}`);
      }
    };
  
    return (
      <Container className="theme-page" fluid>
        {/* Header */}
        <h1 className="theme-header">Choose Your Adventure</h1>


        {/* Theme Options with responsive grid layout */}
      <Container fluid>
        <Row className="theme-container">
          {themes.map((theme) => (
            <Col key={theme._id} xs={12} sm={6} md={4} lg={3} className="theme-col">
              <div
                className={`theme-option ${selectedTheme?._id === theme._id ? "selected" : ""}`}
                onClick={() => handleThemeSelect(theme)}
              >
                <img
                  src={`/images/themes/${theme.title.toLowerCase()}.png`}
                  alt={theme.title}
                  className="theme-image"
                />
                <p>{theme.title}</p>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
  
      <Button variant="primary" className="continue-button"
        onClick={handleContinue} disabled={!selectedTheme} >
        Continue
      </Button>

      </Container>
    );
  };
  

export default ThemePage;
