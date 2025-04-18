import { RefObject, useEffect, useRef, useState } from "react";

interface ThreadItem {
  userEmail: string;
  debateTranscript: string;
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

interface TextDebateProps {
  debateTopic: string;
  threadContainerRef: RefObject<HTMLDivElement>;
  thread: ThreadItem[];
  transcriptScrollRef: RefObject<HTMLDivElement>;
  text: string;
  speaker: string;
  notification: Notification | null;
  userEmail: string;
  handleTextSendButton: () => void;
  setText: (text: string) => void;
}

function TextDebate({
  debateTopic,
  threadContainerRef,
  thread,
  transcriptScrollRef,
  text,
  speaker,
  notification,
  userEmail,
  handleTextSendButton,
  setText,
}: TextDebateProps) {
  const [rows, setRows] = useState(1);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const maxHeightRef = useRef<number | null>(null);

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

  return (
    <div className="game-container flex flex-col justify-center items-center mt-5">
      <div className="debate-topic text-xl w-full max-w-md md:max-w-[700px] text-center">
        <p className="text-sm">Topic:</p>
        <p className="mt-2">{debateTopic}</p>
        <div
          className="text-left text-sm h-[300px] overflow-y-auto mt-5"
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
        className="text-left text-sm h-[50px] overflow-y-auto"
      >
        {text}
      </div>
      <div
        className="
    game-action-container
    flex flex-col
    w-full
    items-center
    max-w-sm md:max-w-[700px]
    space-y-4
    mt-5
  "
      >

        <div className="flex-shrink-0 self-start">
          <div className="speaker-info flex items-center bg-primary p-1.5 font-[600] rounded-md text-black">
            <p className="text-sm">Speaker : {speaker || "None"}</p>
          </div>
          {notification && userEmail === notification.userEmail && (
            <p className="text-sm mt-2 text-white">
              Turns left: {notification.turnsLeft}
            </p>
          )}
        </div>


        {userEmail === speaker && (
          <div className="speaker-container flex items-end w-full space-x-2">
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
    </div>
  );
}

export default TextDebate;
