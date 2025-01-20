import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { RootState } from "../redux/store";

interface PlaygroundPageProps {
  signalRConnection: signalR.HubConnection | null;
}

type UserScenarioMapping = Record<string, string[]>;

function PlaygroundPage({ signalRConnection }: PlaygroundPageProps) {
  const { roomKey } = useParams<{ roomKey: string }>();
  const users = useSelector((state: RootState) => state.room.users);
  const userEmail = localStorage.getItem("UserEmail");
  const [isPlayerReady, setIsPlayerReady] = useState<boolean>(false);
  const [isAllPlayerReady, setIsAllPlayerReady] = useState<boolean>(false);
  const [isGameStarted, setIsGameStarted] = useState<boolean>();
  const [userScenarios, setUserScenarios] = useState<UserScenarioMapping>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  useEffect(() => {
    if (signalRConnection) {
      signalRConnection.on("SendAllPlayersReady", (allReady: boolean) => {
        setIsAllPlayerReady(allReady);
      });

      signalRConnection.on(
        "SendScenarioInfo",
        (userScenarios: UserScenarioMapping) => {
          console.log("User scenario mapping list", userScenarios);
          setUserScenarios(userScenarios);
          setIsGameStarted(true);
        }
      );
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

  const handleNextQuestion = () => {
    if (userEmail && userScenarios[userEmail]) {
      const totalQuestions = userScenarios[userEmail].length;
      setCurrentQuestionIndex((prevIndex) => (prevIndex + 1) % totalQuestions);
    }
  };

  return (
    <div>
      <h1>Joined Room: {roomKey}</h1>
      {isGameStarted ? (
        <div>
          Game has started!
          {Object.entries(userScenarios).map(([user, scenarios]) =>
            user === userEmail ? (
              <div key={user}>
                <strong>{user}</strong>:
                <div className="question-box mt-4">
                  <h3>Question:</h3>
                  <p>{scenarios[currentQuestionIndex]}</p>
                  <button
                    className="btn btn-secondary btn-sm mt-4"
                    onClick={handleNextQuestion}
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null
          )}
        </div>
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
