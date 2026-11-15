using MicroDoc.Controllers;
using MicroDoc.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.AddFile();
builder.Host.UseWindowsService();

DomainOptionsLoader.ContentRootPath = builder.Environment.ContentRootPath;

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
builder.Services.AddSingleton<TagService>();
builder.Services.AddSingleton<DocService>();
builder.Services.AddSingleton<TagMoveService>();
var mvcBuilder = builder.Services.AddControllersWithViews();
if (builder.Environment.IsDevelopment())
{
#pragma warning disable ASPDEPR003
    mvcBuilder.AddRazorRuntimeCompilation();
#pragma warning restore ASPDEPR003
}

builder.Services.AddSignalR();

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

app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var logger = context.RequestServices
            .GetRequiredService<ILogger<Program>>();

        var exception = context.Features
            .Get<Microsoft.AspNetCore.Diagnostics.IExceptionHandlerFeature>()
            ?.Error;

        if (exception != null)
            logger.LogError(exception,
                "Unhandled exception processing {Method} {Path}",
                context.Request.Method,
                context.Request.Path);

        context.Response.StatusCode = StatusCodes.Status500InternalServerError;
        context.Response.ContentType = "text/plain; charset=utf-8";

        await context.Response.WriteAsync("Exception");

        if (app.Environment.IsDevelopment() && exception != null)
        {
            await context.Response.WriteAsync($"\n\n{exception.GetType().FullName}");
            await context.Response.WriteAsync($"\n{exception.Message}");
            await context.Response.WriteAsync($"\n{exception.StackTrace}");
        }
    });
});

if (!app.Environment.IsDevelopment())
{
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

var urls = builder.Configuration["Urls"] ?? "";
if (urls.Split(';').Any(url =>
    url.StartsWith("https://", StringComparison.OrdinalIgnoreCase)))
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapHub<ChangeHub>("/changeHub");

app.Use(async (context, next) =>
{
    context.Items["ClientUID"] =
        context.Request.Headers["X-Client-UID"].ToString();

    await next();
});

// Run UpdateDomainBackgroundVersions
app.Services.GetRequiredService<DocService>().UpdateDomainBackgroundVersions();

app.Run();
