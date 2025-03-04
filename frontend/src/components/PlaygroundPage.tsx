import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useRef, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { RootState } from "../redux/store";
import { useNavigate } from "react-router-dom";
import Lottie from "react-lottie";
import listeningAnimation from "../lottie/listening.json";
import CurrentSpeakerIcon from "../assets/debate-mic.png";
import BuzzerIcon from "../assets/debate-buzzer.png";
import CopyToClipboard from "../assets/copy-to-clipboard.png";

interface PlaygroundPageProps {
  signalRConnection: signalR.HubConnection | null;
}

interface Notification {
  userEmail: string;
  debateEntries: DebateEntry[];
  turnsLeft: Int16Array;
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
}

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
  const [tooltipText, setTooltipText] = useState("Copy to Clipboard");
  const threadContainerRef = useRef<HTMLDivElement>(null);
  const transcriptScrollRef = useRef<HTMLDivElement>(null);

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: listeningAnimation,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };

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
        console.log("Received debateScores:", debateScores);
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

  if (isGameOver) {
    // Create a sorted copy of scores in descending order by Score
    const sortedScores = [...scores].sort((a, b) => b.Score - a.Score);

    return (
      <div className="flex flex-col max-w-sm items-center mx-auto justify-center mt-[150px]">
        <ul className="list bg-base-100 rounded-box shadow-md">
          <li className="p-4 pb-3 text-4xl opacity-60 tracking-wide">
            Leaderboard
          </li>
          {sortedScores.map((score, index) => (
            <li
              key={index}
              className="list-row flex flex-row gap-5 items-center justify-between pb-3 border-b border-gray-200 mt-5 mb-5"
            >
              <div className="list-col-grow">
                <div>{score.UserEmail}</div>
              </div>
              <div className="scores text-2xl">{score.Score}</div>
            </li>
          ))}
        </ul>

        <button className="btn btn-primary btn-sm" onClick={handlePlayAgain}>
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-10 md:mt-10">
      {isGameStarted ? (
        <div className="game-container flex flex-col justify-center items-center pt-10">
          <div className="debate-topic text-xl w-full max-w-md md:max-w-[700px] text-center">
            <p className="text-sm">Topic:</p>
            <p className="mt-2">{debateTopic}</p>
            <div
              className="text-left mt-5 text-sm h-[300px] overflow-y-auto md:mt-[50px]"
              ref={threadContainerRef}
            >
              <ul className="mb-5">
                {thread.map((item, index) => (
                  <li className="mt-2" key={index}>
                    <span className="mr-2 text-white">{item.userEmail}:</span>
                    {item.debateTranscript}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div
            ref={transcriptScrollRef}
            className="text-left  text-sm h-[50px] overflow-y-auto"
          >
            {text}
          </div>
          <div className="game-action-container flex flex-col w-full mt-10 justify-between items-center max-w-sm md:max-w-[700px] md:flex-row">
            <div className="flex-shrink-0">
              <div className="speaker-info flex flex-row items-center bg-primary p-1.5 font-[600] rounded-md text-black">
                <img
                  src={CurrentSpeakerIcon}
                  className="w-5"
                  alt="Speaker Icon"
                />
                <p className="text-sm">Speaker : {speaker || "None"}</p>
              </div>
              <div className="text-white mb-5 text-center md:text-left">
                {notification && userEmail === notification.userEmail && (
                  <p className="text-sm mt-4 text-white">
                    Turns left: {notification.turnsLeft}
                  </p>
                )}
              </div>
            </div>

            {userEmail === speaker ? (
              <div className="speaker-container flex flex-row items-center">
                <button
                  className="btn flex items-center justify-center gap-2 bg-primary hover:bg-primary"
                  onClick={finishSpeaking}
                >
                  <Lottie options={defaultOptions} height={40} width={40} />
                  <p className="text-black">Finish Speaking</p>
                </button>
              </div>
            ) : (
              <div className="buzzer-container flex flex-row items-center">
                <button
                  className="btn btn-primary hover:bg-primary disabled:bg-primary disabled:text-black disabled:opacity-100 disabled:cursor-not-allowed text-black"
                  onClick={handleBuzzerClick}
                  disabled={buzzerLocked}
                >
                  <img src={BuzzerIcon} className="w-5" alt="Buzzer Icon" />
                  <p className="text-sm">Buzzer</p>
                </button>
              </div>
            )}
          </div>

          <br />
        </div>
      ) : (
        <div className="scenario flex flex-col justify-center items-center mt-36">
          <div className="room-code-container">
            {isAllPlayerReady ? (
              <div className="text-2xl mb-5 text-white">
                Starting in {countdown}..
              </div>
            ) : (
              <div className="text-2xl mb-5 flex flex-row items-center gap-2">
                Room code:{" "}
                <span className="font-[600] text-white">{roomKey}</span>
                <div className="flex tooltip" data-tip={tooltipText}>
                  <button className="btn btn-xs w-[45px]" onClick={handleCopy}>
                    <img
                      src={CopyToClipboard}
                      className="w-10"
                      alt="Copy Icon"
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
          <ul className="list bg-base-100 rounded-box shadow-md w-full max-w-md md:max-w-lg">
            <li className="p-4 pb-2 text-xs opacity-60 tracking-wide">
              Players in Room
            </li>
            {users.map((user) =>
              user ? (
                <li
                  key={user.userEmail}
                  className="list-row p-4 gap-x-4 flex justify-between items-center border-b border-gray-200 last:border-b-0"
                >
                  <div className="text-lg font-semibold">
                    {user.inferredName}
                  </div>
                  <div style={{ color: user.isReady ? "#03C988" : "#E94560" }}>
                    {user.isReady ? "Ready" : "Not Ready"}
                  </div>
                </li>
              ) : null
            )}
            <li className="p-4 flex justify-center items-center">
              <button
                className="btn btn-primary btn-sm w-[150px] mt-5"
                onClick={handleReadyStatus}
              >
                {isPlayerReady ? "Not ready" : "Ready"}
              </button>
            </li>
          </ul>
          {isAllPlayerReady && (
            <button
              className="btn btn-primary btn-sm mt-10"
              onClick={handleStart}
            >
              Start
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default PlaygroundPage;
