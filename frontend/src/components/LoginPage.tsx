import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
      });

      if (error) {
        console.error("Sign in error:", error.message);
      } else {
        console.log("Sign in started:", data);
        // Supabase will redirect for OAuth. If you want to navigate after successful sign-in,
        // you might handle it after redirect or in an auth-state listener.
        navigate("/");
      }
    } catch (err: any) {
      console.error("Unexpected error:", err?.message ?? err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center bg-base-100 py-12 px-4 mt-[100px]">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="badge badge-accent text-white px-3 py-1 rounded-full mb-3 text-xs font-medium">
            Beta release
          </div>

          <h1 className="text-2xl md:text-3xl font-semibold text-center leading-tight text-neutral mb-1">
            Welcome to <i className="not-italic text-primary">Debate</i> it
          </h1>

          <p className="text-sm text-muted text-center mt-1">
            Sign in to create or join a debate room
          </p>
        </div>

        {/* Body */}
        <div className="space-y-4">
          <p className="text-sm text-neutral">
            Click the button below to sign in with Google and <span className="underline">start debating</span>.
          </p>

          <button
            onClick={handleGoogleSignIn}
            className="btn w-full flex items-center justify-center gap-3 px-4 py-2"
            disabled={loading}
            aria-busy={loading}
            aria-label="Sign in with Google"
          >
            {/* Spinner (visible while loading) */}
            {loading ? (
              <svg
                className="animate-spin h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden
              >
                <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="4" />
                <path d="M22 12a10 10 0 00-10-10" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
              </svg>
            ) : (
              // Google logo (keeps the colorful google icon)
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 48 48"
                width="20"
                height="20"
                aria-hidden
                className="rounded-sm"
              >
                <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
              </svg>
            )}

            <span className="font-medium">
              {loading ? "Signing in..." : "Sign in with Google"}
            </span>
          </button>

          <div className="text-xs text-center text-muted">
            By signing in you agree to our <span className="underline cursor-pointer">Privacy Policy</span>.
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
