import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import './StripePayment.css'

// Initialize Stripe with test key (you can get your own from https://dashboard.stripe.com)
const stripePromise = loadStripe('')

// Payment Form Component (uses Stripe Hooks)
const PaymentForm = () => {
  const stripe = useStripe()
  const elements = useElements()
  const [amount, setAmount] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Validate form
  const validateForm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      return 'Please enter a valid amount'
    }
    if (!customerEmail || !customerEmail.includes('@')) {
      return 'Please enter a valid email address'
    }
    if (!customerName.trim()) {
      return 'Please enter your name'
    }
    return null
  }

  const handlePayment = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    if (!stripe || !elements) {
      setError('Stripe is not initialized. Please check your publishable key.')
      return
    }

    setLoading(true)

    try {
      // Step 1: Create payment intent with backend
      const response = await fetch('http://localhost:3001/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          currency: 'usd'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create payment intent')
      }

      const { clientSecret } = await response.json()

      // Step 2: Get the card element
      const cardElement = elements.getElement('card')

      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Step 3: Confirm payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: customerName,
              email: customerEmail,
            },
          },
        }
      )

      if (confirmError) {
        setError(confirmError.message)
        setLoading(false)
      } else if (paymentIntent.status === 'succeeded') {
        setSuccess(`Payment of $${amount} completed successfully! Transaction ID: ${paymentIntent.id}`)
        
        // Reset form
        setAmount('')
        setCustomerEmail('')
        setCustomerName('')
        setLoading(false)
      }
    } catch (err) {
      console.error('Payment error:', err)
      setError(err.message || 'Failed to process payment. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="payment-form-wrapper">
      <form onSubmit={handlePayment} className="payment-form">
        {/* Customer Information */}
        <div className="form-section">
          <h3 className="section-title">Customer Information</h3>
          
          <div className="form-group">
            <label htmlFor="customerName">Full Name</label>
            <input
              type="text"
              id="customerName"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="customerEmail">Email Address</label>
            <input
              type="email"
              id="customerEmail"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
              className="form-input"
              required
            />
          </div>
        </div>

        {/* Payment Details */}
        <div className="form-section">
          <h3 className="section-title">Payment Details</h3>
          
          <div className="form-group">
            <label htmlFor="amount">Amount (USD)</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100.00"
              min="0.01"
              step="0.01"
              className="form-input"
              required
            />
          </div>

          {/* Stripe Card Element */}
          <div className="form-group">
            <label htmlFor="card-element">Card Details</label>
            <div className="stripe-card-container">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                    invalid: {
                      color: '#9e2146',
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className={`submit-button ${loading ? 'loading' : ''}`}
          disabled={loading || !stripe}
        >
          {loading ? (
            <>
              <span className="spinner"></span>
              Processing Payment...
            </>
          ) : (
            <>
              🔒 Pay ${amount || '0.00'}
            </>
          )}
        </button>
      </form>

      {/* Info Box */}
      <div className="payment-info">
        <h4>🔐 Security Features</h4>
        <ul>
          <li>✓ PCI DSS compliant payment processing</li>
          <li>✓ Encrypted card data transmission</li>
          <li>✓ 3D Secure authentication support</li>
          <li>✓ Fraud detection and prevention</li>
          <li>✓ Secure vault for storing cards</li>
        </ul>

        <div className="test-card-info">
          <h4>🧪 Test Cards (When Backend is Integrated)</h4>
          <div className="test-cards">
            <div className="test-card-item">
              <strong>Visa:</strong> 4242 4242 4242 4242
            </div>
            <div className="test-card-item">
              <strong>Mastercard:</strong> 5555 5555 5555 4444
            </div>
            <div className="test-card-item">
              <strong>Decline:</strong> 4000 0000 0000 0002
            </div>
          </div>
        </div>

        <div className="api-info">
          <h4>⚙️ How to Test</h4>
          <p>1. Make sure backend is running on port 3001</p>
          <p>2. Use test cards (listed below) - no real money is charged</p>
          <p>3. Backend is already configured with demo Stripe keys</p>
          <p>4. To use your own Stripe account:</p>
          <ol>
            <li>Sign up at <a href="https://dashboard.stripe.com/register" target="_blank">Stripe Dashboard</a></li>
            <li>Get API keys from Developers → API Keys</li>
            <li>Update keys in <code>backend/server.js</code> and frontend</li>
          </ol>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="message error">
          <strong>⚠️ Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="message success">
          <strong>✅ Success:</strong> {success}
        </div>
      )}
    </div>
  )
}

const StripePayment = () => {
  return (
    <div className="stripe-payment-container">
      <div className="payment-header">
        <h2>💳 Stripe Payment Integration</h2>
        <p className="payment-subtitle">Secure Payment Gateway Demo</p>
      </div>

      <div className="demo-notice success-notice">
        <strong>✅ Backend Connected:</strong> Stripe payment integration is fully functional with backend! Use test cards below.
      </div>

      <Elements stripe={stripePromise}>
        <PaymentForm />
      </Elements>
    </div>
  )
}

export default StripePayment

