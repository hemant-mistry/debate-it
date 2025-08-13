import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { RootState } from "../redux/store";
import { useNavigate } from "react-router-dom";
import CopyToClipboard from "../assets/copy-to-clipboard.png";
import { DebateModes } from "../constants/debateMode";
import VoiceDebate from "./ui/VoiceDebate";
import TextDebate from "./ui/TextDebate";

interface PlaygroundPageProps {
  signalRConnection: signalR.HubConnection | null;
}

interface Notification {
  userEmail: string;
  debateEntries: DebateEntry[];
  turnsLeft: number;
  isGameOverFlag: boolean;
}

interface DebateEntry {
  roomKey: string;
  userEmail: string;
  debateTranscript: string;
}

// Define a TypeScript interface for a score entry
interface ScoreEntry {
  UserEmail: string;
  Score: number;
  Reason: string;
}

type DebateModeType = typeof DebateModes[keyof typeof DebateModes];

function PlaygroundPage({ signalRConnection }: PlaygroundPageProps) {
  const navigate = useNavigate();
  const { roomKey } = useParams<{ roomKey: string }>();
  const users = useSelector((state: RootState) => state.room.users);
  const userEmail = localStorage.getItem("UserEmail");
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [isAllPlayerReady, setIsAllPlayerReady] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [speaker, setSpeaker] = useState<string>("");
  const [buzzerLocked, setBuzzerLocked] = useState<boolean>(false);
  const [debateTopic, setDebateTopic] = useState<string>();
  const [text, setText] = useState<string>();
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [scores, setScores] = useState<ScoreEntry[]>([]);
  const [notification, setNotification] = useState<Notification>();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [countdown, setCountdown] = useState<number>(5);
  const [thread, setThread] = useState<DebateEntry[]>([]);
  const [mode, setMode] = useState<DebateModeType>(DebateModes.VOICE);
  const [textSpeaker, setTextSpeaker] = useState<string>("");
  const [showSpinner, setShowSpinner] = useState<boolean>(false);

  const [tooltipText, setTooltipText] = useState("Copy to Clipboard");
  const threadContainerRef = useRef<HTMLDivElement>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (signalRConnection) {
      signalRConnection.on("SendAllPlayersReady", (allReady: boolean) => {
        setIsAllPlayerReady(allReady);
      });

      signalRConnection.on(
        "SendDebateTopicwithMode",
        (response: string, mode: number) => {
          setIsGameStarted(true);

          const modeValue = mode === 0 ? DebateModes.TEXT : DebateModes.VOICE;
          setMode(modeValue);

          console.log("The selected mode is", modeValue);
          setDebateTopic(response);
        }
      );

      signalRConnection.on("SendRelayMessage", (userEmailSever: string) => {
        setSpeaker(userEmailSever);
        setBuzzerLocked(true);
      });

      signalRConnection.on("SpeakerFinished", () => {
        setSpeaker("");
        setBuzzerLocked(false);
      });

      signalRConnection.on("SendCurrentUser", (userEmail: string) => {
        setTextSpeaker(userEmail);
      });

      signalRConnection.on("SendDebateScores", (debateScores: string) => {
        console.log("Received debateScores:", debateScores);
        setShowSpinner(false);
        setIsGameOver(true);
        try {
          // Parse the JSON string into an array of score entries
          const parsedScores: ScoreEntry[] = JSON.parse(debateScores);
          setScores(parsedScores);
        } catch (error) {
          console.error("Error parsing debate scores:", error);
        }
      });

      signalRConnection.on("SavedTranscript", (notification: Notification) => {
        console.log(notification);
        setNotification(notification);
        setThread(
          notification.debateEntries.map((entry) => ({
            roomKey: entry.roomKey,
            userEmail: entry.userEmail,
            debateTranscript: entry.debateTranscript,
          }))
        );
        if (notification.isGameOverFlag) {
          setShowSpinner(true);
        }
      });
    }
  }, [signalRConnection]);

  // Manage countdown timer when all players are ready
  useEffect(() => {
    if (isAllPlayerReady) {
      setCountdown(5); // reset countdown
      const timerId = setInterval(() => {
        setCountdown((prevCount) => {
          if (prevCount <= 1) {
            clearInterval(timerId);
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
      return () => clearInterval(timerId);
    }
  }, [isAllPlayerReady]);

  // Trigger game start when countdown finishes
  useEffect(() => {
    if (isAllPlayerReady && countdown === 0) {
      handleStart();
    }
  }, [countdown, isAllPlayerReady]);

  // Scroll to the bottom of the container when thread updates
  useEffect(() => {
    if (threadContainerRef.current) {
      threadContainerRef.current.scrollTop =
        threadContainerRef.current.scrollHeight;
    }
  }, [thread]);

  // Auto-scroll to bottom when the text changes
  useEffect(() => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTop =
        transcriptScrollRef.current.scrollHeight;
    }
  }, [text]);

  const handleReadyStatus = () => {
    const newReadyStatus = !isPlayerReady;
    setIsPlayerReady(newReadyStatus);
    if (signalRConnection) {
      signalRConnection
        .invoke("UpdateReadyStatus", userEmail, roomKey, newReadyStatus)
        .then(() => console.log("Player status updated successfully!"))
        .catch((err) => console.error("Error updating ready status: ", err));
    }
  };

  const handleStart = () => {
    console.log("HandleStart function called");
    if (signalRConnection) {
      signalRConnection.invoke("StartGame", roomKey).then(() => {
        console.log("SignalR Start Game triggered");
      });
    }
  };

  const handleCopy = () => {
    if (roomKey) {
      navigator.clipboard.writeText(roomKey);
      setTooltipText("Copied");
      // Optionally, revert the tooltip back after 2 seconds
      setTimeout(() => setTooltipText("Copy to Clipboard"), 2000);
    }
  };

  const handlePlayAgain = () => {
    console.log("HandlePlayAgain function triggered");
    navigate("/");
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

  const handleRoundRobin = () => {
    if (signalRConnection) {
      signalRConnection.invoke("GetCurrentUser", roomKey);
    }
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

  const handleTextSendButton = () => {
    if (signalRConnection) {
      signalRConnection.invoke(
        "ReceiveSpeechTranscript",
        roomKey,
        userEmail,
        text
      );
      console.log("Sent the TEXT transcript to SignalR server");
    }

    handleRoundRobin();
    setText("");

  }


  const getUserName = (email: string): string => {
    const user = users.find(u => u?.userEmail === email);
    return user?.inferredName || email; // Fall back to email if name not found
  };

  if (isGameOver) {
    // Sort descending
    const sortedScores = [...scores].sort((a, b) => b.Score - a.Score);

    return (
      <div className="flex flex-col w-full max-w-md mx-auto mt-12 px-4 sm:px-0">
        <h2 className="text-3xl sm:text-4xl font-semibold mb-2 text-center text-gray-800">
          Leaderboard
        </h2>

        {/* Info text to guide users */}
        <p className="text-center text-sm sm:text-base text-gray-600 mb-4">
          Click the arrow next to each name to view why they won the debate.
        </p>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
          {sortedScores.map((score, index) => (
            <div
              key={index}
              tabIndex={0}
              className="collapse collapse-arrow border-b last:border-b-0 border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <div className="collapse-title flex justify-between items-center p-4 pr-10 text-gray-800">
                <span className="font-medium text-sm sm:text-base truncate">
                  {getUserName(score.UserEmail)}
                </span>
                <span className="text-xl sm:text-2xl font-bold">{score.Score}</span>
              </div>
              <div className="collapse-content bg-gray-50 px-4 pb-4">
                <p className="text-sm sm:text-base text-orange-600">
                  {score.Reason}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <button
            className="btn btn-primary w-full sm:w-auto shadow-md"
            onClick={handlePlayAgain}
          >
            Play Again
          </button>
        </div>
      </div>

    );
  }

  if (showSpinner) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <span className="mb-4 text-lg text-primary">Cooking results...</span>
        <span className="loading loading-spinner loading-lg text-primary mb-10"></span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-10 ">
      {isGameStarted && mode == DebateModes.VOICE ? (
        <VoiceDebate
          debateTopic={debateTopic || ""}
          threadContainerRef={threadContainerRef}
          thread={thread}
          transcriptScrollRef={transcriptScrollRef}
          text={text || ""}
          speaker={speaker}
          notification={notification || null}
          userEmail={userEmail || ""}
          buzzerLocked={buzzerLocked}
          handleBuzzerClick={handleBuzzerClick}
          finishSpeaking={finishSpeaking}
          getUserName={getUserName}
        />
      ) : isGameStarted && mode == DebateModes.TEXT ? (
        <TextDebate
          debateTopic={debateTopic || ""}
          threadContainerRef={threadContainerRef}
          thread={thread}
          text={text || ""}
          speaker={textSpeaker}
          notification={notification || null}
          userEmail={userEmail || ""}
          handleTextSendButton={handleTextSendButton}
          setText={setText}
          getUserName={getUserName} />
      ) : (
        <div className="scenario flex flex-col justify-center items-center py-12">
          <div className="room-code-container w-full max-w-md px-4">
            {isAllPlayerReady ? (
              <div className="text-2xl mb-5 text-neutral text-center">
                Starting in <span className="font-semibold text-primary">{countdown}</span>..
              </div>
            ) : (
              <div className="text-2xl mb-5 flex flex-row items-center gap-2 justify-center text-neutral">
                <span>Room code:</span>
                <span className="font-semibold text-primary">{roomKey}</span>
                <div className="flex tooltip" data-tip={tooltipText}>
                  <button className="btn btn-ghost btn-xs ml-2" onClick={handleCopy} aria-label="Copy room code">
                    <img
                      src={CopyToClipboard}
                      className="w-5 h-5"
                      alt="Copy Icon"
                    />
                  </button>
                </div>
              </div>
            )}
          </div>

          <ul className="bg-white rounded-box shadow-md w-full max-w-md md:max-w-lg">
            <li className="p-4 pb-2 text-sm text-neutral opacity-70 tracking-wide">
              Players in Room
            </li>
            {users.map((user) =>
              user ? (
                <li
                  key={user.userEmail}
                  className="flex justify-between items-center p-4 gap-x-4 border-b border-gray-200 last:border-b-0"
                >
                  <div className="text-lg font-semibold text-neutral">
                    {user.inferredName}
                  </div>
                  <div className={`${user.isReady ? "text-success" : "text-error"} font-medium`}>
                    {user.isReady ? "Ready" : "Not Ready"}
                  </div>
                </li>
              ) : null
            )}
            <li className="p-4 flex justify-center items-center">
              <button
                className="btn btn-primary btn-sm w-36"
                onClick={handleReadyStatus}
              >
                {isPlayerReady ? "Not ready" : "Ready"}
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default PlaygroundPage;
