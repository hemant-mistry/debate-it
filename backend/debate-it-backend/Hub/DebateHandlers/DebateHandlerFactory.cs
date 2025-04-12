using debate_it_backend.Hub.DebateHandlers;
using debate_it_backend.Models;

public class DebateHandlerFactory
{
	private readonly IServiceProvider _serviceProvider;

	public DebateHandlerFactory(IServiceProvider serviceProvider)
	{
		_serviceProvider = serviceProvider;
	}

	public IDebateHandler CreateHandler(DebateMode mode)
	{
		return mode switch
		{
			DebateMode.Voice => _serviceProvider.GetRequiredService<VoiceDebateHandler>(),
			_ => throw new ArgumentException($"Unsupported debate mode: {mode}")
		};
	}
}