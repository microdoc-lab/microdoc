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

            // domain permissions
            foreach (var domain in domainOptions.Domains)
            {
                var user = domain.Users.FirstOrDefault(u => string.Equals(u.Email, email, StringComparison.OrdinalIgnoreCase))
                    ?? domain.Users.FirstOrDefault(u => u.Email == "*");

                if (user != null)
                {
                    foreach (var role in user.Roles.Select(r => r.ToString()))
                    {
                        // global role
                        if (!principal.IsInRole(role))
                            identity.AddClaim(new Claim(ClaimTypes.Role, role));

                        // domain role
                        if (!principal.IsInRole(domain.Name + ":" + role))
                            identity.AddClaim(new Claim(ClaimTypes.Role, domain.Name + ":" + role));
                    }
                }
            }

            if (identity.Claims.Any())
                principal.AddIdentity(identity);

            return Task.FromResult(principal);
        }
    }
}
