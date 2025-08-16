import { RefObject, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

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

interface TextDebateProps {
  debateTopic: string;
  threadContainerRef: RefObject<HTMLDivElement>;
  thread: ThreadItem[];
  text: string;
  speaker: string; // speaker is the user identifier (email or id) coming from server
  notification: Notification | null;
  userEmail: string;
  handleTextSendButton: () => void;
  setText: (text: string) => void;
  getUserName: (email: string) => string; // returns display name for an email/id
}

export default function TextDebate({
  debateTopic,
  threadContainerRef,
  thread,
  text,
  speaker,
  notification,
  userEmail,
  handleTextSendButton,
  setText,
  getUserName,
}: TextDebateProps) {
  const [rows, setRows] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const maxHeightRef = useRef<number | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const { roomKey } = useParams<{ roomKey?: string }>();
  const [showParticipants, setShowParticipants] = useState(false);

  // Fetch players API (configurable via env)
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
    const interval = setInterval(fetchPlayers, 5000); // refresh every 5s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [roomKey]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setText(val);

    const lineBreaks = val.split("\n").length;
    setRows(Math.min(Math.max(lineBreaks, 1), 6)); // allow slightly more rows on bigger screens
  };

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;

    if (rows < 1) {
      maxHeightRef.current = null;
      ta.style.overflowY = "hidden";
      ta.style.height = "auto";
      ta.style.height = ta.scrollHeight + "px";
    } else {
      if (maxHeightRef.current === null) {
        ta.style.height = "auto";
        maxHeightRef.current = ta.scrollHeight;
      }
      ta.style.height = maxHeightRef.current + "px";
      ta.style.overflowY = "auto";
    }
  }, [text, rows]);

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

  // derive speaker display name for comparing with players list
  const speakerDisplayName = speaker ? getUserName(speaker) : "";

  // close participants with escape key for accessibility
  useEffect(() => {
    if (!showParticipants) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowParticipants(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showParticipants]);

  return (
    <div className="flex flex-col lg:flex-row w-full mt-6 px-3 sm:px-4 gap-4 lg:gap-6">
      {/* Main Debate Section */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topic card (clean, professional) */}
        <div className="w-full bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Topic</p>
              <p className="mt-1 text-base sm:text-lg font-semibold text-neutral-800 break-words whitespace-normal" title={debateTopic}>
                {debateTopic}


              </p>
            </div>
            {/* <div className="text-sm text-gray-500 truncate">{roomKey ? `Room: ${roomKey}` : ""}</div> */}
          </div>
        </div>

        {/* Debate thread */}
        <div
          ref={threadContainerRef}
          className="mt-3 w-full bg-base-100 rounded-xl p-3 sm:p-4 overflow-y-auto space-y-3 min-h-[180px] h-60 sm:h-72 md:h-80 lg:h-[360px]"
          aria-live="polite"
        >
          <ul className="flex flex-col gap-3">
            {thread.map((item, index) => {
              const isSpeakerMessage = item.userEmail === speaker;
              const isOwn = item.userEmail === userEmail;
              return (
                <li
                  key={index}
                  className={`max-w-full break-words p-3 rounded-lg transition ${isSpeakerMessage
                      ? "bg-white border-l-4 border-primary/60"
                      : isOwn
                        ? "bg-primary/10"
                        : "bg-white"
                    }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-sm font-medium text-neutral-800">{getUserName(item.userEmail)}</div>
                    {isSpeakerMessage && (
                      <div className="text-xs text-primary font-semibold ml-2">Speaking</div>
                    )}
                  </div>

                  <div className="mt-1 text-sm text-neutral-700">{item.debateTranscript}</div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Speaker & turns info */}
        <div className="w-full mt-3 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-neutral-800 truncate">
              Speaker:
              <span className="ml-2 font-semibold truncate">{speakerDisplayName || "None"}</span>
            </span>

            {notification && userEmail === notification.userEmail && (
              <span className="ml-1 text-sm text-gray-500 truncate">Turns left: {notification.turnsLeft}</span>
            )}
          </div>

          {/* participants toggle for small screens - small button, doesn't expand */}
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
        </div>

        {/* Input for active speaker */}
        {userEmail === speaker && (
          <div className="flex flex-col sm:flex-row items-end gap-3 w-full mt-3 mb-5">
            <label htmlFor="debate-input" className="sr-only">
              Type your argument
            </label>
            <textarea
              id="debate-input"
              ref={textareaRef}
              className="textarea textarea-bordered w-full resize-none overflow-hidden rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Type your argument..."
              value={text}
              rows={rows}
              onChange={handleChange}
              aria-label="Type your argument"
            />
            <button
              type="button"
              className="btn btn-primary w-full sm:w-auto"
              onClick={() => {
                handleTextSendButton();
                setText("");
                setRows(1);
              }}
            >
              Send
            </button>
          </div>
        )}
      </div>

      {/* Participants Side Panel - hidden on small screens (becomes left drawer) */}
      {/* Large screens show aside inline */}
      <aside className="hidden lg:flex lg:w-64 bg-white rounded-xl p-4 flex-col">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-neutral-800">Participants</h2>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3" role="list" aria-label="Participants list">
          {players.map((player) => {
            const isCurrentSpeaker = player.name && speakerDisplayName && player.name === speakerDisplayName;
            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-2 rounded-lg transition ${isCurrentSpeaker ? "bg-white" : "hover:bg-gray-50"
                  }`}
                role="listitem"
              >
                {/* avatar (initials) */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${isCurrentSpeaker ? "bg-primary text-white" : "bg-blue-500 text-white"
                    }`}
                >
                  {player.name ? player.name.charAt(0).toUpperCase() : "?"}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-medium text-neutral-800">{player.name}</div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Joined {formatTime(player.createdAt)}</div>
                </div>

                {/* speaking badge only (no ring/shadow/border) */}
                {isCurrentSpeaker && (
                  <div className="ml-2 px-2 py-1 rounded-full bg-primary text-white text-xs font-semibold animate-pulse">
                    Speaking
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Left-side Drawer for small/medium screens */}
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
            className={`relative z-10 w-11/12 max-w-xs h-full bg-white shadow-2xl transform transition-transform duration-300 ease-out ${showParticipants ? "translate-x-0" : "-translate-x-full"
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${isCurrentSpeaker ? "bg-primary text-white" : "bg-blue-500 text-white"
                        }`}
                    >
                      {player.name ? player.name.charAt(0).toUpperCase() : "?"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium text-neutral-800">{player.name}</div>
                      <div className="text-xs text-gray-500 mt-1">Joined {formatTime(player.createdAt)}</div>
                    </div>

                    {isCurrentSpeaker && (
                      <div className="ml-2 px-2 py-0.5 rounded-full bg-primary text-white text-xs font-semibold animate-pulse">Speaking</div>
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
