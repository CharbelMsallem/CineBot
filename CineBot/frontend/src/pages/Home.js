import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Home.css';

const Home = () => {
  const [movies, setMovies] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/movies/random/')
      .then(res => res.json())
      .then(data => setMovies(data));
  }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const filteredMovies = movies.filter(movie =>
    movie.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="home">
      <input
        type="text"
        placeholder="Search movies..."
        value={search}
        onChange={handleSearch}
      />
      <div className="movie-grid">
        {filteredMovies.map(movie => (
          <Link to={`/movie/${movie.id}`} key={movie.id}>
            <div className="movie-card">
              <img src={movie.poster_url} alt={movie.title} />
              <h3>{movie.title}</h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Home;