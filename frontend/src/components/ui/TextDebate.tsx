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

function TextDebate({
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
  const { roomKey } = useParams<{ roomKey: string }>();

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
    setRows(Math.min(Math.max(lineBreaks, 1), 3));
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

  return (
    <div className="flex flex-row w-full mt-10 px-4 gap-6">
      {/* Main Debate Section */}
      <div className="flex-1 flex flex-col">
        {/* Topic card (clean, professional) */}
        <div className="w-full max-w-3xl bg-white border border-gray-200 rounded-2xl p-4 shadow-none">
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

        {/* Debate thread */}
        <div
          ref={threadContainerRef}
          className="mt-4 w-full max-w-3xl h-[320px] overflow-y-auto space-y-3 bg-base-100 rounded-xl p-4"
        >
          <ul className="flex flex-col gap-3">
            {thread.map((item, index) => {
              const isSpeakerMessage = item.userEmail === speaker;
              const isOwn = item.userEmail === userEmail;
              return (
                <li
                  key={index}
                  className={`max-w-full break-words p-3 rounded-lg transition ${
                    isSpeakerMessage
                      ? "bg-white border-l-4 border-primary/60"
                      : isOwn
                      ? "bg-primary/10"
                      : "bg-white"
                  }`}
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

        {/* Speaker & turns info */}
        <div className="w-full max-w-3xl mt-4 flex items-center justify-between">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-neutral-800">
              Speaker:
              <span className="ml-2 font-semibold">{speakerDisplayName || "None"}</span>
            </span>
            {notification && userEmail === notification.userEmail && (
              <span className="ml-3 text-sm text-gray-500">Turns left: {notification.turnsLeft}</span>
            )}
          </div>
        </div>

        {/* Input for active speaker */}
        {userEmail === speaker && (
          <div className="flex items-end gap-3 w-full max-w-3xl mt-4">
            <textarea
              ref={textareaRef}
              className="textarea textarea-bordered w-full resize-none overflow-hidden rounded-lg"
              placeholder="Type your argument..."
              value={text}
              rows={rows}
              onChange={handleChange}
            />
            <button
              className="btn btn-primary"
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

      {/* Participants Side Panel */}
      <aside className="w-64 bg-white rounded-xl p-4 flex flex-col">
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
                className={`flex items-center gap-3 p-2 rounded-lg transition ${
                  isCurrentSpeaker ? "bg-white" : "hover:bg-gray-50"
                }`}
              >
                {/* avatar (initials) */}
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
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Joined {formatTime(player.createdAt)}</div>
                </div>

                {/* speaking badge only (no ring/shadow/border) */}
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

export default TextDebate;
