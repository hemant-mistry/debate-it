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
		Task SendScenarioInfo(Dictionary<string,List<string>> scenarioMapping);
		Task SendAnalysis(string player, string analysis);

	}
}
