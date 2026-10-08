using Microsoft.Extensions.Logging;

namespace JasMaman.Modules.Notifications {
    public record NotificationMessage(long NotificationId, NotificationChannel Channel, string Iin, string FullName, string? Address, string Text);
    public record NotificationSendResult(bool Ok, string? ProviderId, string? Error);

    /// <summary>
    /// Доставка уведомлений: гибридная почта КазПочты, ПЭП (eGov), SMS.
    /// Реальные реализации подключаются через IntegrationHub, когда будут доступны спецификации;
    /// до этого используется <see cref="LoggingNotificationGateway"/>.
    /// </summary>
    public interface INotificationGateway {
        Task<NotificationSendResult> SendAsync(NotificationMessage message);
        /// <summary>Текущий статус доставки у оператора; null — без изменений.</summary>
        Task<NotificationStatus?> GetStatusAsync(NotificationChannel channel, string providerId);
    }

    /// <summary>Заглушка для разработки и тестовых стендов: ничего не отправляет, пишет в лог и сразу считает доставленным.</summary>
    public class LoggingNotificationGateway : INotificationGateway {
        private readonly ILogger<LoggingNotificationGateway> _logger;

        public LoggingNotificationGateway(ILogger<LoggingNotificationGateway> logger) {
            _logger = logger;
        }

        public Task<NotificationSendResult> SendAsync(NotificationMessage message) {
            _logger.LogInformation("Уведомление #{Id} ({Channel}) не отправлено во внешний сервис — используется заглушка", message.NotificationId, message.Channel);
            return Task.FromResult(new NotificationSendResult(true, $"LOG-{message.NotificationId}", null));
        }

        public Task<NotificationStatus?> GetStatusAsync(NotificationChannel channel, string providerId)
            => Task.FromResult<NotificationStatus?>(NotificationStatus.Delivered);
    }
}
