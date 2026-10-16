using System.Security.Claims;

namespace MicroDoc.Services
{
    public static class SecurityExtensions
    {
        public static bool IsInRole(this ClaimsPrincipal user, DomainOptions domainOptions, string role, string domain = null, string documentId = null)
        {
            if (!string.IsNullOrWhiteSpace(domain) && domainOptions.DomainLevelSecurity)
            {
                var options = domainOptions.Find(domain);
                if (!string.IsNullOrWhiteSpace(documentId) && options.DocumentLevelSecurity)
                {
                    string document = Path.GetFileNameWithoutExtension(documentId);
                    if (options.KnownDocuments().Contains(document))
                        return user.IsInRole($"{domain}:{document}:{role}");
                }

                return user.IsInRole($"{domain}:{role}");
            }

            return user.IsInRole(role);
        }

        public static string[] GridColumnDocuments(this ClaimsPrincipal user, DomainOptions domainOptions, string domain)
        {
            var documents = domainOptions.Find(domain).Documents;

            documents = documents.Where(d => IsInRole(user, domainOptions, "r", domain, d)).ToArray();

            return documents;
        }

        public static string[] KnownDocuments(this DomainOptions.Domain domain) 
        {
            return domain.Documents
                .Union(domain.DocumentOptions.Select(o => o.Name))
                .Distinct()
                .ToArray();
        }

        public static IEnumerable<string> AllRoles(this DomainOptions.UserAccess userAccess)
        {
            foreach (var role in userAccess.Roles)
                yield return $"{role}";

            if (string.IsNullOrWhiteSpace(userAccess.Domain))
                yield break;

                foreach (var role in userAccess.Roles)
                    yield return $"{userAccess.Domain}:{role}";

            if (!string.IsNullOrWhiteSpace(userAccess.Document) && userAccess.Document != "*")
                foreach (var role in userAccess.Roles)
                    yield return $"{userAccess.Domain}:{userAccess.Document}:{role}";

            if (userAccess.Documents != null)
                foreach (var document in userAccess.Documents)
                    foreach (var role in userAccess.Roles)
                        yield return $"{userAccess.Domain}:{document}:{role}";
        }
    }
}
