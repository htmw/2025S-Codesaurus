// import { useEffect, useState, useRef } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import { Container, Form, InputGroup, Button } from "react-bootstrap";
// import { FaPaperPlane } from "react-icons/fa";
// import Typewriter from "../UIComponent/Typewriter";
// import DiceRoller from "../DiceComponent/DiceRoller";
// import { motion, AnimatePresence } from "framer-motion";
// import MicRecorder from "mic-recorder-to-mp3";
// import "./GameSessionPage.css";

// const API_BASE_URL = "http://localhost:8081/api";

// function GameSessionPage() {
//     const location = useLocation();
//     const navigate = useNavigate();
//     const storyId = location.state.story;

//     const [sessionId, setSessionId] = useState(localStorage.getItem("sessionId"));
//     const [loading, setLoading] = useState(true);
//     const [messages, setMessages] = useState([]);
//     const [playerInput, setPlayerInput] = useState("");
//     const [isTyping, setIsTyping] = useState(false);
//     const [gameResult, setGameResult] = useState(null);
//     const [requiresRoll, setRequiresRoll] = useState(false);
//     const [rolling, setRolling] = useState(false);
//     const [diceValue, setDiceValue] = useState(1);
//     const [isCompleted, setIsCompleted] = useState(false);
//     const [isDisabled, setIsDisabled] = useState(false);
//     const [isRecording, setIsRecording] = useState(false);

//     const messagesEndRef = useRef(null);
//     const recorder = useRef(new MicRecorder({ bitRate: 128 }));

//     useEffect(() => {
//         if (!sessionId) navigate("/");
//         if (!localStorage.getItem("successCount")) localStorage.setItem("successCount", "0");
//         if (!localStorage.getItem("failureCount")) localStorage.setItem("failureCount", "0");
//     }, []);

//     useEffect(() => {
//         fetchMessageHistory(sessionId);
//     }, [storyId]);

//     useEffect(() => {
//         messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//     }, [messages]);

//     const updateRollCounts = (msg) => {
//         const successCount = parseInt(localStorage.getItem("successCount") || "0");
//         const failureCount = parseInt(localStorage.getItem("failureCount") || "0");

//         if (msg.toLowerCase().includes("success")) {
//             localStorage.setItem("successCount", (successCount + 1).toString());
//         } else if (msg.toLowerCase().includes("failure")) {
//             localStorage.setItem("failureCount", (failureCount + 1).toString());
//         }
//     };

//     const resetRollCounts = () => {
//         localStorage.setItem("successCount", "0");
//         localStorage.setItem("failureCount", "0");
//     };

//     const determineGameResult = (data) => {
//         updateRollCounts(data.storyState);
//         const success = parseInt(localStorage.getItem("successCount") || "0");
//         const failure = parseInt(localStorage.getItem("failureCount") || "0");
//         resetRollCounts();
//         return data.requirementsMet ? (success >= failure ? "win" : "loss") : "loss";
//     };

//     const handleGameEnd = (result, narration) => {
//         setGameResult(result);
//         localStorage.removeItem("sessionId");
//         setSessionId(null);
//         setIsCompleted(true);
//         setIsDisabled(true);

//         setMessages((prev) => {
//             const newMessages = [...prev];
//             const last = newMessages[newMessages.length - 1];
//             if (last?.sender === "narrator") {
//                 last.text = narration.split(".").slice(0, -1).join(".") + ".";
//             }
//             return newMessages;
//         });
//     };

//     const fetchMessageHistory = async (id) => {
//         try {
//             setLoading(true);
//             const res = await fetch(`${API_BASE_URL}/game-state/${id}`);
//             const data = await res.json();
//             const logsRes = await fetch(`${API_BASE_URL}/logs/${id}`);
//             const logs = await logsRes.json();

//             const formatted = logs.flatMap((log) => [
//                 { sender: "narrator", text: log.context },
//                 { sender: "player", text: log.userInput }
//             ]).filter(m => m.text);

