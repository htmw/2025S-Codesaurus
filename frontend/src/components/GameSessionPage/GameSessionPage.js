import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Button } from "react-bootstrap";
import "./GameSessionPage.css";

const API_BASE_URL = "http://localhost:8081/api";

function GameSessionPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const storyId = queryParams.get("story");


    // Session ID
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const startGame = async () => {
        if (!storyId) {
            setError("No story selected.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/start-game`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storyId }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("sessionId", data.sessionId);
                setSessionId(data.sessionId);
            } else {
                setError(data.message || "Failed to start game.");
            }
        } catch (err) {
            setError("Server error. Please try again.");
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="session-page" fluid>
            <h1 className="theme-header">Let's Play!</h1>

            <Container className="session" fluid>
                {error && <p className="error-message">{error}</p>}
                {sessionId && <p>Game session started! (ID: {sessionId})</p>}
                
                <Button variant="primary" className="continue-button"
                    onClick={startGame} 
                    disabled={loading || sessionId}
                >
                    {loading ? "Starting..." : "Start Game"}
                </Button>
            </Container>
        </Container>
    );
};

export default GameSessionPage;
