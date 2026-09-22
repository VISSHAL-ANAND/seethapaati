import React, { useState, useEffect } from 'react';
import { Leaf, Award, ShieldCheck, ArrowRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { productsData, categories } from '../data/products';

export default function Home() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  
  // Filter products based on category AND search query
  const filteredProducts = productsData.filter(product => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          product.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle Hash Links for scrolling (since we're using React Router now)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      setTimeout(() => {
        const element = document.querySelector(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col min-h-screen">
      
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#3B2116]/80 z-10 mix-blend-multiply"></div>
        <img 
          src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?q=80&w=2070&auto=format&fit=crop" 
          alt="Traditional Indian Spices" 
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <span className="text-accent uppercase tracking-[0.3em] font-bold text-sm mb-4 block">Authentic Indian Flavors</span>
          <h1 className="text-5xl md:text-7xl font-serif font-black text-background mb-6 leading-[1.1] tracking-tight">
            Premium Spices &<br /> Traditional Blends
          </h1>
          <p className="text-lg md:text-xl text-background/90 mb-10 max-w-2xl font-light">
            Sourced directly from organic farms. Carefully roasted and ground to preserve the true essence of traditional cooking.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <a href="#shop" className="bg-secondary hover:bg-[#5c262c] text-white px-10 py-4 rounded-xl font-bold text-lg transition-colors shadow-lg">
              Shop Now
            </a>
            <a href="#about" className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 px-10 py-4 rounded-xl font-bold text-lg transition-colors">
              Our Story
            </a>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="bg-white py-12 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Leaf, title: '100% Natural', desc: 'No artificial colors or preservatives' },
              { icon: ShieldCheck, title: 'Premium Quality', desc: 'Carefully sorted and graded' },
              { icon: Award, title: 'Farm to Home', desc: 'Directly sourced from farmers' },
              { icon: ArrowRight, title: 'Fast Delivery', desc: 'Securely packaged and shipped' },
            ].map((feature, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                <div className="bg-accent/10 p-4 rounded-full mb-4 text-accent">
                  <feature.icon className="h-6 w-6 stroke-[2]" />
                </div>
                <h3 className="font-bold text-primary mb-1 text-sm uppercase tracking-wider">{feature.title}</h3>
                <p className="text-text/70 text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop Section */}
      <section id="shop" className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-black text-primary mb-4">Our Collection</h2>
            <p className="text-text/70 max-w-2xl mx-auto text-lg">
              Explore our curated selection of premium ingredients, crafted for those who appreciate true quality.
            </p>
          </div>

          {/* Search Result Indicator */}
          {searchQuery && (
            <div className="mb-8 text-center">
              <p className="text-lg text-primary">
                Showing results for <span className="font-bold italic">"{searchQuery}"</span>
              </p>
              <button 
                onClick={() => {
                  const url = new URL(window.location);
                  url.searchParams.delete('q');
                  window.history.pushState({}, '', url);
                  window.dispatchEvent(new Event('popstate')); 
                }} 
                className="text-secondary hover:underline text-sm font-bold mt-2"
              >
                Clear Search
              </button>
            </div>
          )}

          {/* Category Filter */}
          <div className="flex overflow-x-auto hide-scrollbar justify-start md:justify-center gap-3 mb-16 pb-4">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-6 py-3 rounded-full font-bold text-sm transition-all duration-300 shadow-sm ${
                  activeCategory === category
                    ? 'bg-primary text-background shadow-md'
                    : 'bg-white text-text/70 hover:bg-gray-50 border border-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <p className="text-2xl font-serif text-primary mb-2">No products found</p>
              <p className="text-text/70">Try adjusting your search or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

        </div>
      </section>

      {/* About/Trust Content Section */}
      <section id="about" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="relative h-[600px] rounded-2xl overflow-hidden shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1599940824399-b87987ceb72a?q=80&w=1927&auto=format&fit=crop" 
                alt="Spices and ingredients" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="text-accent uppercase tracking-[0.2em] font-bold text-sm mb-4 block">The Masala & Trades Standard</span>
              <h2 className="text-4xl md:text-5xl font-serif font-black text-primary mb-6 leading-tight">
                Uncompromising Quality. True Authenticity.
              </h2>
              <p className="text-lg text-text/80 mb-6 leading-relaxed">
                We believe that the best meals start with the finest ingredients. That's why we bypass the complex supply chains and source directly from carefully selected farms across India.
              </p>
              <p className="text-lg text-text/80 mb-8 leading-relaxed">
                Our spices are sun-dried, our teas are hand-picked, and every product is packed with care to ensure the volatile oils and aromas remain perfectly intact until they reach your kitchen.
              </p>
              <ul className="space-y-4 mb-10">
                <li className="flex items-center text-primary font-bold">
                  <ShieldCheck className="h-5 w-5 text-accent mr-3" /> No artificial additives or colors.
                </li>
                <li className="flex items-center text-primary font-bold">
                  <ShieldCheck className="h-5 w-5 text-accent mr-3" /> Small-batch processing.
                </li>
                <li className="flex items-center text-primary font-bold">
                  <ShieldCheck className="h-5 w-5 text-accent mr-3" /> Secure, aroma-lock packaging.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}
