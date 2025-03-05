import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import "./ThemePage.css"; // Ensure this file exists

const themes = [
  { id: 1, name: "Dragons", img: "/images/themes/dragons.png" },
  { id: 2, name: "Evil Lords", img: "/images/themes/evil-lords.png" },
  { id: 3, name: "Dark Forest", img: "/images/themes/dark-forest.png" },
  { id: 4, name: "Fantasy", img: "/images/themes/fantasy.png" },
  { id: 5, name: "Realm", img: "/images/themes/forgotten-realm.png" }, // Fixed image name
];

const ThemePage = () => {
  const [selectedTheme, setSelectedTheme] = useState(null);
  const navigate = useNavigate();

  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
  };

  const handleContinue = () => {
    if (selectedTheme) {
      navigate(`/stories?theme=${selectedTheme.id}`);
    }
  };

  return (
    <div className="theme-page">
      {/* Header */}
      <h1 className="theme-header">Choose Your Adventure</h1>

      {/* Theme Options */}
      <div className="theme-container">
        {themes.map((theme) => (
          <div
            key={theme.id}
            className={`theme-option ${selectedTheme?.id === theme.id ? "selected" : ""}`}
            onClick={() => handleThemeSelect(theme)}
          >
            <img src={theme.img} alt={theme.name} />
            <p>{theme.name}</p>
          </div>
        ))}
      </div>

      {/* Continue Button */}
      <button className="continue-button" onClick={handleContinue} disabled={!selectedTheme}>
        Continue
      </button>
    </div>
  );
};

export default ThemePage;
