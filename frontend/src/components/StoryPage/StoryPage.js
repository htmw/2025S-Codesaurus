import { useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import "./StoryPage.css";
import NPCView from "../NPCView/NPCView";

const StoryPage = () => {
    const [stories, setStories] = useState([]);
    const [selectedStory, setSelectedStory] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    const API_BASE_URL = "http://localhost:8081/api";

    const queryParams = new URLSearchParams(location.search);
    const themeId = queryParams.get("theme");

    useEffect(() => {
        if (themeId) {
            fetch(`${API_BASE_URL}/stories`)
                .then((res) => res.json())
                .then((data) => {
                    console.log("Fetched stories:", data);
                    setStories(data);
                })
                .catch((error) => console.error("Error fetching stories:", error));
        }
    }, [themeId]);

    const filteredStories = stories.filter(story => story.themeId._id === themeId);

    const handleStorySelect = (story) => {
        setSelectedStory(prevStory => prevStory?._id === story._id ? null : story);
    };

    const handleContinue = () => {
        if (selectedStory) {
            navigate("/character", { state: { story: selectedStory._id } });
        }
    };

    return (
        <Container className="theme-page" fluid>
            <h1 className="theme-header">Select a Story</h1>

            <Container fluid>
                <Row className="d-flex flex-lg-row flex-column-reverse justify-content-between">
                    {/* Story Cards Column */}
                    <Col lg={9}>
                        <Row className="theme-container">
                            {filteredStories.map((story) => (
                                <Col key={story._id} xs={12} sm={6} md={6} lg={4}>
                                    <Card
                                        className={`story-card ${selectedStory?._id === story._id ? "selected" : ""}`}
                                        onClick={() => handleStorySelect(story)}
                                    >
                                        <Card.Body>
                                            <Card.Title>{story.title}</Card.Title>
                                            <Card.Text>{story.description}</Card.Text>
                                            <p><i>Duration: {story.duration} minutes</i></p>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))}
                        </Row>
                    </Col>

                    {/* NPC Column */}
                    <Col lg={3}>
                        {selectedStory?.npcIds && <NPCView npcs={selectedStory.npcIds} />}
                    </Col>
                </Row>
            </Container>


            <Button
                variant="warning"
                className="continue-button"
                onClick={handleContinue}
                disabled={!selectedStory}
            >
                Continue
            </Button>
        </Container>
    );
};

export default StoryPage;
