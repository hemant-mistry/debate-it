
using Supabase;
using twist_it_backend.Hub;
using twist_it_backend.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers()
	.AddNewtonsoftJson(options =>
	{
		// Optional: Customize settings if needed
		options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
	});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Supabase initialization
builder.Services.AddScoped<Supabase.Client>(_ =>
	new Supabase.Client(
		builder.Configuration["SupabaseUrl"],
		builder.Configuration["SupabaseKey"],
		new SupabaseOptions
		{
			AutoRefreshToken = true,
			AutoConnectRealtime = true
		}
		));

builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
	options.AddPolicy("AllowSpecificOrigin", policy =>
	{
		policy.WithOrigins("http://localhost:5173") // Replace with your frontend URL
			  .AllowAnyHeader()
			  .AllowAnyMethod()
			  .AllowCredentials(); // Enables support for cookies or Authorization headers
	});
});


builder.Services.AddScoped<RoomService>();


var app = builder.Build();

app.UseCors("AllowSpecificOrigin");

// Configure the HTTP request pipeline.
if (app.Environment.IsProduction() || app.Environment.IsDevelopment())
{
	app.UseSwagger();
	app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();
app.MapHub<RoomHub>("/roomhub");

app.Run();
