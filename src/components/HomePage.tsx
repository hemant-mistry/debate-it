import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as signalR from "@microsoft/signalr";

function HomePage() {
  const [isJoinRoom, setIsJoinRoom] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomKey, setRoomKey] = useState("");
  const [topic, setTopic] = useState("");
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const navigate = useNavigate();
  const userEmail = localStorage.getItem("UserEmail");
  const inferredName = "duality";

  useEffect(() => {
    if (userEmail) {
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${import.meta.env.VITE_TWIST_IT_BACKEND_URL}/roomhub`)
        .withAutomaticReconnect()
        .build();
      setConnection(newConnection);
    } else {
      console.error("User email is not available");
    }
  }, [userEmail]);

  useEffect(() => {
    if (connection) {
      connection
        .start()
        .then(() => {
          console.log("Connected to SignalR hub");
          connection.on("SendMessageToClient", (message: string) => {
            console.log(message);
          });
        })
        .catch((err) => console.error("Connection failed: ", err));
    }
  }, [connection]);

  const handleJoinRoom = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_TWIST_IT_BACKEND_URL}/api/rooms/join-room`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerName, roomKey }),
      }
    );

    if (response.ok) {
      if (connection) {
        connection
          .invoke("JoinRoom", roomKey, userEmail, playerName)
          .then(() => {
            console.log("Joined room successfully");
            navigate(`/hub/${roomKey}`);
          })
          .catch((err) => console.error("JoinRoom failed: ", err));
      }
    } else {
      console.error("Failed to join room");
    }
  };

  const handleCreateRoom = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_TWIST_IT_BACKEND_URL}/api/rooms/create-room`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerName, topic }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const createdRoomKey = data.room.roomKey;
      if (connection) {
        connection
          .invoke("JoinRoom", createdRoomKey, userEmail, inferredName)
          .then(() => {
            console.log("Created and joined room successfully");
            navigate(`/hub/${createdRoomKey}`);
          })
          .catch((err) => console.error("JoinRoom failed: ", err));
      }
    } else {
      console.error("Failed to create room");
    }
  };

  return (
    <div className="flex justify-center items-center">
      <div className="card flex items-center bg-black shadow-xl p-4 justify-center mt-[150px] w-[300px]">
        <div className="flex-row card-body">
          <button
            className={`btn ${isJoinRoom ? "btn-ghost" : "btn-secondary"} btn-sm`}
            onClick={() => setIsJoinRoom(false)}
          >
            Create Room
          </button>
          <button
            className={`btn ${isJoinRoom ? "btn-secondary" : "btn-ghost"} btn-sm`}
            onClick={() => setIsJoinRoom(true)}
          >
            Join Room
          </button>
        </div>
        {isJoinRoom ? (
          <div className="flex flex-col gap-4">
            <div className="label">
              <span className="label-text">Enter your name:</span>
            </div>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="input input-bordered"
            />
            <div className="label">
              <span className="label-text">Enter room key:</span>
            </div>
            <input
              type="text"
              value={roomKey}
              onChange={(e) => setRoomKey(e.target.value)}
              className="input input-bordered"
            />
            <button className="btn btn-primary" onClick={handleJoinRoom}>
              Join Room
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="label">
              <span className="label-text">Enter your name:</span>
            </div>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="input input-bordered"
            />
            <div className="label">
              <span className="label-text">Enter topic:</span>
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="input input-bordered"
            />
            <button className="btn btn-primary" onClick={handleCreateRoom}>
              Create Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;