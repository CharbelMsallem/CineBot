import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../styles/Navbar.css';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  // Handle window scroll for navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Close sidebar when route changes
  useEffect(() => {
    return navigate(() => {
      setSidebarOpen(false);
    });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setSidebarOpen(false);
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="navbar-logo">
            <Link to="/">
              <span className="logo-text">CineBot</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="navbar-links-desktop">
            <Link to="/" className="nav-link">Home</Link>
            {isLoggedIn ? (
              <>
                <Link to="/profile" className="nav-link">Profile</Link>
                <button onClick={handleLogout} className="logout-btn">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="nav-link">Login</Link>
                <Link to="/register" className="nav-link register-btn">Register</Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="burger-menu" onClick={toggleSidebar}>
            <div className={`burger-bar ${isSidebarOpen ? 'open' : ''}`}></div>
            <div className={`burger-bar ${isSidebarOpen ? 'open' : ''}`}></div>
            <div className={`burger-bar ${isSidebarOpen ? 'open' : ''}`}></div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <div className={`sidebar-overlay ${isSidebarOpen ? 'open' : ''}`} onClick={toggleSidebar}></div>
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h2 className="sidebar-logo">CineBot</h2>
          <button className="close-sidebar" onClick={toggleSidebar}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div className="sidebar-links">
          <Link to="/" className="sidebar-link" onClick={toggleSidebar}>Home</Link>
          {isLoggedIn ? (
            <>
              <Link to="/profile" className="sidebar-link" onClick={toggleSidebar}>Profile</Link>
              <button onClick={handleLogout} className="sidebar-logout-btn">Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="sidebar-link" onClick={toggleSidebar}>Login</Link>
              <Link to="/register" className="sidebar-link register-link" onClick={toggleSidebar}>Register</Link>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Navbar;