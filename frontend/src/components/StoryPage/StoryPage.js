import { useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, Card } from "react-bootstrap";
import "./StoryPage.css"; 

const StoryPage = () => {
    const [stories, setStories] = useState([]);
    const [selectedStory, setSelectedStory] = useState(null);
    const location = useLocation(); // Use this hook to access the query params
    const navigate = useNavigate();

    const API_BASE_URL = "http://localhost:8081/api";

    // Get the theme ID from query params
    const queryParams = new URLSearchParams(location.search);
    const themeId = queryParams.get("theme");

    // Fetch stories based on the selected theme ID
    useEffect(() => {
        if (themeId) {
            fetch(`${API_BASE_URL}/stories`)
                .then((res) => res.json())
                .then((data) => {
                    console.log("Fetched stories:", data);
                    setStories(data);  // Set the fetched stories to state
                })
                .catch((error) => console.error("Error fetching stories:", error));
        }
    }, [themeId]);

    // Filter stories based on the themeId from query parameter
    const filteredStories = stories.filter(story => story.themeId._id === themeId);

    // Handle story selection
    const handleStorySelect = (story) => {
        setSelectedStory(story);
    };

    // Navigate to game session with selected story
    const handleContinue = () => {
        // if (selectedStory) {
        //     navigate(`/gameSession?story=${selectedStory._id}`);
        // }
        if (selectedStory) {
            sessionStorage.setItem("selectedStory", JSON.stringify(selectedStory));
            navigate(`/character`);
          }
    };

    return (
        <Container className="theme-page" fluid>
            <h1 className="theme-header">Select a Story</h1>

            <Container fluid>
                <Row className="theme-container">
                    {filteredStories.length > 0 ? (
                        filteredStories.map((story) => (
                            <Col key={story._id} xs={12} sm={6} md={4} lg={3}>
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
                        ))
                    ) : (
                        <p>No stories available for this theme.</p>
                    )}
                </Row>
            </Container>

            <Button
                variant="primary"
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
