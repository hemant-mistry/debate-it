import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUsers } from "../redux/slices/roomSlice";
import { UserDetails } from "../types/User";
import Guide from "./ui/Guide";

interface HomePageProps {
  signalRConnection: signalR.HubConnection | null;
}

function HomePage({ signalRConnection }: HomePageProps) {
  const [isJoinRoom, setIsJoinRoom] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomKey, setRoomKey] = useState("");
  const [topic, setTopic] = useState("");

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const userEmail = localStorage.getItem("UserEmail");

  useEffect(() => {
    if (signalRConnection) {
      signalRConnection.on("SendUpdatedUserList", (users: UserDetails[]) => {
        console.log("Sendupdatedlist");
        dispatch(setUsers(users));
      });
    }
  }, [signalRConnection, dispatch]);

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
      if (signalRConnection) {
        try {
          await signalRConnection.invoke(
            "JoinRoom",
            roomKey,
            userEmail,
            playerName
          );
          console.log("Joined room successfully");
          navigate(`/hub/${roomKey}`);
        } catch (err) {
          console.error("JoinRoom failed: ", err);
        }
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
      if (signalRConnection) {
        signalRConnection
          .invoke("JoinRoom", createdRoomKey, userEmail, playerName)
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
    <>

      <div className="flex justify-center items-center">

        <div className="card flex items-center bg-black shadow-xl p-4 justify-center mt-[100px] w-[300px] pb-10">
          <div className="main-header text-5xl text-center mt-[10px]">
            <i>Debate</i> it
          </div>
          <div className="flex-row card-body">
            <button
              className={`btn ${isJoinRoom ? "btn-ghost" : "btn-secondary"
                } btn-sm`}
              onClick={() => setIsJoinRoom(false)}
            >
              Create Room
            </button>
            <button
              className={`btn ${isJoinRoom ? "btn-secondary" : "btn-ghost"
                } btn-sm`}
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
                <span className="label-text">Enter number of question:</span>
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
      <Guide />
    </>
  );
}

export default HomePage;
