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
  getUserName
}: VoiceDebateProps) {
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
                <span className="mr-2 text-white">{getUserName(item.userEmail)}:</span>
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
            <img src={CurrentSpeakerIcon} className="w-5" alt="Speaker Icon" />
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
             disabled={
              buzzerLocked ||
              (notification?.userEmail === userEmail &&
                notification.turnsLeft === 0)
            } 
            >
              <img src={BuzzerIcon} className="w-5" alt="Buzzer Icon" />
              <p className="text-sm">Buzzer</p>
            </button>
          </div>
        )}
      </div>

      <br />
    </div>
  );
}

export default VoiceDebate;
