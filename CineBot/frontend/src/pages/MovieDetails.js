import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/MovieDetails.css';

const MovieDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [likeInProgress, setLikeInProgress] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // STATE VARIABLES FOR REVIEW
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [newReview, setNewReview] = useState({
    rating: null,
    comment: ''
  });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [userReview, setUserReview] = useState(null);

  // Check login status and fetch movie details
  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);

    // Get user ID if logged in
    if (token) {
      fetch('http://127.0.0.1:8000/api/auth/profile/', {
        headers: { 'Authorization': `Token ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch profile');
          return res.json();
        })
        .then(userData => {
          setUserId(userData.id);
        })
        .catch(err => console.error('Error fetching user data:', err));
    }

    // Fetch movie details
    fetch(`http://127.0.0.1:8000/api/tmdb/movie/${id}/`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch movie details');
        }
        return response.json();
      })
      .then(data => {
        setMovie(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching movie details:', error);
        setLoading(false);
      });
      
    // Fetch reviews for this movie
    fetchReviews();
  }, [id]);

  // Fetch reviews for the movie
  const fetchReviews = () => {
    setReviewsLoading(true);
    fetch(`http://127.0.0.1:8000/api/reviews/?movie=${id}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch reviews');
        }
        return response.json();
      })
      .then(data => {
        setReviews(data);
        setReviewsLoading(false);
        
        // Check if the logged-in user has already reviewed this movie
        if (userId) {
          const userReviewData = data.find(review => review.user === userId);
          if (userReviewData) {
            setUserReview(userReviewData);
            setNewReview({
              rating: userReviewData.rating,
              comment: userReviewData.comment
            });
          } else {
            setUserReview(null);
          }
        }
      })
      .catch(error => {
        console.error('Error fetching reviews:', error);
        setReviewsLoading(false);
      });
  };

  // Check if movie is liked when user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Only check liked status if logged in
    if (token) {
      fetch('http://127.0.0.1:8000/api/auth/profile/', {
        headers: { 'Authorization': `Token ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch profile');
          return res.json();
        })
        .then(userData => {
          const likedMovies = userData.liked_movies || [];
          setIsLiked(likedMovies.some(m => m.id === parseInt(id)));
        })
        .catch(err => console.error('Error checking liked status:', err));
    } else {
      // If not logged in, reset liked status
      setIsLiked(false);
    }
  }, [id, isLoggedIn]);

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    
    // If not logged in, redirect to login page
    if (!token) {
      navigate('/login', { state: { redirectTo: `/movie/${id}` } });
      return;
    }

    setLikeInProgress(true);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/user/movies/${id}/like/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      console.log('Movie liked:', data);
      setIsLiked(true);
    } catch (error) {
      console.error('Error liking movie:', error);
      alert('Error liking movie. Please try again.');
    } finally {
      setLikeInProgress(false);
    }
  };

  const handleUnlike = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsLiked(false);
      return;
    }
    
    setLikeInProgress(true);
    
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/user/movies/${id}/unlike/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      
      const data = await response.json();
      console.log('Movie unliked:', data);
      setIsLiked(false);
    } catch (error) {
      console.error('Error unliking movie:', error);
      alert('Error unliking movie. Please try again.');
    } finally {
      setLikeInProgress(false);
    }
  };
  
  // Handle change in review form inputs
  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setNewReview(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle rating change
  const handleRatingChange = (rating) => {
    setNewReview(prev => ({
      ...prev,
      rating: rating
    }));
  };
  
  // Submit a new review or update existing one
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login', { state: { redirectTo: `/movie/${id}` } });
      return;
    }
    
    setSubmittingReview(true);
    
    try {
      // First, ensure the movie exists in our database
      const addToReviewResponse = await fetch(`http://127.0.0.1:8000/api/user/movies/${id}/review/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!addToReviewResponse.ok) {
        console.error('Error ensuring movie exists:', await addToReviewResponse.json());
        throw new Error('Failed to prepare movie for review');
      }
      
      // Now proceed with submitting/updating the review
      let url = 'http://127.0.0.1:8000/api/reviews/';
      let method = 'POST';
      
      // If user already has a review for this movie, update it instead
      if (userReview) {
        url = `http://127.0.0.1:8000/api/reviews/${userReview.id}/`;
        method = 'PUT';
      }
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          movie: parseInt(id),
          rating: parseInt(newReview.rating),
          comment: newReview.comment
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Review submission error:', errorData);
        
        if (errorData.non_field_errors && errorData.non_field_errors[0].includes('unique')) {
          alert('You have already reviewed this movie. You can only submit one review per movie.');
        } else {
          throw new Error('Bad request: ' + JSON.stringify(errorData));
        }
        return;
      }
      
      // Reset form and fetch updated reviews
      alert(userReview ? 'Review updated successfully!' : 'Review submitted successfully!');
      
      // If this was a new review, get the new review details
      if (!userReview) {
        const newReviewData = await response.json();
        setUserReview(newReviewData);
      }
      
      // Refetch reviews to update the UI
      fetchReviews();
      
    } catch (error) {
      console.error('Error submitting review:', error);
      alert('Error submitting review: ' + error.message);
    } finally {
      setSubmittingReview(false);
    }
  };
  
  // UPDATED: Improved star rendering function
  const renderStars = (rating) => {
    return (
      <div className="star-display">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className="star-icon">
            {star <= rating ? (
              <i className="fa fa-star" style={{ color: '#f5c518' }}></i>
            ) : (
              <i className="fa fa-star-o" style={{ color: '#ccc' }}></i>
            )}
          </span>
        ))}
      </div>
    );
  };
  
  // Format date to readable format
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  if (loading || !movie) {
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
    <div className="movie-details-details-container">
      {/* Backdrop image */}
      {movie.backdrop_path && (
        <div className="backdrop" style={{ backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path})` }}></div>
      )}
      
      <div className="content-wrapper">
        <div className="movie-details-header">
          {/* Movie poster with rating badge */}
          <div className="poster-container">
            <img src={movie.poster_url} alt={movie.title} className="movie-details-poster" />
            <div className="details-rating-badge">{movie.rating.toFixed(1)}</div>
          </div>
          
          {/* Movie information section */}
          <div className="movie-details-info">
            <h1 className="movie-details-title">{movie.title}</h1>
            {movie.tagline && <p className="movie-details-tagline">"{movie.tagline}"</p>}
            
            <div className="movie-details-meta">
              <span className="release-date">{movie.release_date}</span>
              {movie.runtime && <span className="runtime">{movie.runtime} min</span>}
              <span className="genres">{movie.genres.join(', ')}</span>
            </div>
            
            <div className="movie-details-actions">
              <button className="btn-primary">
                <i className="fa fa-play"></i> Watch Trailer
              </button>
              
              {/* Conditional rendering of Like/Unlike button */}
              {isLoggedIn ? (
                isLiked ? (
                  <button 
                    className="btn-secondary unlike" 
                    onClick={handleUnlike} 
                    style={{backgroundColor: '#f44336'}}
                    disabled={likeInProgress}
                  >
                    <i className="fa fa-heart"></i> Unlike Movie
                  </button>
                ) : (
                  <button 
                    className="btn-secondary" 
                    onClick={handleLike}
                    disabled={likeInProgress}
                  >
                    <i className="fa fa-heart"></i> Like Movie
                  </button>
                )
              ) : (
                <button className="btn-secondary" onClick={() => navigate('/login')}>
                  <i className="fa fa-sign-in"></i> Login to Like
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="movie-details-body">
          {/* Overview section */}
          <section className="movie-details-overview">
            <h2>Overview</h2>
            <p>{movie.plot}</p>
          </section>
          
          {/* Movie stats section */}
          <section className="movie-details-stats">
            <div className="stat-item">
              <h3>Budget</h3>
              <p>${movie.budget ? movie.budget.toLocaleString() : 'N/A'}</p>
            </div>
            <div className="stat-item">
              <h3>Revenue</h3>
              <p>${movie.revenue ? movie.revenue.toLocaleString() : 'N/A'}</p>
            </div>
            <div className="stat-item">
              <h3>Status</h3>
              <p>{movie.status || 'Released'}</p>
            </div>
            <div className="stat-item">
              <h3>Release Date</h3>
              <p>{movie.release_date}</p>
            </div>
          </section>
          
          {/* Cast section */}
          {movie.cast && movie.cast.length > 0 && (
            <section className="cast-section">
              <h2>Cast</h2>
              <div className="cast-grid">
                {movie.cast.map(actor => (
                  <div key={actor.id} className="cast-card">
                    {actor.profile_url && (
                      <img src={actor.profile_url} alt={actor.name} className="actor-image" />
                    )}
                    <h3 className="actor-name">{actor.name}</h3>
                    <p className="character-name">{actor.character}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
          
          {/* Reviews/Comments Section */}
          <section className="reviews-section">
            <h2>User Reviews</h2>
            
            {/* Add review form */}
            {isLoggedIn ? (
              <div className="add-review-container">
                <h3>{userReview ? 'Edit Your Review' : 'Add Your Review'}</h3>
                <form onSubmit={handleSubmitReview} className="review-form">
                  <div className="rating-selector">
                    <label>Your Rating:</label>
                    {/* UPDATED: Improved star rating selector */}
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span 
                          key={star}
                          className={`star ${star <= newReview.rating ? 'active' : ''}`}
                          onClick={() => handleRatingChange(star)}
                        >
                          {star <= newReview.rating ? (
                            <i className="fa fa-star" style={{color: '#f5c518', fontSize: '24px'}}></i>
                          ) : (
                            <i className="fa fa-star-o" style={{color: '#ccc', fontSize: '24px'}}></i>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="comment-input">
                    <label htmlFor="comment">Your Review:</label>
                    <textarea
                      id="comment"
                      name="comment"
                      value={newReview.comment}
                      onChange={handleReviewChange}
                      placeholder="Share your thoughts about this movie..."
                      required
                    ></textarea>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn-primary" 
                    disabled={submittingReview}
                  >
                    {submittingReview ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="login-to-review">
                <p>Please <button onClick={() => navigate('/login')} className="link-button">login</button> to add your review</p>
              </div>
            )}
            
            {/* Display existing reviews */}
            <div className="reviews-container">
              <h3>All Reviews ({reviews.length})</h3>
              
              {reviewsLoading ? (
                <div className="reviews-loading">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="no-reviews">
                  <p>No reviews yet. Be the first to review this movie!</p>
                </div>
              ) : (
                <div className="reviews-list">
                  {reviews.map(review => (
                    <div key={review.id} className="review-card">
                      <div className="review-header">
                        <div className="reviewer-info">
                          <h4 className="reviewer-name">{review.username}</h4>
                          {/* UPDATED: Using the improved star rendering */}
                          <div className="review-rating">
                            {renderStars(review.rating)}
                          </div>
                        </div>
                        <span className="review-date">{formatDate(review.created_at)}</span>
                      </div>
                      <div className="review-content">
                        <p>{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MovieDetails;