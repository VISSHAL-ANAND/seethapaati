import React from 'react';
import { Star, Heart } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { Link } from 'react-router-dom';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { wishlist, toggleWishlist } = useWishlist();
  
  const isWishlisted = wishlist.has(product.id);

  return (
    <div className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full relative">
      {/* Wishlist Button */}
      <button 
        onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
        className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
      >
        <Heart className={`h-5 w-5 ${isWishlisted ? 'fill-secondary text-secondary' : 'text-gray-400 hover:text-secondary'}`} />
      </button>

      {/* Image Container - Links to PDP */}
      <Link to={`/product/${product.slug}`} className="relative h-64 overflow-hidden block bg-gray-50">
        <img 
          src={product.image} 
          alt={product.name} 
          className="w-full h-full object-cover object-center transform group-hover:scale-105 transition-transform duration-700 ease-out" 
          onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/400x400/FBF3E8/3B2116?text=${product.category}`; }}
        />
        <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
      </Link>
      
      {/* Content */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <p className="text-[11px] font-bold tracking-widest text-secondary uppercase bg-secondary/5 px-2 py-1 rounded-sm">
            {product.category}
          </p>
          <div className="flex items-center text-accent">
            <Star className="h-3 w-3 fill-accent" />
            <span className="text-[12px] font-bold text-text ml-1">{product.rating}</span>
          </div>
        </div>
        
        <Link to={`/product/${product.slug}`} className="block flex-grow">
          <h3 className="text-xl font-serif font-bold text-primary mb-1 group-hover:text-secondary transition-colors line-clamp-2">
            {product.name}
          </h3>
          <p className="text-text/60 text-sm mb-4">{product.weight}</p>
        </Link>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
          <div>
            <span className="text-2xl font-bold text-primary tracking-tight">₹{product.price}</span>
          </div>
          <button 
            onClick={() => addToCart(product)}
            className="bg-secondary hover:bg-[#5c262c] text-white px-5 py-2.5 rounded-lg font-bold text-sm transition-colors shadow-sm"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
