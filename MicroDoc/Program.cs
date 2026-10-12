using MicroDoc.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// Bind configuration
builder.Services.Configure<MicroDocOptions>(
    builder.Configuration.GetSection("MicroDoc"));

// Add services to the container.
builder.Services.AddSingleton(sp =>
{
    var options = sp.GetRequiredService<IOptions<MicroDocOptions>>().Value;
    return DomainOptionsLoader.LoadOptionsFromFile(options.DomainOptions);
});
builder.Services.AddSingleton<LockManager>();
builder.Services.AddSingleton<TagTreeService>();
builder.Services.AddSingleton<DocService>();
builder.Services.AddControllersWithViews()
    .AddRazorRuntimeCompilation()
;

// Add authentication
builder.Services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = GoogleDefaults.AuthenticationScheme;
})
.AddCookie()
.AddGoogle(googleOptions =>
{
    builder.Configuration.Bind("Authentication:Google", googleOptions);
});

builder.Services.AddTransient<
    IClaimsTransformation,
    ConfiguredRolesTransformation>();

builder.Services.AddAuthorization();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

// Run UpdateDomainBackgroundVersions
app.Services.GetRequiredService<DocService>().UpdateDomainBackgroundVersions();

app.Run();
