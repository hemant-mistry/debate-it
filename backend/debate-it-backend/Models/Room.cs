using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace debate_it_backend.Models
{
	[Table("room")]
	public class Room: BaseModel
	{
		[PrimaryKey("id",false)]
		public int Id { get; set; }
		[Column("room_key")]
		public string RoomKey { get; set; }
		[Column("created_at")]
		public DateTime CreatedAt { get; set; }
		[Column("topic")]
		public string Topic { get; set; }
		[Column("debate_mode")]
		[JsonConverter(typeof(StringEnumConverter))]
		public DebateMode DebateMode { get; set; }
	}
}
