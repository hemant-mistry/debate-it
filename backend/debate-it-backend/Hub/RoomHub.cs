﻿using Microsoft.AspNetCore.SignalR;
using Supabase.Gotrue;
using debate_it_backend.Hub.Interfaces;
using debate_it_backend.Models;
using System.Collections.Concurrent;
using Mscc.GenerativeAI;

namespace debate_it_backend.Hub
{
	public class RoomHub : Hub<IRoomClient>
	{
		// Connection mapping to associate email with connectionId
		private readonly static ConnectionMapping<string> _connections = new ConnectionMapping<string>();

		private IConfiguration _configuration;

		// Method for clients to join a room
		public async Task JoinRoom(string roomKey, string userEmail, string inferredName)
		{
			// Map the email to the PlayerInfo
			_connections.Add(userEmail, Context.ConnectionId, userEmail, inferredName, roomKey);

			// Add the user to the SignalR group
			await Groups.AddToGroupAsync(Context.ConnectionId, roomKey);

			await Clients.Group(roomKey).SendMessageToClient($"{userEmail} has joined room {roomKey}");

			List<PlayerInfo> users = _connections.GetUniqueInferredPlayersPerRoom(roomKey);

			await Clients.Group(roomKey).SendUpdatedUserList(users);

		}

		// Method for sending a message to all clients in a specific room
		public async Task SendMessage(string roomKey, string message)
		{
			await Clients.Group(roomKey).SendMessageToClient(message);
		}

		/*// Method for handling client leaving a room
		public async Task LeaveRoom(string roomKey)
		{
			await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomKey);
			await Clients.Group(roomKey).ReceiveNotification($"A user has left room {roomKey}");

			// Remove the connection from the mapping
			_connections.Remove(Context.ConnectionId);
		}

		// Handle client disconnection
		public override async Task OnDisconnectedAsync(Exception? exception)
		{
			// Remove the connection from the mapping
			_connections.Remove(Context.ConnectionId);
			await base.OnDisconnectedAsync(exception);
		}
		*/

		public async Task RemoveAllUsersInRoom(string roomKey)
		{
			// Get all connection IDs associated with the room
			var connections = _connections.GetConnectionsByRoomKey(roomKey);

			if (connections != null && connections.Any())
			{
				foreach (var connection in connections)
				{
					// Remove the connection from the group
					await Groups.RemoveFromGroupAsync(connection.ConnectionId, roomKey);

					// Optionally notify the room about user removal
					await Clients.Group(roomKey).SendMessageToClient($"{connection.InferredName} has been removed from the room {roomKey}");

					// Remove the connection from the mapping
					_connections.Remove(connection.ConnectionId);
				}
			}

			// Optionally notify the entire room that all users were removed
			await Clients.Group(roomKey).SendMessageToClient($"All users have been removed from room {roomKey}");
		}


		// Start a timer and notify all clients in the room
		public async Task StartTimer(string roomKey)
		{
			for (int i = 20; i >= 0; i--)
			{
				await Clients.Group(roomKey).SendMessageToClient($"Time remaining: {i} seconds");
				await Task.Delay(1000);
			}
			await Clients.Group(roomKey).SendMessageToClient("Timer finished");
		}

		// Get all unique users in a specific room
		public async Task GetUsersInRoom(string roomKey)
		{
			// Retrieve the connections for specified roomKey
			List<PlayerInfo> users = _connections.GetUniqueInferredPlayersPerRoom(roomKey);

			await Clients.Group(roomKey).SendUpdatedUserList(users);
		}

		// playerUniqueName = UserEmail
		public async Task UpdateReadyStatus(string playerUniqueName, string roomKey, bool isReady)
		{
			var user = _connections.UpdateUserReadyStatus(playerUniqueName, roomKey, isReady);
			if (user != null)
			{
				List<PlayerInfo> users = _connections.GetUniqueInferredPlayersPerRoom(roomKey);
				await Clients.Group(roomKey).SendUpdatedUserList(users);

				bool allReady = users.All(player => player.IsReady);

				await Clients.Group(roomKey).SendAllPlayersReady(allReady);
					
			}
		}

		// TODO: Replace these with Gemini generated scenarios
		// StartGame would trigger once all players are ready and hit "start"
		readonly string debateTopic = "This is an AI generated Debate topic..";
		public async Task StartGame(string roomKey)
		{
			var content = "Girls are bad at driving";
			var apiKey = _configuration["GeminiKey"];
			var systemInstruction = new Content($"Based on the topic you need to start debate between two people. So give questions or scenarios to build a debate around the topic./n Just give one topic /n Topic: {content}");
			IGenerativeAI genAi = new GoogleAI(apiKey);
			var model = genAi.GenerativeModel(Model.Gemini15ProLatest, systemInstruction: systemInstruction);
			var request = new GenerateContentRequest(content);

			var response = await model.GenerateContent(request);

			await Clients.Group(roomKey).SendDebateTopic(response.Text);
			
		}

		private static ConcurrentDictionary<string, string> RoomSpeakers = new ConcurrentDictionary<string, string>();
		private static ConcurrentDictionary<string, bool> RoomBuzzerState = new ConcurrentDictionary<string, bool>();

		public async Task BuzzerHit(string roomKey, string userEmail)
		{
			if(!RoomBuzzerState.GetValueOrDefault(roomKey, false))
			{
				RoomBuzzerState[roomKey] = true;
				RoomSpeakers[roomKey] = userEmail;
				await Clients.Groups(roomKey).SendRelayMessage(userEmail);
			}
		}

		public async Task FinishSpeaking(string roomKey)
		{
			if(RoomSpeakers.TryRemove(roomKey, out _))
			{
				RoomBuzzerState[roomKey] = false;
				await Clients.Groups(roomKey).SpeakerFinished("Speaker finished");
			}
		}
	}
}