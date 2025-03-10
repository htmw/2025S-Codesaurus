import { Container, Button } from 'react-bootstrap'
import { useNavigate } from "react-router-dom";

import './HomePage.css'

function HomePage() {
    const navigate = useNavigate();

    const handleContinue = () => {
        navigate("/themes");
      };

    return (
        <div className="homepage">
        {/* Background Image */}
        <div className="homepage-background">
          <Container className="homepage-content">
            {/* Header */}
            <h1 className="homepage-header">Q U E S T</h1>
            {/* Paragraph */}
            <p className="homepage-paragraph">
            <i>A journey into the unknown, the choice is up to you</i>
            </p>
            <p className="homepage-paragraph p"> click <strong>"Continue"</strong> to begin </p>
            {/* Continue Button */}
            <Button
              className="continue-button"
              variant="primary"
              onClick={handleContinue}
            >
              Continue
            </Button>
          </Container>
        </div>
      </div>
    )
}

export default HomePage