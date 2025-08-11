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

export default function VoiceDebate({
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
  const { roomKey } = useParams<{ roomKey?: string }>();
  const [showParticipants, setShowParticipants] = useState(false);
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

  // close participants with escape key for accessibility
  useEffect(() => {
    if (!showParticipants) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowParticipants(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showParticipants]);

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
    <div className="flex flex-col lg:flex-row w-full mt-5 px-3 sm:px-4 gap-4 lg:gap-6">
      {/* Main Voice Debate Section (left) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topic card */}
        <div className="w-full bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Topic</p>
              <p className="mt-1 text-base sm:text-lg font-semibold text-neutral-800 truncate">
                {debateTopic}
              </p>
            </div>
            <div className="text-sm text-gray-500 truncate">{roomKey ? `Room: ${roomKey}` : ""}</div>
          </div>
        </div>

        {/* Thread */}
        <div
          ref={threadContainerRef}
          className="mt-3 w-full bg-base-100 rounded-xl p-3 sm:p-4 overflow-y-auto space-y-3 min-h-[180px] h-60 sm:h-72 md:h-80 lg:h-[360px]"
          aria-live="polite"
        >
          <ul className="flex flex-col gap-3">
            {thread.map((item, idx) => {
              const isSpeakerMessage = item.userEmail === speaker;
              const isOwn = item.userEmail === userEmail;
              return (
                <li
                  key={idx}
                  className={`max-w-full break-words p-3 rounded-lg shadow-sm transition ${
                    isSpeakerMessage ? "bg-white border-l-4 border-primary/80" : isOwn ? "bg-primary/10" : "bg-white"
                  }`}
                  style={isSpeakerMessage ? { boxShadow: "0 4px 14px rgba(37,99,235,0.06)" } : {}}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-sm font-medium text-neutral-800">{getUserName(item.userEmail)}</div>
                    {isSpeakerMessage && <div className="text-xs text-primary font-semibold ml-2">Speaking</div>}
                  </div>

                  <div className="mt-1 text-sm text-neutral-700">{item.debateTranscript}</div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Live transcript area (compact) */}
        <div
          ref={transcriptRef}
          className="w-full mt-3 rounded-lg p-3 bg-base-300 text-sm min-h-[56px] max-h-36 overflow-y-auto"
          aria-live="polite"
        >
          {text}
        </div>

        {/* Controls */}
        <div className="w-full mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* left: speaker / turns */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-neutral-800 truncate">
              Speaker:
              <span className="ml-2 font-semibold truncate">{speakerDisplayName || "None"}</span>
            </span>

            {notification && userEmail === notification.userEmail && (
              <span className="ml-1 text-sm text-gray-500 truncate">Turns left: {notification.turnsLeft}</span>
            )}
          </div>

          {/* right: buttons */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* participants toggle for small screens - small and won't expand */}
            <div className="lg:hidden flex-shrink-0">
              <button
                aria-expanded={showParticipants}
                aria-controls="participants-panel"
                onClick={() => setShowParticipants((s) => !s)}
                className="btn btn-ghost btn-sm"
                type="button"
              >
                {showParticipants ? "Hide" : "Participants"}
              </button>
            </div>

            {/* action button container: make it full width on mobile but don't overflow */}
            <div className="flex-1 sm:flex-none">
              {userEmail === speaker ? (
                <button
                  type="button"
                  onClick={finishSpeaking}
                  className="btn flex items-center justify-center gap-2 bg-primary hover:bg-primary text-primary-content w-full sm:w-auto whitespace-nowrap"
                >
                  <div className="w-8 h-8 flex-shrink-0 -ml-1">
                    <Lottie options={defaultOptions} height={32} width={32} />
                  </div>
                  <span className="truncate">Finish Speaking</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleBuzzerClick}
                  disabled={buzzerLocked || (notification?.userEmail === userEmail && notification.turnsLeft === 0)}
                  className="btn btn-primary disabled:bg-primary disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2 w-full sm:w-auto whitespace-nowrap"
                >
                  <img src={BuzzerIcon} className="w-5 h-5 flex-shrink-0" alt="Buzzer Icon" />
                  <span className="truncate">Buzzer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Participants Side Panel (right) for large screens */}
      <aside className="hidden lg:flex lg:w-64 bg-white rounded-xl shadow-lg p-4 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-800">Participants</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3" role="list" aria-label="Participants list">
          {players.map((player) => {
            const isCurrentSpeaker = player.name && speakerDisplayName && player.name === speakerDisplayName;
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition-shadow ${
                  isCurrentSpeaker ? "bg-white ring-2 ring-primary/30 shadow-md" : "hover:bg-gray-50"
                }`}
                role="listitem"
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

      {/* Left-side Drawer for small/medium screens */}
      {/* Backdrop + sliding panel. Panel width limited (e.g., max-w-xs). */}
      {showParticipants && (
        <div
          id="participants-panel"
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex"
          aria-label="Participants Drawer"
        >
          {/* backdrop */}
          <button
            aria-hidden="true"
            onClick={() => setShowParticipants(false)}
            className="absolute inset-0 bg-black/40"
            type="button"
          />

          {/* sliding panel from left */}
          <div
            className={`relative z-10 w-11/12 max-w-xs h-full bg-white shadow-2xl transform transition-transform duration-300 ease-out ${
              showParticipants ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="p-4 flex items-center justify-between border-b">
              <h3 className="text-lg font-semibold">Participants</h3>
              <button onClick={() => setShowParticipants(false)} className="btn btn-ghost btn-sm" type="button">
                Close
              </button>
            </div>

            <div className="p-4 overflow-y-auto h-full space-y-3" role="list" aria-label="Participants list">
              {players.map((player) => {
                const isCurrentSpeaker = player.name && speakerDisplayName && player.name === speakerDisplayName;
                return (
                  <div key={player.id} className="flex items-center gap-3 p-2 rounded-lg">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        isCurrentSpeaker ? "bg-primary text-white" : "bg-blue-500 text-white"
                      }`}
                    >
                      {player.name ? player.name.charAt(0).toUpperCase() : "?"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium text-neutral-800">{player.name}</div>
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
          </div>
        </div>
      )}
    </div>
  );
}