//             setMessages(formatted);
//             setRequiresRoll(data.requiresRoll);
//             setIsCompleted(data.isCompleted);
//             setIsDisabled(data.isCompleted);

//             if (data.isCompleted) handleGameEnd(determineGameResult(data), formatted.at(-1)?.text || "");
//         } catch (e) {
//             console.error("Fetch error:", e);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleSendMessage = async () => {
//         if (!playerInput.trim() || !sessionId || isCompleted) return;
//         setMessages((prev) => [...prev, { sender: "player", text: playerInput }]);
//         setPlayerInput("");
//         setIsTyping(true);

//         try {
//             const res = await fetch(`${API_BASE_URL}/play-turn`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ sessionId, playerChoice: playerInput }),
//             });
//             const data = await res.json();

//             setMessages((prev) => [...prev, { sender: "narrator", text: data.storyState }]);
//             if (!isTyping) playNarration(data.storyState);
//             setRequiresRoll(data.requiresRoll || false);
//             setIsCompleted(data.isCompleted);
//             setIsDisabled(data.isCompleted);
//             if (data.isCompleted) handleGameEnd(determineGameResult(data), data.storyState);
//         } catch (e) {
//             console.error("Message error:", e);
//         } finally {
//             setIsTyping(false);
//         }
//     };

//     const handleRoll = async () => {
//         if (rolling || !sessionId) return;
//         setRolling(true);
//         try {
//             const res = await fetch(`${API_BASE_URL}/roll-dice`, {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ sessionId }),
//             });
//             const data = await res.json();

//             setDiceValue(data.diceRoll);
//             const newMessages = [
//                 { sender: "player", text: data.diceUserMessage },
//                 { sender: "narrator", text: data.storyState }
//             ];
//             setMessages(prev => [...prev, ...newMessages]);
//             if (!isTyping) playNarration(data.storyState);
//             setTimeout(() => setRequiresRoll(data.requiresRoll), 4000);
//             if (data.isCompleted) handleGameEnd(determineGameResult(data), data.storyState);
//         } catch (e) {
//             console.error("Roll error:", e);
//         } finally {
//             setRolling(false);
//         }
//     };

//     const startRecording = () => {
//         recorder.current.start().then(() => setIsRecording(true)).catch(console.error);
//     };

//     const stopRecording = async () => {
//         try {
//             const [buffer, blob] = await recorder.current.stop().getMp3();
//             setIsRecording(false);
//             const file = new File([blob], "voice.mp3", { type: "audio/mpeg" });
//             const formData = new FormData();
//             formData.append("file", file);

//             const response = await fetch("http://localhost:8081/api/voice/transcribe", {
//                 method: "POST",
//                 body: formData,
//             });

//             const result = await response.json();
//             setPlayerInput(result.text);
//         } catch (e) {
//             console.error("Transcription error:", e);
//         }
//     };

//     const playNarration = async (text) => {
//         try {
//             const response = await fetch("http://localhost:8081/api/voice/synthesize", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ text }),
//             });

//             if (!response.ok) throw new Error("TTS failed");

//             const audioBlob = await response.blob();
//             const audioUrl = URL.createObjectURL(audioBlob);
//             const audio = new Audio(audioUrl);
//             audio.play();
//         } catch (e) {
//             console.warn("Could not play narration:", e.message);
//         }
//     };

//     return (
//         <Container fluid className="game-container">
//             <Container fluid className="chat-container">
//                 <h2 className="chat-header">Let's Play!</h2>
//                 {gameResult && <div className={`game-result ${gameResult}`}>{gameResult === "win" ? "🎉 Victory!" : "💀 Game Over"}</div>}

//                 {isRecording && <div className="recording-indicator">🎙️ Listening...</div>}

