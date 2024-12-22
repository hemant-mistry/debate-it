import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const [isJoinRoom, setIsJoinRoom] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [roomKey, setRoomKey] = useState('');
  const [topic, setTopic] = useState('');
  const navigate = useNavigate();

  const handleJoinRoom = async () => {
    const response = await fetch(`${import.meta.env.VITE_TWIST_IT_BACKEND_URL}/api/rooms/join-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerName, roomKey }),
    });

    if (response.ok) {
      console.log('Joined room successfully');
      navigate(`/hub/${roomKey}`);
    } else {
      console.error('Failed to join room');
    }
  };

  const handleCreateRoom = async () => {
    const response = await fetch(`${import.meta.env.VITE_TWIST_IT_BACKEND_URL}/api/rooms/create-room`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ playerName, topic }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(data);
      const createdRoomKey = data.room.roomKey; // Assuming the response contains the roomKey
      console.log('Created room successfully', createdRoomKey);
      navigate(`/hub/${createdRoomKey}`);
    } else {
      console.error('Failed to create room');
    }
  };

  return (
    <>
      <div className="flex justify-center items-center">
        <div className="card flex items-center bg-black shadow-xl p-4 justify-center mt-[150px] w-[300px]">
          <div className="flex-row card-body">
            <button
              className={`btn ${isJoinRoom ? 'btn-ghost' : 'btn-secondary'} btn-sm`}
              onClick={() => setIsJoinRoom(false)}
            >
              Create Room
            </button>
            <button
              className={`btn ${isJoinRoom ? 'btn-secondary' : 'btn-ghost'} btn-sm`}
              onClick={() => setIsJoinRoom(true)}
            >
              Join Room
            </button>
          </div>
          {isJoinRoom ? (
            <div className="flex flex-col gap-4">
              <div className="label">
                <span className="label-text">Enter your name:</span>
              </div>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="input input-bordered"
              />
              <div className="label">
                <span className="label-text">Enter room key:</span>
              </div>
              <input
                type="text"
                value={roomKey}
                onChange={(e) => setRoomKey(e.target.value)}
                className="input input-bordered"
              />
              <button className="btn btn-primary" onClick={handleJoinRoom}>
                Join Room
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="label">
                <span className="label-text">Enter your name:</span>
              </div>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="input input-bordered"
              />
              <div className="label">
                <span className="label-text">Enter topic:</span>
              </div>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="input input-bordered"
              />
              <button className="btn btn-primary" onClick={handleCreateRoom}>
                Create Room
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default HomePage;