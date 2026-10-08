using System.Reflection;
using JasMaman.LocalizationResources;
using IdentityModel.Client;
using Microsoft.Extensions.Options;
using WalletApi.Client;
using Yoda.Application.Helpers;
using YodaApp.SignBoxV3;
using YodaApp.Yoda.Application.Avatars;
using YodaApp.Yoda.Application.IntegrationHub;
using YodaApp.Yoda.Application.Notifications;
using YodaApp.Yoda.Application.RefsApi;
using YodaApp.Yoda.Application.Wallet;
using YodaApp.Yoda.Interfaces;
using YodaExtensions;
using JasMaman.Modules.Common;


namespace Yoda;
public class Startup {
    public static void Main(string[] args) =>
        BuildWebHost(args)
            .Build()
            .Run();

    public static IHostBuilder BuildWebHost(string[] args) {
        YodaUiConfig.UiVersion = UiVersion.V2;
        return Host
            .CreateDefaultBuilder()
            .PreferTls12()
            .UseRuCultureAsDefault()
            .ConfigureAppConfiguration((context, configuration) => {
                configuration.UseYodaDefaultConfigurations(context.HostingEnvironment.EnvironmentName, args);
            })
            .ConfigureServices((context, services) => {
                services.UseYodaServices(
                       context.Configuration,
                       Directory.GetCurrentDirectory(),
                       plugins => plugins
                           .Add(Assembly.GetExecutingAssembly())
                           .Add(typeof(CommonModule).Assembly)
                           .Add(typeof(YodaCorePlugin.Entry).Assembly)
                   );
                services.Configure<WalletApiClientConfig>(option => {
                    option.AuthorityUrl = context.Configuration["walletApi:authorityUrl"];
                    option.ApiUrl = context.Configuration["walletApi:url"];
                    option.ClientId = context.Configuration["walletApi:client:clientId"];
                    option.Secret = context.Configuration["walletApi:client:pwd"];
                });
                services.AddSingleton<IWalletClientFactory, WalletClientFactory>();
                services.AddNotifications(context.Configuration);
                services.AddAvatars(context.Configuration);
                services.AddWalletClient(context.Configuration);

                if (!context.HostingEnvironment.IsDevelopment()) {
                    services.AddMinioFilesManagerWithEncryption(
                        new MinioFileManagerOptions {
                            BucketName = context.Configuration["minio:bucketName"],
                            Server = context.Configuration["minio:server"],
                            Login = context.Configuration["minio:login"],
                            Password = context.Configuration["minio:password"],
                        }, new MinioAesEncryptOption {
                            Iv = context.Configuration["aes:iv"],
                            Key = context.Configuration["aes:secret"],
                        }
                    );
                }

                //services.AddUserWithGbdUlAndFlSynchronizer();

                services.AddEmailSender(options => {
                    options.SmtpClient = new SmtpClientConfig {
                        Server = context.Configuration["emailSettings:server"],
                        User = context.Configuration["emailSettings:userName"],
                        Secret = context.Configuration["emailSettings:secret"],
                        EnableSsl = bool.Parse(context.Configuration["emailSettings:enableSsl"]),
                        Port = int.Parse(context.Configuration["emailSettings:port"])
                    };
                    options.EmailFromText = "АО \"Информационно-учетный центр\"";
                    options.EmailFromTextInjectedIntoSubject = "Jas Maman";
                });
                services.Configure<UserContextMenuItemsConfiguration>(context.Configuration);
                services.AddSingleton<IUserContextMenuItems, DefaultUserContextMenuItems>();
                services.AddQueryExecuterOptions(context.Configuration);

                services.Configure<IntegrationHubClientOptions>(options => {
                    options.AuthorityUrl = context.Configuration["integrationHubApi:authorityUrl"];
                    options.ApiUrl = context.Configuration["integrationHubApi:url"];
                    options.ClientId = context.Configuration["integrationHubApi:clientId"];
                    options.Secret = context.Configuration["integrationHubApi:clientSecret"];
                });
                services.AddSingleton<IIntegrationHubClientFactory, IntegrationHubClientFactory>();

                services.Configure<RefsApiClientOptions>(options => {
                    options.ApiUrl = context.Configuration["refsApiUrl"];
                });
                services.AddSingleton<IRefsApiClientFactory, RefsApiClientFactory>();
                services
                    .AddSyncNotWorkingDaysCalendarTimer(syncStartYearOrNowYear: 2022)
                    .AddSyncMrpTimer(syncStartYearOrNowYear: 2022);

                var authorityUrl = new Uri(context.Configuration["authorityUrl"]).ToIdentityServerCheckUri();
                var avatarApiUrl = new Uri(context.Configuration["avatarApi:url"]).ToSwaggerApiCheckUri();
                var refsApiUrl = new Uri(context.Configuration["refsApiUrl"]).ToSwaggerApiCheckUri();
                var integrationHubUrl = new Uri(context.Configuration["integrationHubApi:url"]).ToSwaggerApiCheckUri();
                var walletApiUrl = new Uri(context.Configuration["walletApi:url"]).ToSwaggerApiCheckUri();
                var notificationsApiUrl = new Uri(context.Configuration["notificationsApi:url"]).ToSwaggerApiCheckUri();

                services
                     .AddUrlsHealthCheck(new[] {
                        new UrlHealthCheckConfiguration(authorityUrl, $"AuthorityUrl ({authorityUrl})"),
                        new UrlHealthCheckConfiguration(avatarApiUrl, $"AvatarApi ({avatarApiUrl})"),
                        new UrlHealthCheckConfiguration(refsApiUrl, $"RefsApi ({refsApiUrl})"),
                        new UrlHealthCheckConfiguration(integrationHubUrl, $"IntegrationHub ({integrationHubUrl})"),
                        new UrlHealthCheckConfiguration(walletApiUrl, $"WalletApi ({walletApiUrl})"),
                        new UrlHealthCheckConfiguration(notificationsApiUrl, $"NotificationsApi ({notificationsApiUrl})"),
                    })
                    .AddQueryExecuter(context.Configuration)
                    .AddCertCheckers(context.Configuration)
                    .AddSignVerifiers(context.Configuration);


                if (context.HostingEnvironment.IsDevelopment() && context.Configuration["CertificateSignMode"] == "Emulate") {
                    services.AddSignBoxV3Mock(context.Configuration);
                } else {
                    services.AddSignBoxV3(context.Configuration);
                }

                services
                        .AddLocalization(o => {
                            o.ResourcesPath = "LocalizationResources";
                        })
                        .AddMvc(option => option.EnableEndpointRouting = false)
                        .AddDataAnnotationsLocalization(options => {
                            options.DataAnnotationLocalizerProvider = (type, factory) => factory.Create(typeof(SharedResources));
                        })
                        .AddViewLocalization();

                services.Configure<RequestLocalizationOptions>(options => {
                    var supportedCultures = new[]
                    {
                            new CultureInfo("kz"),
                            new CultureInfo("ru"),
                            new CultureInfo("en")
                        };

                    options.SupportedCultures = supportedCultures;
                    options.SupportedUICultures = supportedCultures;
                });

            })
            .ConfigureWebHostDefaults(webBuilder => {
                webBuilder.Configure((context, appBuilder) => {
                    appBuilder.UseYodaWebAppOrGenMigration();
                    appBuilder.AddGetEgovQrEndpoint();
                });
            });
    }
}


