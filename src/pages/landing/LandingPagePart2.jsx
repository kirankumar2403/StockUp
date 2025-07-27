import React from 'react';

const LandingPagePart2 = () => {
  return (
    <div>
      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">E-commerce Platform Features</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Everything you need to launch, manage, and grow your online store with ease.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Product Management */}
            <div className="bg-gray-800 bg-opacity-50 rounded-xl p-8 border border-gray-700 hover:border-purple-500 transition">
              <div className="w-14 h-14 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Product Catalog</h3>
              <p className="text-gray-300">Easily add, edit, and organize your products with rich descriptions, images, and categories.</p>
            </div>
            {/* Feature 2: Inventory Tracking */}
            <div className="bg-gray-800 bg-opacity-50 rounded-xl p-8 border border-gray-700 hover:border-purple-500 transition">
              <div className="w-14 h-14 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6m16 0H4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Inventory Management</h3>
              <p className="text-gray-300">Track stock levels in real time and get alerts for low inventory to avoid missed sales.</p>
            </div>
            {/* Feature 3: Analytics */}
            <div className="bg-gray-800 bg-opacity-50 rounded-xl p-8 border border-gray-700 hover:border-purple-500 transition">
              <div className="w-14 h-14 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17a1 1 0 001 1h6a1 1 0 001-1V7a1 1 0 00-1-1h-6a1 1 0 00-1 1v10zm-7 4a1 1 0 001-1V3a1 1 0 00-1-1H3a1 1 0 00-1 1v17a1 1 0 001 1h1zm4-4a1 1 0 001-1V7a1 1 0 00-1-1H7a1 1 0 00-1 1v9a1 1 0 001 1h1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Sales Analytics</h3>
              <p className="text-gray-300">Gain insights with real-time analytics on sales, revenue, and customer behavior to grow your business.</p>
            </div>
            {/* Feature 4: Checkout */}
            <div className="bg-gray-800 bg-opacity-50 rounded-xl p-8 border border-gray-700 hover:border-purple-500 transition">
              <div className="w-14 h-14 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.35 2.7A1 1 0 007.6 17h8.8a1 1 0 00.95-.68L19 13M16 21a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Seamless Checkout</h3>
              <p className="text-gray-300">Offer a fast, secure, and mobile-friendly checkout experience to maximize conversions.</p>
            </div>
            {/* Feature 5: Customer Engagement */}
            <div className="bg-gray-800 bg-opacity-50 rounded-xl p-8 border border-gray-700 hover:border-purple-500 transition">
              <div className="w-14 h-14 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8a2 2 0 012-2h2m4-4h4a2 2 0 012 2v4a2 2 0 01-2 2h-4a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Customer Engagement</h3>
              <p className="text-gray-300">Send personalized emails, offer discounts, and build loyalty with integrated marketing tools.</p>
            </div>
            {/* Feature 6: Multi-channel Selling */}
            <div className="bg-gray-800 bg-opacity-50 rounded-xl p-8 border border-gray-700 hover:border-purple-500 transition">
              <div className="w-14 h-14 bg-purple-500 bg-opacity-20 rounded-lg flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-3">Multi-channel Selling</h3>
              <p className="text-gray-300">Sell on your website, social media, and marketplaces—all from one dashboard.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 px-6 bg-gray-900 text-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How EcommerceAI Works</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Launch and grow your online store in three simple steps.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-500 bg-opacity-20 rounded-full flex items-center justify-center mb-6 relative">
                <span className="text-2xl font-bold text-purple-400">1</span>
                <div className="absolute -right-8 top-1/2 w-8 h-0.5 bg-gray-700 hidden md:block"></div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Add Your Products</h3>
              <p className="text-gray-300">Easily upload product details, images, and pricing to build your online catalog.</p>
            </div>
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-500 bg-opacity-20 rounded-full flex items-center justify-center mb-6 relative">
                <span className="text-2xl font-bold text-purple-400">2</span>
                <div className="absolute -right-8 top-1/2 w-8 h-0.5 bg-gray-700 hidden md:block"></div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Manage Inventory & Orders</h3>
              <p className="text-gray-300">Track stock, process orders, and keep your store running smoothly with real-time tools.</p>
            </div>
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-purple-500 bg-opacity-20 rounded-full flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-purple-400">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">Start Selling Online</h3>
              <p className="text-gray-300">Go live and reach customers everywhere—on your website, social media, and marketplaces.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24 px-6 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">See EcommerceAI in Action</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">Watch how easily you can set up your store, add products, and start selling online with EcommerceAI.</p>
          </div>
          <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
            <div className="aspect-w-16 aspect-h-9 bg-gray-900 flex items-center justify-center">
              <div className="p-8 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-gray-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-400">EcommerceAI Demo Video</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPagePart2;