﻿using Microsoft.AspNetCore.SignalR;
using Supabase.Gotrue;
using debate_it_backend.Hub.Interfaces;
using debate_it_backend.Models;
using System.Collections.Concurrent;
using Mscc.GenerativeAI;
using debate_it_backend.Prompts;
using System.Diagnostics;
using Json.More;
using System.Text.Json;

namespace debate_it_backend.Hub
{
	public class RoomHub : Hub<IRoomClient>
	{
		// Connection mapping to associate email with connectionId
		private readonly static ConnectionMapping<string> _connections = new ConnectionMapping<string>();
		private static readonly Dictionary<string, List<DebateEntry>> _debateRecords = new();
		private readonly Supabase.Client? _supabaseClient;

		public RoomHub(Supabase.Client supabaseClient)
		{
			_supabaseClient = supabaseClient ?? throw new ArgumentNullException(nameof(supabaseClient));
		}
		private IConfiguration _configuration;

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
			for (int i = 60; i >= 0; i--)
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
		public async Task StartGame(string roomKey)
		{
			var room = await _supabaseClient.From<Room>()
				.Where(x => x.RoomKey == roomKey)
				.Single();

			var topic = room!.Topic;

			string debateTopic = await GenerateDebateTopic(topic);

			await Clients.Group(roomKey).SendDebateTopic(debateTopic);

		}

		private static ConcurrentDictionary<string, string> RoomSpeakers = new ConcurrentDictionary<string, string>();
		private static ConcurrentDictionary<string, bool> RoomBuzzerState = new ConcurrentDictionary<string, bool>();

		public async Task BuzzerHit(string roomKey, string userEmail)
		{
			if (!RoomBuzzerState.GetValueOrDefault(roomKey, false))
			{
				RoomBuzzerState[roomKey] = true;
				RoomSpeakers[roomKey] = userEmail;
				await Clients.Groups(roomKey).SendRelayMessage(userEmail);
			}
		}

		public async Task FinishSpeaking(string roomKey)
		{
			if (RoomSpeakers.TryRemove(roomKey, out _))
			{
				RoomBuzzerState[roomKey] = false;
				await Clients.Groups(roomKey).SpeakerFinished("Speaker finished");
			}
		}

		public async Task ReceiveSpeechTranscript(string roomKey, string userEmail, string debateTranscript)
		{
			int turnsLeft = 0;
			lock (_debateRecords)
			{
				if(!_debateRecords.TryGetValue(roomKey, out var entries))
				{
					entries = new List<DebateEntry>();
					_debateRecords[roomKey] = entries;
				}

				lock (entries)
				{
					entries.Add(new DebateEntry
					{
						RoomKey = roomKey,
						UserEmail = userEmail,
						DebateTranscript = debateTranscript,
					});

					// Calculate turns left for the user (MAX TURNS 5)
					turnsLeft = Math.Max(0, 5 - entries.Count(e => e.UserEmail == userEmail));
				}
			}

			List<DebateEntry> debates;

			debates = _debateRecords.Values
					.SelectMany(debateList => debateList)
					.Where(debate => debate.RoomKey == roomKey)
					.ToList();

			Notification notification = new Notification
			{
				UserEmail = userEmail,
				TurnsLeft = turnsLeft,
				DebateEntries = debates
			};

			await Clients.Groups(roomKey).SavedTranscript(notification);

			// Check if debate is complete for all users
			await CheckAndHandleGameOver(roomKey);
		}

		public async Task HandleGameOver(string roomKey)
		{
			List<DebateEntry> debates;
			List<GeminiInputFormat> inputFormats = new List<GeminiInputFormat>();

			lock (_debateRecords)
			{
				debates = _debateRecords.Values
					.SelectMany(debateList => debateList)
					.Where(debate => debate.RoomKey == roomKey)
					.ToList();

				foreach (var debate in debates)
				{
					inputFormats.Add(new GeminiInputFormat
					{
						UserEmail = debate.UserEmail,
						Transcript = debate.DebateTranscript
					});
				}
			}

			string response = await CallGeminiAPI(inputFormats);

			await Clients.Groups(roomKey).SendDebateScores(response);

			// Remove all debate records for the room from the dictionary
			lock (_debateRecords)
			{
				// Iterate over a copy of the keys
				foreach (var key in _debateRecords.Keys.ToList())
				{
					// Remove debate entries that belong to the given room
					_debateRecords[key].RemoveAll(debate => debate.RoomKey == roomKey);

					// If no more debates remain under this key, remove the key entirely
					if (_debateRecords[key].Count == 0)
					{
						_debateRecords.Remove(key);
					}
				}
			}

			// Remove all user connections for the room
			RemoveRoomConnections(roomKey);
		}

