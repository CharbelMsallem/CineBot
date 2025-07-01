import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import '../styles/GenreMoviesPage.css';
import SearchBar from '../components/SearchBar';

// Genre mapping for names and IDs
const GENRES = {
  '28': 'Action',
  '35': 'Comedy',
  '10749': 'Romance',
  '27': 'Horror',
  '878': 'Sci-Fi',
  '12': 'Adventure',
  '16': 'Animation',
  '80': 'Crime',
  '99': 'Documentary',
  '18': 'Drama',
  '10751': 'Family',
  '14': 'Fantasy',
  '36': 'History',
  '10402': 'Music',
  '9648': 'Mystery',
  '10752': 'War',
  '37': 'Western',
  '53': 'Thriller'
};

const GenreMoviesPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // State variables
  const [movies, setMovies] = useState([]);
  const [filteredMovies, setFilteredMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(id || 'all');
  const [moviesPerPage, setMoviesPerPage] = useState(20);
  const [totalMovies, setTotalMovies] = useState(0);
  
  // Determine the page title and fetch URL
  const getPageDetails = () => {
    // For genre pages
    if (id && GENRES[id]) {
      return {
        title: `${GENRES[id]} Movies`,
        fetchUrl: `http://127.0.0.1:8000/api/tmdb/genres/${id}/movies/`
      };
    }
    
    // For special categories
    switch(id) {
      case 'popular':
        return {
          title: 'Popular Movies',
          fetchUrl: 'http://127.0.0.1:8000/api/tmdb/movies/popular/'
        };
      case 'top-rated':
        return {
          title: 'Top Rated Movies',
          fetchUrl: 'http://127.0.0.1:8000/api/tmdb/movies/top-rated/'
        };
      default:
        return {
          title: 'All Movies',
          fetchUrl: 'http://127.0.0.1:8000/api/tmdb/movies/popular/' // Default to popular as fallback
        };
    }
  };
  
  const { title, fetchUrl } = getPageDetails();
  
  // Fetch movies based on current parameters
  useEffect(() => {
    const fetchMovies = async () => {
      if (!fetchUrl) {
        setError('Invalid category');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Add pagination and limit parameters to the URL
        const paginatedUrl = `${fetchUrl}?page=${page}&limit=${moviesPerPage}`;
        const response = await fetch(paginatedUrl);
        
        if (!response.ok) {
          throw new Error('Failed to fetch movies');
        }
        
        const data = await response.json();
        
        if (page === 1) {
          setMovies(data);
          setFilteredMovies(data);
        } else {
          // Append new movies to existing list
          const updatedMovies = [...movies, ...data];
          setMovies(updatedMovies);
          
          // Apply current filters to the new combined dataset
          applyFilters(updatedMovies, searchQuery, selectedGenre);
        }
        
        setTotalMovies(prev => prev + data.length);
        
        // If we received fewer movies than requested, there are no more pages
        setHasMore(data.length >= moviesPerPage);
        setError(null);
      } catch (err) {
        console.error('Error fetching movies:', err);
        setError('Failed to load movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMovies();
  }, [fetchUrl, page, moviesPerPage]);
  
  // Function to apply both search and genre filters
  const applyFilters = (movieData, query, genre) => {
    let results = [...movieData];
    
    // Apply search filter if query exists
    if (query && query.trim() !== '') {
      const lowerCaseQuery = query.toLowerCase().trim();
      results = results.filter(movie => 
        movie.title.toLowerCase().includes(lowerCaseQuery)
      );
    }
    
    // Apply genre filter if not 'all' and not already on a genre page
    if (genre !== 'all' && genre !== id) {
      results = results.filter(movie => 
        movie.genre_ids && movie.genre_ids.includes(Number(genre))
      );
    }
    
    setFilteredMovies(results);
  };
  
  // Handle search input
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(movies, query, selectedGenre);
  };
  
  // Handle genre selection
  const handleGenreChange = (e) => {
    const genre = e.target.value;
    setSelectedGenre(genre);
    
    // If changing to a different specific genre page, navigate there
    if (genre !== 'all' && genre !== id) {
      navigate(`/genre/${genre}`);
    } else {
      // Just filter the current results
      applyFilters(movies, searchQuery, genre);
    }
  };
  
  // Handle movies per page change
  const handleMoviesPerPageChange = (e) => {
    const value = parseInt(e.target.value);
    setMoviesPerPage(value);
    setPage(1); // Reset to first page when changing this setting
    setMovies([]); // Clear movies to fetch with new limit
  };
  
  // Load more movies
  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
    }
  };
  
  return (
    <div className="genre-page">
      <div className="genre-header">
        <h1>{title}</h1>
        <div className="genre-description">
          <p>Discover the best {title.toLowerCase()} for your next movie night</p>
        </div>
      </div>
      
      {/* Filters and Search Section */}
      <div className="filters-section">
        <SearchBar
          placeholder="Search for movies..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="search-bar"
        />
        
        <div className="filters-container">
          <div className="filter-group">
            <label htmlFor="genre-select">Genre:</label>
            <select 
              id="genre-select" 
              value={selectedGenre} 
              onChange={handleGenreChange}
              className="filter-select"
            >
              <option value="all">All Genres</option>
              {Object.entries(GENRES).map(([genreId, genreName]) => (
                <option key={genreId} value={genreId}>
                  {genreName}
                </option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label htmlFor="count-select">Show:</label>
            <select 
              id="count-select" 
              value={moviesPerPage} 
              onChange={handleMoviesPerPageChange}
              className="filter-select"
            >
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={40}>40 per page</option>
              <option value={60}>60 per page</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Results stats */}
      <div className="results-stats">
        Showing {filteredMovies.length} {filteredMovies.length === 1 ? 'movie' : 'movies'}
        {searchQuery && <span> for "{searchQuery}"</span>}
      </div>
      
      {/* Loading state for initial load */}
      {loading && page === 1 ? (
        <div className="loading-container">
          <div className="loading-animation">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="error-icon">!</div>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={() => setPage(1)}>Try Again</button>
        </div>
      ) : (
        <>
          {/* No results message */}
          {filteredMovies.length === 0 && !loading && (
            <div className="no-results">
              <h3>No movies found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
          
          {/* Movies Grid */}
          <div className="movies-grid">
            {filteredMovies.map(movie => (
              <div className="movie-card" key={movie.id}>
                <a href={`/movie/${movie.id}`} className="movie-link">
                  <div className="poster-container">
                    <img 
                      src={movie.poster_url || '/placeholder-poster.jpg'} 
                      alt={movie.title} 
                      className="movie-poster" 
                    />
                    <div className="movie-overlay">
                      <div className="rating-badge">★ {movie.rating?.toFixed(1) || '0.0'}</div>
                      <button className="details-btn">View Details</button>
                    </div>
                  </div>
                  <div className="movie-title">{movie.title}</div>
                </a>
              </div>
            ))}
          </div>
          
          {/* Load More Button */}
          {hasMore && filteredMovies.length > 0 && (
            <div className="load-more-container">
              <button 
                className="load-more-btn" 
                onClick={loadMore} 
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
          
          {/* Loading indicator for when loading more */}
          {loading && page > 1 && (
            <div className="loading-more">
              <div className="loading-animation">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default GenreMoviesPage;