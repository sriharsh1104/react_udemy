import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Ecommerce.css';

function Header() {
  const navigate = useNavigate();

  return (
    <header className="eco-header">
      <div className="eco-header-container">
        <div className="eco-logo" onClick={() => navigate('/')}>
          <span className="eco-logo-icon">✨</span>
          <span className="eco-logo-text">AuraBags</span>
        </div>
        <nav className="eco-nav">
          <Link to="/" className="eco-nav-link">Shop</Link>
          <Link to="/checkout" className="eco-nav-link eco-cart-icon">🛒</Link>
        </nav>
      </div>
    </header>
  );
}

export default Header;
