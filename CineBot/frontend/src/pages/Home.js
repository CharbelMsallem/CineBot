import { useState, useEffect, useCallback } from 'react';
import MovieCarousel from '../components/MovieCarousel';
import SearchBar from '../components/SearchBar';
import '../styles/Navbar.css';
import '../styles/Home.css';

const GENRE_IDS = {
  ACTION: 28,
  COMEDY: 35,
  ROMANCE: 10749,
  HORROR: 27,
  SCIFI: 878,
};

const Home = () => {
  const [movies, setMovies] = useState({
    popular: [],
    topRated: [],
    comedy: [],
    romance: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoints = [
        { key: 'popular', url: 'http://127.0.0.1:8000/api/tmdb/movies/popular/' },
        { key: 'topRated', url: 'http://127.0.0.1:8000/api/tmdb/movies/top-rated/' },
        { key: 'comedy', url: `http://127.0.0.1:8000/api/tmdb/genres/${GENRE_IDS.COMEDY}/movies/` },
        { key: 'romance', url: `http://127.0.0.1:8000/api/tmdb/genres/${GENRE_IDS.ROMANCE}/movies/` },
      ];
      
      const responses = await Promise.all(
        endpoints.map(({ url }) => fetch(url).then(res => res.ok ? res.json() : Promise.reject(res.statusText)))
      );
      
      setMovies({
        popular: responses[0],
        topRated: responses[1],
        comedy: responses[2],
        romance: responses[3],
      });
      setError(null);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load movies. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleSearch = async (query) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/tmdb/movies/search/?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error('Search error:', error);
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">!</div>
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={fetchAllData}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1>Discover Your Next Favorite Movie</h1>
          <p>Explore thousands of movies across all genres</p>
          <SearchBar onSearch={handleSearch} />
        </div>
      </div>
      <div className="categories-container">
        <MovieCarousel title="Popular Right Now" movies={movies.popular} showRank={true} />
        <MovieCarousel title="Top Rated" movies={movies.topRated} />
        <MovieCarousel title="Comedy Movies" movies={movies.comedy} genreId={GENRE_IDS.COMEDY} />
        <MovieCarousel title="Romance Movies" movies={movies.romance} genreId={GENRE_IDS.ROMANCE} />
      </div>
    </div>
  );
};

export default Home;