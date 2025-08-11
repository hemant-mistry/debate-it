import { RefObject, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Lottie from "react-lottie";
import BuzzerIcon from "../../assets/debate-buzzer.png";
import listeningAnimation from "../../lottie/listening.json";

interface ThreadItem {
  userEmail: string;
  debateTranscript: string;
}

interface Notification {
  userEmail: string;
  debateEntries: DebateEntry[];
  turnsLeft: number;
}

interface DebateEntry {
  roomKey: string;
  userEmail: string;
  debateTranscript: string;
}

interface Player {
  id: number;
  name: string;
  isAdmin: boolean;
  room_key: string;
  createdAt: string;
}

interface VoiceDebateProps {
  debateTopic: string;
  threadContainerRef: RefObject<HTMLDivElement>;
  thread: ThreadItem[];
  transcriptScrollRef: RefObject<HTMLDivElement>;
  text: string;
  speaker: string; // speaker identifier (email or id)
  notification: Notification | null;
  userEmail: string;
  buzzerLocked: boolean;
  handleBuzzerClick: () => void;
  finishSpeaking: () => void;
  getUserName: (email: string) => string;
}

const defaultOptions = {
  loop: true,
  autoplay: true,
  animationData: listeningAnimation,
  rendererSettings: {
    preserveAspectRatio: "xMidYMid slice",
  },
};

function VoiceDebate({
  debateTopic,
  threadContainerRef,
  thread,
  transcriptScrollRef,
  text,
  speaker,
  notification,
  userEmail,
  buzzerLocked,
  handleBuzzerClick,
  finishSpeaking,
  getUserName,
}: VoiceDebateProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const { roomKey } = useParams<{ roomKey: string }>();
  const transcriptRef = transcriptScrollRef;

  // fetch players (configurable)
  useEffect(() => {
    if (!roomKey) return;
    let mounted = true;
    const fetchPlayers = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_TWIST_IT_BACKEND_URL}/api/rooms/players/${roomKey}`
        );
        if (!res.ok) throw new Error("Failed to fetch players");
        const data = await res.json();
        if (mounted) setPlayers(data);
      } catch (err) {
        console.error("Error fetching players:", err);
      }
    };

    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [roomKey]);

  const formatTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const speakerDisplayName = speaker ? getUserName(speaker) : "";

  return (
    <div className="flex flex-row w-full mt-5 px-4 gap-6">
      {/* Main Voice Debate Section (left) */}
      <div className="flex-1 flex flex-col">
        {/* Topic card */}
        <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Topic</p>
              <p className="mt-1 text-lg font-semibold text-neutral-800">
                {debateTopic}
              </p>
            </div>
            <div className="text-sm text-gray-500">{roomKey ? `Room: ${roomKey}` : ""}</div>
          </div>
        </div>

        {/* Thread */}
        <div
          ref={threadContainerRef}
          className="mt-4 w-full max-w-3xl h-[320px] overflow-y-auto space-y-3 bg-base-100 rounded-xl p-4"
        >
          <ul className="flex flex-col gap-3">
            {thread.map((item, idx) => {
              const isSpeakerMessage = item.userEmail === speaker;
              const isOwn = item.userEmail === userEmail;
              return (
                <li
                  key={idx}
                  className={`max-w-full break-words p-3 rounded-lg shadow-sm transition ${
                    isSpeakerMessage
                      ? "bg-white border-l-4 border-primary/80"
                      : isOwn
                      ? "bg-primary/10"
                      : "bg-white"
                  }`}
                  style={isSpeakerMessage ? { boxShadow: "0 4px 14px rgba(37,99,235,0.06)" } : {}}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-sm font-medium text-neutral-800">
                      {getUserName(item.userEmail)}
                    </div>
                    {isSpeakerMessage && (
                      <div className="text-xs text-primary font-semibold ml-2">Speaking</div>
                    )}
                  </div>

                  <div className="mt-1 text-sm text-neutral-700">
                    {item.debateTranscript}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Live transcript area (compact) */}
        <div
          ref={transcriptRef}
          className="w-full max-w-3xl mt-3 text-sm h-[54px] overflow-y-auto p-3 bg-base-300 rounded-lg text-neutral"
        >
          {text}
        </div>

        {/* Controls */}
        <div className="w-full max-w-3xl mt-6 flex items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-neutral-800">
              Speaker: <span className="ml-2 font-semibold">{speakerDisplayName || "None"}</span>
            </span>

            {notification && userEmail === notification.userEmail && (
              <span className="ml-3 text-sm text-gray-500">Turns left: {notification.turnsLeft}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {userEmail === speaker ? (
              <button
                className="btn flex items-center justify-center gap-2 bg-primary hover:bg-primary text-primary-content"
                onClick={finishSpeaking}
              >
                <Lottie options={defaultOptions} height={36} width={36} />
                Finish Speaking
              </button>
            ) : (
              <button
                className="btn btn-primary hover:bg-primary text-primary-content disabled:bg-primary disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                onClick={handleBuzzerClick}
                disabled={
                  buzzerLocked ||
                  (notification?.userEmail === userEmail && notification.turnsLeft === 0)
                }
              >
                <img src={BuzzerIcon} className="w-5" alt="Buzzer Icon" />
                Buzzer
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Participants Side Panel (right) */}
      <aside className="w-64 bg-white rounded-xl shadow-lg p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-800">Participants</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3">
          {players.map((player) => {
            const isCurrentSpeaker =
              player.name && speakerDisplayName && player.name === speakerDisplayName;
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-shadow ${
                  isCurrentSpeaker ? "bg-white ring-2 ring-primary/30 shadow-md" : "hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                    isCurrentSpeaker ? "bg-primary text-white" : "bg-blue-500 text-white"
                  }`}
                >
                  {player.name ? player.name.charAt(0).toUpperCase() : "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium text-neutral-800">{player.name}</div>
                    {player.isAdmin && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 text-amber-800">Admin</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Joined {formatTime(player.createdAt)}</div>
                </div>

                {isCurrentSpeaker && (
                  <div className="ml-2 px-2 py-0.5 rounded-full bg-primary text-white text-xs font-semibold animate-pulse">
                    Speaking
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

export default VoiceDebate;
