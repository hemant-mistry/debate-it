using debate_it_backend.Models;

public class CreateRoomRequest
{
	public string PlayerName { get; set; }
	public string Topic { get; set; } // If you have a 'topic' field in the room model, use this
	public string Mode { get; set; }
}
