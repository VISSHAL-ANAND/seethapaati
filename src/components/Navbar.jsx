import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Menu, X, Heart } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const { cartCount, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    } else {
      navigate('/');
    }
  };

  return (
    <>
      {/* Announcement Bar (Marquee) */}
      <div className="bg-primary text-accent py-2 overflow-hidden relative flex whitespace-nowrap items-center text-[13px] font-medium tracking-wide w-full">
        <div className="animate-[marquee_20s_linear_infinite] flex space-x-12">
          <span>Free shipping over ₹500</span>
          <span>&bull;</span>
          <span>100% Natural</span>
          <span>&bull;</span>
          <span>Farm to Home</span>
          <span>&bull;</span>
          <span>Premium Quality</span>
          <span>&bull;</span>
          <span>Free shipping over ₹500</span>
          <span>&bull;</span>
          <span>100% Natural</span>
        </div>
      </div>

      {/* Sticky Navbar */}
      <header className={`sticky top-0 w-full z-40 transition-all duration-300 ${scrolled ? 'bg-background shadow-[0_4px_20px_rgba(59,33,22,0.08)] py-4' : 'bg-background py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            
            {/* Logo */}
            <Link to="/" className="flex items-center flex-shrink-0 cursor-pointer">
              <span className="text-3xl font-serif font-black text-primary tracking-tight">
                Masala <span className="italic font-medium">and Trades</span>
              </span>
            </Link>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex space-x-10">
              <Link to="/#shop" className="text-text hover:text-secondary font-semibold text-[15px] transition-colors">Shop</Link>
              <Link to="/#about" className="text-text/70 hover:text-secondary font-semibold text-[15px] transition-colors">About</Link>
              <Link to="/#testimonials" className="text-text/70 hover:text-secondary font-semibold text-[15px] transition-colors">Testimonials</Link>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-6 text-primary">
              
              <form onSubmit={handleSearch} className="relative group">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products..." 
                  className="pl-4 pr-10 py-2 border-b-2 border-transparent bg-white/50 hover:bg-white rounded-full focus:outline-none focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all w-48 lg:w-64 text-sm"
                />
                <button type="submit" className="absolute right-3 top-2 text-gray-400 hover:text-accent group-focus-within:text-accent transition-colors">
                  <Search className="h-5 w-5 stroke-[2]" />
                </button>
              </form>

              <button className="hover:text-secondary transition-colors relative">
                <Heart className="h-5 w-5 stroke-[2]" />
                {wishlist.size > 0 && <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-secondary rounded-full"></span>}
              </button>
              
              <button onClick={() => setIsCartOpen(true)} className="relative hover:text-secondary transition-colors flex items-center">
                <ShoppingCart className="h-5 w-5 stroke-[2]" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold text-white transform translate-x-1/2 -translate-y-1/2 bg-secondary rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center space-x-4 text-primary">
              <button onClick={() => setIsCartOpen(true)} className="relative">
                <ShoppingCart className="h-6 w-6 stroke-[1.5]" />
                {cartCount > 0 && <span className="absolute top-0 right-0 w-4 h-4 text-[10px] bg-secondary text-white rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">{cartCount}</span>}
              </button>
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-background border-t border-gray-200 shadow-2xl p-6 flex flex-col space-y-6 animate-[fade-in_0.2s_ease-out]">
            <Link to="/#shop" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-serif font-bold text-primary">Shop</Link>
            <Link to="/#about" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-serif font-bold text-primary">About</Link>
            <Link to="/#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="text-xl font-serif font-bold text-primary">Testimonials</Link>
            <hr className="border-gray-200" />
            
            <form onSubmit={handleSearch} className="relative w-full">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products..." 
                className="w-full pl-4 pr-10 py-3 bg-white rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button type="submit" className="absolute right-4 top-3"><Search className="h-5 w-5 text-gray-400" /></button>
            </form>

            <div className="flex space-x-6 text-text/70 mt-2">
              <button className="flex items-center"><Heart className="h-5 w-5 mr-2" /> Wishlist ({wishlist.size})</button>
            </div>
          </div>
        )}
      </header>
    </>
  );
}
