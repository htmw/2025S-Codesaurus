import { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Container, Form, InputGroup, Button } from "react-bootstrap";
import { FaPaperPlane } from "react-icons/fa";
import Typewriter from "../UIComponent/Typewriter";
import DiceRoller from "../DiceComponent/DiceRoller";
import { motion, AnimatePresence } from "framer-motion";
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

    const [requiresRoll, setRequiresRoll] = useState(false);
    const [rolling, setRolling] = useState(false);
    const [diceValue, setDiceValue] = useState(1);
    const [isDisabled, setIsDisabled] = useState(false);

    useEffect(() => {
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
            const response = await fetch(`${API_BASE_URL}/game-state/${sessionId}`);
            const data = await response.json();

            if (response.ok) {
                // Fetch logs separately
                const logsRes = await fetch(`${API_BASE_URL}/logs/${sessionId}`);
                const logsData = await logsRes.json();

                const formattedMessages = logsData.map((log) => [
                    { sender: "narrator", text: log.context },
                    { sender: "player", text: log.userInput }
                ]).flat().filter(msg => msg.text);

                setMessages(formattedMessages);
                setRequiresRoll(data.requiresRoll); // update dice state
            } else {
                throw new Error("Failed to fetch game state.");
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
                setRequiresRoll(data.requiresRoll || false);
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


    const handleRoll = async () => {
        if (rolling) return;
        if (!sessionId) return;
        setRolling(true);
        try {
            const response = await fetch(`${API_BASE_URL}/roll-dice`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
            });

            const data = await response.json();

            if (response.ok) {
                setDiceValue(data.diceRoll); // Update dice face
                setMessages(prev => [
                    ...prev,
                    { sender: "player", text: `🎲 Rolled a ${data.diceRoll} (Threshold: ${data.threshold})` },
                    { sender: "narrator", text: data.storyState }
                ]);
                setTimeout(() => {
                    setRequiresRoll(data.requiresRoll);
                }, 4000);
            } else {
                throw new Error("Dice roll failed");
            }
        } catch (error) {
            console.error("Dice Roll Error:", error);
            setMessages(prev => [
                ...prev,
                { sender: "narrator", text: "Something went wrong while rolling the dice." }
            ]);
        } finally {
            setRolling(false);
        }
    };

    return (
        <Container fluid className="game-container">
            <Container fluid className="chat-container">
                <h2 className="chat-header">Let's Play!</h2>

                <div className="message-area">
                    {messages.map((msg, index) => {
                        const isLastMessage = index === messages.length - 1;
                        const isNarrator = msg.sender === "narrator";
                        return (
                            <motion.div
                                key={index}
                                className={`chat-message ${msg.sender}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {isNarrator && isLastMessage ? (
                                    <Typewriter text={msg.text || ""} speed={15} delay={0} />
                                ) : (
                                    isNarrator ? msg.text : <em>"{msg.text}"</em>
                                )}
                            </motion.div>
                        );
                    })}

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
                        placeholder={requiresRoll ? "Roll the dice..." : "Make your move..."}
                        value={playerInput}
                        onChange={(e) => setPlayerInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !requiresRoll && handleSendMessage()}
                        disabled={loading || isTyping || requiresRoll}
                        className="chat-input-field"
                    />

                    <AnimatePresence mode="wait">
                        {requiresRoll ? (
                            <motion.div
                                key="dice"
                                initial={{ opacity: 1, scale: 1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.5 } }}
                                transition={{ duration: 0.5 }}
                            >
                                <DiceRoller value={diceValue} rolling={rolling} onRoll={handleRoll} size={30} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="send"
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <Button className="send-button" onClick={handleSendMessage} disabled={!playerInput.trim()}>
                                    <FaPaperPlane size={18} />
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </InputGroup>

            </Container>
        </Container>
    );
}

export default GameSessionPage;
