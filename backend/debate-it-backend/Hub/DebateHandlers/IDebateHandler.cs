using debate_it_backend.Hub.Interfaces;
using Microsoft.AspNetCore.SignalR;

namespace debate_it_backend.Hub.DebateHandlers
{
	public interface IDebateHandler
	{
		Task ProcessDebateEntry(string roomKey, string userEmail, string content,
		IHubCallerClients<IRoomClient> clients, IGroupManager groups);

		Task StartDebate(string roomKey, string topic,
			IHubCallerClients<IRoomClient> clients, IGroupManager groups);
		Task CheckAndHandleGameOver(string roomKey, IHubCallerClients<IRoomClient> clients, IGroupManager groups);
	}
}