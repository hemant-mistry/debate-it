import "./App.css";
import SamplePage from "./components/SamplePage";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import { useEffect } from "react";
import { supabase } from "./supabaseClient";
import { useDispatch } from "react-redux";
import { setUserEmail } from "./redux/slices/authSlice";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import PlaygroundPage from "./components/PlaygroundPage";
import JoinedPage from "./components/JoinedPage";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error.message);
      } else if (data?.user?.email) {
        dispatch(setUserEmail(data.user.email));
        localStorage.setItem("UserEmail", data.user.email);
      }
    };

    fetchUser();
  }, []);
 
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage/>}/>
          <Route path="/sample" element={<SamplePage/>}/>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/hub/:roomKey" element={<JoinedPage/>}/>
        </Routes>

      </BrowserRouter>
      
    </>
  );
}

export default App;
