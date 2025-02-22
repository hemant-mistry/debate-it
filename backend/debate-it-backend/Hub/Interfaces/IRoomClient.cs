using System.Collections.Generic;
using debate_it_backend.Models;

namespace debate_it_backend.Hub.Interfaces
{
	public interface IRoomClient
	{
		Task SendMessageToClient(string message);
		Task SendUpdatedUserList(List<PlayerInfo> users);
		Task SendPlayerInfo(PlayerInfo playerInfo);
		Task SendAllPlayersReady(bool isAllPlayerReady);
		Task SendRelayMessage(string userEmail);
		Task SendDebateTopic(string roomKey);
		Task SpeakerFinished(string message);
		Task SavedTranscript(Notification notification);
		Task SendDebateScores(string debateScores);

	}
}
