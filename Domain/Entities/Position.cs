using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
	public class Position
	{
		public int Id { get; set; }
		public string Title { get; set; }
		public Depatment Depatment { get; set; }
		public ICollection<Emolyee> Employees { get; set; }
	}
}
