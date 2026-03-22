using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Domain.Entities
{
	public class Depatment
	{
		public int ID { get; set; }
		public string Name { get; set; }
		public ICollection<Position> Positions { get; set; }
		public ICollection<Emolyee> Emolyees { get; set; }
	}
}
