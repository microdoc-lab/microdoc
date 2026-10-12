using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;

namespace MicroDoc.Services
{
    public sealed class ConfiguredRolesTransformation(
        DomainOptions domainOptions) : IClaimsTransformation
    {
        public Task<ClaimsPrincipal> TransformAsync(
            ClaimsPrincipal principal)
        {
            var email = principal.FindFirst(ClaimTypes.Email)?.Value
                ?? principal.FindFirst("email")?.Value;

            if (string.IsNullOrWhiteSpace(email))
                return Task.FromResult(principal);

            var users = domainOptions.Users;

            var user = users.FirstOrDefault(
                u => string.Equals(
                    u.Email, email, StringComparison.OrdinalIgnoreCase));

            if (user is null)
                return Task.FromResult(principal);

            var identity = new ClaimsIdentity();

            foreach (var role in user.Roles.Select(r => r.ToString()))
            {
                if (!principal.IsInRole(role))
                    identity.AddClaim(new Claim(ClaimTypes.Role, role));
            }

            if (identity.Claims.Any())
                principal.AddIdentity(identity);

            return Task.FromResult(principal);
        }
    }
}
