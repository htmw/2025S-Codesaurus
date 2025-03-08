import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Container, Form, InputGroup, Button } from "react-bootstrap";
import { FaPaperPlane } from "react-icons/fa";
import "./GameSessionPage.css";

const API_BASE_URL = "http://localhost:8081/api";

function GameSessionPage() {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const storyId = queryParams.get("story");

    const [sessionId, setSessionId] = useState(localStorage.getItem("sessionId"));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);
    const [playerInput, setPlayerInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        console.log('sessionId: ', sessionId);
        if (!sessionId) {
            startGame();
        } else {
            fetchMessageHistory(sessionId);
        }
    }, [storyId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const startGame = async () => {
        if (!storyId) {
            setError("No story selected.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/start-game`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ storyId }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("sessionId", data.sessionId);
                setSessionId(data.sessionId);
                setMessages([{ sender: "narrator", text: data.storyState }]);
            } else {
                throw new Error(data.message || "Failed to start game.");
            }
        } catch (err) {
            setError("Server error. Please try again.");
            console.error("Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessageHistory = async (sessionId) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/logs/${sessionId}`);
            const data = await response.json();

            if (response.ok) {
                const formattedMessages = data.map((log) => [
                    { sender: "narrator", text: log.context },
                    { sender: "player", text: log.userInput }
                ]).flat().filter(msg => msg.text);

                setMessages(formattedMessages);
            } else {
                throw new Error("Failed to fetch chat history.");
            }
        } catch (error) {
            console.error("Error fetching message history:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!playerInput.trim() || !sessionId) return;

        const userMessage = { sender: "player", text: playerInput };
        setMessages((prev) => [...prev, userMessage]);
        setPlayerInput("");
        setIsTyping(true);

        try {
            const response = await fetch(`${API_BASE_URL}/play-turn`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId, playerChoice: playerInput }),
            });

            const data = await response.json();

            if (response.ok) {
                const aiMessage = { sender: "narrator", text: data.storyState };
                setMessages((prev) => [...prev, aiMessage]);
            } else {
                throw new Error("Failed to get AI response.");
            }
        } catch (error) {
            console.error("Error sending message:", error);
            setMessages((prev) => [
                ...prev,
                { sender: "narrator", text: "I couldn't process your message. Try again." },
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <Container fluid className="game-container">
            <Container fluid className="chat-container">
                <h2 className="chat-header">Let's Play!</h2>

                <div className="message-area">
                    {messages.map((msg, index) => (
                        <div key={index} className={`chat-message ${msg.sender}`}>
                            {msg.sender === "narrator" ? msg.text : <em>"{msg.text}"</em>}
                        </div>
                    ))}

                    {isTyping && (
                        <div className="chat-message narrator typing-indicator">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input */}
                <InputGroup className="chat-input">
                    <Form.Control
                        type="text"
                        placeholder="Make your move..."
                        value={playerInput}
                        onChange={(e) => setPlayerInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        disabled={loading || isTyping}
                        className="chat-input-field"
                    />
                    <Button className="send-button" onClick={handleSendMessage} disabled={!playerInput.trim()}>
                        <FaPaperPlane size={18} />
                    </Button>
                </InputGroup>
            </Container>
        </Container>
    );
}

export default GameSessionPage;
