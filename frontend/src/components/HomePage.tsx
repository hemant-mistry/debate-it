import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUsers } from "../redux/slices/roomSlice";
import { UserDetails } from "../types/User";
import Guide from "./ui/Guide";
import { DebateModes } from "../constants/debateMode";

interface HomePageProps {
  signalRConnection: signalR.HubConnection | null;
}

function HomePage({ signalRConnection }: HomePageProps) {
  const [isJoinRoom, setIsJoinRoom] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomKey, setRoomKey] = useState("");
  const [topic, setTopic] = useState("");
  type DebateModeType = typeof DebateModes[keyof typeof DebateModes];
  const [mode, setMode] = useState<DebateModeType>(DebateModes.TEXT);


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
    if (!playerName || !roomKey) {
      alert("Please enter both your name and the room key");
      return;
    }
    try {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to join room.");
      }

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
          if (err instanceof Error) {
            alert(
              err.message || "Error while joining the room. Please try again."
            );
          } else {
            alert("Error while joining the room. Please try again.");
          }
        }
      } else {
        throw new Error("SignalR connection not available.");
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      if (err instanceof Error) {
        alert(err.message || "An unexpected error occurred. Please try again.");
      } else {
        alert("An unexpected error occurred. Please try again.");
      }
    }
  };

  const handleCreateRoom = async () => {
    if (!playerName || !topic) {
      alert("Please enter both your name and the topic");
      return;
    }

    console.log("Sending mode:", mode, "Type:", typeof mode);


    const response = await fetch(
      `${import.meta.env.VITE_TWIST_IT_BACKEND_URL}/api/rooms/create-room`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ playerName, topic, mode }),
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
        <div className="card flex items-center bg-black shadow-xl p-4 justify-center w-[300px] mt-[100px] md:mt-[70px]">
          <div className="badge bg-[#03C988] text-black mb-2 font-[600] badge-md p-3">
            Beta release
          </div>
          <div className="main-header text-4xl text-center">
            <i>Debate</i> it
          </div>
          <div className="flex-row card-body">
            <button
              className={`btn ${
                isJoinRoom ? "btn-ghost" : "btn-secondary"
              } btn-xs`}
              onClick={() => setIsJoinRoom(false)}
            >
              Create Room
            </button>
            <button
              className={`btn ${
                isJoinRoom ? "btn-secondary" : "btn-ghost"
              } btn-xs`}
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
                className="input input-bordered input-sm"
              />
              <div className="label">
                <span className="label-text">Enter room key:</span>
              </div>
              <input
                type="text"
                value={roomKey}
                onChange={(e) => setRoomKey(e.target.value)}
                className="input input-bordered input-sm"
              />
              <button
                className="btn btn-primary btn-sm"
                onClick={handleJoinRoom}
              >
                Join Room
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="label">
                <span className="label-text">Enter your name:</span>
              </div>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="input input-bordered input-sm"
              />
              <div className="label">
                <span className="label-text">Topic:</span>
              </div>
              <input
                type="text"
                value={topic}
                placeholder="Ex Sports, Politics"
                onChange={(e) => setTopic(e.target.value)}
                className="input input-bordered input-sm"
              />
              <div
                role="tablist"
                className="flex items-center gap-x-2 tabs-sm mt-2 mb-2"
              >
                <div className="label flex-shrink-0">
                  <span className="label-text text-sm font-medium">
                    Select mode:
                  </span>
                </div>
                <div className="tooltip" data-tip="Debate via text">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="TEXT"
                      className="hidden peer"
                      checked={mode === "Text"}
                      onChange={() => setMode(DebateModes.TEXT)}

                    />
                    <div className="tab rounded-lg text-white font-medium peer-checked:bg-[#FFA500] peer-checked:text-black">
                      Text
                    </div>
                  </label>
                </div>
                <div className="tooltip" data-tip="Debate via voice">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="mode"
                      value="VOICE"
                      className="hidden peer"
                      checked={mode === "Voice"}
                      onChange={() => setMode(DebateModes.VOICE)}
                    />
                    <div className="tab rounded-lg text-white font-medium peer-checked:bg-[#FFA500] peer-checked:text-black">
                      Voice
                    </div>
                  </label>
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleCreateRoom}
              >
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
