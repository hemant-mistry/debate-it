using debate_it_backend.Models;

namespace debate_it_backend.Hub
{
	public class ConnectionMapping<T>
	{
		private readonly Dictionary<T, List<PlayerInfo>> _connections = new Dictionary<T, List<PlayerInfo>>();
		
		public int Count => _connections.Count;

		public void Add(T key, string connectionId, string userEmail, string inferredName, string roomKey)
		{
			lock (_connections)
			{
				if (!_connections.TryGetValue(key, out var connections))
				{
					connections = new List<PlayerInfo>();
					_connections[key] = connections;
				}

				lock (connections)
				{
					connections.Add(new PlayerInfo
					{
						ConnectionId = connectionId,
						UserEmail = userEmail,
						InferredName = inferredName,
						RoomKey = roomKey,
						IsReady = false
					}) ;
				}
			}
		}

		public void Remove(string connectionId)
		{
			lock (_connections)
			{
				foreach (var key in _connections.Keys.ToList())
				{
					_connections[key].RemoveAll(c => c.ConnectionId == connectionId);

					if (!_connections[key].Any())
					{
						_connections.Remove(key);
					}
				}
			}
		}

		public PlayerInfo UpdateUserReadyStatus(T key, string roomKey, bool isReady)
		{
			lock ( _connections)
			{
				if(_connections.TryGetValue(key, out var connections))
				{
					var playerToUpdate =  connections.FirstOrDefault(c => c.RoomKey == roomKey);

					if (playerToUpdate != null)
					{
						playerToUpdate.IsReady = isReady;
						return playerToUpdate;
					}
				}
			}
			return null; 
		}

		public IEnumerable<PlayerInfo> GetConnectionsByRoomKey(string roomKey)
		{
			lock (_connections)
			{
				return _connections.Values
					.SelectMany(list => list)
					.Where(c => c.RoomKey == roomKey)
					.ToList();
			}
		}

		public List<PlayerInfo> GetUniqueInferredPlayersPerRoom(string roomKey)
		{
			lock (_connections)
			{
				// Flatten all PlayerInfo objects across all keys (emails)
				var allConnections = _connections.Values.SelectMany(connections => connections);

				// Filter connections by the given roomKey and select distinct inferred names
				return allConnections
					.Where(c=> c.RoomKey == roomKey)
					.GroupBy(c=> c.InferredName)
					.Select(group => group.First())
					.ToList();
			}
		}

		public IEnumerable<T> GetKeys()
		{
			lock (_connections)
			{
				return _connections.Keys.ToList();
			}
		}
	}
}
