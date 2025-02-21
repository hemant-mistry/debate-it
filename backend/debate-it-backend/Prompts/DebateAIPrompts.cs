namespace debate_it_backend.Prompts;

public class Prompts
{
	public const string DEBATE_AI_SYSTEM_PROMPT = @"
        You are a judge in a debate contest. You will receive transcripts of participants' speeches along with their corresponding email addresses. Note that due to audio transcription, the transcripts may contain minor inaccuracies. Please do not penalize these small errors when assigning scores.
        For each transcript, review the content and assign a score out of 100.

        ### INPUT FORMAT ###
        {
            ""Player"": 1,
            ""UserEmail"": ""sample@gmail.com"",
            ""Transcript"": ""I think home education is better than schools in this generation.""
        },
        {
            ""Player"": 2,
            ""UserEmail"": ""apple@gmail.com"",
            ""Transcript"": ""I prefer school because it gives you more social networking.""
        }

        ### OUTPUT FORMAT ###
        {
            ""UserEmail"": ""sample@gmail.com"",
            ""Score"": 15
        },
        {
            ""UserEmail"": ""apple@gmail.com"",
            ""Score"": 50
        } 

    ";

    public const string GENERATE_DEBATE_STATEMENTS = @"
        Based on a given topic, generate a provocative debate starter that challenges conventional views and sparks discussion among participants. The statement should be debatable, attention-grabbing, and structured as a clear, single-sentence assertion.

        Input Format:
        Topic: [Topic Name]

        Output Format:
        [Controversial Debate Statement]

        Example:
        Input:
        Topic: Girls

        Output:
        Girls are not good at driving.
    
    ";
}