import { RefObject } from "react";

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
  setText
}: TextDebateProps) {
  return (
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
        className="text-left text-sm h-[50px] overflow-y-auto"
      >
        {text}
      </div>
      <div className="game-action-container flex flex-col w-full mt-10 justify-between items-center max-w-sm md:max-w-[700px] md:flex-row">
        <div className="flex-shrink-0">
          <div className="speaker-info flex flex-row items-center bg-primary p-1.5 font-[600] rounded-md text-black">
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

        {userEmail === speaker && (
          <div className="speaker-container flex flex-row items-center">
            <textarea
              className="textarea textarea-bordered w-full"
              placeholder="Type your argument..."
              value={text}
              onChange={(e) => setText(e.target.value)} // 👈 Update parent state
            />
            <button className="btn btn-primary" onClick={handleTextSendButton}>
              Send
            </button>
          </div>
        )}
      </div>

      <br />
    </div>
  );
}

export default TextDebate;
