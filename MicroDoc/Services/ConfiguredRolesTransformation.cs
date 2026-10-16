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

            var identity = new ClaimsIdentity();

            var userRoles = domainOptions.Users.Where(u => string.Equals(u.Email, email, StringComparison.OrdinalIgnoreCase))
                .Union(domainOptions.Users.Where(u => u.Email == "*"))
                .ToList();

            var roles = userRoles.SelectMany(u => u.AllRoles()).Distinct().ToArray();
            foreach (var role in roles)
                identity.AddClaim(new Claim(ClaimTypes.Role, role));

            if (identity.Claims.Any())
                principal.AddIdentity(identity);

            return Task.FromResult(principal);
        }
    }
}
