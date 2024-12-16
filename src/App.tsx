import './App.css';
import { useState, useEffect } from 'react';
import LoginPage from './components/LoginPage';
import { supabase } from './supabaseClient';
import { User } from '@supabase/auth-js'; // Import the User type

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error.message);
      } else if (data?.user) {
        setUser(data.user); // Use the Supabase User type
      }
    };

    fetchUser();
  }, []);

  return (
    <>
      {user ? (
        <div>
          <h1>Welcome, {user.email ?? 'Guest'}!</h1> {/* Handle undefined email */}
        </div>
      ) : (
        <LoginPage />
      )}
    </>
  );
}

export default App;
