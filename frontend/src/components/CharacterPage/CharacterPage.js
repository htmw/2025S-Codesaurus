import React, { useState } from "react";
import { Container, Form, Row, Col, Button, Card, Tabs, Tab } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, Dash } from 'react-bootstrap-icons';


const API_BASE_URL = "http://localhost:8081/api";

const CharacterPage = () => {
  const [characters, setCharacters] = useState([
    {
      name: "",
      race: "",
      class: "",
      background: "",
      stats: {
        strength: "",
        dexterity: "",
        constitution: "",
        intelligence: "",
        wisdom: "",
        charisma: "",
      },
    },
  ]);
  const [activeTab, setActiveTab] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e, index) => {
    const { name, value } = e.target;

    setCharacters(prevCharacters => {
      const updatedCharacters = [...prevCharacters];
      const character = updatedCharacters[index];

      if (name in character.stats) {
        character.stats[name] = Math.max(1, Math.min(10, parseInt(value) || ""));
      } else {
        character[name] = value;
      }

      return updatedCharacters;
    });
  };

  const handleAddTab = () => {
    setCharacters(prev => [
      ...prev,
      {
        name: "",
        race: "",
        class: "",
        background: "",
        stats: {
          strength: "",
          dexterity: "",
          constitution: "",
          intelligence: "",
          wisdom: "",
          charisma: "",
        },
      },
    ]);
    setActiveTab(characters.length); // set active to new tab
  };

  const handleSubmit = async () => {
    try {
      const storyId = location.state.story
      if (!storyId) {
        alert("No story selected."); // TODO: toast message
        return;
      }
      
      const gameRes = await fetch(`${API_BASE_URL}/start-game`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ storyId, characters }),
      });

      const gameData = await gameRes.json();

      if (!gameRes.ok) {
        alert(gameData.message || "Failed to start game.");
        return;
      }

      localStorage.setItem("sessionId", gameData.sessionId);

      // STEP 4: Navigate to game session with storyId as query param
      navigate(`/gameSession?story=${storyId}`, { state: { story: storyId } });
    } catch (error) {
      console.error("Error during submission:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleRemoveTab = () => {
    if (characters.length > 1) {
      setCharacters(prev => prev.slice(0, -1)); // Remove last character
      setActiveTab(prev => Math.max(0, prev - 1)); // Move activeTab back if needed
    }
  };
  

  return (
    <Container className="theme-page" fluid>
      <h1 className="theme-header mb-4">Character Creation</h1>
  
      <div className="d-flex align-items-center mb-3">
        {/* Tabs */}
        <div className="flex-grow-1">
          <Tabs
            id="character-tabs"
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k)}
            className="mb-0"
          >
            {characters.map((char, index) => (
              <Tab
                eventKey={index}
                title={`Character ${index + 1}`}
                key={index}
              />
            ))}
          </Tabs>
        </div>
  
        {/* Plus and Minus Buttons next to Tabs */}
        <div className="d-flex ms-2">
          <Button
            variant="outline-warning"
            className="me-2"
            size="sm"
            onClick={handleAddTab}
          >
            <Plus />
          </Button>
  
          <Button
            variant="outline-danger"
            size="sm"
            onClick={handleRemoveTab}
            disabled={characters.length <= 1}
          >
            <Dash />
          </Button>
        </div>
      </div>
  
      {/* Tab Content Below */}
      {characters.map((char, index) => (
        activeTab === index && (
          <Container key={index} className="d-flex justify-content-center align-items-center">
            <Card>
              <Card.Body>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label className="text-warning fw-semibold">Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={char.name}
                      onChange={(e) => handleChange(e, index)}
                      placeholder="Your character's name"
                      className="bg-dark-subtle border-0"
                    />
                  </Form.Group>
  
                  <Form.Group className="mb-3">
                    <Form.Label className="text-warning fw-semibold">Race</Form.Label>
                    <Form.Control
                      type="text"
                      name="race"
                      value={char.race}
                      onChange={(e) => handleChange(e, index)}
                      placeholder="Elf, Orc, Human..."
                      className="bg-dark-subtle border-0"
                    />
                  </Form.Group>
  
                  <Form.Group className="mb-3">
                    <Form.Label className="text-warning fw-semibold">Class</Form.Label>
                    <Form.Control
                      type="text"
                      name="class"
                      value={char.class}
                      onChange={(e) => handleChange(e, index)}
                      placeholder="Wizard, Rogue, Warrior..."
                      className="bg-dark-subtle border-0"
                    />
                  </Form.Group>
  
                  <Form.Group className="mb-4">
                    <Form.Label className="text-warning fw-semibold">Background</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      name="background"
                      value={char.background}
                      onChange={(e) => handleChange(e, index)}
                      placeholder="Brief background or traits"
                      className="bg-dark-subtle border-0"
                    />
                  </Form.Group>
  
                  <Row>
                    {Object.entries(char.stats).map(([key, value]) => (
                      <Col xs={6} md={4} key={key} className="mb-3">
                        <Form.Label className="text-capitalize text-warning fw-semibold">
                          {key} (1-10)
                        </Form.Label>
                        <Form.Control
                          type="number"
                          name={key}
                          min="1"
                          max="10"
                          value={value}
                          onChange={(e) => handleChange(e, index)}
                          className="bg-dark-subtle border-0"
                        />
                      </Col>
                    ))}
                  </Row>
                </Form>
              </Card.Body>
            </Card>
          </Container>
        )
      ))}
  
      {/* Global Continue Button */}
      <div className="d-flex justify-content-end mt-4">
        <Button
          variant="warning"
          className="continue-button"
          onClick={handleSubmit}
        >
          Continue
        </Button>
      </div>
    </Container>
  );   
};

export default CharacterPage;
