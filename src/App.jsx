import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import { useCart } from './context/CartContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const { showToast, toastMessage } = useCart();

  return (
    <div className="min-h-screen flex flex-col font-sans text-text bg-background">
      <ScrollToTop />
      <Navbar />
      <CartDrawer />
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/product/:slug" element={<ProductDetails />} />
          {/* <Route path="/checkout" element={<Checkout />} /> */}
        </Routes>
      </main>

      <Footer />

      {/* Toast Notification */}
      <div 
        className={`fixed bottom-6 right-6 bg-secondary text-white px-6 py-4 rounded-xl shadow-2xl font-bold flex items-center transform transition-all duration-300 z-50 ${
          showToast ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
        }`}
      >
        <span className="mr-3 bg-white/20 p-1 rounded-full text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
        </span>
        {toastMessage}
      </div>
    </div>
  );
}
