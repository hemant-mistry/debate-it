import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { setUsers } from "../redux/slices/roomSlice";

function PlaygroundPage() {
  const dispatch = useDispatch();
  const { roomKey } = useParams<{ roomKey: string }>();
  const users = useSelector((state: any) => state.room.users);
  useEffect(() => {
    const persistedUsers = JSON.parse(
      localStorage.getItem("roomUsers") || "[]"
    );
    if (users.length === 0 && persistedUsers.length > 0) {
      dispatch(setUsers(persistedUsers));
    }
  }, [users, dispatch]);

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
          {users.map((user: string) => (
            <li key={user}>{user}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default PlaygroundPage;
