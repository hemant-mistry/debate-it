using debate_it_backend.Hub.Interfaces;
using debate_it_backend.Models;
using debate_it_backend.Services;
using Microsoft.AspNetCore.SignalR;
using Supabase.Interfaces;
using System.Collections.Concurrent;
namespace debate_it_backend.Hub.DebateHandlers
{
	public class VoiceDebateHandler:IDebateHandler
	{
		private readonly ConcurrentDictionary<string, List<DebateEntry>> _debateRecords = new();
		private readonly ConcurrentDictionary<string, string> _roomSpeakers = new();
		private readonly ConcurrentDictionary<string ,bool> _roomBuzzerState = new();
		private readonly GeminiService _geminiService;

		public VoiceDebateHandler(
			GeminiService geminiService)
		{
			_geminiService = geminiService;
		}

		public async Task StartDebate(string roomKey, string topicKey,
			IHubCallerClients<IRoomClient> clients)
		{

			var topic = await _geminiService.GenerateDebateTopic(topicKey);
			await clients.Group(roomKey).SendDebateTopicWithMode(topic, 1);
			_debateRecords[roomKey] = new List<DebateEntry>();
		}

		public async Task ProcessDebateEntry(string roomKey, string userEmail, string content,
		IHubCallerClients<IRoomClient> clients)
		{
			int turnsLeft = 0;
			lock (_debateRecords)
			{
				if (!_debateRecords.TryGetValue(roomKey, out var entries))
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
						DebateTranscript = content,
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

			await clients.Groups(roomKey).SavedTranscript(notification);

			// Check if debate is complete for all users
			await CheckAndHandleGameOver(roomKey, clients);
		}

		public async Task CheckAndHandleGameOver(string roomKey, IHubCallerClients<IRoomClient> clients)
		{
			bool isGameOver = false;
			lock (_debateRecords)
			{
				if (_debateRecords.TryGetValue(roomKey, out var entries))
				{
					// Group by user and check if every user has at least 5 entries
					var userCounts = entries.GroupBy(e => e.UserEmail)
											.Select(g => new { User = g.Key, Count = g.Count() });

					if (userCounts.All(u => u.Count >= 5))
					{
						isGameOver = true;
					}
				}
			}

			if (isGameOver)
			{
				await HandleGameOver(roomKey, clients);
			}
		}

		private async Task HandleGameOver(string roomKey, IHubCallerClients<IRoomClient> clients)
		{
			List<GeminiInputFormat> inputFormats = new List<GeminiInputFormat>();

			if (_debateRecords.TryGetValue(roomKey, out var entries))
			{
				// Convert text entries to the format expected by Gemini
				foreach (var userEntries in entries.GroupBy(e => e.UserEmail))
				{
					inputFormats.Add(new GeminiInputFormat
					{
						UserEmail = userEntries.Key,
						Transcript = string.Join("\n", userEntries.Select(e => e.DebateTranscript))
					});
				}
			}

			// Get AI evaluation
			string response = await _geminiService.AnalyzeDebate(inputFormats);

			// Send results to clients
			await clients.Group(roomKey).SendDebateScores(response);

			// Clean up
			_debateRecords.TryRemove(roomKey, out _);
		}

		public async Task BuzzerHit(string roomKey, string userEmail, IHubCallerClients<IRoomClient> clients)
		{
			if (!_roomBuzzerState.GetValueOrDefault(roomKey, false))
			{
				_roomBuzzerState[roomKey] = true;
				_roomSpeakers[roomKey] = userEmail;
				await clients.Groups(roomKey).SendRelayMessage(userEmail);
			}
		}

		public async Task FinishSpeaking(string roomKey, IHubCallerClients<IRoomClient> clients)
		{
			if (_roomSpeakers.TryRemove(roomKey, out _))
			{
				_roomBuzzerState[roomKey] = false;
				await clients.Groups(roomKey).SpeakerFinished("Speaker finished");
			}
		}
	}
}
