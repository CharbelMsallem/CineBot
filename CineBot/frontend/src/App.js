import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ChatBot from './components/ChatBot';
import Login from './pages/Login';
import Register from './pages/Register';
import MovieDetails from './pages/MovieDetails';
import Profile from './pages/Profile';
import GenreMoviesPage from './pages/GenreMoviesPage';
import './styles/App.css';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/movie/:id" element={<MovieDetails />} />
          <Route path="/profile" element={<Profile />} />
          
          {/* Updated routes for genre pages */}
          <Route path="/genre/:id" element={<GenreMoviesPage />} />

          {/* New routes for special categories */}
          <Route path="/popular" element={<GenreMoviesPage />} />
          <Route path="/top-rated" element={<GenreMoviesPage />} />
        </Routes>
        <ChatBot />
      </Router>
    </AuthProvider>
  );
}

export default App;