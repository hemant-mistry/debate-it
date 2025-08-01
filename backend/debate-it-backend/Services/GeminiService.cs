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

		public async Task<string> GenerateDebateTopic(string topic)
		{
			var apiKey = "AIzaSyCsOhcjnS27yJsB9Po41nmKiOA-Zay2JCs";
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

		public async Task<string> AnalyzeDebate(List<GeminiInputFormat> debates, int maxRetries = 3)
		{
			var apiKey = "AIzaSyDQnHEm7EikjDTfIgmkHdGeQqc3W3DN9h8";
			// Convert debate entries to a structured format
			string debateText = string.Join("\n", debates.Select(d => $"{d.UserEmail}: {d.Transcript}"));
			// System instruction with proper newline formatting
			var systemInstruction = new Content($"{Prompts.Prompts.DEBATE_AI_SYSTEM_PROMPT}\nDebate Transcript:\n{debateText}");
			IGenerativeAI genAi = new GoogleAI(apiKey);
			var model = genAi.GenerativeModel(Model.Gemini20Flash, systemInstruction: systemInstruction);

			// Expected JSON structure for strict validation
			string expectedFormat = @"[
				{
				""UserEmail"": ""example@example.com"",
				""Score"": 30,
				""Reason"": ""Explanation text""
				}
			]";

			// Create the request using the debate content
			var request = new GenerateContentRequest(debateText);

			int retryCount = 0;
			while (retryCount <= maxRetries)
			{
				try
				{
					var response = await model.GenerateContent(request);
					var jsonDoc = response?.ToJsonDocument();
					string fullJsonResponse = jsonDoc != null ? jsonDoc.RootElement.GetRawText() : null;
					if (string.IsNullOrEmpty(fullJsonResponse))
					{
						if (retryCount < maxRetries)
						{
							retryCount++;
							await Task.Delay(1000 * retryCount); // Exponential backoff
							continue;
						}
						return "No response after multiple attempts";
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
									else if (text.StartsWith("```"))
									{
										text = text.Substring(3);
									}

									if (text.EndsWith("```"))
									{
										text = text.Substring(0, text.Length - 3);
									}

									// Clean up any extra whitespace
									text = text.Trim();

									// Explicitly validate JSON before returning
									try
									{
										// Parse the text as JSON array to validate it matches expected format
										using (JsonDocument validationDoc = JsonDocument.Parse(text))
										{
											// Validate that it's an array
											if (validationDoc.RootElement.ValueKind != JsonValueKind.Array)
											{
												throw new JsonException("Response is not a JSON array");
											}

											// Validate each item in the array has the expected properties
											foreach (JsonElement item in validationDoc.RootElement.EnumerateArray())
											{
												// Check required properties exist and have correct types
												if (!item.TryGetProperty("UserEmail", out JsonElement userEmail) ||
													userEmail.ValueKind != JsonValueKind.String)
												{
													throw new JsonException("Missing or invalid UserEmail property");
												}

												if (!item.TryGetProperty("Score", out JsonElement score) ||
													score.ValueKind != JsonValueKind.Number)
												{
													throw new JsonException("Missing or invalid Score property");
												}

												if (!item.TryGetProperty("Reason", out JsonElement reason) ||
													reason.ValueKind != JsonValueKind.String)
												{
													throw new JsonException("Missing or invalid Reason property");
												}
											}

											// If we reach here, the JSON is valid and matches our expected format
											return text;
										}
									}
									catch (JsonException ex)
									{
										// The text is not valid JSON or doesn't match our format
										Console.WriteLine($"Gemini returned invalid JSON (Attempt {retryCount + 1}/{maxRetries + 1}): {ex.Message}");

										if (retryCount < maxRetries)
										{
											retryCount++;
											await Task.Delay(1000 * retryCount); // Exponential backoff
											continue;
										}
										return $"Invalid JSON response after {maxRetries + 1} attempts: {ex.Message}";
									}
								}
							}
						}
					}

					if (retryCount < maxRetries)
					{
						retryCount++;
						await Task.Delay(1000 * retryCount); // Exponential backoff
						continue;
					}
					return "Could not extract valid response after multiple attempts";
				}
				catch (Exception ex)
				{
					if (retryCount < maxRetries)
					{
						Console.WriteLine($"Error calling Gemini API (Attempt {retryCount + 1}/{maxRetries + 1}): {ex.Message}");
						retryCount++;
						await Task.Delay(1000 * retryCount); // Exponential backoff
						continue;
					}
					Console.WriteLine($"Error calling Gemini API after {maxRetries + 1} attempts: {ex.Message}");
					return "Error processing request after multiple attempts";
				}
			}

			return "Failed to get valid response after all retry attempts";
		}
	}
}
