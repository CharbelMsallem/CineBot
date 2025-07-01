import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../styles/Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    profilePicture: null,
    profilePictureBase64: null, // New field for Base64 encoded image
    favoriteGenres: []
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [genres, setGenres] = useState([]);
  const [loadingGenres, setLoadingGenres] = useState(true);
  const navigate = useNavigate();
  
  // OTP verification states
  const [showOTPForm, setShowOTPForm] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/tmdb/genres/`)
      .then(res => res.json())
      .then(data => {
        setGenres(data);  
        setLoadingGenres(false); 
      })
      .catch(err => {
        console.error("Error fetching genres", err);
        setLoadingGenres(false);
      });
  }, []);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleGenreToggle = (genreId) => {
    setFormData(prevData => {
      const currentGenres = [...prevData.favoriteGenres];
      
      // If genre is already selected, remove it
      if (currentGenres.includes(genreId)) {
        return {
          ...prevData,
          favoriteGenres: currentGenres.filter(id => id !== genreId)
        };
      } 
      // Otherwise, add it (limited to max 5 selections)
      else if (currentGenres.length < 5) {
        return {
          ...prevData,
          favoriteGenres: [...currentGenres, genreId]
        };
      }
      
      return prevData;
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({
        ...formData,
        profilePicture: file
      });
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
        // Also save the Base64 encoded image
        setFormData(prevData => ({
          ...prevData,
          profilePictureBase64: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Username validation - alphanumeric and underscores only
    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    // Password validation - add more specific requirements
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Validate favorite genres
    if (formData.favoriteGenres.length === 0) {
      newErrors.favoriteGenres = 'Please select at least one favorite genre';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Create JSON data for submission
      const jsonData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password2: formData.confirmPassword,
        bio: formData.bio || '',
        favorite_genres: formData.favoriteGenres,
        profile_picture_base64: formData.profilePictureBase64 || null
      };
      
      const response = await fetch('http://127.0.0.1:8000/api/auth/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });
      
      const data = await response.json();

      if (!response.ok) {
        console.error('Server validation errors:', data);
        
        // Handle server-side validation errors
        const serverErrors = {};
        for (const key in data) {
          if (Array.isArray(data[key])) {
            serverErrors[key] = data[key][0];
          } else if (typeof data[key] === 'string') {
            serverErrors[key] = data[key];
          }
        }
        
        if (Object.keys(serverErrors).length > 0) {
          setErrors(serverErrors);
        } else {
          throw new Error('Registration failed. Please check your information and try again.');
        }
        setLoading(false);
        return;
      }
      
      console.log('Registration successful:', data);
      
      // Show OTP verification form
      setShowOTPForm(true);
      setRegisteredEmail(formData.email);
      
    } catch (err) {
      console.error('Registration error:', err);
      setErrors({
        ...errors,
        general: err.message || 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    
    if (!otp) {
      setOtpError('Please enter the OTP code');
      return;
    }
    
    setVerifyingOtp(true);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/verify-email/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registeredEmail,
          otp: otp
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setOtpError(data.otp || data.email || 'Verification failed');
        return;
      }
      
      // Verification successful, redirect to login
      navigate('/login', { state: { message: 'Email verified successfully! Please log in.' } });
      
    } catch (err) {
      console.error('OTP verification error:', err);
      setOtpError('An error occurred during verification. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setVerifyingOtp(true);
      
      const response = await fetch('http://127.0.0.1:8000/api/auth/resend-otp/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: registeredEmail
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setOtpError(data.email || 'Failed to resend OTP');
        return;
      }
      
      // Show success message
      setOtpError('');
      alert('A new OTP has been sent to your email.');
      
    } catch (err) {
      console.error('Resend OTP error:', err);
      setOtpError('An error occurred while resending OTP. Please try again.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-animation">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        <p>Creating your account</p>
      </div>
    );
  }

  if (loadingGenres) {
    return (
      <div className="loading-container">
        <div className="loading-animation">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    );
  }

  // OTP Verification Form
  if (showOTPForm) {
    return (
      <div className="register-page">
        <div className="otp-verification-container">
          <h1 className="register-title">Verify Your Email</h1>
          <p className="register-subtitle">We've sent a 6-digit code to {registeredEmail}</p>
          
          {otpError && (
            <div className="error-message">
              {otpError}
            </div>
          )}
          
          <form onSubmit={handleVerifyOTP} className="otp-form">
            <div className="form-group">
              <label htmlFor="otp">Enter Verification Code</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                maxLength="6"
                className={otpError ? 'input-error' : ''}
              />
            </div>
            
            <button 
              type="submit" 
              className="register-button"
              disabled={verifyingOtp}
            >
              {verifyingOtp ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
          
          <div className="resend-otp">
            Didn't receive the code? 
            <button 
              onClick={handleResendOTP} 
              className="resend-button"
              disabled={verifyingOtp}
            >
              Resend Code
            </button>
          </div>
          
          <div className="login-link">
            Back to <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-form-container">
          <h1 className="register-title">Create Your Account</h1>
          <p className="register-subtitle">Join our community and discover your next favorite movie</p>
          
          {errors.general && (
            <div className="error-message">
              {errors.general}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={errors.username ? 'input-error' : ''}
                  placeholder="Choose a username"
                />
                {errors.username && <span className="error-text">{errors.username}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={errors.email ? 'input-error' : ''}
                  placeholder="Enter your email"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={errors.password ? 'input-error' : ''}
                  placeholder="Min 8 chars, with uppercase, lowercase & number"
                />
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={errors.confirmPassword ? 'input-error' : ''}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </div>
            </div>
            
            <div className="form-group genre-selection-container">
              <label>Favorite Genres <span className="optional-tag">(select up to 5)</span></label>
              
              <div className="genres-grid">
                {genres.map(genre => (
                  <div 
                    key={genre.id}
                    className={`genre-chip ${formData.favoriteGenres.includes(genre.id) ? 'selected' : ''}`}
                    onClick={() => handleGenreToggle(genre.id)}
                  >
                    {genre.name}
                    {formData.favoriteGenres.includes(genre.id) && (
                      <span className="genre-check">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </span>
                    )}
                  </div>
                ))}
              </div>
              {errors.favoriteGenres && <span className="error-text">{errors.favoriteGenres}</span>}
              <div className="selected-count">
                {formData.favoriteGenres.length} of 5 selected
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group bio-group">
                <label htmlFor="bio">Bio <span className="optional-tag">(optional)</span></label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself and your movie preferences"
                  rows="2"
                />
                {errors.bio && <span className="error-text">{errors.bio}</span>}
              </div>
              
              <div className="form-group profile-picture-group">
                <label>Profile Picture <span className="optional-tag">(optional)</span></label>
                <div className="profile-upload-container">
                  <div className="profile-preview">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Profile preview" />
                    ) : (
                      <div className="no-preview">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="upload-buttons">
                    <label htmlFor="profilePicture" className="upload-button">
                      {previewUrl ? 'Change' : 'Upload'}
                      <input
                        type="file"
                        id="profilePicture"
                        name="profilePicture"
                        onChange={handleFileChange}
                        accept="image/*"
                        hidden
                      />
                    </label>
                    {previewUrl && (
                      <button 
                        type="button" 
                        className="remove-button"
                        onClick={() => {
                          setPreviewUrl(null);
                          setFormData({
                            ...formData,
                            profilePicture: null,
                            profilePictureBase64: null
                          });
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
                {errors.profile_picture && <span className="error-text">{errors.profile_picture}</span>}
              </div>
            </div>
            
            <button type="submit" className="register-button">
              Create Account
            </button>
          </form>
          
          <div className="login-link">
            Already have an account? <Link to="/login">Log In</Link>
          </div>
        </div>
        
        <div className="register-image-container">
          <div className="register-image">
            <div className="features-list">
              <h2>Why Join Us?</h2>
              <ul>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Personalized movie recommendations</span>
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Create and share your watchlists</span>
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Rate and review your favorite films</span>
                </li>
                <li>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                  <span>Connect with fellow movie enthusiasts</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;