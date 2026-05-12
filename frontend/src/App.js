import React, { useState, useEffect } from 'react';
import { Search, Calendar, Users, Star, MapPin, ChevronRight, Sparkles, Shield, Clock, Wifi, Car, Coffee, Waves } from 'lucide-react';
import Login from './Login';
import Dashboard from './Dashboard';
import HotelAdminDashboard from './HotelAdminDashboard';
import SystemAdminDashboard from './SystemAdminDashboard';
import HotelAdminRegister from './HotelAdminRegister';
import authService from './services/authService';
import Swal from 'sweetalert2';

const App = () => {
  const [scrolled, setScrolled] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');
  const [user, setUser] = useState(null);

    useEffect(() => {
    const loggedInUser = authService.getCurrentUser();
    if (loggedInUser && authService.isAuthenticated()) {
      setUser(loggedInUser);
      // Redirect based on role
      if (loggedInUser.role === 'system_admin') {
        setCurrentPage('systemAdmin');
      } else if (loggedInUser.role === 'hotel_admin') {
        setCurrentPage('hotelAdmin');
      } else if (loggedInUser.role === 'admin') {
        setCurrentPage('admin');
      } else {
        setCurrentPage('dashboard');
      }
    }

    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    // Redirect based on role
    if (userData.role === 'system_admin') {
      setCurrentPage('systemAdmin');
    } else if (userData.role === 'hotel_admin') {
      setCurrentPage('hotelAdmin');
    } else if (userData.role === 'admin') {
      setCurrentPage('admin');
    } else {
      setCurrentPage('dashboard');
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setCurrentPage('home');
  };

  // ====== ROLE-BASED DASHBOARD ROUTING ======

  // System Admin Dashboard
  if (currentPage === 'systemAdmin' && user?.role === 'system_admin') {
    return <SystemAdminDashboard user={user} onLogout={handleLogout} />;
  }

  // Hotel Admin Dashboard
  if (currentPage === 'hotelAdmin' && user?.role === 'hotel_admin') {
    return <HotelAdminDashboard user={user} onLogout={handleLogout} />;
  }

  // Guest/Customer Dashboard
  if (currentPage === 'dashboard' && user) {
    return <Dashboard user={user} onLogout={handleLogout} />;
  }

    // Login Page
  if (currentPage === 'login') {
    return <Login 
      onLogin={handleLogin} 
      onBack={() => setCurrentPage('home')}
      onNavigate={setCurrentPage}
    />;
  }

  // Hotel Admin Registration Page (Let's Partner)
  if (currentPage === 'partner') {
    return <HotelAdminRegister
      onSuccess={() => {
        Swal.fire({
          icon: 'success',
          title: 'Registration Submitted',
          text: 'Your account is pending system admin approval. You will receive an email notification once approved.',
          confirmButtonColor: '#06b6d4'
        });
        setCurrentPage('home');
      }}
      onBack={() => setCurrentPage('home')} 
    />;
  }

  // ====== HOME / LANDING PAGE ======
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden relative">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Navigation */}
      <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">

          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('home')}>
            <svg width="36" height="36" viewBox="0 0 680 680" xmlns="http://www.w3.org/2000/svg">
  <circle cx="340" cy="340" r="320" fill="#1a1f36"/>
  <circle cx="340" cy="340" r="305" fill="none" stroke="#f5c842" strokeWidth="3" strokeDasharray="6 5"/>
  <rect x="310" y="240" width="60" height="115" rx="3" fill="#f5c842"/>
  <polygon points="340,205 300,240 380,240" fill="#f5c842"/>
  <rect x="334" y="198" width="12" height="10" rx="2" fill="#d4a918"/>
  <line x1="340" y1="182" x2="340" y2="200" stroke="#d4a918" strokeWidth="2"/>
  <polygon points="340,182 356,187 340,192" fill="#ffffff"/>
  <rect x="318" y="250" width="10" height="10" rx="1" fill="#1a1f36"/>
  <rect x="335" y="250" width="10" height="10" rx="1" fill="#ffffff" opacity="0.85"/>
  <rect x="352" y="250" width="10" height="10" rx="1" fill="#1a1f36"/>
  <rect x="318" y="266" width="10" height="10" rx="1" fill="#ffffff" opacity="0.85"/>
  <rect x="335" y="266" width="10" height="10" rx="1" fill="#1a1f36"/>
  <rect x="352" y="266" width="10" height="10" rx="1" fill="#ffffff" opacity="0.85"/>
  <rect x="333" y="330" width="14" height="25" rx="2" fill="#1a1f36"/>
  <path d="M185 390 Q262 370 340 380 Q418 370 495 390 L495 440 Q418 420 340 430 Q262 420 185 440 Z" fill="#232a4a"/>
  <line x1="340" y1="380" x2="340" y2="440" stroke="#f5c842" strokeWidth="2"/>
  <circle cx="230" cy="300" r="5" fill="#f5c842"/>
  <circle cx="255" cy="275" r="4" fill="#8ca0cc"/>
  <line x1="234" y1="298" x2="252" y2="278" stroke="#f5c842" strokeWidth="1.5"/>
  <circle cx="450" cy="300" r="5" fill="#f5c842"/>
  <circle cx="425" cy="275" r="4" fill="#8ca0cc"/>
  <line x1="446" y1="298" x2="428" y2="278" stroke="#f5c842" strokeWidth="1.5"/>
</svg>
<span className="text-2xl font-bold">
  <span className="text-yellow-400">AI</span>
  <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"> Stay</span>
</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {/* LET'S PARTNER - For Hotel Admins to Register */}
            {!user && (
              <button
                onClick={() => setCurrentPage('partner')}
                className="text-gray-300 hover:text-white transition-colors font-medium"
              >
                Let&apos;s Partner
              </button>
            )}

            {user ? (
              <button
                onClick={() => {
                  if (user.role === 'system_admin') setCurrentPage('systemAdmin');
                  else if (user.role === 'hotel_admin') setCurrentPage('hotelAdmin');
                  else if (user.role === 'admin') setCurrentPage('admin');
                  else setCurrentPage('dashboard');
                }}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
              >
                Dashboard
              </button>
            ) : (
              <button
                onClick={() => setCurrentPage('login')}
                className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 mb-6">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-sm text-gray-300">Luxury Hotel Booking</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Discover Your
              <span className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Perfect Escape</span>
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience the future of hospitality with AI-curated luxury stays tailored to your desires.
            </p>
          </div>

          {/* Search Bar */}
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-2 border border-white/10 shadow-2xl shadow-purple-500/10">
              <div className="grid md:grid-cols-4 gap-2">
                <SearchField icon={MapPin} placeholder="Where to?" label="Destination" />
                <SearchField icon={Calendar} placeholder="Check in" label="Check-in" />
                <SearchField icon={Calendar} placeholder="Check out" label="Check-out" />
                <SearchField icon={Users} placeholder="Guests" label="Guests" />
              </div>
              <div className="p-2">
                <button 
                  onClick={() => user ? setCurrentPage('dashboard') : setCurrentPage('login')}
                  className="w-full py-4 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl font-bold text-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  <Search className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Find Exclusive Stays
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Hotels */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Curated Excellence</h2>
              <p className="text-gray-400">Handpicked luxury properties for the discerning traveler</p>
            </div>
            <button className="hidden md:flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors">
              View All <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <HotelCard 
              image="https://www.klook.com/en-PH/hotels/detail/253867-bai-hotel-cebu/"
              name="Bai Hotel Cebu"
              location="Mandaue City, Philippines"
              price="2,450"
              rating="4.9"
              tags={["Ocean View", "Private Pool"]}
            />
            <HotelCard 
              image="https://megaworldinternational.com/properties/belmont-hotel-mactan/"
              name="Belmont Hotel Mactan"
              location="Mactan, Philippines"
              price="3,200"
              rating="5.0"
              tags={["Seaview", "SPA"]}
              featured
            />
            <HotelCard 
              image="https://www.mandanibay.com/location/"
              name="Mandani Bay"
              location="Mandaue City, Philippines"
              price="4,100"
              rating="4.9"
              tags={["Seaview", "Beach Access"]}
            />
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="relative z-10 py-20 px-6 bg-gradient-to-b from-transparent via-purple-950/20 to-transparent">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Luxury Booking Experience</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">Our proprietary approach ensures a seamless and luxurious booking process for every guest.</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            <FeatureCard icon={Sparkles} title="Luxurious Hotel" desc="Experience unparalleled luxury at our handpicked properties" />
            <FeatureCard icon={Shield} title="Secure Booking" desc="Blockchain-verified transactions and identity protection" />
            <FeatureCard icon={Clock} title="Instant Confirm" desc="Real-time availability with immediate booking confirmation" />
            <FeatureCard icon={Waves} title="24/7 Concierge" desc="Customer service available around the clock for any request" />
          </div>
        </div>
      </section>

      {/* Partner CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-3xl p-12 border border-white/10">
            <h2 className="text-3xl font-bold mb-4">Own a Hotel?</h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Join our network of luxury properties and reach thousands of discerning travelers. 
              Partner with AI STAY today.
            </p>
            <button 
              onClick={() => setCurrentPage('partner')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl font-bold hover:shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
            >
              Let&apos;s Partner →
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 680 680" xmlns="http://www.w3.org/2000/svg">
  <circle cx="340" cy="340" r="320" fill="#1a1f36"/>
  <circle cx="340" cy="340" r="305" fill="none" stroke="#f5c842" strokeWidth="3" strokeDasharray="6 5"/>
  <rect x="310" y="240" width="60" height="115" rx="3" fill="#f5c842"/>
  <polygon points="340,205 300,240 380,240" fill="#f5c842"/>
  <rect x="334" y="198" width="12" height="10" rx="2" fill="#d4a918"/>
  <line x1="340" y1="182" x2="340" y2="200" stroke="#d4a918" strokeWidth="2"/>
  <polygon points="340,182 356,187 340,192" fill="#ffffff"/>
  <rect x="333" y="330" width="14" height="25" rx="2" fill="#1a1f36"/>
  <path d="M185 390 Q262 370 340 380 Q418 370 495 390 L495 440 Q418 420 340 430 Q262 420 185 440 Z" fill="#232a4a"/>
  <line x1="340" y1="380" x2="340" y2="440" stroke="#f5c842" strokeWidth="2"/>
</svg>
<span className="text-xl font-bold">
  <span className="text-yellow-400">AI</span> Stay
</span>
          </div>
          <p className="text-gray-500 text-sm">© 2026 AI STAY. The future of luxury hospitality.</p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Privacy</a>
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Terms</a>
            <a href="#" className="text-gray-400 hover:text-cyan-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

const SearchField = ({ icon: Icon, placeholder, label }) => (
  <div className="flex items-center gap-3 p-4 hover:bg-white/5 rounded-2xl transition-colors cursor-pointer group">
    <Icon className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
    <div className="flex-1">
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <input type="text" placeholder={placeholder} className="w-full bg-transparent text-white placeholder-gray-500 outline-none font-medium" />
    </div>
  </div>
);

const HotelCard = ({ image, name, location, price, rating, tags, featured }) => (
  <div className="group relative bg-slate-900/50 rounded-3xl overflow-hidden border border-white/10 hover:border-cyan-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/20">
    {featured && (
      <div className="absolute top-4 left-4 z-20 px-3 py-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full text-xs font-bold">
        FEATURED
      </div>
    )}
    <div className="relative h-64 overflow-hidden">
      <img src={image} alt={name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
    </div>
    <div className="p-6">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-xl font-bold mb-1 group-hover:text-cyan-400 transition-colors">{name}</h3>
          <div className="flex items-center gap-1 text-gray-400 text-sm">
            <MapPin className="w-4 h-4" />{location}
          </div>
        </div>
        <div className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded-lg">
          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
          <span className="font-bold text-sm">{rating}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-4">
        {tags.map((tag, idx) => (
          <span key={idx} className="px-3 py-1 bg-white/5 rounded-full text-xs text-gray-300 border border-white/10">{tag}</span>
        ))}
      </div>
      <div className="flex justify-between items-center pt-4 border-t border-white/10">
        <div>
          <span className="text-2xl font-bold text-cyan-400">₱{price}</span>
          <span className="text-gray-500 text-sm">/night</span>
        </div>
        <button className="px-4 py-2 bg-white/10 hover:bg-cyan-500 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25">
          Book Now
        </button>
      </div>
    </div>
  </div>
);

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 group">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6 text-cyan-400" />
    </div>
    <h3 className="text-lg font-bold mb-2">{title}</h3>
    <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
  </div>
);

export default App;