import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const LandingPagePart1 = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div>
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-gray-900 shadow-lg py-2' : 'bg-transparent py-4'}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 font-bold">StockUp</span>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="hover:text-purple-400 transition">Features</a>
            <a href="#how-it-works" className="hover:text-purple-400 transition">How It Works</a>
            <a href="#pricing" className="hover:text-purple-400 transition">Pricing</a>
          </div>
          <div>
            <Link to="/login" className="px-4 py-2 mr-4 text-purple-400 border border-purple-400 rounded-full hover:bg-purple-400 hover:text-white transition">
              Login
            </Link>
            <Link to="/signup" className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full hover:opacity-90 transition">
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-24 px-6 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto flex flex-col lg:flex-row items-center">
          <div className="lg:w-1/2 flex flex-col items-start mb-12 lg:mb-0">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Real-Time Inventory Management Platform
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8">
              Monitor your stock levels, receive instant low-stock alerts, and make smarter, data-driven decisions to keep your business running smoothly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/signup" className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-medium hover:opacity-90 transition text-center">
                Get Started Free
              </Link>
              <a href="#demo" className="px-8 py-3 bg-gray-800 border border-gray-600 rounded-full font-medium hover:bg-gray-700 transition text-center">
                See Demo
              </a>
            </div>
          </div>
          <div className="lg:w-1/2">
            <div className="relative">
              <div className="absolute -top-10 -left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
              <div className="absolute -bottom-10 -right-10 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
              <div className="relative">
                <img 
                  src="/demo-ecommerce.png" 
                  alt="AI Ecommerce Demo" 
                  className="rounded-xl shadow-2xl border border-gray-700"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/600x400?text=AI+Ecommerce+Demo";
                  }}
                />
                <div className="absolute -bottom-5 -right-5 bg-gray-900 p-4 rounded-lg shadow-lg border border-gray-700">
                  <p className="text-sm font-medium">Generated in <span className="text-purple-400">2.5 seconds</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Brands Section */}
      <section className="py-12 bg-gray-800 bg-opacity-50 text-white">
        <div className="container mx-auto px-6">
          <p className="text-center text-gray-400 mb-8">Trusted by businesses to manage inventory in real time</p>
          <div className="relative overflow-x-hidden">
            <div className="flex items-center gap-8 md:gap-12 opacity-70 pb-2 animate-scroll-logos whitespace-nowrap" style={{ minWidth: 'max-content' }}>
              {/* Example logos, replace src with your own or real brand logos */}
              <div className="h-16 w-16 flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md mx-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React" className="h-16 w-16 object-contain" />
              </div>
              <div className="h-16 w-16 flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md mx-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/47/Nodejs-logo.svg" alt="Node.js" className="h-16 w-16 object-contain" />
              </div>
              <div className="h-16 w-16 flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md mx-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png" alt="JavaScript" className="h-16 w-16 object-contain" />
              </div>
              <div className="h-16 w-16 flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md mx-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg" alt="Tailwind CSS" className="h-16 w-16 object-contain" />
              </div>
              <div className="h-16 w-16 flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md mx-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/96/Sass_Logo_Color.svg" alt="Sass" className="h-16 w-16 object-contain" />
              </div>
              <div className="h-16 w-16 flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md mx-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" alt="Figma" className="h-16 w-16 object-contain" />
              </div>
              <div className="h-16 w-16 flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md mx-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="GitHub" className="h-16 w-16 object-contain" />
              </div>
              {/* Duplicate logos for seamless loop */}
              <div className="h-16 w-16 flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md mx-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" alt="React" className="h-16 w-16 object-contain" />
              </div>
              <div className="h-16 w-16 flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md mx-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/4/47/Nodejs-logo.svg" alt="Node.js" className="h-16 w-16 object-contain" />
              </div>
              <div className="h-16 w-16 flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md mx-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/6/6a/JavaScript-logo.png" alt="JavaScript" className="h-16 w-16 object-contain" />
              </div>
              <div className="h-16 w-16 flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md mx-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d5/Tailwind_CSS_Logo.svg" alt="Tailwind CSS" className="h-16 w-16 object-contain" />
              </div>
              <div className="h-16 w-16 flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md mx-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/96/Sass_Logo_Color.svg" alt="Sass" className="h-16 w-16 object-contain" />
              </div>
              <div className="h-16 w-16 flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md mx-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg" alt="Figma" className="h-16 w-16 object-contain" />
              </div>
              <div className="h-16 w-16 flex items-center justify-center bg-gray-900 border border-gray-700 shadow-md mx-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg" alt="GitHub" className="h-16 w-16 object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPagePart1;