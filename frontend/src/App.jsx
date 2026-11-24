import { useState } from 'react';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('furniture_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLoginSuccess = (user) => {
    localStorage.setItem('furniture_user', JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('furniture_user');
    setCurrentUser(null);
  };

  const isAdmin = currentUser && (Number(currentUser.role_id) === 2 || currentUser.role_name === 'admin');

  if (isAdmin) {
    return <AdminLayout currentUser={currentUser} onLogout={handleLogout} />;
  }

  return (
    <UserLayout
      currentUser={currentUser}
      onLoginSuccess={handleLoginSuccess}
      onLogout={handleLogout}
    />
  );
}