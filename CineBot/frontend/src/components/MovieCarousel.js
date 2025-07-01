import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import '../styles/MovieCarousel.css';

const MovieCarousel = ({ title, movies, showRank = false, genreId = null, nbOfMovies }) => {
  const navigate = useNavigate();
  
  const handleViewMore = () => {
    if (genreId) {
      navigate(`/genre/${genreId}`);
    } else if (title.includes("Popular")) {
      navigate('/popular');
    } else if (title.includes("Top Rated")) {
      navigate('/top-rated');
    }
  };
  
  return (
    <div className="carousel-section">
      <div className="category-header">
        <h2>{title}</h2>
        <button className="view-more-btn" onClick={handleViewMore}>
          View More
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>
      </div>
      <div className="carousel-container">
        <div className="carousel">
          {movies.map((movie, index) => (
            <Link to={`/movie/${movie.id}`} key={movie.id} className="carousel-item">
              <div className="movie-card">
                {showRank && (
                  <div className="rank-badge">#{movie.rank}</div>
                )}
                <div className="poster-container">
                  <img src={movie.poster_url || '/placeholder-poster.jpg'} alt={movie.title} className="movie-poster" />
                  <div className="movie-overlay">
                    <div className="rating-badge">★ {movie.rating.toFixed(1)}</div>
                  </div>
                </div>
                <div className="movie-title">{movie.title}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MovieCarousel;