import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsData } from '../data/products';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Star, Heart, ArrowLeft, ShieldCheck, Truck, RotateCcw, Minus, Plus } from 'lucide-react';

export default function ProductDetails() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    const foundProduct = productsData.find(p => p.slug === slug);
    setProduct(foundProduct);
    setQuantity(1); // Reset quantity when product changes
  }, [slug]);

  if (!product) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center">
        <h2 className="text-3xl font-serif text-primary mb-4">Product Not Found</h2>
        <Link to="/" className="text-secondary hover:underline font-bold">Return to Shop</Link>
      </div>
    );
  }

  const isWishlisted = wishlist.has(product.id);

  const handleAddToCart = () => {
    // We add multiple quantities by adding the item multiple times, 
    // or we can adjust CartContext to accept a quantity parameter.
    // For now, let's just loop it to reuse existing addToCart logic, 
    // or better, if the cart context supported `addToCart(product, qty)`.
    // Assuming our CartContext takes the whole product and assumes +1 each time.
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
  };

  return (
    <div className="bg-background pt-12 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-text/60 hover:text-primary transition-colors text-sm font-bold uppercase tracking-wider">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Shop
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-12 lg:gap-24">
          
          {/* Product Image */}
          <div className="relative rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-100 aspect-square">
            <img 
              src={product.image} 
              alt={product.name} 
              className="w-full h-full object-cover object-center"
              onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/800x800/FBF3E8/3B2116?text=${product.category}`; }}
            />
            <button 
              onClick={() => toggleWishlist(product.id)}
              className="absolute top-6 right-6 p-3 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
            >
              <Heart className={`h-6 w-6 ${isWishlisted ? 'fill-secondary text-secondary' : 'text-gray-400 hover:text-secondary'}`} />
            </button>
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            <div className="mb-6">
              <span className="text-[12px] font-bold tracking-widest text-secondary uppercase bg-secondary/5 px-3 py-1 rounded-sm inline-block mb-4">
                {product.category}
              </span>
              <h1 className="text-4xl md:text-5xl font-serif font-black text-primary mb-4 leading-tight">
                {product.name}
              </h1>
              
              <div className="flex items-center space-x-4 mb-6">
                <span className="text-3xl font-bold text-primary tracking-tight">₹{product.price}</span>
                <div className="flex items-center bg-white px-3 py-1 rounded-full border border-gray-200">
                  <Star className="h-4 w-4 fill-accent text-accent" />
                  <span className="text-sm font-bold text-text ml-1.5">{product.rating}</span>
                </div>
              </div>
              
              <p className="text-text/80 text-lg leading-relaxed">
                {product.description}
              </p>
            </div>

            <hr className="border-gray-200 mb-6" />

            {/* Options */}
            <div className="mb-8">
              <h3 className="font-bold text-primary mb-3">Pack Size</h3>
              <div className="inline-block border-2 border-primary text-primary font-bold px-6 py-2 rounded-xl bg-white">
                {product.weight}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3 sm:w-32">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="text-text/50 hover:text-primary transition-colors p-1"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="font-bold text-lg w-8 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(quantity + 1)}
                  className="text-text/50 hover:text-primary transition-colors p-1"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <button 
                onClick={handleAddToCart}
                disabled={!product.available}
                className={`flex-1 py-4 rounded-xl font-bold text-lg transition-colors shadow-sm flex justify-center items-center ${
                  product.available 
                    ? 'bg-secondary hover:bg-[#5c262c] text-white' 
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                {product.available ? `Add to Cart - ₹${product.price * quantity}` : 'Out of Stock'}
              </button>
            </div>

            {/* Trust Features */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-white p-6 rounded-xl border border-gray-100">
              <div className="flex flex-col items-center text-center">
                <ShieldCheck className="h-6 w-6 text-accent mb-2" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Secure<br/>Payment</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Truck className="h-6 w-6 text-accent mb-2" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Fast<br/>Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <RotateCcw className="h-6 w-6 text-accent mb-2" />
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Easy<br/>Returns</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
