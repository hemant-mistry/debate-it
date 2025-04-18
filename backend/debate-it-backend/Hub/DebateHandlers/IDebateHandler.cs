using debate_it_backend.Hub.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace debate_it_backend.Hub.DebateHandlers
{
	public interface IDebateHandler
	{
		Task ProcessDebateEntry(string roomKey, string userEmail, string content,IHubCallerClients<IRoomClient> clients);
		Task StartDebate(string roomKey, string topic,IHubCallerClients<IRoomClient> clients, List<string>? joinedUsers = null);
		Task CheckAndHandleGameOver(string roomKey, IHubCallerClients<IRoomClient> clients);
	}
}