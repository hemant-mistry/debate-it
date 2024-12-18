import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

function LoginPage() {

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });

      if (error) {
        setMessage(`Error: ${error.message}`);
      } else {
        setMessage('SignUp successful!');
        console.log("User signed in with Google:", data);
        navigate('/');
      }
    } catch (err: any) {
    setMessage(`Unexpected error: ${err.message}`);
    }finally {
        setLoading(false);
      }
  };

  return (
    <>
      <div>
      <button 
        className="btn btn-primary" 
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'SignUp via email'}
      </button>
      {message && <p>{message}</p>}
    </div>
    </>
  );
}

export default LoginPage;