		private static async Task<string> CallGeminiAPI(List<GeminiInputFormat> debates)
		{
			var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");

			// Convert debate entries to a structured format
			string debateText = string.Join("\n", debates.Select(d => $"{d.UserEmail}: {d.Transcript}"));

			// System instruction with proper newline formatting
			var systemInstruction = new Content($"{Prompts.Prompts.DEBATE_AI_SYSTEM_PROMPT}\nDebate Transcript:\n{debateText}");

			IGenerativeAI genAi = new GoogleAI(apiKey);
			var model = genAi.GenerativeModel(Model.Gemini20Flash, systemInstruction: systemInstruction);

			// Create the request using the debate content
			var request = new GenerateContentRequest(debateText);

			try
			{
				var response = await model.GenerateContent(request);
				var jsonDoc = response?.ToJsonDocument();
				string fullJsonResponse = jsonDoc != null ? jsonDoc.RootElement.GetRawText() : null;
				if (string.IsNullOrEmpty(fullJsonResponse))
				{
					return "No response";
				}

				// Parse the outer JSON to extract the inner JSON from the candidate response
				using (JsonDocument doc = JsonDocument.Parse(fullJsonResponse))
				{
					if (doc.RootElement.TryGetProperty("Candidates", out JsonElement candidates) &&
						candidates.GetArrayLength() > 0)
					{
						// Extract the first candidate's content text
						var firstCandidate = candidates[0];
						if (firstCandidate.TryGetProperty("Content", out JsonElement content) &&
							content.TryGetProperty("Parts", out JsonElement parts) &&
							parts.GetArrayLength() > 0)
						{
							var text = parts[0].GetProperty("Text").GetString();
							if (!string.IsNullOrEmpty(text))
							{
								// Remove markdown formatting (triple backticks and optional "json")
								text = text.Trim();
								if (text.StartsWith("```json"))
								{
									text = text.Substring("```json".Length);
								}
								if (text.EndsWith("```"))
								{
									text = text.Substring(0, text.Length - 3);
								}
								// Clean up any extra whitespace
								text = text.Trim();
								// Return the inner JSON string, e.g. the leaderboard data.
								return text;
							}
						}
					}
				}
				return "No response";
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error calling Gemini API: {ex.Message}");
				return "Error processing request";
			}
		}


		private async Task<string> GenerateDebateTopic(string topic)
		{
			var apiKey = Environment.GetEnvironmentVariable("GEMINI_API_KEY");

			// System instruction with correct newline syntax
			var systemInstruction = new Content($"{Prompts.Prompts.GENERATE_DEBATE_STATEMENTS}");


			IGenerativeAI genAi = new GoogleAI(apiKey);
			var model = genAi.GenerativeModel(Model.Gemini20Flash, systemInstruction: systemInstruction);

			// Properly format the request with debate content
			var request = new GenerateContentRequest(topic);

			try
			{
				var response = await model.GenerateContent(request);

				// Extract and return response text
				return response?.ToString() ?? "No response received";
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error calling Gemini API: {ex.Message}");
				return "Error processing request";
			}
		}

		private async Task CheckAndHandleGameOver(string roomKey)
		{
			bool isGameOver = false;
			lock (_debateRecords)
			{
				if(_debateRecords.TryGetValue(roomKey, out var entries))
				{
					// Group by user and check if every user has at least 5 entries
					var userCounts = entries.GroupBy(e => e.UserEmail)
											.Select(g => new {User = g.Key, Count = g.Count()});

					if(userCounts.All(u => u.Count >=5))
					{
						isGameOver = true;
					}
				}
			}

			if(isGameOver)
			{
				await HandleGameOver(roomKey);
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