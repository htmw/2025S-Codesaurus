import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Form, InputGroup, Button } from "react-bootstrap";
import { FaPaperPlane, FaVolumeUp } from "react-icons/fa";
import Typewriter from "../UIComponent/Typewriter";
import DiceRoller from "../DiceComponent/DiceRoller";
import { motion, AnimatePresence } from "framer-motion";
import "./GameSessionPage.css";

const API_BASE_URL = "http://localhost:8081/api";

function GameSessionPage() {
    const location = useLocation();
    const navigate = useNavigate();

    const storyId = location.state.story;

    const [sessionId, setSessionId] = useState(localStorage.getItem("sessionId"));
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [messages, setMessages] = useState([]);
    const [playerInput, setPlayerInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [gameResult, setGameResult] = useState(null);
    const messagesEndRef = useRef(null);

    const [requiresRoll, setRequiresRoll] = useState(false);
    const [rolling, setRolling] = useState(false);
    const [diceValue, setDiceValue] = useState(1);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);

    const [voices, setVoices] = useState([]);
    const [selectedVoice, setSelectedVoice] = useState("");

    useEffect(() => {
        fetchMessageHistory(sessionId);
    }, [storyId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    useEffect(() => {
        if (!localStorage.getItem("sessionId")) {
            navigate("/");
        }
        if (!localStorage.getItem("successCount")) {
            localStorage.setItem("successCount", "0");
        }
        if (!localStorage.getItem("failureCount")) {
            localStorage.setItem("failureCount", "0");
        }

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);
            if (availableVoices.length > 0) {
                setSelectedVoice(availableVoices[0].name);
            }
        };

        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
    }, []);

    const speakText = (text) => {
        if (!text) return;
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = voices.find((v) => v.name === selectedVoice);
        if (voice) utterance.voice = voice;
        window.speechSynthesis.speak(utterance);
    };

    const updateRollCounts = (message) => {
        const successCount = parseInt(localStorage.getItem("successCount") || "0");
        const failureCount = parseInt(localStorage.getItem("failureCount") || "0");
        if (message.toLowerCase().includes("success")) {
            localStorage.setItem("successCount", (successCount + 1).toString());
        } else if (message.toLowerCase().includes("failure")) {
            localStorage.setItem("failureCount", (failureCount + 1).toString());
        }
    };

    const resetRollCounts = () => {
        localStorage.setItem("successCount", "0");
        localStorage.setItem("failureCount", "0");
    };

    const processNarrationText = (text) => {
        if (!text.includes("?")) return text;
        const sentences = text.split(".");
        const lastSentence = sentences[sentences.length - 1].trim();
        if (lastSentence.includes("?")) {
            return sentences.slice(0, -1).join(".").trim() + ".";
        }
        return text;
    };

    const determineGameResult = (data) => {
        updateRollCounts(data.storyState);
        const successCount = parseInt(localStorage.getItem("successCount") || "0");
        const failureCount = parseInt(localStorage.getItem("failureCount") || "0");
        if (data.requirementsMet) {
            const isWin = successCount >= failureCount;
            resetRollCounts();
            return isWin ? "win" : "loss";
        } else {
            resetRollCounts();
            return "loss";
        }
    };

    const handleGameEnd = (result, narration) => {
        setGameResult(result);
        localStorage.removeItem("sessionId");
        setSessionId(null);
        setIsCompleted(true);
        setIsDisabled(true);
        setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.sender === "narrator") {
                lastMessage.text = processNarrationText(narration);
            }
            return newMessages;
        });
    };

    const fetchMessageHistory = async (sessionId) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/game-state/${sessionId}`);
            const data = await response.json();

            if (response.ok) {
                const logsRes = await fetch(`${API_BASE_URL}/logs/${sessionId}`);
                const logsData = await logsRes.json();

                const formattedMessages = logsData.map((log) => [
                    { sender: "narrator", text: log.context },
                    { sender: "player", text: log.userInput },
                ]).flat().filter((msg) => msg.text);

                setMessages(formattedMessages);
                setRequiresRoll(data.requiresRoll);
                setIsCompleted(data.isCompleted);
                setIsDisabled(data.isCompleted);

                if (data.isCompleted) {
                    const lastMessage = formattedMessages[formattedMessages.length - 1]?.text || "";
                    handleGameEnd(determineGameResult(lastMessage), lastMessage);
                }
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
        if (!playerInput.trim() || !sessionId || isCompleted) return;

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
                setIsCompleted(data.isCompleted);
                setIsDisabled(data.isCompleted);

                if (data.isCompleted) {
                    const endResult = determineGameResult(data);
                    handleGameEnd(endResult, data.storyState);
                }
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
                setDiceValue(data.diceRoll);
                if (data.success) {
                    const successCount = parseInt(localStorage.getItem("successCount") || "0");
                    localStorage.setItem("successCount", (successCount + 1).toString());
                } else {
                    const failureCount = parseInt(localStorage.getItem("failureCount") || "0");
                    localStorage.setItem("failureCount", (failureCount + 1).toString());
                }

                setMessages((prev) => [
                    ...prev,
                    { sender: "player", text: data.diceUserMessage },
                    { sender: "narrator", text: data.storyState },
                ]);
                setTimeout(() => {
                    setRequiresRoll(data.requiresRoll);
                }, 4000);

                if (data.isCompleted) {
                    handleGameEnd(determineGameResult(data.storyState), data.storyState);
                }
            } else {
                throw new Error("Dice roll failed");
            }
        } catch (error) {
            console.error("Dice Roll Error:", error);
            setMessages((prev) => [
                ...prev,
                { sender: "narrator", text: "Something went wrong while rolling the dice." },
            ]);
        } finally {
            setRolling(false);
        }
    };

    return (
        <Container fluid className="game-container">
            <Container fluid className="chat-container">
                <h2 className="chat-header">Let's Play!</h2>

                {gameResult && (
                    <div className={`game-result ${gameResult}`}>
                        {gameResult === "win" ? "🎉 Victory!" : "💀 Game Over"}
                    </div>
                )}

                <div className="message-area">
                    {messages.map((msg, index) => {
                        const isNarrator = msg.sender === "narrator";
                        return (
                            <motion.div
                                key={index}
                                className={`chat-message ${msg.sender}`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                {isNarrator ? (
                                    <>
                                        {index === messages.length - 1 ? (
                                            <Typewriter text={msg.text || ""} speed={15} delay={0} />
                                        ) : (
                                            msg.text
                                        )}
                                        <Button
                                            className="voice-button"
                                            variant="link"
                                            onClick={() => speakText(msg.text)}
                                        >
                                            <FaVolumeUp size={18} />
                                        </Button>
                                    </>
                                ) : (
                                    <em>"{msg.text}"</em>
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

                <Form.Group controlId="voiceSelect">
                    <Form.Label>Select Voice:</Form.Label>
                    <Form.Control
                        as="select"
                        value={selectedVoice}
                        onChange={(e) => setSelectedVoice(e.target.value)}
                    >
                        {voices.map((voice, index) => (
                            <option key={index} value={voice.name}>
                                {voice.name} ({voice.lang})
                            </option>
                        ))}
                    </Form.Control>
                </Form.Group>

                <InputGroup className="chat-input">
                    <Form.Control
                        type="text"
                        placeholder={isCompleted ? "Game Over" : requiresRoll ? "Roll the dice..." : "Make your move..."}
                        value={playerInput}
                        onChange={(e) => setPlayerInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !requiresRoll && !isCompleted && handleSendMessage()}
                        disabled={loading || isTyping || requiresRoll || isCompleted}
                        className="chat-input-field"
                    />

                    <AnimatePresence mode="wait">
                        {requiresRoll && !isCompleted ? (
                            <motion.div
                                key="dice"
                                initial={{ opacity: 1, scale: 1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.5 } }}
                                transition={{ duration: 0.5 }}
                            >
                                <DiceRoller value={diceValue} rolling={rolling} onRoll={handleRoll} size={30} />
                            </motion.div>
                        ) : !isCompleted ? (
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
                        ) : null}
                    </AnimatePresence>
                </InputGroup>
            </Container>
        </Container>
    );
}

export default GameSessionPage;
