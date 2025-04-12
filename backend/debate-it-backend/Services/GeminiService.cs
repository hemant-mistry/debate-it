using debate_it_backend.Models;
using Json.More;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Mscc.GenerativeAI;
using System.Text.Json;

namespace debate_it_backend.Services
{
	public class GeminiService
	{
		private readonly string _apiKey;
		public GeminiService(IConfiguration configuration)
		{
			_apiKey = "AIzaSyCbzdC1Cy5PKkJfoqdv1QTYhSIn6TdBEN4";
		}

		public async Task<string> GenerateDebateTopic(string topic)
		{
			var apiKey = "AIzaSyCbzdC1Cy5PKkJfoqdv1QTYhSIn6TdBEN4";
			// System instruction with correct newline syntax
			var systemInstruction = new Content($"{Prompts.Prompts.GENERATE_DEBATE_STATEMENTS}");


			IGenerativeAI genAi = new GoogleAI(apiKey);
			var model = genAi.GenerativeModel(Model.Gemini20Flash, systemInstruction: systemInstruction);

			// Properly format the request with debate content
			var request = new GenerateContentRequest(topic);

			try
			{
				var response = await model.GenerateContent(request);

				// Extract and return response text
				return response?.ToString() ?? "No response received";
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error calling Gemini API: {ex.Message}");
				return "Error processing request";
			}
		}

		public async Task<string> AnalyzeDebate(List<GeminiInputFormat> debates)
		{
			var apiKey = _apiKey;

			// Convert debate entries to a structured format
			string debateText = string.Join("\n", debates.Select(d => $"{d.UserEmail}: {d.Transcript}"));

			// System instruction with proper newline formatting
			var systemInstruction = new Content($"{Prompts.Prompts.DEBATE_AI_SYSTEM_PROMPT}\nDebate Transcript:\n{debateText}");

			IGenerativeAI genAi = new GoogleAI(apiKey);
			var model = genAi.GenerativeModel(Model.Gemini20Flash, systemInstruction: systemInstruction);

			// Create the request using the debate content
			var request = new GenerateContentRequest(debateText);

			try
			{
				var response = await model.GenerateContent(request);
				var jsonDoc = response?.ToJsonDocument();
				string fullJsonResponse = jsonDoc != null ? jsonDoc.RootElement.GetRawText() : null;
				if (string.IsNullOrEmpty(fullJsonResponse))
				{
					return "No response";
				}

				// Parse the outer JSON to extract the inner JSON from the candidate response
				using (JsonDocument doc = JsonDocument.Parse(fullJsonResponse))
				{
					if (doc.RootElement.TryGetProperty("Candidates", out JsonElement candidates) &&
						candidates.GetArrayLength() > 0)
					{
						// Extract the first candidate's content text
						var firstCandidate = candidates[0];
						if (firstCandidate.TryGetProperty("Content", out JsonElement content) &&
							content.TryGetProperty("Parts", out JsonElement parts) &&
							parts.GetArrayLength() > 0)
						{
							var text = parts[0].GetProperty("Text").GetString();
							if (!string.IsNullOrEmpty(text))
							{
								// Remove markdown formatting (triple backticks and optional "json")
								text = text.Trim();
								if (text.StartsWith("```json"))
								{
									text = text.Substring("```json".Length);
								}
								if (text.EndsWith("```"))
								{
									text = text.Substring(0, text.Length - 3);
								}
								// Clean up any extra whitespace
								text = text.Trim();
								// Return the inner JSON string, e.g. the leaderboard data.
								return text;
							}
						}
					}
				}
				return "No response";
			}
			catch (Exception ex)
			{
				Console.WriteLine($"Error calling Gemini API: {ex.Message}");
				return "Error processing request";
			}
		}
	}
}
