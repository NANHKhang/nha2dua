import { useState } from 'react';
import UserLayout from './layouts/UserLayout';
import AdminLayout from './layouts/AdminLayout';

export default function App() {
  // 'user' = Giao diện cửa hàng khách hàng, 'admin' = Giao diện quản trị viên
  const [layout, setLayout] = useState('user');
  const [currentUser, setCurrentUser] = useState(null);

  if (layout === 'admin') {
    return <AdminLayout onSwitchToUser={() => setLayout('user')} />;
  }

  return (
    <UserLayout
      currentUser={currentUser}
      setCurrentUser={setCurrentUser}
      onSwitchToAdmin={() => setLayout('admin')}
    />
  );
}