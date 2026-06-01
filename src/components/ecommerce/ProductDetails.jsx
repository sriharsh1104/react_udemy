import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { products } from '../../data/products';
import './Ecommerce.css';

function Accordion({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="eco-accordion">
      <div className="eco-accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>{title}</h3>
        <span className="eco-accordion-icon">{isOpen ? '−' : '+'}</span>
      </div>
      {isOpen && <div className="eco-accordion-content">{children}</div>}
    </div>
  );
}

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const product = products.find(p => p.id === id) || products[0]; // fallback if not found

  const [selectedDesign, setSelectedDesign] = useState(product.designs[0]);
  const [mainImage, setMainImage] = useState(product.designs[0].img);
  const [customText, setCustomText] = useState('');

  // Reset states if product changes
  useEffect(() => {
    setSelectedDesign(product.designs[0]);
    setMainImage(product.designs[0].img);
    setCustomText('');
  }, [product]);

  const allImages = [
    ...product.designs.map(d => d.img),
    ...(product.additionalImages || [])
  ];

  const handleDesignChange = (design) => {
    setSelectedDesign(design);
    setMainImage(design.img);
  };

  const handleBuyNow = () => {
    localStorage.setItem('cart', JSON.stringify({
      productId: `${product.id}-${selectedDesign.id}`,
      title: `${selectedDesign.name} Embroidery Sling Bag`,
      price: product.currentPrice,
      text: customText
    }));
    navigate('/checkout');
  };

  if (!product) return <div>Product not found</div>;

  return (
    <div className="eco-pdp-container">
      <div className="eco-pdp-layout">
        
        {/* Image Gallery */}
        <div className="eco-gallery-section">
          <div className="eco-main-image-container">
            <div className="eco-image-placeholder" style={{backgroundImage: `url(${mainImage})`}}>
              {!mainImage && <span>Main Product Image</span>}
            </div>
          </div>
          <div className="eco-thumbnail-list">
            {allImages.map((img, index) => (
              <div 
                key={index} 
                className={`eco-thumbnail ${mainImage === img ? 'active' : ''}`}
                onClick={() => setMainImage(img)}
                style={{backgroundImage: `url(${img})`}}
              >
                {!img && <span>{index + 1}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Product Details */}
        <div className="eco-details-section">
          <h1 className="eco-product-title-pdp">{product.title}</h1>
          
          <div className="eco-price-container">
            <span className="eco-price-current">Rs. {product.currentPrice.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="eco-price-original">Rs. {product.originalPrice.toFixed(2)}</span>
            )}
            {product.discountBadge && (
              <span className="eco-price-badge">{product.discountBadge}</span>
            )}
          </div>

          <div className="eco-highlights">
            {product.highlights.map((hl, i) => (
              <div key={i} className="eco-highlight-item">
                <span className="eco-highlight-icon">{hl.icon}</span>
                <span>{hl.text}</span>
              </div>
            ))}
            <div className="eco-highlight-item">
              <span className="eco-highlight-icon">🌻</span>
              <span>{selectedDesign.name} Embroidery</span>
            </div>
          </div>

          {product.designs && product.designs.length > 0 && (
            <div className="eco-personalisation" style={{ marginTop: '1rem' }}>
              <label>Select Design</label>
              <div className="eco-design-selector">
                {product.designs.map(design => (
                  <button 
                    key={design.id}
                    className={`eco-design-btn ${selectedDesign.id === design.id ? 'active' : ''}`}
                    onClick={() => handleDesignChange(design)}
                  >
                    {design.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="eco-personalisation">
            <label>Name for Personalisation (Optional)</label>
            <input 
              type="text" 
              className="eco-input" 
              placeholder="E.g. Your Name" 
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              maxLength={15}
            />
          </div>

          <button className="eco-btn-buy" onClick={handleBuyNow}>
            BUY NOW
          </button>
          <div className="eco-payment-icons">
            <span>🔒 Secure Checkout with Razorpay</span>
          </div>

          <div className="eco-accordions-wrapper">
            <Accordion title="Description & Material">
              <p>{product.description}</p>
              <br/>
              <p><strong>Product Highlights:</strong></p>
              <ul>
                {product.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
              <br/>
              {product.note && <p><em>{product.note}</em></p>}
            </Accordion>
            
            <Accordion title="Shipping & Delivery">
              <p>Personalised orders typically require 2-6 working days for dispatch. While we strive to dispatch orders within this timeframe, please note that the delivery period by the courier company usually takes an additional 2-6 days.</p>
            </Accordion>

            <Accordion title="Bag Care">
              <ul>
                <li>Clean your bag gently with a damp cloth.</li>
                <li>Avoid contact with harsh chemicals or bleach.</li>
                <li>Store in a dry place to maintain fabric quality.</li>
                <li>Do not machine wash to preserve the handmade embroidery.</li>
              </ul>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
