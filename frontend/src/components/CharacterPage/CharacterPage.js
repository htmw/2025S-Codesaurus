import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./CharacterPage.css";
import axios from "axios";

const CharacterPage = () => {
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [newCharacter, setNewCharacter] = useState({
    name: "",
    race: "",
    class: "",
    background: "",
    stats: {
      strength: "",
      dexterity: "",
      constitution: "",
      intelligence: "",
      wisdom: "",
      charisma: "",
    },
  });
  const [fetchedCharacter, setFetchedCharacter] = useState(null);
  const [mode, setMode] = useState("select");

  const API_BASE_URL = "http://localhost:8081/api";
  const navigate = useNavigate();

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/characters`);
      setCharacters(response.data);
    } catch (error) {
      console.error("Error fetching characters:", error);
    }
  };

  const handleDropdownChange = async (e) => {
    const name = e.target.value;
    if (name === "") {
      setFetchedCharacter(null);
      setSelectedCharacter(null);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/characters/${name}`);
      setFetchedCharacter(response.data);
      setSelectedCharacter(response.data);
    } catch (error) {
      console.error("Character not found:", error);
      alert("Character not found");
    }
  };

  const handleContinue = async () => {
    if (mode === "create") {
      try {
        const characterToSubmit = {
          ...newCharacter,
          stats: Object.fromEntries(
            Object.entries(newCharacter.stats).map(([key, val]) => [key, parseInt(val)])
          )
        };
        const response = await axios.post(`${API_BASE_URL}/characters`, characterToSubmit);
        const createdCharacter = response.data.character;
        setSelectedCharacter(createdCharacter);
        setFetchedCharacter(null);
        sessionStorage.setItem("selectedCharacter", JSON.stringify(createdCharacter));
        alert(`New character '${createdCharacter.name}' created and selected.`);
        fetchCharacters();
        navigate("/gameSession");
      } catch (error) {
        console.error("Error creating character:", error);
        alert("Failed to create character.");
        return;
      }
    } else if (selectedCharacter) {
      sessionStorage.setItem("selectedCharacter", JSON.stringify(selectedCharacter));
      alert(`You selected ${selectedCharacter.name}`);
      navigate("/gameSession");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name in newCharacter.stats) {
      const numericValue = Math.max(1, Math.min(10, parseInt(value) || ""));
      setNewCharacter({
        ...newCharacter,
        stats: { ...newCharacter.stats, [name]: numericValue },
      });
    } else {
      setNewCharacter({ ...newCharacter, [name]: value });
    }
  };

  return (
    <div className="theme-page">
      <div className="theme-header">Choose or Create Your Character</div>

      <div className="character-form">
        <div className="input-row" style={{ marginBottom: "20px" }}>
          <label style={{ color: "#FFD966" }}>
            <input
              type="radio"
              value="select"
              checked={mode === "select"}
              onChange={() => {
                setMode("select");
                setSelectedCharacter(null);
              }}
            />
            Select Existing Character
          </label>
          <label style={{ color: "#FFD966", marginLeft: "20px" }}>
            <input
              type="radio"
              value="create"
              checked={mode === "create"}
              onChange={() => {
                setMode("create");
                setSelectedCharacter(null);
              }}
            />
            Create New Character
          </label>
        </div>

        {mode === "select" && (
          <>
            <div className="input-row">
              <select onChange={handleDropdownChange} defaultValue="">
                <option value="">-- Select a Character --</option>
                {characters.map((char) => (
                  <option key={char._id} value={char.name}>{char.name}</option>
                ))}
              </select>
            </div>

            {fetchedCharacter && (
              <div className="fetched-character">
                <h3 style={{ color: "#FFD966" }}>{fetchedCharacter.name}</h3>
                <p style={{ color: "#FFD966" }}>Race: {fetchedCharacter.race}</p>
                <p style={{ color: "#FFD966" }}>Class: {fetchedCharacter.class}</p>
                <p style={{ color: "#FFD966" }}>Background: {fetchedCharacter.background}</p>
                <h4 style={{ color: "#FFD966" }}>Stats:</h4>
                <ul>
                  {Object.entries(fetchedCharacter.stats).map(([key, value]) => (
                    <li key={key} style={{ color: "#FFD966" }}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}: {value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {mode === "create" && (
          <>
            <h2>Create New Character</h2>
            <div className="input-row">
              <label style={{ color: "#FFD966" }}>Name: <input type="text" name="name" value={newCharacter.name} onChange={handleInputChange} /></label>
              <label style={{ color: "#FFD966" }}>Race: <input type="text" name="race" value={newCharacter.race} onChange={handleInputChange} /></label>
              <label style={{ color: "#FFD966" }}>Class: <input type="text" name="class" value={newCharacter.class} onChange={handleInputChange} /></label>
              <label style={{ color: "#FFD966" }}>Background: <input type="text" name="background" value={newCharacter.background} onChange={handleInputChange} /></label>
            </div>
            <h4 style={{ color: "#FFD966" }}>Stats</h4>
            <div className="input-row">
              {Object.keys(newCharacter.stats).map((stat) => (
                <label key={stat} style={{ color: "#FFD966" }}>
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}:
                  <input
                    type="number"
                    name={stat}
                    min="1"
                    max="10"
                    value={newCharacter.stats[stat]}
                    onChange={handleInputChange}
                  />
                </label>
              ))}
            </div>
          </>
        )}
      </div>

      <button
        className="continue-button"
        disabled={mode === "select" && !selectedCharacter}
        onClick={handleContinue}
      >
        Continue
      </button>
    </div>
  );
};

export default CharacterPage;