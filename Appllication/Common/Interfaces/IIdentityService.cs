using System.Threading.Tasks;

namespace Appllication.Common.Interfaces
{
    public interface IIdentityService
    {
        Task<string> LoginAsync(string email, string password);
        Task<string> RegisterAsync(string email, string password, string userName, int? employeeId);
        Task ChangePasswordAsync(string userId, string currentPassword, string newPassword);
    }
}
