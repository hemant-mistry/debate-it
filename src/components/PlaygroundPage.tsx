import { useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { RootState } from "../redux/store";


interface PlaygroundPageProps{
  signalRConnection: signalR.HubConnection | null;
}

function PlaygroundPage({signalRConnection}:PlaygroundPageProps) {
  const { roomKey } = useParams<{ roomKey: string }>();
  const users = useSelector((state: RootState) => state.room.users);
  const userEmail = localStorage.getItem("UserEmail");
  const [isAllPlayerReady, setIsAllPlayerReady] = useState<boolean>(false);


  useEffect(() => {
    if(signalRConnection){
      signalRConnection.on("SendAllPlayersReady", (allReady:boolean)=>{
        setIsAllPlayerReady(allReady)
      })
    }
  }, [signalRConnection]);

  const handleReadyStatus = () => {
    if (signalRConnection) {
      signalRConnection
        .invoke("UpdateReadyStatus", userEmail, roomKey)
        .then(() => console.log("Player status updated successfully!"))
        .catch((err) => console.error("Error updating ready status: ", err));
    }
  };

  return (
    <div>
      <h1>Joined Room: {roomKey}</h1>
      <div className="scenario p-4">
        <div className="scenario-header text-3xl">Scenario</div>
        <div className="scenario-description mt-2">
          You and your best friend accidentally stumble upon a time machine
          disguised as a porta-potty at a music festival. You decide to take it
          for a spin, but something goes hilariously wrong.
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
                    Ready to play
                  </button>
                )}
              </li>
            ) : null
          )}
        </ul>
        <div>{isAllPlayerReady}</div>
        {isAllPlayerReady && (
          <button className="btn btn-primary btn-sm mt-10">Start</button>
        )}

      </div>
    </div>
  );
}

export default PlaygroundPage;
