import React, { useEffect, useState } from "react";
import * as signalR from "@microsoft/signalr";
import { useParams } from "react-router-dom";

function PlaygroundPage() {
  const { roomKey } = useParams<{ roomKey: string }>();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(
    null
  );

  const [uniqueUsers, setUniqueUsers] = useState<string[]>([]);
  const userEmail = localStorage.getItem("UserEmail");

  useEffect(() => {
    if (userEmail) {
      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${import.meta.env.VITE_TWIST_IT_BACKEND_URL}/roomhub`)
        .withAutomaticReconnect()
        .build();
      setConnection(newConnection);
    } else {
      console.error("User email is not available");
    }
  }, [userEmail]);

  useEffect(() => {
      if (connection) {
        connection
          .start()
          .then(() => {
            console.log("Connected to SignalR hub");
            connection.on("SendMessageToClient", (message: string) => {
              console.log(message);
            });
          })
          .catch((err) => console.error("Connection failed: ", err));
      }
    }, [connection]);

  const handleFetchUniqueUser = () => {
    if (connection) {
      connection
        .invoke("GetUsersInRoom", roomKey)
        .then((users: string[]) => {
          setUniqueUsers(users);
        })
        .catch((err) => console.error("GetUsersInRoom failed: ", err));
    }
  };
  return (
    <div>
      <h1>Joined Room: {roomKey}</h1>
      {/* <ul>
        {notifications.map((notification, index) => (
          <li key={index}>{notification}</li>
        ))}
      </ul> */}

      <div className="scenario p-4">
        <div className="scenario-header text-3xl">Scenario</div>
        <div className="scenario-description mt-2">
          You and your best friend accidentally stumble upon a time machine
          disguised as a porta-potty at a music festival. You decide to take it
          for a spin, but something goes hilariously wrong.
        </div>

        <button
          className="btn btn-primary btn-sm mt-4"
          onClick={handleFetchUniqueUser}
        >
          Fetch unique users
        </button>
        <ul>
          {uniqueUsers.map((user, index) => (
            <li key={index}>{user}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default PlaygroundPage;
