import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { setUsers, toggleUserReady } from "../redux/slices/roomSlice";
import * as signalR from "@microsoft/signalr";
import { RootState } from "../redux/store"; // Ensure you have a RootState type defined in your store
import { UserDetails } from "../types/User";

function PlaygroundPage() {
  const dispatch = useDispatch();
  const { roomKey } = useParams<{ roomKey: string }>();
  const users = useSelector((state: RootState) => state.room.users);
  const userEmail = localStorage.getItem("UserEmail");
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);

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
          connection.on("SendUpdatedUserList", (users: UserDetails[]) => {
            dispatch(setUsers(users));
          });
        })
        .catch((err) => console.error("Connection failed: ", err));
    }
  }, [connection, dispatch]);

  const handleReadyStatus = () => {
        if(connection){
          connection
          .invoke("UpdateReadyStatus", userEmail, roomKey)
          .then(()=>{
            console.log("Player status updated successfully!");
            connection.on("SendUpdatedUserList", (users: UserDetails[]) => {
              console.log("Updated user list", users);
              dispatch(setUsers(users));
            });
          })
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

        <ul>
          {users.map((user) => (
            user && (
              <li key={user.inferredName} className="mt-4">
                {user.inferredName}: <span style={{ color: user .isReady ? "green" : "red" }}>{user.isReady ? "Ready" : "Not Ready"}</span>
                <button className="btn btn-primary btn-xs mt-2" onClick={handleReadyStatus}>Ready to play</button>
              </li>
            )
          ))}
        </ul>
      </div>
    </div>
  );
}

export default PlaygroundPage;