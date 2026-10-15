using System.Security.Claims;

namespace MicroDoc.Services
{
    public static class SecurityExtensions
    {
        public static bool IsInRole(this ClaimsPrincipal user, DomainOptions domainOptions, string domain, string role)
        {
            return domainOptions.DomainLevelSecurity && user.IsInRole(domain + ":" + role)
                || !domainOptions.DomainLevelSecurity && user.IsInRole(role);
        }
    }
}
