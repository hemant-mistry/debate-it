import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setUsers } from "../redux/slices/roomSlice";
import { UserDetails } from "../types/User";
import { DebateModes } from "../constants/debateMode";

interface HomePageProps {
  signalRConnection: signalR.HubConnection | null;
}

function HomePage({ signalRConnection }: HomePageProps) {
  const [isJoinRoom, setIsJoinRoom] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomKey, setRoomKey] = useState("");
  const [topic, setTopic] = useState("");
  type DebateModeType = (typeof DebateModes)[keyof typeof DebateModes];
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
      {/* Use items-start + responsive padding-top so we get exact spacing:
          - md: 50px (md:pt-[50px])
          - lg: 150px (lg:pt-[150px]) */}
      <div className="flex items-start justify-center bg-base-100 pt-12 px-4 mt-10">
        {/* Card (narrow) */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
          {/* Header */}
          <div className="flex flex-col items-center mb-4">
            <div className="badge badge-accent text-white px-3 py-1 rounded-full mb-3 text-xs font-medium">
              Beta release v2
            </div>

            <h1 className="text-2xl md:text-3xl font-semibold text-center leading-tight text-neutral mb-1">
              <i>Debate</i> it
            </h1>
            <p className="text-sm text-muted text-center mt-1">
              A lightweight space to create or join a debate room
            </p>
          </div>

          {/* Create / Join segmented control (with sliding indicator) */}
          <div className="flex justify-center mb-5">
            <div
              role="tablist"
              aria-label="Create or join room"
              className="relative inline-flex items-center bg-white border border-gray-200 rounded-full p-1 w-64"
              style={{ height: 36 }}
            >
              {/* sliding indicator */}
              <span
                aria-hidden="true"
                className="absolute top-1/2 left-1 w-1/2 h-8 rounded-full bg-primary transition-transform duration-200 ease-in-out"
                style={{
                  transform: isJoinRoom
                    ? "translateX(100%) translateY(-50%)"
                    : "translateX(0) translateY(-50%)",
                  boxShadow: "0 6px 14px rgba(37,99,235,0.10)",
                }}
              />

              <button
                type="button"
                role="tab"
                aria-pressed={!isJoinRoom}
                onClick={() => setIsJoinRoom(false)}
                className={`relative z-10 flex-1 text-sm font-medium py-1 px-2 rounded-full focus:outline-none transition-colors duration-150 ${
                  !isJoinRoom ? "text-white" : "text-neutral"
                }`}
              >
                Create Room
              </button>

              <button
                type="button"
                role="tab"
                aria-pressed={isJoinRoom}
                onClick={() => setIsJoinRoom(true)}
                className={`relative z-10 flex-1 text-sm font-medium py-1 px-2 rounded-full focus:outline-none transition-colors duration-150 ${
                  isJoinRoom ? "text-white" : "text-neutral"
                }`}
              >
                Join Room
              </button>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text text-sm text-neutral">
                  Enter your name
                </span>
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="input input-bordered w-full input-md"
                placeholder="Your display name"
              />
            </div>

            {isJoinRoom ? (
              <>
                <div>
                  <label className="label">
                    <span className="label-text text-sm text-neutral">
                      Enter room key
                    </span>
                  </label>
                  <input
                    type="text"
                    value={roomKey}
                    onChange={(e) => setRoomKey(e.target.value)}
                    className="input input-bordered w-full input-md"
                    placeholder="Room key"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleJoinRoom}
                  >
                    Join Room
                  </button>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="label">
                    <span className="label-text text-sm text-neutral">
                      Topic
                    </span>
                  </label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Ex: Sports, Politics"
                    className="input input-bordered w-full input-md"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-neutral font-medium">
                      Select mode:
                    </span>

                    {/* Mode segmented control (same sliding-pill pattern) */}
                    <div
                      role="tablist"
                      aria-label="Select mode"
                      className="relative inline-flex items-center bg-white border border-gray-200 rounded-full p-1 w-40"
                      style={{ height: 36 }}
                    >
                      <span
                        aria-hidden="true"
                        className="absolute top-1/2 left-1 w-1/2 h-8 rounded-full bg-primary transition-transform duration-200 ease-in-out"
                        style={{
                          transform:
                            mode === "Voice"
                              ? "translateX(100%) translateY(-50%)"
                              : "translateX(0) translateY(-50%)",
                          boxShadow: "0 6px 14px rgba(37,99,235,0.10)",
                        }}
                      />

                      <button
                        type="button"
                        role="tab"
                        aria-pressed={mode === "Text"}
                        onClick={() => setMode(DebateModes.TEXT)}
                        className={`relative z-10 flex-1 text-sm font-medium py-1 px-2 rounded-full focus:outline-none transition-colors duration-150 ${
                          mode === "Text" ? "text-white" : "text-neutral"
                        }`}
                      >
                        Text
                      </button>

                      <button
                        type="button"
                        role="tab"
                        aria-pressed={mode === "Voice"}
                        onClick={() => setMode(DebateModes.VOICE)}
                        className={`relative z-10 flex-1 text-sm font-medium py-1 px-2 rounded-full focus:outline-none transition-colors duration-150 ${
                          mode === "Voice" ? "text-white" : "text-neutral"
                        }`}
                      >
                        Voice
                      </button>
                    </div>
                  </div>

                  <div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleCreateRoom}
                    >
                      Create Room
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-muted">
            By creating a room you agree to our{" "}
            <span className="underline">community guidelines</span>.
          </div>
        </div>
      </div>
    </>
  );
}

export default HomePage;
