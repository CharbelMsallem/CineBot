import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout: authLogout } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close sidebar when route changes
  useEffect(() => {
    return navigate(() => {
      setSidebarOpen(false);
      setDropdownOpen(false);
    });
  }, [navigate]);

  const handleLogout = async () => {
    const token = localStorage.getItem('token');

    try {
      await fetch('http://127.0.0.1:8000/api/auth/logout/', {
        method: 'POST',
        headers: { 'Authorization': `Token ${token}` }
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }

    // Use the logout function from AuthContext
    authLogout();
    setSidebarOpen(false);
    setDropdownOpen(false);
    navigate('/');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
    setDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Get user initials or first letter for avatar
  const getUserInitials = () => {
    if (!user || !user.username) return '?';
    return user.username.charAt(0).toUpperCase();
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
            {user ? (
              <div className="profile-dropdown" ref={dropdownRef}>
                <button onClick={toggleDropdown} className="profile-dropdown-btn">
                  {user && user.profile_picture ? (
                    <img 
                      src={user.profile_picture} 
                      alt={user.username} 
                      className="navbar-profile-image" 
                    />
                  ) : (
                    <div className="navbar-profile-initial">
                      {getUserInitials()}
                    </div>
                  )}
                  <span className="profile-username">{user ? user.username : 'User'}</span>
                  <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>▼</span>
                </button>
                
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <Link to="/profile" className="dropdown-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                      </svg>
                      <span>My Profile</span>
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="dropdown-item">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                        <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                      </svg>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
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
        
        {user && (
          <div className="sidebar-user-info">
            {user.profile_picture ? (
              <img 
                src={user.profile_picture} 
                alt={user.username} 
                className="sidebar-profile-image" 
              />
            ) : (
              <div className="sidebar-profile-initial">
                {getUserInitials()}
              </div>
            )}
            <div className="sidebar-user-details">
              <span className="sidebar-username">{user.username}</span>
              <span className="sidebar-email">{user.email}</span>
            </div>
          </div>
        )}
        
        <div className="sidebar-links">
          <Link to="/" className="sidebar-link" onClick={toggleSidebar}>Home</Link>
          {user ? (
            <>
              <Link to="/profile" className="sidebar-link" onClick={toggleSidebar}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                </svg>
                My Profile
              </Link>
              <button onClick={handleLogout} className="sidebar-logout-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
                  <path d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
                </svg>
                Logout
              </button>
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