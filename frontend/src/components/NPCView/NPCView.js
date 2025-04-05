import React from "react";
import { Container, Card, Row, Col } from "react-bootstrap";
import "./NPCView.css";

const NPCView = ({ npcs }) => {
    if (!npcs || npcs.length === 0) return null; // Don't render if no NPCs

    return (
        <Container className="npc-container" fluid>
            <h3 className="npc-header">NPCs in this Story</h3>


            {npcs.map((npc) => {
                const npcImage = npc.alignment.toLowerCase() === "good"
                    ? "/images/npc/default-hero.png"
                    : "/images/npc/default-enemy.png"; // Select image based on alignment

                return (
                    <Row className="d-flex justify-content-center mb-2" key={npc._id} xs={12} sm={6} md={4} >
                        <Card style={{ width: '18rem' }} className="text-white">
                            <Card.Img variant="top" src={npcImage} alt={npc.title} />
                            <Card.Body>
                                <Card.Title>{npc.title}</Card.Title>
                                <Card.Text>
                                    Role: {npc.role}<br />
                                    {npc.description} <br />

                                </Card.Text>
                                <Card.Text>
                                    Alignment: {npc.alignment}<br />
                                    Strength: {npc.stats.strength}<br />
                                    Intelligence: {npc.stats.intelligence}<br />
                                    Charisma: {npc.stats.charisma}<br />
                                    Agility: {npc.stats.agility}<br />
                                </Card.Text>
                            </Card.Body>
                        </Card>
                        {/* <Card className="npc-card">
                                <div>
                                    <Card.Img variant="top" src={npcImage} alt={npc.title} className="npc-image" />
                                    <Card.Text className="npc-description">
                                        <b>Alignment:</b> {npc.alignment} <br />
                                        <b>Strength:</b> {npc.stats.strength} |
                                        <b> Intelligence:</b> {npc.stats.intelligence} |
                                        <b> Charisma:</b> {npc.stats.charisma} |
                                        <b> Agility:</b> {npc.stats.agility}
                                    </Card.Text>
                                </div>
                                <Card.Body>
                                    <Card.Title className="npc-title">{npc.title}</Card.Title>
                                    <Card.Text className="npc-role"><b>Role:</b> {npc.role}</Card.Text>
                                    <Card.Text className="npc-role">
                                        {npc.description} <br />
                                    </Card.Text>
                                </Card.Body>
                            </Card> */}
                    </Row>
                );
            })}
        </Container>
    );
};

export default NPCView;
