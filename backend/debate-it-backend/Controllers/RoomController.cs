using Microsoft.AspNetCore.Mvc;
using debate_it_backend.Models;
using debate_it_backend.Services;
using Mscc.GenerativeAI;

namespace debate_it_backend.Controllers
{
	
	[ApiController]
	[Route("api/rooms")]
	public class RoomController : ControllerBase
	{
		private readonly RoomService _roomService;
		private readonly IConfiguration _configuration;

		// Constructor to inject the RoomService
		public RoomController(RoomService roomService, IConfiguration configuration)
		{
			_roomService = roomService;
			_configuration = configuration;
		}

		[HttpGet]
		[Route("fetch-rooms")]
		public async Task<IActionResult> GetRooms()
		{
			try
			{
				var response = await _roomService.GetRoomsAsync();
				if (response != null)
				{
					return Ok(response);
				}

				return NotFound("No rooms found.");
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Internal server error: {ex.Message}");
			}
		}

		[HttpPost]
		[Route("create-room")]
		public async Task<IActionResult> CreateRooms([FromBody] CreateRoomRequest request)
		{
			try
			{
				var (room, player, error) = await _roomService.CreateRoomAsync(request);

				if (!string.IsNullOrEmpty(error))
				{
					return StatusCode(500, $"Internal server error: {error}");
				}

				return Ok(new
				{
					Room = room,
					Player = player
				});
			}
			catch (Exception ex)
			{
				return StatusCode(500, $"Internal server error: {ex.Message}");
			}
		}

		[HttpPost]
		[Route("join-room")]
		public async Task<IActionResult> JoinRoom([FromBody] JoinRoomRequest joinRoomRequest)
		{
			try
			{
				// Call the service layer
				var response = await _roomService.JoinRoomAsync(joinRoomRequest);

				if (response.Success)
				{
					return Ok(response.Message); // Return 200 with success message
				}
				// Return the response directly as the message
				else
				{
					return BadRequest(response.Message); // Return 400 with error message
				}
			}
			catch (Exception ex)
			{
				// Return an internal server error with the exception message
				return StatusCode(500, $"Internal server error: {ex.Message}");
			}
		}

		[HttpPost]
		[Route("/ai/create")]
		public async Task<IActionResult> CreateAIContent([FromBody] string content)
		{
			try
			{
				var apiKey = _configuration["GeminiKey"];
				var systemInstruction = new Content("You are a friendly pirate. Speak like one.");
				IGenerativeAI genAi = new GoogleAI(apiKey);
				var model = genAi.GenerativeModel(Model.Gemini15ProLatest, systemInstruction: systemInstruction);
				var request = new GenerateContentRequest(content);

				var response = await model.GenerateContent(request);

				return Ok(response.Text);

			}
			catch ( Exception ex)
			{
				return StatusCode(500, $"Internal server error: {ex.Message}");
			}
		}


	}
}
