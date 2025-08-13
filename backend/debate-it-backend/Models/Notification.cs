using System.Diagnostics.Eventing.Reader;

namespace debate_it_backend.Models
{
	public class Notification
	{
		public string UserEmail { get; set; }
		public List<DebateEntry> DebateEntries { get; set; }
		public int TurnsLeft { get; set; }
		public bool isGameOverFlag { get; set; }
	}
}