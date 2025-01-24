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
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [answer, setAnswer] = useState<string>("");
  const [response, setResponse] = useState<string>("");

  const question = "Is football dying?";

  useEffect(() => {
    if (signalRConnection) {
      signalRConnection.on("SendAllPlayersReady", (allReady: boolean) => {
        setIsAllPlayerReady(allReady);
      });

      signalRConnection.on("SendScenarioInfo", () => {
        setIsGameStarted(true);
      });

      signalRConnection.on("SendAnalysis", (email:string, repsonse:string )=>{
        if(email == userEmail){
          setResponse(repsonse);
        }
      
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

  const handleNextQuestion = async () => {
    if (signalRConnection) {
      try {
        await signalRConnection.invoke(
          "AnalyseResponse",
          roomKey,
          userEmail,
          question,
          answer
        );
        
        setAnswer("");
      } catch (error) {
        console.error("Error invoking AnalyseResponse: ", error);
      }
    }
  };

  return (
    <div>
      <h1>Joined Room: {roomKey}</h1>
      {isGameStarted ? (
        <div>
          Game has started!
          <div className="question-box mt-4">
            <div className="question-details">
              <h3>Question:</h3>
              <p>{question}</p>
              <textarea
                className="textarea textarea-bordered mt-5"
                placeholder="Type your answer here"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
              ></textarea>
            </div>

            <button
              className="btn btn-secondary btn-sm mt-4"
              onClick={handleNextQuestion}
            >
              Submit
            </button>
          </div>
          {response && (
            <div className="response-box mt-4">
              <h3>Response:</h3>
              <p>{response}</p>
            </div>
          )}
        </div>
      ) : isGameOver ? (
        <>Game over!</>
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