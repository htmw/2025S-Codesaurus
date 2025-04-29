import React, { useState } from "react";
import { Container, Form, Row, Col, Button } from "react-bootstrap";
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
    if (characters.length >= location.state.maxPlayers) {
      return;
    }
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

      navigate(`/gameSession?story=${storyId}`, { state: { story: storyId } });
    } catch (error) {
      console.error("Error during submission:", error);
      alert("Something went wrong. Please try again.");
    }
  };

  const handleRemoveTab = (index) => {
    if (characters.length <= 1) return; // Prevent removing the last tab

    setCharacters(prev => {
      const updatedCharacters = [...prev];
      updatedCharacters.splice(index, 1); // Remove the character at the specified index
      return updatedCharacters;
    });

    if (activeTab >= characters.length) {
      setActiveTab(characters.length - 1); // Set active tab to the last one if current is removed
    }
  }


  return (
    <Container className="theme-page" fluid>
      <h1 className="theme-header mb-4">Character Creation</h1>
      <div className="d-flex justify-content-center bg-quest-secondary bd-highlight">
        <div class="p-2 bg-quest bd-highlight">
          <div className="button-container d-flex flex-column align-items-center">
            <Button
              variant="warning"
              className="m-1 w-100"
              onClick={handleAddTab}
              disabled={characters.length >= (location?.state?.maxPlayers ? parseInt(location?.state?.maxPlayers) : 4)}
            >
              <Plus size={20} />
            </Button>
          </div>
          <div className="d-flex flex-column align-items-center">
            {/* Map through characters to create buttons for each character */}
            {characters.map((_, index) => (

              <Button
                variant={activeTab === index ? "primary" : "secondary"}
                className="w-100 m-1"
                onClick={() => setActiveTab(index)}
              >
                {`Character ${index + 1}`}
              </Button>

            ))}
          </div>
        </div>
        {<div class="p-3 flex-grow-1 bd-highlight">
          {characters[activeTab] && <Form>
            <Form.Group className="mb-3">
              <Form.Label className="text-warning fw-semibold">Name</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={characters[activeTab]?.name || ""}
                onChange={(e) => handleChange(e, activeTab)}
                placeholder="Your character's name"
                className="bg-dark-subtle border-0"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-warning fw-semibold">Race</Form.Label>
              <Form.Control
                type="text"
                name="race"
                value={characters[activeTab]?.race || ""}
                onChange={(e) => handleChange(e, activeTab)}
                placeholder="Elf, Orc, Human..."
                className="bg-dark-subtle border-0"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="text-warning fw-semibold">Class</Form.Label>
              <Form.Control
                type="text"
                name="class"
                value={characters[activeTab]?.class || ""}
                onChange={(e) => handleChange(e, activeTab)}
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
                value={characters[activeTab]?.background || ""}
                onChange={(e) => handleChange(e, activeTab)}
                placeholder="Brief background or traits"
                className="bg-dark-subtle border-0"
              />
            </Form.Group>

            <Row>
              {Object.entries(characters[activeTab]?.stats || {}).map(([key, value]) => (
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
                    onChange={(e) => handleChange(e, activeTab)}
                    className="bg-dark-subtle border-0"
                  />
                </Col>
              ))}
            </Row>
            <div className="d-flex justify-content-end">
              <Button
                variant="outline-danger"
                className="m-1"
                onClick={() => handleRemoveTab(activeTab)}
                disabled={characters.length <= 1}
              >
                Delete
              </Button>
            </div>
          </Form>}
        </div>}
      </div>
      {/* <div style={{ display: "none" }} className="d-flex flex-column justify-content-center">
        <Tabs
          id="character-tabs"
          activeKey={activeTab}
          onSelect={(k) => {
            if (k === "add") {
              handleAddTab();
            } else if (k === "remove") {
              handleRemoveTab();
            } else {
              setActiveTab(k);
            }
          }}
          className="mb-0"
        >
          {characters.map((char, index) => (
            activeTab === index && (
              <Tab
                eventKey={index}
                title={`Character ${index + 1}`}
                key={index}
              >
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
              </Tab>

            )
          ))}
          <Tab eventKey="add" title="➕" />
        </Tabs>

      </div> */}
      {/* Tab Content Below */}


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
