import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MovieCarousel from '../components/MovieCarousel';
import '../styles/Home.css';

// Genre IDs for TMDb API
const GENRE_IDS = {
  ACTION: 28,
  COMEDY: 35,
  ROMANCE: 10749,
  HORROR: 27,
  SCIFI: 878
};

const Home = () => {
  const [search, setSearch] = useState('');
  const [popularMovies, setPopularMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [comedyMovies, setComedyMovies] = useState([]);
  const [romanceMovies, setRomanceMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        // Fetch all required data in parallel
        const [popularRes, topRatedRes, comedyRes, romanceRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/movies/popular/'),
          fetch('http://127.0.0.1:8000/api/movies/top-rated/'),
          fetch(`http://127.0.0.1:8000/api/movies/genre/${GENRE_IDS.COMEDY}/`),
          fetch(`http://127.0.0.1:8000/api/movies/genre/${GENRE_IDS.ROMANCE}/`)
        ]);
        
        // Check for any failed requests
        if (!popularRes.ok || !topRatedRes.ok || !comedyRes.ok || !romanceRes.ok) {
          throw new Error('One or more API requests failed');
        }
        
        // Parse all responses
        const popularData = await popularRes.json();
        const topRatedData = await topRatedRes.json();
        const comedyData = await comedyRes.json();
        const romanceData = await romanceRes.json();
        
        // Update state with fetched data
        setPopularMovies(popularData);
        setTopRatedMovies(topRatedData);
        setComedyMovies(comedyData);
        setRomanceMovies(romanceData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load movies. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAllData();
  }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };
  
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?query=${encodeURIComponent(search)}`);
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
        <p>Loading amazing movies for you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">!</div>
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Discover Your Next Favorite Movie</h1>
          <p>Explore thousands of movies across all genres</p>
          <form onSubmit={handleSearchSubmit} className="search-form">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search for movies..."
                value={search}
                onChange={handleSearch}
                className="search-input"
              />
              <button type="submit" className="search-button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="categories-container">
        <MovieCarousel 
          title="Popular Right Now" 
          movies={popularMovies} 
          showRank={true} 
        />
        
        <MovieCarousel 
          title="Top Rated" 
          movies={topRatedMovies} 
        />
        
        <MovieCarousel 
          title="Comedy Movies" 
          movies={comedyMovies} 
          genreId={GENRE_IDS.COMEDY} 
        />
        
        <MovieCarousel 
          title="Romance Movies" 
          movies={romanceMovies} 
          genreId={GENRE_IDS.ROMANCE} 
        />
      </div>
    </div>
  );
};

export default Home;