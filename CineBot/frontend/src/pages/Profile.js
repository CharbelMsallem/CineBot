import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [availableGenres, setAvailableGenres] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [likedMovies, setLikedMovies] = useState([]);

  const navigate = useNavigate();
  
  const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;

  // Profile.js - Updated fetchPoster function
  const fetchPoster = async (movieId) => {
    try {
      console.log(`Fetching poster for movie ID: ${movieId}`);
      const res = await fetch(`http://127.0.0.1:8000/api/tmdb/movie/${movieId}/poster/`, {
        headers: { 'Authorization': `Token ${localStorage.getItem('token')}` }
      });
      
      if (!res.ok) {
        console.error(`Failed to fetch poster for movie ID ${movieId}: ${res.status}`);
        throw new Error('Failed to fetch poster');
      }
      
      const data = await res.json();
      return data.poster_url;
    } catch (err) {
      console.error(`Error fetching poster for movie ${movieId}:`, err);
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/auth/profile/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch profile');
    
        const data = await res.json();
        console.log('Profile data received:', data);
        setUser(data);
        setEditedUser({
          username: data.username,
          email: data.email,
          bio: data.bio || '',
          favorite_genres: data.favorite_genres.map(g => g.id)
        });
        setSelectedGenres(data.favorite_genres);
    
        const liked = data.liked_movies || [];
        console.log('Liked movies from API:', liked);
    
        // Explicitly fetch posters for each movie
        const moviesWithPosters = await Promise.all(
          liked.map(async (movie) => {
            if (!movie.id) {
              console.error('Movie is missing ID:', movie);
              return { ...movie, poster: null };
            }
            
            const posterUrl = await fetchPoster(movie.id);
            return { ...movie, poster: posterUrl };
          })
        );
        
        console.log('Movies with posters:', moviesWithPosters);
        setLikedMovies(moviesWithPosters);
        setIsLoading(false);
      } catch (err) {
        console.error('Profile fetch error:', err);
        setErrorMessage('Error loading your profile.');
        setIsLoading(false);
      }
    };

    const fetchGenres = async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/tmdb/genres/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        const data = await res.json();
        setAvailableGenres(data);
      } catch (err) {
        console.error('Genres fetch error:', err);
      }
    };

    fetchProfile();
    fetchGenres();
  }, [navigate, TMDB_API_KEY]);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditedUser({
        username: user.username,
        email: user.email,
        bio: user.bio || '',
        favorite_genres: user.favorite_genres.map(g => g.id)
      });
      setSelectedGenres(user.favorite_genres);
      setImagePreview(null);
      setProfileImage(null);
    }
    setIsEditing(!isEditing);
    setUpdateSuccess(false);
    setErrorMessage('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedUser(prev => ({ ...prev, [name]: value }));
  };

  const handleGenreChange = (e) => {
    const genreId = parseInt(e.target.value);
    const genre = availableGenres.find(g => g.id === genreId);
    if (genre && !selectedGenres.some(g => g.id === genreId)) {
      setSelectedGenres(prev => [...prev, genre]);
      setEditedUser(prev => ({
        ...prev,
        favorite_genres: [...prev.favorite_genres, genreId]
      }));
    }
  };

  const handleRemoveGenre = (genreId) => {
    setSelectedGenres(prev => prev.filter(g => g.id !== genreId));
    setEditedUser(prev => ({
      ...prev,
      favorite_genres: prev.favorite_genres.filter(id => id !== genreId)
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
  
    const formData = new FormData();
    
    // Only add username and email if they've changed
    if (editedUser.username !== user.username) {
      formData.append('username', editedUser.username);
    }
    
    if (editedUser.email !== user.email) {
      formData.append('email', editedUser.email);
    }
    
    // Always include bio (even if empty)
    formData.append('bio', editedUser.bio || '');
    
    // Handle favorite genres properly
    if (editedUser.favorite_genres && editedUser.favorite_genres.length > 0) {
      // Make sure to convert favorite_genres to JSON if needed
      formData.append('favorite_genres', JSON.stringify(editedUser.favorite_genres));
    }
    
    // Only append profile picture if a new one was selected
    if (profileImage) {
      formData.append('profile_picture', profileImage);
    }
  
    try {
      console.log("Sending profile update with data:", Object.fromEntries(formData));
      
      const res = await fetch('http://127.0.0.1:8000/api/auth/profile/', {
        method: 'PUT',
        headers: { 
          'Authorization': `Token ${token}`
        },
        body: formData
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Profile update error:', errorData);
        throw new Error(errorData.error || 'Failed to update profile');
      }
  
      const updatedUser = await res.json();
      setUser(updatedUser);
      setEditedUser({
        username: updatedUser.username,
        email: updatedUser.email,
        bio: updatedUser.bio || '',
        favorite_genres: updatedUser.favorite_genres.map(g => g.id)
      });
      setSelectedGenres(updatedUser.favorite_genres);
      
      // Re-fetch posters for liked movies
      const likedWithPosters = await Promise.all(
        (updatedUser.liked_movies || []).map(async movie => {
          const poster = await fetchPoster(movie.id);
          return { ...movie, poster };
        })
      );
      setLikedMovies(likedWithPosters);
      
      setUpdateSuccess(true);
      setIsEditing(false);
      setProfileImage(null);
      setImagePreview(null);
    } catch (err) {
      console.error('Update error:', err);
      setErrorMessage(`Failed to update profile: ${err.message}`);
    }
  };

  const handleUnlikeMovie = async (movieId) => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/user/movies/${movieId}/unlike/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error('Failed to unlike movie');

      // Remove the unliked movie from state
      setLikedMovies(prev => prev.filter(movie => movie.id !== movieId));
    } catch (err) {
      console.error('Unlike error:', err);
      setErrorMessage('Failed to unlike movie.');
    }
  };

  if (isLoading) {
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

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>My Profile</h1>
        <button onClick={handleEditToggle} className={`edit-button ${isEditing ? 'cancel' : ''}`}>
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      {updateSuccess && <div className="success-message">Profile updated successfully!</div>}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      <div className="profile-content">
        <div className="profile-sidebar">
          <div className="profile-picture-container">
            {isEditing ? (
              <>
                <div className="current-profile-picture">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" />
                  ) : user?.profile_picture ? (
                    <img src={user.profile_picture} alt={user.username} />
                  ) : (
                    <div className="default-profile-picture">{user ? user.username[0].toUpperCase() : '?'}</div>
                  )}
                </div>
                <label className="upload-picture-btn">
                  <input type="file" accept="image/*" onChange={handleImageChange} />
                  Change Picture
                </label>
              </>
            ) : (
              <>
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt={user.username} />
                ) : (
                  <div className="default-profile-picture">{user ? user.username[0].toUpperCase() : '?'}</div>
                )}
              </>
            )}
          </div>
          <div className="joined-date">
            <span>Member since:</span> {user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : ''}
          </div>
        </div>

        <div className="profile-details">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="edit-profile-form">
              <div className="form-group">
                <label>Username</label>
                <input type="text" name="username" value={editedUser.username} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={editedUser.email} onChange={handleInputChange} />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea name="bio" value={editedUser.bio} onChange={handleInputChange} rows="4" />
              </div>
              <div className="form-group">
                <label>Favorite Genres</label>
                <select onChange={handleGenreChange} value="">
                  <option value="" disabled>Select genres</option>
                  {availableGenres.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
                <div className="selected-genres">
                  {selectedGenres.map(g => (
                    <span key={g.id} className="genre-tag">
                      {g.name} <button type="button" onClick={() => handleRemoveGenre(g.id)}>×</button>
                    </span>
                  ))}
                </div>
              </div>
              <button type="submit" className="save-button">Save Changes</button>
            </form>
          ) : (
            <div className="profile-info">
              <div className="info-item"><h3>Username</h3><p>{user.username}</p></div>
              <div className="info-item"><h3>Email</h3><p>{user.email}</p></div>
              <div className="info-item"><h3>Bio</h3><p>{user.bio || 'No bio added yet.'}</p></div>
              <div className="info-item"><h3>Favorite Genres</h3>
                <div className="genre-list">
                  {user.favorite_genres.length > 0 ? user.favorite_genres.map(g => (
                    <span key={g.id} className="genre-badge">{g.name}</span>
                  )) : <p>No favorite genres selected.</p>}
                </div>
              </div>
              <div className="info-item"><h3>Liked Movies</h3>
                {likedMovies.length > 0 ? (
                  <div className="liked-movies-grid">
                    {likedMovies.map(movie => (
                      <div key={movie.id} className="liked-movie-card">
                        <div className="movie-card-content" onClick={() => navigate(`/movie/${movie.id}`)}>
                          {movie.poster ? (
                            <img 
                              src={movie.poster} 
                              alt={movie.title} 
                              className="liked-movie-poster" 
                              onError={(e) => {
                                console.error(`Error loading image for ${movie.title}`);
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentNode.innerHTML = `<div class="movie-placeholder">${movie.title[0]}</div>`;
                              }}
                            />
                          ) : (
                            <div className="movie-placeholder">{movie.title[0]}</div>
                          )}
                          <div className="liked-movie-info">
                            <h4>{movie.title}</h4>
                          </div>
                        </div>
                        <button className="unlike-movie-btn" onClick={(e) => {
                          e.stopPropagation(); 
                          handleUnlikeMovie(movie.id);
                        }}>Unlike</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>You haven't liked any movies yet.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;