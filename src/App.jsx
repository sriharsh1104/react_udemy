import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BirthdayPage from './components/birthday/BirthdayPage'
import './index.css'

// --- Ecommerce routes (disabled for birthday deploy) ---
// import Header from './components/ecommerce/Header'
// import Home from './components/ecommerce/Home'
// import ProductDetails from './components/ecommerce/ProductDetails'
// import Checkout from './components/ecommerce/Checkout'
// import './components/ecommerce/Ecommerce.css'
//
// function AppContent() {
//   return (
//     <div className="eco-app">
//       <Header />
//       <main className="eco-main">
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/product/:id" element={<ProductDetails />} />
//           <Route path="/checkout" element={<Checkout />} />
//           <Route path="*" element={<Home />} />
//         </Routes>
//       </main>
//     </div>
//   )
// }

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BirthdayPage />} />
        <Route path="*" element={<BirthdayPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
