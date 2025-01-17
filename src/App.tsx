import "./App.css";
import SamplePage from "./components/SamplePage";
import HomePage from "./components/HomePage";
import LoginPage from "./components/LoginPage";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useDispatch } from "react-redux";
import { setUserEmail } from "./redux/slices/authSlice";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import PlaygroundPage from "./components/PlaygroundPage";
import * as signalR from "@microsoft/signalr";


function App() {
  const dispatch = useDispatch();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
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

  useEffect(() => {

        const newConnection = new signalR.HubConnectionBuilder()
          .withUrl(`${import.meta.env.VITE_TWIST_IT_BACKEND_URL}/roomhub`)
          .withAutomaticReconnect()
          .build();
        setConnection(newConnection);

        newConnection
        .start()
        .then(()=>{
          console.log("Connected to SignalR Hub");
        })
        .catch((err)=> console.log("Connection failed: ", err));
      },[]);
 
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage signalRConnection={connection}/>}/>
          <Route path="/sample" element={<SamplePage/>}/>
          <Route path="/login" element={<LoginPage/>}/>
          <Route path="/hub/:roomKey" element={<PlaygroundPage signalRConnection={connection}/>}/>
        </Routes>

      </BrowserRouter>
      
    </>
  );
}

export default App;
