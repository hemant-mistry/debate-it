import React, { useEffect, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { useParams } from 'react-router-dom';

function PlaygroundPage() {
  const { roomKey } = useParams<{ roomKey: string }>();
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Establish connection
    const newConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${import.meta.env.VITE_TWIST_IT_BACKEND_URL}/roomhub`, {})
      .withAutomaticReconnect()
      .build();

    setConnection(newConnection);
  }, [roomKey]); // Recreate connection if roomKey changes

  useEffect(() => {
    if (connection) {
      // Start the connection
      connection
        .start()
        .then(() => {
          console.log('Connected to SignalR hub');
          connection.on('ReceiveNotification', (message: string) => {
            setNotifications((prev) => [...prev, message]);
          });

          // Join the room
          connection.invoke('JoinRoom', roomKey).catch((err) => console.error('JoinRoom failed: ', err));
        })
        .catch((err) => console.error('Connection failed: ', err));
    }
  }, [connection, roomKey]);

  const handleSendMessage = () => {
    if (connection && message) {
      connection.invoke('SendMessage', roomKey, message).catch((err) => console.error('SendMessage failed: ', err));
      setMessage('');
    }
  };

  const handleStartTimer = () => {
    if(connection){
      connection.invoke('StartTimer', roomKey).catch((err)=>console.error('StartTimer failed: ', err));
    }
  }

  return (
    <div>
      <h1>Joined Room: {roomKey}</h1>
      <ul>
        {notifications.map((notification, index) => (
          <li key={index}>{notification}</li>
        ))}
      </ul>
      <div>
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter your message"
        />
        <button onClick={handleSendMessage}>Send Message</button>
      </div>
      <div>
        <button onClick={handleStartTimer}>Start Timer</button>
      </div>
    </div>
  );
}

export default PlaygroundPage;