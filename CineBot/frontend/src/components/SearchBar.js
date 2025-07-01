import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/SearchBar.css';

const SearchBar = ({ onSearch }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (e) => {
        setSearchTerm(e.target.value);
        if (e.target.value.trim()) {
            setShowResults(true);
        } else {
            setShowResults(false);
            setSearchResults([]);
        }
    };

    useEffect(() => {
        const searchMovies = async () => {
            if (searchTerm.trim()) {
                setIsLoading(true);
                try {
                    const response = await fetch(`http://127.0.0.1:8000/api/tmdb/movies/search/?q=${encodeURIComponent(searchTerm)}`);
                    if (!response.ok) {
                        throw new Error('Search failed');
                    }
                    const data = await response.json();
                    setSearchResults(data);
                    setIsLoading(false);
                } catch (error) {
                    console.error('Search error:', error);
                    setIsLoading(false);
                }
            }
        };

        // Debounce search to avoid too many requests
        const timeoutId = setTimeout(() => {
            if (searchTerm.trim()) {
                searchMovies();
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (searchTerm.trim()) {
            onSearch(searchTerm);
            navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
        }
    };

    const handleResultClick = (movieId) => {
        navigate(`/movie/${movieId}`);
        setShowResults(false);
    };

    // Close results when clicking outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.search-container') && !e.target.closest('.search-results')) {
                setShowResults(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <div className="search-wrapper">
            <form onSubmit={handleSubmit} className="search-form">
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Search for movies..."
                        value={searchTerm}
                        onChange={handleInputChange}
                        className="search-input"
                        aria-label="Search for movies"
                    />
                    <button type="submit" className="search-button" aria-label="Search">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                </div>
                {showResults && searchTerm.trim() && (
                    <div className="search-results">
                        {isLoading ? (
                            <div className="search-loading">Loading...</div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((movie) => (
                                <div 
                                    key={movie.id} 
                                    className="search-result-item"
                                    onClick={() => handleResultClick(movie.id)}
                                >
                                    <div className="search-result-poster">
                                        {movie.poster_url ? (
                                            <img src={movie.poster_url} alt={movie.title} />
                                        ) : (
                                            <div className="no-poster">No Image</div>
                                        )}
                                    </div>
                                    <div className="search-result-info">
                                        <h4>{movie.title}</h4>
                                        <div className="search-result-meta">
                                            <span className="rating">⭐ {movie.rating.toFixed(1)}</span>
                                            {movie.release_date && (
                                                <span className="year">
                                                    {new Date(movie.release_date).getFullYear()}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-results">No movies found</div>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};

export default SearchBar;