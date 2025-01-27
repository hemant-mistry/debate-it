using debate_it_backend.Models;
using Supabase.Interfaces;
namespace debate_it_backend.Services;	
public class RoomService
{
	private readonly Supabase.Client _supabaseClient;

	public RoomService(Supabase.Client supabaseClient)
	{
		_supabaseClient = supabaseClient;
	}

	// Method to create a room and player
	public async Task<(Room? room, Player? player, string? error)> CreateRoomAsync(CreateRoomRequest request)
	{
		try
		{
			// Generate a unique RoomKey
			var roomKey = Guid.NewGuid().ToString("N").Substring(0, 6);

			// Create the room
			var room = new Room
			{
				RoomKey = roomKey,
				Topic = request.Topic
			};

			var roomResponse = await _supabaseClient.From<Room>().Insert(room);
			if (roomResponse.Models == null)
				return (null, null, "Failed to create room.");

			// Create the player
			var player = new Player
			{
				Name = request.PlayerName,
				isAdmin = true, 
				room_key = roomResponse.Models[0].RoomKey,
				CreatedAt = DateTime.UtcNow
			};

			var playerResponse = await _supabaseClient.From<Player>().Insert(player);
			if (playerResponse.Models == null)
				return (null, null, "Failed to create player.");

			return (roomResponse.Models[0], playerResponse.Models[0], null);
		}
		catch (Exception ex)
		{
			return (null, null, ex.Message);
		}
	}

	// Method to get all rooms
	public async Task<List<Room>> GetRoomsAsync()
	{
		try
		{
			var response = await _supabaseClient.From<Room>().Get();
			return response.Models ?? new List<Room>();
		}
		catch (Exception)
		{
			return new List<Room>(); // Return an empty list in case of error
		}
	}

	// Method to validate and join the room
	public async Task<JoinRoomResponse> JoinRoomAsync(JoinRoomRequest joinRoomRequest)
	{
		var response = new JoinRoomResponse();
		try
		{
			var room = await _supabaseClient.From<Room>()
				.Where(x => x.RoomKey == joinRoomRequest.RoomKey)
				.Single();

			if (room == null)
			{
				response.Success = false;
				response.Message = "Room not found";
				return response;
			}

			// Create the player
			var player = new Player
			{
				Name = joinRoomRequest.PlayerName,
				isAdmin = false,
				room_key = joinRoomRequest.RoomKey,
				CreatedAt = DateTime.UtcNow
			};

			var playerResponse = await _supabaseClient.From<Player>().Insert(player);

			response.Success = true;
			response.Message = $"The player with name {joinRoomRequest.PlayerName} joined room {joinRoomRequest.RoomKey} successfully";
		}
		catch (Exception ex)
		{
			response.Success = false;
			response.Message = $"The player was not able to join the room because {ex.Message}";
		}

		return response;
	}
	
	
}