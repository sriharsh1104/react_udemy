import React from 'react';
import { useNavigate } from 'react-router-dom';
import { products } from '../../data/products';
import './Ecommerce.css';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="eco-home">
      <div className="eco-hero">
        <h1>Design Your Vibe.</h1>
        <p>Premium customizable bags. Create something that is uniquely yours and have it shipped to your door.</p>
      </div>

      <div className="eco-products">
        {products.map(product => (
          <div key={product.id} className="eco-product-card" onClick={() => navigate(`/product/${product.id}`)}>
            <div className="eco-product-image" style={{ backgroundImage: `url(${product.designs?.[0]?.img || ''})`, backgroundSize: 'cover', backgroundPosition: 'center', height: '300px' }}>
              {/* Fallback emoji if no image */}
              {!product.designs?.[0]?.img && <span style={{fontSize: '5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'}}>🎒</span>}
            </div>
            <div className="eco-product-info">
              <h3 className="eco-product-title">{product.title}</h3>
              <p className="eco-product-desc" style={{marginBottom: '1rem'}}>
                {product.description.substring(0, 80)}...
              </p>
              <div className="eco-product-footer">
                <span className="eco-product-price">₹{product.currentPrice}</span>
                <button className="eco-btn">View Details</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
