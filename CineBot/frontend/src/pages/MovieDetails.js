import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import '../styles/MovieDetails.css';

const MovieDetails = () => {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);

  useEffect(() => {
    fetch(`http://127.0.0.1:8000/api/movies/fetch_movie/${id}/`)
      .then(res => res.json())
      .then(data => setMovie(data));
  }, [id]);

  if (!movie) return <div>Loading...</div>;

  return (
    <div className="movie-details">
      <h2>{movie.title}</h2>
      <img src={movie.poster_url} alt={movie.title} />
      <p><strong>Genres:</strong> {movie.genres.join(', ')}</p>
      <p><strong>Plot:</strong> {movie.plot}</p>
      <p><strong>Rating:</strong> {movie.rating}</p>
      <p><strong>Release Date:</strong> {movie.release_date}</p>
    </div>
  );
};

export default MovieDetails;