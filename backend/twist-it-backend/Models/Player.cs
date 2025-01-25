using Supabase.Postgrest.Attributes;
using Supabase.Postgrest.Models;

namespace twist_it_backend.Models
{
	[Table("player")]
	public class Player: BaseModel
	{
		[PrimaryKey("id", false)]
		public int Id { get; set; }
		[Column("name")]
		public string Name { get; set; }
		[Column("is_admin")]
		public bool isAdmin { get; set; }
		[Column("room_key")]
		public string room_key { get; set; }
		[Column("created_at")]
		public DateTime CreatedAt { get; set; }
	}
}
