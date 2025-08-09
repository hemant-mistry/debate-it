import { RefObject } from "react";
import Lottie from "react-lottie";
import CurrentSpeakerIcon from "../../assets/debate-mic.png";
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

interface VoiceDebateProps {
  debateTopic: string;
  threadContainerRef: RefObject<HTMLDivElement>;
  thread: ThreadItem[];
  transcriptScrollRef: RefObject<HTMLDivElement>;
  text: string;
  speaker: string;
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
  return (
    <div className="flex flex-col items-center pt-10 px-4">
      {/* Debate topic */}
      <div className="w-full max-w-md md:max-w-[700px] bg-base-200 rounded-2xl p-4 shadow-md text-center">
        <p className="text-xs text-neutral/70">Topic:</p>
        <p className="mt-1 text-lg font-medium">{debateTopic}</p>

        {/* Debate thread */}
        <div
          ref={threadContainerRef}
          className="mt-4 h-[300px] overflow-y-auto space-y-2 text-sm text-neutral"
        >
          <ul className="space-y-1">
            {thread.map((item, index) => (
              <li key={index}>
                <span className="font-semibold text-primary">
                  {getUserName(item.userEmail)}:
                </span>{" "}
                {item.debateTranscript}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Transcript preview */}
      <div
        ref={transcriptScrollRef}
        className="w-full max-w-md md:max-w-[700px] mt-3 text-sm h-[50px] overflow-y-auto p-2 bg-base-300 rounded-lg text-neutral"
      >
        {text}
      </div>

      {/* Action area */}
      <div className="w-full max-w-sm md:max-w-[700px] mt-8 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Speaker info */}
        <div>
          <div className="flex items-center gap-2 bg-primary text-primary-content px-3 py-2 rounded-lg font-semibold">
            <img src={CurrentSpeakerIcon} className="w-5" alt="Speaker Icon" />
            <p className="text-sm">Speaker: {speaker || "None"}</p>
          </div>
          {notification && userEmail === notification.userEmail && (
            <p className="text-sm text-neutral mt-2">
              Turns left: {notification.turnsLeft}
            </p>
          )}
        </div>

        {/* Action button */}
        {userEmail === speaker ? (
          <button
            className="btn flex items-center justify-center gap-2 bg-primary hover:bg-primary text-primary-content"
            onClick={finishSpeaking}
          >
            <Lottie options={defaultOptions} height={40} width={40} />
            Finish Speaking
          </button>
        ) : (
          <button
            className="btn btn-primary hover:bg-primary text-primary-content disabled:bg-primary disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
            onClick={handleBuzzerClick}
            disabled={
              buzzerLocked ||
              (notification?.userEmail === userEmail &&
                notification.turnsLeft === 0)
            }
          >
            <img src={BuzzerIcon} className="w-5" alt="Buzzer Icon" />
            Buzzer
          </button>
        )}
      </div>
    </div>
  );
}

export default VoiceDebate;
