using Infrastructure.Data.Identity;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public interface ITokenService
    {
        Task<string> GenerateTokenAsync(AppUser user);
    }
}
