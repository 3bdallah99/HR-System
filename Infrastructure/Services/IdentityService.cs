using Appllication.Common.Exceptions;
using Appllication.Common.Interfaces;
using Infrastructure.Data.Identity;
using Microsoft.AspNetCore.Identity;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Infrastructure.Services
{
    public class IdentityService : IIdentityService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly ITokenService _tokenService;

        public IdentityService(
            UserManager<AppUser> userManager,
            SignInManager<AppUser> signInManager,
            ITokenService tokenService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
        }

        public async Task<string> LoginAsync(string email, string password)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
            {
                throw new BadRequestException("Invalid Email or Password");
            }

            var result = await _signInManager.CheckPasswordSignInAsync(user, password, false);
            if (!result.Succeeded)
            {
                throw new BadRequestException("Invalid Email or Password");
            }

            return await _tokenService.GenerateTokenAsync(user);
        }

        public async Task<string> RegisterAsync(string email, string password, string userName, int? employeeId)
        {
            var userExists = await _userManager.FindByEmailAsync(email);
            if (userExists != null)
                throw new ConflictException("User already exists!");

            AppUser user = new()
            {
                Email = email,
                SecurityStamp = Guid.NewGuid().ToString(),
                UserName = userName,
                EmployeeId = employeeId
            };

            var result = await _userManager.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new BadRequestException($"User creation failed: {errors}");
            }

            // Assign role based on whether this is an Employee or an HR admin
            if (employeeId.HasValue)
            {
                await _userManager.AddToRoleAsync(user, "Employee");
            }
            else
            {
                await _userManager.AddToRoleAsync(user, "HR");
            }

            return "User created successfully!";
        }

        public async Task ChangePasswordAsync(string userId, string currentPassword, string newPassword)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user is null)
                throw new NotFoundException("User", userId);

            var result = await _userManager.ChangePasswordAsync(user, currentPassword, newPassword);
            if (!result.Succeeded)
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                throw new BadRequestException($"Password change failed: {errors}");
            }
        }
    }
}
