using System.Security.Claims;

namespace MicroDoc.Services
{
    public static class SecurityExtensions
    {
        public static bool IsInRole(this ClaimsPrincipal user, DomainOptions domainOptions, string role, string domain)
        {
            return domainOptions.DomainLevelSecurity && user.IsInRole(domain + ":" + role)
                || !domainOptions.DomainLevelSecurity && user.IsInRole(role);
        }

        public static IEnumerable<string> AllRoles(this DomainOptions.UserAccess userAccess)
        {
            foreach (var role in userAccess.Roles)
                yield return $"{role}";

            if (!string.IsNullOrWhiteSpace(userAccess.Domain))
                foreach (var role in userAccess.Roles)
                    yield return $"{userAccess.Domain}:{role}";

            if (!string.IsNullOrWhiteSpace(userAccess.Domain) && !string.IsNullOrWhiteSpace(userAccess.Document))
                foreach (var role in userAccess.Roles)
                    yield return $"{userAccess.Domain}:{userAccess.Document}:{role}";

            if (!string.IsNullOrWhiteSpace(userAccess.Domain) && userAccess.Documents != null)
                foreach (var document in userAccess.Documents)
                    foreach (var role in userAccess.Roles)
                        yield return $"{userAccess.Domain}:{document}:{role}";
        }
    }
}
