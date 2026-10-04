// Empty interface because the implementation generates the token directly inside Infrastructure.
// We keep this file to prevent build errors since ITokenService was previously in Application.
// Alternatively, we can just move ITokenService entirely to Infrastructure.
namespace Appllication.Common.Interfaces
{
    // Keeping this file empty as we removed the direct usage in Application
}
