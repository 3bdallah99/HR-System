using System.Security.Claims;

namespace PL.API.Extensions
{
    /// <summary>
    /// Provides reusable, DRY authorization helpers for the HR system.
    /// All controllers should use these instead of inline role/claim checks.
    /// </summary>
    public static class ClaimsPrincipalExtensions
    {
        /// <summary>
        /// Returns <c>true</c> if the caller belongs to the "HR" or "Admin" role.
        /// </summary>
        public static bool IsHrOrAdmin(this ClaimsPrincipal user)
            => user.IsInRole("HR") || user.IsInRole("Admin");

        /// <summary>
        /// Resolves the effective employee ID that the caller is authorized to act upon.
        ///
        /// Rules:
        /// <list type="bullet">
        ///   <item>
        ///     <description>
        ///       HR/Admin users pass through as-is: <paramref name="effectiveEmployeeId"/> is set to
        ///       <paramref name="requestedEmployeeId"/> and the method returns <c>true</c>.
        ///     </description>
        ///   </item>
        ///   <item>
        ///     <description>
        ///       Non-HR users who pass <c>null</c> for <paramref name="requestedEmployeeId"/> will have
        ///       <paramref name="effectiveEmployeeId"/> resolved from their own <c>"EmployeeId"</c> JWT claim.
        ///       Returns <c>true</c> on success, <c>false</c> if the claim is missing or invalid.
        ///     </description>
        ///   </item>
        ///   <item>
        ///     <description>
        ///       Non-HR users who pass an explicit <paramref name="requestedEmployeeId"/> must have it
        ///       match their own <c>"EmployeeId"</c> JWT claim. Returns <c>false</c> (Forbidden) otherwise.
        ///     </description>
        ///   </item>
        /// </list>
        /// </summary>
        /// <param name="user">The current <see cref="ClaimsPrincipal"/>.</param>
        /// <param name="requestedEmployeeId">The employee ID requested by the client (may be null).</param>
        /// <param name="effectiveEmployeeId">
        ///   On success: the employee ID the handler should use.
        ///   On failure: <c>null</c>.
        /// </param>
        /// <returns><c>true</c> if the caller is authorized; <c>false</c> if they should receive a 403.</returns>
        public static bool TryGetAuthorizedEmployeeId(
            this ClaimsPrincipal user,
            int? requestedEmployeeId,
            out int? effectiveEmployeeId)
        {
            // HR / Admin: unrestricted access — pass the requested ID through as-is.
            if (user.IsHrOrAdmin())
            {
                effectiveEmployeeId = requestedEmployeeId;
                return true;
            }

            // Regular employee: read their own EmployeeId from the JWT claim.
            var claimValue = user.FindFirst("EmployeeId")?.Value;
            if (!int.TryParse(claimValue, out var myEmpId))
            {
                // JWT is missing a valid EmployeeId claim — reject.
                effectiveEmployeeId = null;
                return false;
            }

            if (requestedEmployeeId is null)
            {
                // Caller did not specify an employee — default to their own.
                effectiveEmployeeId = myEmpId;
                return true;
            }

            if (requestedEmployeeId == myEmpId)
            {
                // Caller is requesting their own record — allow.
                effectiveEmployeeId = myEmpId;
                return true;
            }

            // Caller is requesting someone else's record — deny.
            effectiveEmployeeId = null;
            return false;
        }
    }
}
