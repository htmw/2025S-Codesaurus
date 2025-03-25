import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import "./NPCView.css";

const NPCView = ({ npcs }) => {
    if (!npcs || npcs.length === 0) return null; // Don't render if no NPCs

    return (
        <div className="npc-sidebar">
            <h2 className="npc-header">NPCs in this Story</h2>
            <Row>
                {npcs.map((npc) => (
                    <Col key={npc._id} xs={12} sm={6} md={4}>
                        <Card className="npc-card">
                            <Card.Body>
                                <Card.Title className="npc-title">{npc.title}</Card.Title>
                                <Card.Text className="npc-role"><b>Role:</b> {npc.role}</Card.Text>
                                <Card.Text className="npc-description">{npc.description}</Card.Text>
                                <Card.Text><b>Alignment:</b> {npc.alignment}</Card.Text>
                                <Card.Text>
                                    <b>Strength:</b> {npc.stats.strength} | 
                                    <b> Intelligence:</b> {npc.stats.intelligence} | 
                                    <b> Charisma:</b> {npc.stats.charisma} | 
                                    <b> Agility:</b> {npc.stats.agility}
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default NPCView;
