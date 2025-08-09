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
  speaker: string;
  notification: Notification | null;
  userEmail: string;
  handleTextSendButton: () => void;
  setText: (text: string) => void;
  getUserName: (email: string) => string;
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

  useEffect(() => {
    if (!roomKey) return;

    const fetchPlayers = async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_TWIST_IT_BACKEND_URL}/api/rooms/players/${roomKey}`
        );
        const data = await res.json();
        setPlayers(data);
      } catch (err) {
        console.error("Error fetching players:", err);
      }
    };

    fetchPlayers();
    const interval = setInterval(fetchPlayers, 5000); // refresh every 5s
    return () => clearInterval(interval);
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
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="flex flex-row w-full mt-5 px-4 gap-6">
      {/* Main Debate Section */}
      <div className="flex-1 flex flex-col items-center">
        {/* Debate topic */}
        <div className="w-full max-w-3xl bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl p-4 shadow-md">
          <p className="text-xs opacity-80">Topic</p>
          <p className="mt-1 text-lg font-semibold">{debateTopic}</p>
        </div>

        {/* Debate thread */}
        <div
          ref={threadContainerRef}
          className="mt-4 w-full max-w-3xl h-[300px] overflow-y-auto space-y-2 bg-gray-50 rounded-xl p-4 shadow-inner"
        >
          <ul className="space-y-1 text-sm">
            {thread.map((item, index) => (
              <li key={index}>
                <span className="font-semibold text-blue-600">
                  {getUserName(item.userEmail)}:
                </span>{" "}
                <span className="text-gray-800">{item.debateTranscript}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Speaker info */}
        <div className="w-full max-w-3xl mt-5">
          <div className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg font-semibold inline-block">
            Speaker: {speaker || "None"}
          </div>
          {notification && userEmail === notification.userEmail && (
            <p className="text-sm text-gray-500 mt-1">
              Turns left: {notification.turnsLeft}
            </p>
          )}
        </div>

        {/* Input for active speaker */}
        {userEmail === speaker && (
          <div className="flex items-end gap-2 w-full max-w-3xl mt-4">
            <textarea
              ref={textareaRef}
              className="textarea textarea-bordered w-full resize-none overflow-hidden"
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
      <div className="w-64 bg-white rounded-xl shadow-lg p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-4">Participants</h2>
        <div className="space-y-3 overflow-y-auto">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg shadow-sm"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                {player.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="font-medium">{player.name}</p>
                <p className="text-xs text-gray-500">
                  Joined {formatTime(player.createdAt)}
                </p>
              </div>
              {player.isAdmin && (
                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-md">
                  Admin
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TextDebate;
