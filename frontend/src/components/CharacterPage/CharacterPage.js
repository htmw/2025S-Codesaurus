import React, { useState } from "react";
import { Container, Form, Row, Col, Button, Card } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import 'bootstrap/dist/css/bootstrap.min.css';

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

  const handleSubmit = () => {
    sessionStorage.setItem("selectedCharacter", JSON.stringify(character));
    navigate("/gameSession");
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
      >
        Continue
      </Button>
    </Container>
  );
};

export default CharacterPage;
