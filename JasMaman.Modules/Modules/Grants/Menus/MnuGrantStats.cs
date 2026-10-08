using System.Net;
using System.Text;
using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.QueryTables;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.Notifications;
using JasMaman.Modules.References;
using Yoda.Interfaces.Menu;

namespace JasMaman.Modules.Grants.Menus {
    /// <summary>Сводка по реестру: этапы, статусы мониторинга и взыскания, сроки, требующие внимания.</summary>
    public class MnuGrantStats : FrmMenu {
        public const string MnuName = nameof(MnuGrantStats);

        public MnuGrantStats() : base(MnuName, "Сводка") {
            AccessCheck((args, context) => new AccessCheckResult {
                HasAccess = context.User.IsAuthentificated && context.GetUserContextForGrantOp().Is(GrantActor.Monitoring | GrantActor.Legal | GrantActor.Accounting)
            });
            OnRendering(re => {
                var qe = re.QueryExecuter;
                var today = DateTime.Today;
                long count(Func<TbGrantState, TbGrantState> filter) => filter(GrantsStore.Instance.TbState()).Count(qe);

                var sb = new StringBuilder("<div class=\"row\">");
                sb.Append(tile("Требуют внимания", new (string, long)[] {
                    ("Срок явки истёк, работа не подтверждена", count(t => t
                        .AddFilter(x => x.flStage, GrantStage.Obligation)
                        .AddFilter(x => x.flArrivalDeadline, ConditionOperator.Less, today)
                        .AddFilter(x => x.flWorkedMonths, 0)
                        .AddFilter(x => x.flDeferralUntil, DBNull.Value))),
                    ("Отсрочка заканчивается в ближайшие 30 дней", count(t => t
                        .AddFilter(x => x.flDeferralUntil, ConditionOperator.GreateOrEqual, today)
                        .AddFilter(x => x.flDeferralUntil, ConditionOperator.LessOrEqual, today.AddDays(30)))),
                    ("Уведомления ждут утверждения", new TbNotification().AddFilter(t => t.flStatus, NotificationStatus.Draft).Count(qe)),
                    ("Уведомления с ошибкой отправки", new TbNotification().AddFilter(t => t.flStatus, NotificationStatus.Failed).Count(qe)),
                }));
                sb.Append(tile("Этапы", Enum.GetValues<GrantStage>()
                    .Select(stage => (stage.ToDisplayText(), count(t => t.AddFilter(x => x.flStage, stage)))).ToArray()));
                sb.Append(tile("Статус мониторинга (открытые обязательства)", Enum.GetValues<MonitoringStatus>()
                    .Select(status => (RefMonitoringStatus.Texts[status], count(t => t.AddFilter(x => x.flStage, GrantStage.Obligation).AddFilter(x => x.flMonitoringStatus, status))))
                    .Where(x => x.Item2 > 0).ToArray()));
                sb.Append(tile("Статус взыскания (ТКС)", Enum.GetValues<RecoveryStatus>().Where(s => s != RecoveryStatus.None)
                    .Select(status => (RefRecoveryStatus.Texts[status], count(t => t.AddFilter(x => x.flRecoveryStatus, status))))
                    .Where(x => x.Item2 > 0).ToArray()));
                sb.Append("</div>");
                re.Form.Append(new HtmlTextV2(sb.ToString(), HtmlTextV2.HtmlSecurity.МойHtmlЗащищенОтCrossSiteScripting));
            });
        }

        private static string tile(string title, (string label, long value)[] rows) {
            var sb = new StringBuilder($"<div class=\"col-lg-6\"><div class=\"card mb-3\"><div class=\"card-body\"><h5 class=\"card-title\">{WebUtility.HtmlEncode(title)}</h5>");
            if (rows.Length == 0) {
                sb.Append("<p class=\"text-muted mb-0\">Нет данных</p>");
            } else {
                sb.Append("<table class=\"table table-sm mb-0\"><tbody>");
                foreach (var (label, value) in rows) {
                    sb.Append($"<tr><td>{WebUtility.HtmlEncode(label)}</td><td class=\"text-end\"><b>{value:N0}</b></td></tr>");
                }
                sb.Append("</tbody></table>");
            }
            sb.Append("</div></div></div>");
            return sb.ToString();
        }
    }
}
