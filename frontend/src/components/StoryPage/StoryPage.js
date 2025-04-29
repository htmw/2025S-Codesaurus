import { useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { Container, Button, Card } from "react-bootstrap";
import "./StoryPage.css";

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
                    setStories(data); // test duplication
                })
                .catch((error) => console.error("Error fetching stories:", error));
        }
    }, [themeId]);

    const filteredStories = stories.filter(story => story.themeId._id === themeId);

    const handleStorySelect = (story) => {
        setSelectedStory(prev => prev?._id === story._id ? null : story);
    };

    const handleContinue = () => {
        if (selectedStory) {
            navigate("/character", { state: { story: selectedStory._id, storyData: selectedStory } });
        }
    };

    return (
        <Container className="theme-page" fluid>
            <h1 className="theme-header">Select a Story</h1>

            <div className="d-flex flex-wrap gap-4 justify-content-start mb-5">
                {filteredStories.map((story) => {
                    return (
                        <div key={story._id} className="d-flex flex-column align-items-start">
                            <div className="d-flex align-items-center">
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

                                {selectedStory?._id === story._id && (
                                    <div className="npc-panel bg-black">
                                        <div className="npc-panel-header bg-dark">NPCs in this Story</div>
                                        <div className="npc-panel-scroll">
                                            {(story.npcIds || []).map((npc, index) => (
                                                <Card key={index} className="bg-dark text-light mb-2">
                                                    <Card.Img variant="top" src={npc.alignment.toLowerCase() === "good"
                                                        ? "/images/npc/default-hero.png"
                                                        : "/images/npc/default-enemy.png"} />
                                                    <Card.Body>
                                                        <Card.Title>{npc.title}</Card.Title>
                                                        <Card.Text>
                                                            <strong>Role:</strong> {npc.role}<br />
                                                            {npc.description}<br />
                                                            <strong>Alignment:</strong> {npc.alignment}<br />
                                                            <strong>Strength:</strong> {npc.stats?.strength}<br />
                                                            <strong>Intelligence:</strong> {npc.stats?.intelligence}<br />
                                                            <strong>Charisma:</strong> {npc.stats?.charisma}<br />
                                                            <strong>Agility:</strong> {npc.stats?.agility}
                                                        </Card.Text>
                                                    </Card.Body>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                    );
                })}
            </div>




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
