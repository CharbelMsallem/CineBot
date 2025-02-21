import { useState, useEffect } from 'react';
import '../styles/Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch('http://127.0.0.1:8000/api/auth/profile/', {
      headers: { 'Authorization': `Token ${token}` }
    })
      .then(res => res.json())
      .then(data => setUser(data));
  }, []);

  if (!user) return <div>Loading profile...</div>;

  return (
    <div className="profile">
      <h2>Welcome, {user.username}</h2>
      <p>Email: {user.email}</p>
    </div>
  );
};

export default Profile;
