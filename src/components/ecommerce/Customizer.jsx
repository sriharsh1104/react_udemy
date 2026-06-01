import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './Ecommerce.css';

const colors = [
  { id: 'black', hex: '#1e1e1e' },
  { id: 'white', hex: '#f8fafc' },
  { id: 'navy', hex: '#1e3a8a' },
  { id: 'purple', hex: '#6b46c1' },
  { id: 'red', hex: '#dc2626' }
];

function Customizer() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [selectedColor, setSelectedColor] = useState(colors[0]);
  const [customText, setCustomText] = useState('');

  const handleCheckout = () => {
    // Save selection to localStorage or state management to retrieve in checkout
    localStorage.setItem('cart', JSON.stringify({
      productId: id,
      color: selectedColor.id,
      text: customText,
      price: id === 'bag-duffel' ? 1499 : id === 'bag-backpack' ? 1999 : 999
    }));
    navigate('/checkout');
  };

  return (
    <div className="eco-customizer-layout">
      {/* Interactive Canvas Area */}
      <div className="eco-canvas-container">
        <div 
          className="eco-preview-bag" 
          style={{ backgroundColor: selectedColor.hex }}
        >
          <div className="eco-preview-strap"></div>
          <div className="eco-preview-text" style={{ color: selectedColor.id === 'white' ? '#1e1e1e' : '#fff' }}>
            {customText || 'Your Design'}
          </div>
        </div>
      </div>

      {/* Controls Area */}
      <div className="eco-controls">
        <h2>Customize Your Product</h2>
        <p style={{ color: 'var(--eco-text-light)', marginBottom: '2rem' }}>
          Make it truly yours by choosing colors and adding text.
        </p>

        <div className="eco-control-group">
          <h3>Choose Color</h3>
          <div className="eco-color-picker">
            {colors.map(color => (
              <div 
                key={color.id}
                className={`eco-color-btn ${selectedColor.id === color.id ? 'active' : ''}`}
                style={{ backgroundColor: color.hex, border: color.id === 'white' ? '1px solid #ccc' : 'none' }}
                onClick={() => setSelectedColor(color)}
                title={color.id}
              />
            ))}
          </div>
        </div>

        <div className="eco-control-group">
          <h3>Add Text</h3>
          <input 
            type="text" 
            className="eco-input" 
            placeholder="E.g. AURORA" 
            value={customText}
            onChange={(e) => setCustomText(e.target.value.toUpperCase())}
            maxLength={10}
          />
        </div>

        <button className="eco-btn accent" style={{ width: '100%', marginTop: '1rem', fontSize: '1.1rem' }} onClick={handleCheckout}>
          Proceed to Checkout ✨
        </button>
      </div>
    </div>
  );
}

export default Customizer;
