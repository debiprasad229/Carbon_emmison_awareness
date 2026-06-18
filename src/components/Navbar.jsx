import { useState, useEffect } from 'react';
import { Menu, X, BarChart3, Globe, ScanLine, Brain, Activity } from 'lucide-react';

export default function Navbar({ isOpen, setIsOpen }) {
  const [scrolled, setScrolled] = useState(false);

  // Handle sticky blur effect on scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: 'Overview', href: '#overview', icon: <Activity size={18} /> },
    { name: 'Analytics', href: '#analytics', icon: <BarChart3 size={18} /> },
    { name: 'Offsets', href: '#offsets', icon: <Globe size={18} /> },
    { name: 'Scanner', href: '#scanner', icon: <ScanLine size={18} /> },
    { name: 'AI Coach', href: '#ai-coach', icon: <Brain size={18} /> },
  ];

  return (
    <>
      {/* Sticky Navbar */}
      <nav className={`top-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">

          {/* Desktop Links */}
          <div className="desktop-nav-links">
            {navLinks.map((link) => (
              <a key={link.name} href={link.href} className="nav-item">
                {link.icon}
                <span>{link.name}</span>
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Side Drawer Overlay */}
      <div className={`mobile-drawer-overlay ${isOpen ? 'open' : ''}`} onClick={toggleMenu} />

      {/* Mobile Side Drawer */}
      <div className={`mobile-side-drawer ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h2 className="drawer-title">Menu</h2>
          <button className="close-drawer-btn" onClick={toggleMenu}>
            <X size={24} />
          </button>
        </div>
        <div className="drawer-links">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="drawer-item" 
              onClick={toggleMenu}
            >
              {link.icon}
              <span>{link.name}</span>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
