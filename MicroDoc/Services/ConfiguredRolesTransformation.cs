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

            {   // global permissions
                var user = domainOptions.Users.FirstOrDefault(
                    u => string.Equals(
                        u.Email, email, StringComparison.OrdinalIgnoreCase));

                if (user != null)
                {
                    foreach (var role in user.Roles.Select(r => r.ToString()))
                    {
                        if (!principal.IsInRole(role))
                            identity.AddClaim(new Claim(ClaimTypes.Role, role));
                    }
                }
            }

            // domain permissions
            foreach (var domain in domainOptions.Domains)
            {
                var user = domain.Users.FirstOrDefault(
                    u => string.Equals(
                        u.Email, email, StringComparison.OrdinalIgnoreCase));

                if (user != null)
                {
                    foreach (var role in user.Roles.Select(r => r.ToString()))
                    {
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