public class HomeController : Application.HomeController {
    public override string[] GetInitialRequireUiPackages(IYodaRequestContext requestContext) {
        return new List<string>(base.GetInitialRequireUiPackages(requestContext)) {
            "jquery.core",
            "bootstrap",
            "bootstrap-modal-facade",
            "hyper-theme.structure",
            "hyper-theme.fonts.inter",
            "hyper-theme.components",
            "hyper-theme.icons.dripicons",
            "hyper-theme.icons.materialdesignicons",
            "hyper-theme.icons.unicons",
            "hyper-theme.pages",
            "hyper-theme.metis-menu",
            "hyper-theme.app",
            "editors.filter",
            "editors.reference",
            "editors.date",
            "project-theme",
            "hyper-fix",
            "yodic",
            "simplebar"
        }.ToArray();
    }
}


public class DefaultUserContextMenuItems : IUserContextMenuItems {
    private readonly UserContextMenuItemsConfiguration _contextMenuItems;
    public DefaultUserContextMenuItems(IOptions<UserContextMenuItemsConfiguration> contextMenuItems) {
        _contextMenuItems = contextMenuItems.Value;
    }

    public ContextMenuItem[] GetUserContextMenuItems(IYodaRequestContext context) {
        return _contextMenuItems.UserContextMenus;
    }
}

public interface IUserContextMenuItems {
    public ContextMenuItem[] GetUserContextMenuItems(IYodaRequestContext context);
}
public class UserContextMenuItemsConfiguration {
    public ContextMenuItem[] UserContextMenus { get; set; }
}
public class ContextMenuItem {
    public ContextMenuItem() { }
    public ContextMenuItem(string text, string url, string iconClassName) {
        Text = text;
        Url = url;
        IconClassName = iconClassName;
    }

    public string Text { get; set; }
    public string Url { get; set; }
    public string IconClassName { get; set; }
}

public interface IWalletClientFactory {
    public Task<WalletClient> CreateClientAsync();
}
public class WalletClientFactory : IWalletClientFactory {
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AccessTokenFactory _accessTokenFactory;
    private readonly IOptions<WalletApiClientConfig> _config;
    public WalletClientFactory(IHttpClientFactory httpClientFactory, IOptions<WalletApiClientConfig> config) {
        _httpClientFactory = httpClientFactory;
        _accessTokenFactory = new AccessTokenFactory(
            httpClientFactory,
            config.Value.AuthorityUrl,
            config.Value.ClientId,
            config.Value.Secret,
            scope: "WalletApi",
            60
        );
        _config = config;
    }
    public async Task<WalletClient> CreateClientAsync() {
        var token = await _accessTokenFactory.GetAccessToken();
        var httpClient = _httpClientFactory.CreateClient();
        httpClient.SetBearerToken(token.AccessToken);
        return new WalletClient(httpClient) {
            BaseUrl = _config.Value.ApiUrl
        };
    }
}

public class WalletApiClientConfig {
    public string AuthorityUrl { get; set; }
    public string ApiUrl { get; set; }
    public string ClientId { get; set; }
    public string Secret { get; set; }
}
