import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Ecommerce.css';

function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    } else {
      // No cart, go home
      navigate('/');
    }
  }, [navigate]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Load Razorpay Script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (!cart) return;
    
    setLoading(true);

    try {
      const res = await loadRazorpayScript();
      if (!res) {
        alert('Razorpay SDK failed to load. Are you online?');
        setLoading(false);
        return;
      }

      // Create Order on Backend
      const orderResponse = await fetch('http://localhost:3001/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cart.price,
          currency: 'INR'
        })
      });
      
      const orderData = await orderResponse.json();

      if (!orderData.success) {
        alert('Failed to create order. Please try again.');
        setLoading(false);
        return;
      }

      const options = {
        key: 'rzp_test_YourTestKey', // Fallback, usually we pass it from backend or env
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'AuraBags Custom',
        description: 'Custom Bag Order',
        order_id: orderData.order.id,
        handler: async function (response) {
          // Verify payment on backend
          const verifyRes = await fetch('http://localhost:3001/api/razorpay/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              customerDetails: formData,
              cartDetails: cart
            })
          });
          
          const verifyData = await verifyRes.json();
          if (verifyData.success) {
            alert('Payment Successful! Order Placed.');
            localStorage.removeItem('cart');
            navigate('/');
          } else {
            alert('Payment verification failed.');
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#6b46c1'
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();

    } catch (error) {
      console.error('Payment Error:', error);
      alert('An error occurred during payment.');
    } finally {
      setLoading(false);
    }
  };

  if (!cart) return null;

  return (
    <div className="eco-checkout-container">
      <h2>Complete Your Order</h2>
      
      <div className="eco-order-summary">
        <div className="eco-summary-row">
          <span>{cart.title}</span>
          <span>₹{cart.price}</span>
        </div>
        <div className="eco-summary-row">
          <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Personalisation: {cart.text || 'None'}</span>
        </div>
        <div className="eco-summary-total">
          <span>Total</span>
          <span>₹{cart.price}</span>
        </div>
      </div>

      <form onSubmit={handlePayment}>
        <div className="eco-form-group">
          <label>Full Name</label>
          <input required type="text" name="name" className="eco-input" value={formData.name} onChange={handleInputChange} />
        </div>
        <div className="eco-form-group">
          <label>Email</label>
          <input required type="email" name="email" className="eco-input" value={formData.email} onChange={handleInputChange} />
        </div>
        <div className="eco-form-group">
          <label>Phone Number</label>
          <input required type="tel" name="phone" className="eco-input" value={formData.phone} onChange={handleInputChange} />
        </div>
        <div className="eco-form-group">
          <label>Shipping Address</label>
          <textarea required name="address" className="eco-input" rows="3" value={formData.address} onChange={handleInputChange}></textarea>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="eco-form-group">
            <label>City</label>
            <input required type="text" name="city" className="eco-input" value={formData.city} onChange={handleInputChange} />
          </div>
          <div className="eco-form-group">
            <label>Pincode</label>
            <input required type="text" name="pincode" className="eco-input" value={formData.pincode} onChange={handleInputChange} />
          </div>
        </div>

        <button type="submit" className="eco-btn accent" style={{ width: '100%', fontSize: '1.1rem', marginTop: '1rem' }} disabled={loading}>
          {loading ? 'Processing...' : `Pay ₹${cart.price}`}
        </button>
      </form>
    </div>
  );
}

export default Checkout;
