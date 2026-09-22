import React from 'react';
import { X, ShoppingCart, Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function CartDrawer() {
  const { 
    cart, 
    isCartOpen, 
    setIsCartOpen, 
    removeFromCart, 
    updateQuantity, 
    cartTotal 
  } = useCart();
  
  const navigate = useNavigate();

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setIsCartOpen(false)}
      ></div>
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-background z-50 shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-serif font-bold text-primary">Your Cart</h2>
          <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-white rounded-full transition-colors">
            <X className="h-6 w-6 text-text" />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-6 space-y-6">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-text/50 space-y-4">
              <ShoppingCart className="h-16 w-16 opacity-20" />
              <p className="text-lg">Your cart is feeling light.</p>
              <button onClick={() => setIsCartOpen(false)} className="text-secondary hover:text-primary font-semibold">
                Start shopping
              </button>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-4 items-center">
                <div className="h-20 w-20 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-gray-200">
                  <img src={item.image} alt={item.name} className="h-full w-full object-cover" onError={(e) => { e.target.onerror=null; e.target.src=`https://placehold.co/100x100/FBF3E8/3B2116?text=${item.category}`; }} />
                </div>
                <div className="flex-grow flex flex-col justify-between h-full py-1">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-primary text-sm line-clamp-1">{item.name}</h4>
                    <button onClick={() => removeFromCart(item.id)} className="text-text/50 hover:text-secondary transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-text font-semibold text-sm mb-2">₹{item.price}</div>
                  <div className="flex items-center space-x-3 bg-white rounded-lg w-fit px-2 py-1 border border-gray-200">
                    <button onClick={() => updateQuantity(item.id, -1)} className="text-text/70 hover:text-primary">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="text-text/70 hover:text-primary">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-6 bg-white">
            <div className="flex justify-between items-center mb-6 text-lg font-bold text-primary">
              <span>Subtotal</span>
              <span>₹{cartTotal}</span>
            </div>
            <button 
              onClick={handleCheckout}
              className="w-full bg-secondary hover:bg-[#5c262c] text-white py-4 rounded-xl font-bold transition-colors shadow-md"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
