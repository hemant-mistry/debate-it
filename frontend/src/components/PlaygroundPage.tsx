import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { RootState } from "../redux/store";

interface PlaygroundPageProps {
  signalRConnection: signalR.HubConnection | null;
}

function PlaygroundPage({ signalRConnection }: PlaygroundPageProps) {
  const { roomKey } = useParams<{ roomKey: string }>();
  const users = useSelector((state: RootState) => state.room.users);
  const userEmail = localStorage.getItem("UserEmail");
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [isAllPlayerReady, setIsAllPlayerReady] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>(false);
  const [speaker, setSpeaker] = useState<string>("");
  const [buzzerLocked, setBuzzerLocked] = useState<boolean>(false);


  useEffect(() => {
    if (signalRConnection) {
      signalRConnection.on("SendAllPlayersReady", (allReady: boolean) => {
        setIsAllPlayerReady(allReady);
      });

      signalRConnection.on("SendDebateTopic", () => {
        setIsGameStarted(true);
      });

      signalRConnection.on("SendRelayMessage", (userEmailSever:string)=>{
        setSpeaker(userEmailSever);
        setBuzzerLocked(true);
      });

      signalRConnection.on("SpeakerFinished", () => {
        setSpeaker("");
        setBuzzerLocked(false);
      })

    }
  }, [signalRConnection]);

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

  const handleBuzzerClick = () => {
    console.log("Inside BuzzerClick function!");
    if(!buzzerLocked){
      if(signalRConnection){
        signalRConnection.invoke("BuzzerHit", roomKey, userEmail);
      }
    }
  };

  const finishSpeaking = () => {
    if(userEmail == speaker){
      if(signalRConnection){
        signalRConnection.invoke("FinishSpeaking", roomKey);
      }
    }
  }

  return (
    <div>
      <h1>Joined Room: {roomKey}</h1>
      {isGameStarted ? (
        <div>
        <h1>Room: {roomKey}</h1>
        <p>Current Speaker: {speaker || "None"}</p>
        <button onClick={handleBuzzerClick} disabled={buzzerLocked}>
          Press Buzzer
        </button>
        {userEmail === speaker && (
          <button onClick={finishSpeaking}>Finish Speaking</button>
        )}
      </div> /*: isGameOver ? (
        <>Game over!</>
      )*/
      ) : (
        <div className="scenario p-4">
          <div className="scenario-header text-3xl">Scenario</div>
          <div className="scenario-description mt-2">
            You and your best friend accidentally stumble upon a time machine
            disguised as a porta-potty at a music festival. You decide to take
            it for a spin, but something goes hilariously wrong.
          </div>
          <ul>
            {users.map((user) =>
              user ? (
                <li key={user.inferredName} className="mt-4">
                  {user.inferredName}:{" "}
                  <span style={{ color: user.isReady ? "green" : "red" }}>
                    {user.isReady ? "Ready" : "Not Ready"}
                  </span>
                  {user.userEmail === userEmail && (
                    <button
                      className="btn btn-primary btn-xs mt-2"
                      onClick={handleReadyStatus}
                    >
                      {isPlayerReady ? "Not ready" : "Ready"}
                    </button>
                  )}
                </li>
              ) : null
            )}
          </ul>
          <div>{isAllPlayerReady}</div>
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
