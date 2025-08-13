using debate_it_backend.Hub.Interfaces;
using debate_it_backend.Models;
using debate_it_backend.Services;
using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Reactive;
using Notification = debate_it_backend.Models.Notification;

namespace debate_it_backend.Hub.DebateHandlers
{
	public class TextDebateHandler:IDebateHandler
	{
		private readonly ConcurrentDictionary<string, List<DebateEntry>> _debateRecords = new();
		private readonly ConcurrentDictionary<string, int> _roomRoundRobinIndex = new();
		private readonly GeminiService _geminiService;

		public TextDebateHandler(
			GeminiService geminiService, IHubContext<RoomHub> hubContext)
		{	
			_geminiService = geminiService;
		}

		public async Task StartDebate(string roomKey, string topicKey, IHubCallerClients<IRoomClient> clients, List<string> joinedUsers)
		{
			var topic = await _geminiService.GenerateDebateTopic(topicKey);
			await clients.Group(roomKey).SendDebateTopicWithMode(topic, 0);
			_debateRecords[roomKey] = new List<DebateEntry>();

			// Call GetUsersInRoom from RoomHub
			string currentUser = EmailRoundRobin(roomKey, joinedUsers);
			await clients.Group(roomKey).SendCurrentUser(currentUser);
		}

		public async Task ProcessDebateEntry(string roomKey, string userEmail, string content, IHubCallerClients<IRoomClient> clients)
		{
			var entries = _debateRecords.GetOrAdd(roomKey, _ => new List<DebateEntry>());

			int turnsLeft = 0;
            bool isGameOverFlag = false;

            lock (entries)
			{
				entries.Add(new DebateEntry
				{
					RoomKey = roomKey,
					UserEmail = userEmail,
					DebateTranscript = content,
				});

				turnsLeft = Math.Max(0, 5 - entries.Count(e => e.UserEmail == userEmail));

                var userCounts = entries
					.GroupBy(e => e.UserEmail)
					.Select(g => new { User = g.Key, Count = g.Count() });

                if (userCounts.All(u => u.Count >= 5))
                {
                    isGameOverFlag = true;
                }
            }

			List<DebateEntry> debates;

			debates = _debateRecords.Values
				.SelectMany(debateList => debateList)
				.Where(debate=>debate.RoomKey == roomKey)
				.ToList();

			Notification notification = new Notification
			{
				UserEmail = userEmail,
				TurnsLeft = turnsLeft,
				DebateEntries = debates,
                isGameOverFlag = isGameOverFlag
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

		public async Task GetCurrentUser(string roomKey, IHubCallerClients<IRoomClient> clients, List<string> userEmails)
		{
			await clients.Group(roomKey).SendCurrentUser(EmailRoundRobin(roomKey, userEmails));
		}

		public string EmailRoundRobin(string roomKey, List<string> emails)
		{
			if (emails == null || emails.Count == 0)
			{
				throw new ArgumentException("There are no people in the room");
			}

			// Fetch debate entries for the room
			var entries = _debateRecords.GetOrAdd(roomKey, _ => new List<DebateEntry>());

			// Count turns per user
			var userTurnCounts = emails.ToDictionary(
				email => email,
				email => entries.Count(e => e.UserEmail == email)
			);

			// Get current index (default to -1)
			var currentIndex = _roomRoundRobinIndex.GetOrAdd(roomKey, -1);

			// Try to find the next eligible user (less than 5 turns)
			for (int i = 1; i <= emails.Count; i++)
			{
				int nextIndex = (currentIndex + i) % emails.Count;
				string candidateEmail = emails[nextIndex];

				if (userTurnCounts[candidateEmail] < 5)
				{
					_roomRoundRobinIndex[roomKey] = nextIndex;
					return candidateEmail;
				}
			}
			throw new InvalidOperationException("All users have completed their turns.");
		}
	}
}
