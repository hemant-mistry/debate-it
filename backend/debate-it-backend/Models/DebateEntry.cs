namespace debate_it_backend.Models
{
	public class DebateEntry
	{
		public string RoomKey { get; set; }
		public string UserEmail { get; set; }
		public string DebateTranscript { get; set; }
		public int Points { get; set; }	
	}
}