//                 <div className="message-area">
//                     {messages.map((msg, i) => (
//                         <motion.div key={i} className={`chat-message ${msg.sender}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
//                             {msg.sender === "narrator" && i === messages.length - 1 ? (
//                                 <Typewriter text={msg.text || ""} speed={15} delay={0} />
//                             ) : msg.sender === "narrator" ? (
//                                 <>
//                                     {msg.text}
//                                     <Button size="sm" onClick={() => playNarration(msg.text)} className="ms-2">🔊</Button>
//                                 </>
//                             ) : (
//                                 <em>"{msg.text}"</em>
//                             )}
//                         </motion.div>
//                     ))}
//                     {isTyping && <div className="chat-message narrator typing-indicator"><span className="dot"></span><span className="dot"></span><span className="dot"></span></div>}
//                     <div ref={messagesEndRef} />
//                 </div>

//                 <InputGroup className="chat-input">
//                     <Form.Control
//                         type="text"
//                         placeholder={isCompleted ? "Game Over" : requiresRoll ? "Roll the dice..." : "Make your move..."}
//                         value={playerInput || ""} onChange={(e) => setPlayerInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !requiresRoll && !isCompleted && handleSendMessage()} disabled={loading || isTyping || requiresRoll || isCompleted}
//                         className="chat-input-field"
//                     />

//                     <Button variant="secondary" onClick={isRecording ? stopRecording : startRecording} disabled={isTyping || isCompleted || requiresRoll} className="mic-button">
//                         {isRecording ? "⏹️ Stop" : "🎤 Speak"}
//                     </Button>

//                     <AnimatePresence mode="wait">
//                         {requiresRoll && !isCompleted ? (
//                             <motion.div key="dice" initial={{ opacity: 1, scale: 1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.5 } }} transition={{ duration: 0.5 }}>
//                                 <DiceRoller value={diceValue} rolling={rolling} onRoll={handleRoll} size={30} />
//                             </motion.div>
//                         ) : !isCompleted ? (
//                             <motion.div key="send" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
//                                 <Button className="send-button" onClick={handleSendMessage} disabled={!playerInput.trim()}>
//                                     <FaPaperPlane size={18} />
//                                 </Button>
//                             </motion.div>
//                         ) : null}
//                     </AnimatePresence>
//                 </InputGroup>
//             </Container>
//         </Container>
//     );
// }

// export default GameSessionPage;



import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Container, Form, InputGroup, Button, Spinner } from "react-bootstrap";
import { FaPaperPlane, FaPlay, FaPause } from "react-icons/fa";
import Typewriter from "../UIComponent/Typewriter";
import DiceRoller from "../DiceComponent/DiceRoller";
import { motion, AnimatePresence } from "framer-motion";
import MicRecorder from "mic-recorder-to-mp3";
import "./GameSessionPage.css";

const API_BASE_URL = "http://localhost:8081/api";

function GameSessionPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const storyId = location.state.story;

    const [sessionId, setSessionId] = useState(localStorage.getItem("sessionId"));
    const [loading, setLoading] = useState(true);
    const [messages, setMessages] = useState([]);
    const [playerInput, setPlayerInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [gameResult, setGameResult] = useState(null); // 'win' or 'loss'
    const [charactersData, setCharactersData] = useState([]);
    const [activeUser, setActiveUser] = useState(0);
    const [playerInputs, setPlayerInputs] = useState(Array(charactersData.length).fill(""));
    const [npcInScene, setNpcInScene] = useState([]);
    const [allNPCs, setAllNPCs] = useState([]);


    const messagesEndRef = useRef(null);

    const [requiresRoll, setRequiresRoll] = useState(false);
    const [rolling, setRolling] = useState(false);
    const [diceValue, setDiceValue] = useState(1);
    const [isCompleted, setIsCompleted] = useState(false);
    const [isDisabled, setIsDisabled] = useState(false);
    const [isRecording, setIsRecording] = useState(false);

    const [audioPlayers, setAudioPlayers] = useState({});
    const [playingIndex, setPlayingIndex] = useState(null);
    const [loadingAudioIndex, setLoadingAudioIndex] = useState(null);

    const messagesEndRef = useRef(null);
    const recorder = useRef(new MicRecorder({ bitRate: 128 }));

    useEffect(() => {
        if (!sessionId) navigate("/");
        if (!localStorage.getItem("successCount")) localStorage.setItem("successCount", "0");
        if (!localStorage.getItem("failureCount")) localStorage.setItem("failureCount", "0");
    }, []);

    useEffect(() => {
        if (!sessionId) {
            // If sessionId is not in localStorage, redirect to home page
            navigate("/");
        } else {
            fetchMessageHistory(sessionId);
            fetchCharactersData();
            fetchStoryNPCs();
        }
    }, [storyId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Initialize success/failure counts in localStorage if they don't exist
    useEffect(() => {
        if (!localStorage.getItem('sessionId')) {
            navigate("/",);
        }
        if (!localStorage.getItem('successCount')) {
            localStorage.setItem('successCount', '0');
        }
        if (!localStorage.getItem('failureCount')) {
            localStorage.setItem('failureCount', '0');
        }
    }, []);

    // Fetch characters data from the server
    const fetchCharactersData = async () => {
        // Fetch characters from game session id
        const sessionId = localStorage.getItem("sessionId");
        if (!sessionId) return;
        try {
            const response = await fetch(`${API_BASE_URL}/characters?gameSessionId=${sessionId}`);
            const data = await response.json();
            if (response.ok) {
                setCharactersData(data);
                setPlayerInputs(Array(data.length).fill(""));
            } else {
                console.error("Failed to fetch characters:", data.message);
            }
        } catch (error) {
            console.error("Error fetching characters:", error);
        }
    };

    // Function to update success/failure counts
    const updateRollCounts = (message) => {
        const successCount = parseInt(localStorage.getItem('successCount') || '0');
        const failureCount = parseInt(localStorage.getItem('failureCount') || '0');

        console.log(message);

        if (message.toLowerCase().includes('success')) {
            localStorage.setItem('successCount', (successCount + 1).toString());
        } else if (message.toLowerCase().includes('failure')) {
            localStorage.setItem('failureCount', (failureCount + 1).toString());
        }
    };

    const resetRollCounts = () => {
        localStorage.setItem("successCount", "0");
        localStorage.setItem("failureCount", "0");
    };

    const determineGameResult = (data) => {
        updateRollCounts(data.storyState);
        const success = parseInt(localStorage.getItem("successCount") || "0");
        const failure = parseInt(localStorage.getItem("failureCount") || "0");
        resetRollCounts();
        return data.requirementsMet ? (success >= failure ? "win" : "loss") : "loss";
    };

    const handleGameEnd = (result, narration) => {
        setGameResult(result);
        localStorage.removeItem("sessionId");
        setSessionId(null);
        setIsCompleted(true);
        setIsDisabled(true);
        setMessages((prev) => {
            const newMessages = [...prev];
            const last = newMessages[newMessages.length - 1];
            if (last?.sender === "narrator") {
                last.text = narration.split(".").slice(0, -1).join(".") + ".";
            }
            return newMessages;
        });
    };

    const fetchMessageHistory = async (id) => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/game-state/${sessionId}`);
            const data = await response.json();

            if (response.ok) {
                // Fetch logs separately
                const logsData = data.logs || [];
                console.log('logsData: ', logsData);

                const formattedMessages = logsData.map((log) => [
                    { sender: "narrator", text: log.context, npcInScene: log.npcInScene },
                    { sender: "player", text: log.userInput }
                ]).flat().filter(msg => msg.text);

                setMessages(formatted);
                setRequiresRoll(data.requiresRoll);
                setIsCompleted(data.isCompleted);
                setIsDisabled(data.isCompleted);

                if (data.isCompleted) handleGameEnd(determineGameResult(data), formatted.at(-1)?.text || "");
            } catch (e) {
                console.error("Fetch error:", e);
            } finally {
                setLoading(false);
            }
        };

        const handleSendMessage = async () => {
            if (!sessionId || isCompleted) return;

            // Filter valid non-empty inputs
            const playerChoices = charactersData
                .map((char, index) => {
                    const input = playerInputs[index]?.trim();
                    return input
                        ? {
                            characterId: char._id,
                            choice: input,
                        }
                        : null;
                })
                .filter(Boolean); // remove nulls

            if (playerChoices.length === 0) return;

            // Add user messages to chat
            const userMessages = playerChoices.map((pc) => ({
                sender: "player",
                text: `${charactersData.find((c) => c._id === pc.characterId)?.name || "Player"}: ${pc.choice}`,
            }));

            setMessages((prev) => [...prev, ...userMessages]);
            setPlayerInputs(Array(charactersData.length).fill("")); // clear all inputs
            setIsTyping(true);

            try {
                const res = await fetch(`${API_BASE_URL}/play-turn`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sessionId, playerChoices }),
                });

                const data = await response.json();
                console.log('data: ', JSON.stringify(data));

                if (response.ok) {
                    const aiMessage = {
                        sender: "narrator",
                        text: data.storyState,
                        npcInScene: data.npcInScene || [],
                    };
                    setMessages((prev) => [...prev, aiMessage]);
                    setNpcInScene(data.npcInScene || []);
                    setRequiresRoll(data.requiresRoll || false);
                    setIsCompleted(data.isCompleted);
                    setIsDisabled(data.isCompleted);

                    if (data.isCompleted) {
                        console.log(data.requirementsMet);
                        const endResult = determineGameResult(data);
                        handleGameEnd(endResult, data.storyState);
                    }
                } else {
                    throw new Error(data.message || "Failed to get AI response.");
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
            if (rolling || !sessionId) return;
            setRolling(true);
            try {
                const res = await fetch(`${API_BASE_URL}/roll-dice`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ sessionId }),
                });

                const data = await response.json();
                console.log(JSON.stringify(data));

                if (response.ok) {
                    setDiceValue(data.diceRoll); // Update dice face

                    // Update success/failure counts based on the dice roll result
                    if (data.success) {
                        const successCount = parseInt(localStorage.getItem('successCount') || '0');
                        localStorage.setItem('successCount', (successCount + 1).toString());
                    } else {
                        const failureCount = parseInt(localStorage.getItem('failureCount') || '0');
                        localStorage.setItem('failureCount', (failureCount + 1).toString());
                    }

                    setMessages(prev => [
                        ...prev,
                        { sender: "player", text: data.message },
                        { sender: "narrator", text: data.storyState }
                    ]);
                    setNpcInScene(data.npcInScene || []);
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
                setMessages(prev => [
                    ...prev,
                    { sender: "narrator", text: "Something went wrong while rolling the dice." }
                ]);
            } finally {
                setRolling(false);
            }
        };

        const fetchStoryNPCs = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/stories/${storyId}`);
                const data = await response.json();
                if (response.ok && data.npcIds) {
                    setAllNPCs(data.npcIds); // assume backend returns full NPC objects populated
                }
            } catch (error) {
                console.error("Failed to load NPCs for story:", error);
            }
        };



        const startRecording = () => {
            recorder.current.start().then(() => setIsRecording(true)).catch(console.error);
        };

        const stopRecording = async () => {
            try {
                const [buffer, blob] = await recorder.current.stop().getMp3();
                setIsRecording(false);
                const file = new File([blob], "voice.mp3", { type: "audio/mpeg" });
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("http://localhost:8081/api/voice/transcribe", {
                    method: "POST",
                    body: formData,
                });

                const result = await response.json();
                setPlayerInput(result.text);
            } catch (e) {
                console.error("Transcription error:", e);
            }
        };

        const generateNarrationAudio = async (text) => {
            try {
                const response = await fetch(`${API_BASE_URL}/voice/synthesize`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text }),
                });

                if (!response.ok) throw new Error("TTS failed");

                const blob = await response.blob();
                return new Audio(URL.createObjectURL(blob));
            } catch (e) {
                console.warn("Could not fetch narration:", e);
                return null;
            }
        };

        const toggleAudio = async (index, text) => {
            if (playingIndex === index) {
                audioPlayers[index]?.pause();
                setPlayingIndex(null);
                return;
            }

            if (playingIndex !== null) {
                audioPlayers[playingIndex]?.pause();
            }

            if (!audioPlayers[index]) {
                setLoadingAudioIndex(index);
                const newAudio = await generateNarrationAudio(text);
                if (newAudio) {
                    newAudio.onended = () => setPlayingIndex(null);
                    setAudioPlayers(prev => ({ ...prev, [index]: newAudio }));
                    newAudio.play();
                    setPlayingIndex(index);
                }
                setLoadingAudioIndex(null);
            } else {
                audioPlayers[index].play();
                setPlayingIndex(index);
            }
        };

        return (
            <Container fluid className="game-container">
                <Container fluid className="chat-container">
                    <h2 className="chat-header">Let's Play!</h2>
                    {gameResult && <div className={`game-result ${gameResult}`}>{gameResult === "win" ? "🎉 Victory!" : "💀 Game Over"}</div>}

                    {isRecording && <div className="recording-indicator">🎙️ Listening...</div>}

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
                                        <em>{msg.text}</em>
                                    )}
                                    {msg.sender === "narrator" && msg.npcInScene?.length > 0 && (
                                        <div className="npc-scene-images mt-2 d-flex flex-wrap gap-3">
                                            {allNPCs
                                                .filter(npc => msg.npcInScene.includes(npc._id))
                                                .map(npc => (
                                                    <div key={npc._id} className="text-center">
                                                        <img
                                                            src={npc.imageUrl}
                                                            alt={npc.title}
                                                            className="npc-image"
                                                            style={{ width: "80px", borderRadius: "8px" }}
                                                        />
                                                        <div className="text-light small mt-1">{npc.title}</div>
                                                    </div>
                                                ))}
                                        </div>
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

                    {
                        requiresRoll && !isCompleted ? (
                            <div className="dice-container">
                                <DiceRoller
                                    rolling={rolling}
                                    onRoll={handleRoll}
                                    value={diceValue}
                                />
                            </div>
                        ) : (
                            <>
                                <div className="mb-2 d-flex gap-2">
                                    {charactersData.map((char, index) => (
                                        <Button
                                            key={char._id}
                                            variant={index === activeUser ? "primary" : "outline-secondary"}
                                            onClick={() => setActiveUser(index)}
                                        >
                                            {char.name || `User ${index + 1}`}
                                        </Button>
                                    ))}
                                </div>
                                <InputGroup className="chat-input">
                                    <Form.Control
                                        type="text"
                                        placeholder={
                                            isCompleted ? "Game Over" : requiresRoll ? "Roll the dice..." : "Make your move..."
                                        }
                                        value={playerInputs[activeUser]}
                                        onChange={(e) => {
                                            const newInputs = [...playerInputs];
                                            newInputs[activeUser] = e.target.value;
                                            setPlayerInputs(newInputs);
                                        }}
                                        disabled={loading || isTyping || requiresRoll || isCompleted}
                                        className="chat-input-field"
                                    />

                                    <AnimatePresence mode="wait">
                                        {!isCompleted && (
                                            <motion.div
                                                key="send"
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0 }}
                                                transition={{ duration: 0.5 }}
                                            >
                                                <Button
                                                    className="send-button"
                                                    onClick={handleSendMessage}
                                                    disabled={!playerInputs?.[activeUser]?.trim()}
                                                >
                                                    <FaPaperPlane size={18} />
                                                </Button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </InputGroup>
                            </>
                        )
                    }
                </Container>
            </Container>
        );
    }

    export default GameSessionPage;
