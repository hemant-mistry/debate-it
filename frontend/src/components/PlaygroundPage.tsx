import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { RootState } from "../redux/store";

interface PlaygroundPageProps {
  signalRConnection: signalR.HubConnection | null;
}

interface Notification {
  userEmail: string;
  turnsLeft: Int16Array
}

const mockUsers = [
  { inferredName: "Alice", isReady: true, userEmail: "alice@example.com" },
  { inferredName: "Bob", isReady: false, userEmail: "bob@example.com" },
  { inferredName: "Charlie", isReady: true, userEmail: "charlie@example.com" },
  { inferredName: "David", isReady: false, userEmail: "david@example.com" }
];


function PlaygroundPage({ signalRConnection }: PlaygroundPageProps) {
  const { roomKey } = useParams<{ roomKey: string }>();
  //const users = useSelector((state: RootState) => state.room.users);
  // Turn on for mock debugging
  const [users, setUsers] = useState(mockUsers);
  const userEmail = localStorage.getItem("UserEmail");
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [isAllPlayerReady, setIsAllPlayerReady] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [speaker, setSpeaker] = useState<string>("");
  const [buzzerLocked, setBuzzerLocked] = useState<boolean>(false);
  const [debateTopic, setDebateTopic] = useState<string>();
  const [text, setText] = useState<string>();
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [scores, setScores] = useState<string>();
  const [notification, setNotification] = useState<Notification>();
  const recognitionRef = useRef<SpeechRecognition | null>(null);


  useEffect(() => {
    if (signalRConnection) {
      signalRConnection.on("SendAllPlayersReady", (allReady: boolean) => {
        setIsAllPlayerReady(allReady);
      });

      signalRConnection.on("SendDebateTopic", (response: string) => {
        setIsGameStarted(true);
        setDebateTopic(response);
      });

      signalRConnection.on("SendRelayMessage", (userEmailSever: string) => {
        setSpeaker(userEmailSever);
        setBuzzerLocked(true);
      });

      signalRConnection.on("SpeakerFinished", () => {
        setSpeaker("");
        setBuzzerLocked(false);
      });

      signalRConnection.on("SendDebateScores", (debateScores: string) => {
        console.log(debateScores);
        setIsGameOver(true);
        setScores(debateScores);
      });

      signalRConnection.on("SavedTranscript", (notification: Notification) => {
        console.log(notification);
        setNotification(notification);
      })
    }
  }, [signalRConnection]);

  // const handleReadyStatus = () => {
  //   const newReadyStatus = !isPlayerReady;
  //   setIsPlayerReady(newReadyStatus);
  //   if (signalRConnection) {
  //     signalRConnection
  //       .invoke("UpdateReadyStatus", userEmail, roomKey, newReadyStatus)
  //       .then(() => console.log("Player status updated successfully!"))
  //       .catch((err) => console.error("Error updating ready status: ", err));
  //   }
  // };

  const handleReadyStatus = (email: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.userEmail === email ? { ...user, isReady: !user.isReady } : user
      )
    );
  };


  const handleStart = () => {
    console.log("HandleStart function called");
    if (signalRConnection) {
      signalRConnection.invoke("StartGame", roomKey).then(() => {
        console.log("SignalR Start Game triggered");
      });
    }
  };

  const handleBuzzerClick = () => {
    console.log("Inside BuzzerClick function!");

    if (!buzzerLocked) {
      if (signalRConnection) {
        signalRConnection.invoke("BuzzerHit", roomKey, userEmail);
      }
    }

    // Initialize SpeechRecognition
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true; // Keep recording even when the user pauses
    recognition.interimResults = true; // Get results while the user is speaking
    recognition.lang = "en-US"; // Set language (adjust as needed)

    recognition.onresult = async (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + " ";
      }
      console.log("Speech recognized:", transcript.trim());
      setText(transcript.trim());
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
    };

    recognition.onend = () => {
      console.log("Speech recognition ended.");
    };

    // Store the recognition instance in ref
    recognitionRef.current = recognition;

    // Start recognition
    recognition.start();
    console.log("Speech recognition started...");
  };

  const finishSpeaking = () => {
    if (userEmail === speaker) {
      if (signalRConnection) {
        signalRConnection.invoke("FinishSpeaking", roomKey);
      }
    }

    // Stop speech recognition if it's running
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      console.log("Speech recognition stopped.");
    }

    if (signalRConnection) {
      signalRConnection.invoke(
        "ReceiveSpeechTranscript",
        roomKey,
        userEmail,
        text
      );
      console.log("Sent the transcript to SignalR server");
    }
  };

  const handleEndGameClick = () => {
    console.log("Clicked the endgame");
    if (signalRConnection) {
      signalRConnection.invoke("HandleGameOver", roomKey);
      console.log("HandleGameOver triggered!");
    }
  };

  if (isGameOver) {
    return (
      <>
        Game over!
        Scores are as follows: {scores}
      </>
    )
  }

  return (
    <div>
      {isGameStarted ? (
        <div>
          <h1>Room: {roomKey}</h1>
          <p> Debate topic: {debateTopic}</p>
          <p>Current Speaker: {speaker || "None"}</p>

          {/* Display turns left only if notification exists and matches the userEmail */}
          {notification && userEmail === notification.userEmail && (
            <p> Turns left: {notification.turnsLeft}</p>
          )}

          <button onClick={handleBuzzerClick} disabled={buzzerLocked}>
            Press Buzzer
          </button>
          {userEmail === speaker && (
            <>
              <p>Your transcript: {text}</p>
              <button onClick={finishSpeaking}>Finish Speaking</button>
            </>
          )}
          <br />
          <button
            className="btn btn-sm btn-primary mt-5"
            onClick={handleEndGameClick}
          >
            End game
          </button>
        </div>
      ) : (
        <div className="scenario flex flex-col items-center">
          {/* Card for header only */}
          <div className="scenario card flex flex-col shadow-xl w-1/2 p-4 mt-10">
            <div className="flex justify-between w-full">
              <div className="scenario-header text-xl">Game Lobby</div>
              <div className="scenario-header text-xl">Room code: {roomKey}</div>
            </div>
          </div>

          {/* Player list below header */}
          <ul className="w-1/2 mt-4">
            {users.map((user) =>
              user ? (
                <li key={user.inferredName} className="mt-4">
                  {user.inferredName}:{" "}
                  <span style={{ color: user.isReady ? "green" : "red" }}>
                    {user.isReady ? "Ready" : "Not Ready"}
                  </span>
                  {user.userEmail === userEmail && (
                    <button
                      className="btn btn-primary btn-xs mt-2"
                      onClick={() => handleReadyStatus(user.userEmail)}
                    >
                      {user.isReady ? "Not ready" : "Ready"}
                    </button>
                  )}
                </li>
              ) : null
            )}
          </ul>

          {/* Additional controls */}
          <div>{isAllPlayerReady}</div>
          {isAllPlayerReady && (
            <button className="btn btn-primary btn-sm mt-10" onClick={handleStart}>
              Start
            </button>
          )}
        </div>



      )}
    </div>
  );
}

export default PlaygroundPage;
