using Microsoft.AspNetCore.SignalR;
using Supabase.Gotrue;
using debate_it_backend.Hub.Interfaces;
using debate_it_backend.Models;
using System.Collections.Concurrent;
using Mscc.GenerativeAI;
using System.Diagnostics;
using Json.More;
using System.Text.Json;
using debate_it_backend.Hub.DebateHandlers;
using debate_it_backend.Services;

namespace debate_it_backend.Hub
{
	public class RoomHub : Hub<IRoomClient>
	{
		// Connection mapping to associate email with connectionId
		private readonly static ConnectionMapping<string> _connections = new ConnectionMapping<string>();
		private readonly Supabase.Client? _supabaseClient;
		private readonly DebateHandlerFactory _handlerFactory;
		private readonly GeminiService _geminiService;

		private static readonly ConcurrentDictionary<string, IDebateHandler> _roomHandlers = new();

		public RoomHub(
			Supabase.Client supabaseClient,
			DebateHandlerFactory handlerFactory,
			GeminiService geminiService)
		{
			_supabaseClient = supabaseClient ?? throw new ArgumentNullException(nameof(supabaseClient));
			_handlerFactory = handlerFactory ?? throw new ArgumentNullException(nameof(handlerFactory));
			_geminiService = geminiService ?? throw new ArgumentNullException(nameof(geminiService));
		}

		// Modified to use the strategy pattern
		public async Task StartGame(string roomKey)
		{
			// Get room details from database
			var room = await _supabaseClient.From<Room>()
				.Where(x => x.RoomKey == roomKey)
				.Single();

			var topic = room!.Topic;
			// Create the appropriate handler based on room mode
			var handler = _handlerFactory.CreateHandler(room.DebateMode);
			_roomHandlers[roomKey] = handler;

			// Start the debate with the handler
			await handler.StartDebate(roomKey, topic, Clients, Groups);
		}

		// Modified to use the strategy pattern
		public async Task ReceiveSpeechTranscript(string roomKey, string userEmail, string debateTranscript)
		{
			// Get or create handler for this room
			if (!_roomHandlers.TryGetValue(roomKey, out var handler))
			{
				var room = await _supabaseClient.From<Room>()
					.Where(x => x.RoomKey == roomKey)
					.Single();

				handler = _handlerFactory.CreateHandler(room.DebateMode);
				_roomHandlers[roomKey] = handler;
			}

			// Process the transcript using the appropriate handler
			await handler.ProcessDebateEntry(roomKey, userEmail, debateTranscript, Clients, Groups);
		}

		public async Task BuzzerHit(string roomKey, string userEmail)
		{
			if (_roomHandlers.TryGetValue(roomKey, out var handler) && handler is VoiceDebateHandler voiceHandler)
			{
				await voiceHandler.BuzzerHit(roomKey, userEmail, Clients, Groups);
			}
		}

		public async Task FinishSpeaking(string roomKey)
		{
			if (_roomHandlers.TryGetValue(roomKey, out var handler) && handler is VoiceDebateHandler voiceHandler)
			{
				await voiceHandler.FinishSpeaking(roomKey, Clients, Groups);
			}
		}


		// Method for clients to join a room
		public async Task JoinRoom(string roomKey, string userEmail, string inferredName)
		{
			try
			{
				_connections.Add(userEmail, Context.ConnectionId, userEmail, inferredName, roomKey);
				await Groups.AddToGroupAsync(Context.ConnectionId, roomKey);
				await Clients.Group(roomKey).SendMessageToClient($"{userEmail} has joined room {roomKey}");

				List<PlayerInfo> users = _connections.GetUniqueInferredPlayersPerRoom(roomKey);
				await Clients.Group(roomKey).SendUpdatedUserList(users);
			}
			catch (InvalidOperationException ex)
			{
				throw new HubException(ex.Message); // Throwing SignalR specific exception
			}
			catch (Exception ex)
			{
				throw new HubException("An unexpected error occurred while joining the room.");
			}
		}	

		// Method for sending a message to all clients in a specific room
		public async Task SendMessage(string roomKey, string message)
		{
			await Clients.Group(roomKey).SendMessageToClient(message);
		}

		public override async Task OnDisconnectedAsync(Exception? exception)
		{

			Trace.WriteLine(Context.ConnectionId + " - disconnected");
			_connections.Remove(Context.ConnectionId);
			await base.OnDisconnectedAsync(exception);
		}

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

		private void RemoveRoomConnections(string roomKey)
		{
			lock (_connections)
			{
				var usersInRoom = _connections.GetConnectionsByRoomKey(roomKey);
				foreach (var user in usersInRoom)
				{
					_connections.Remove(user.ConnectionId);
				}
			}
		}

	}
}