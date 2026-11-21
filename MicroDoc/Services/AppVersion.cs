using System.Reflection;

namespace MicroDoc.Services
{
    public static class AppVersion
    {
        public static string Value =>
            typeof(AppVersion).Assembly
                .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
                ?.InformationalVersion ?? "Unknown";
    }
}
