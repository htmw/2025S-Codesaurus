import React, { useState } from "react";
import { Container, Form, Row, Col, Button, Card } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";

const API_BASE_URL = "http://localhost:8081/api";

const CharacterPage = () => {
  const [character, setCharacter] = useState({
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
  });
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name in character.stats) {
      const numValue = Math.max(1, Math.min(10, parseInt(value) || ""));
      setCharacter((prev) => ({
        ...prev,
        stats: { ...prev.stats, [name]: numValue },
      }));
    } else {
      setCharacter((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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
        body: JSON.stringify({ storyId, character }),
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


  return (
    <Container className="theme-page" fluid>
      <h1 className="theme-header mb-4">Character Creation</h1>
      <Container className="d-flex justify-content-center align-items-center">
        <Card>
          <Card.Body>
            <Form>
              <Form.Group className="mb-3">
                <Form.Label className="text-warning fw-semibold">Name</Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  value={character.name}
                  onChange={handleChange}
                  placeholder="Your character's name"
                  className="bg-dark-subtle border-0"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="text-warning fw-semibold">Race</Form.Label>
                <Form.Control
                  type="text"
                  name="race"
                  value={character.race}
                  onChange={handleChange}
                  placeholder="Elf, Orc, Human..."
                  className="bg-dark-subtle border-0"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="text-warning fw-semibold">Class</Form.Label>
                <Form.Control
                  type="text"
                  name="class"
                  value={character.class}
                  onChange={handleChange}
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
                  value={character.background}
                  onChange={handleChange}
                  placeholder="Brief background or traits"
                  className="bg-dark-subtle border-0"
                />
              </Form.Group>

              {/* <h5 className="text-warning fw-bold mb-3">Stats (1–10)</h5> */}
              <Row>
                {Object.entries(character.stats).map(([key, value]) => (
                  <Col xs={6} md={4} key={key} className="mb-3">
                    <Form.Label className="text-capitalize text-warning fw-semibold">{key} (1-10)</Form.Label>
                    <Form.Control
                      type="number"
                      name={key}
                      min="1"
                      max="10"
                      value={value}
                      onChange={handleChange}
                      className="bg-dark-subtle border-0"
                    />
                  </Col>
                ))}
              </Row>

              <div className="d-flex justify-content-end mt-4">
              </div>
            </Form>
          </Card.Body>
        </Card>
      </Container>
      <Button
        variant="warning"
        className="continue-button"
        onClick={() => handleSubmit()}
      >
        Continue
      </Button>
    </Container>
  );
};

export default CharacterPage;
