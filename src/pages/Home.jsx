import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const Home = () => {
  return (
    <div className="home-container">
      <section className="hero">
        <div className="hero-content">
          <h1 className="outfit-font">Track Your Cycle, <span className="highlight">Empower Your Life.</span></h1>
          <p>Smart Cycle helps you stay ahead of your schedule with accurate predictions, symptom tracking, and personalized insights.</p>
          <div className="hero-btns">
            <Link to="/signup" className="btn-primary">Get Started</Link>
            <Link to="/login" className="btn-secondary">Log In</Link>
          </div>
        </div>
        <div className="hero-visual">
          <div className="blob blob-1"></div>
          <div className="blob blob-2"></div>
          <div className="hero-card glass-card">
            <div className="card-stat">
              <span className="stat-label">Every Cycle</span>
              <span className="stat-value">is a Reset</span>
            </div>
            <div className="card-stat">
              <span className="stat-label">Flow gently</span>
              <span className="stat-value">Rest deeply</span>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <h2 className="outfit-font">Designed for Your Needs</h2>
        <div className="feature-grid">
          <div className="feature-card glass-card">
            <div className="feature-icon">📅</div>
            <h3>Smart Tracking</h3>
            <p>Easily log your period dates and see them on an interactive calendar.</p>
          </div>
          <div className="feature-card glass-card">
            <div className="feature-icon">✨</div>
            <h3>Predictions</h3>
            <p>Our intelligent system predicts your next three cycles with high accuracy.</p>
          </div>
          <div className="feature-card glass-card">
            <div className="feature-icon">📝</div>
            <h3>Symptom Log</h3>
            <p>Keep track of how you feel throughout your cycle to identify patterns.</p>
          </div>
        </div>
      </section>

      <section className="cta-section glass-card">
        <h2>Ready to take control?</h2>
        <p>Join thousands of users who trust Smart Cycle for their health journey.</p>
        <Link to="/signup" className="btn-primary">Create Free Account</Link>
      </section>
    </div>
  );
};

export default Home;
