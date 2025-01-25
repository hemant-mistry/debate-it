namespace twist_it_backend.Models
{
	public class PlayerInfo
	{
		public string ConnectionId { get; set; }
		public string UserEmail { get; set; }
		public string InferredName { get; set; }
		public string RoomKey { get; set; }
		public bool IsReady { get; set; }
	}
}
