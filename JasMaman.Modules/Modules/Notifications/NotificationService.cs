using JasMaman.Modules.Grants.Logic;
using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;
using Microsoft.Extensions.Caching.Memory;
using OpPatternAbstractions.Op;

namespace JasMaman.Modules.Notifications {
    public static class NotificationService {
        /// <summary>
        /// Текст уведомления. Уровень образования подставляется автоматически
        /// (в УМОСК сотрудник дописывал категорию вручную — у МС может быть два обязательства).
        /// </summary>
        public static string BuildText(GrantState state, NotificationKind kind, DateTime today) {
            var level = RefEducationLevel.Texts[state.Study.EducationLevel].ToLowerInvariant();
            var name = state.Person.FullName;
            var university = state.Study.UniversityName ?? "организация образования";
            var employer = state.Assignments.Safe().OrderBy(a => a.CreatedAt).LastOrDefault()?.EmployerName;
            return kind switch {
                NotificationKind.ObligationReminder =>
                    $"Уважаемый(ая) {name}! По окончании обучения по государственному образовательному гранту ({level}, {university}) "
                    + $"вы обязаны отработать не менее трёх лет по распределению{(employer == null ? "" : $" ({employer})")}. "
                    + $"Срок прибытия к месту работы — {GrantRules.ArrivalDeadline(state):dd.MM.yyyy}. "
                    + "Подтверждающие трудоустройство документы направьте в АО «Финансовый центр». "
                    + "При неисполнении обязательства бюджетные средства, затраченные на обучение, подлежат возмещению.",
                NotificationKind.ObligationCompleted =>
                    $"Уважаемый(ая) {name}! Сообщаем, что ваше обязательство по отработке ({level}, {university}) исполнено "
                    + $"{state.Obligation?.CompletedAt ?? today:dd.MM.yyyy}.",
                NotificationKind.DebtRepaid =>
                    $"Уважаемый(ая) {name}! Сообщаем, что задолженность по возмещению бюджетных средств за обучение ({level}, {university}) "
                    + $"погашена полностью ({today:dd.MM.yyyy}).",
                _ => throw new ArgumentOutOfRangeException(nameof(kind))
            };
        }

        public static string? AddressFor(GrantState state, NotificationChannel channel) => channel switch {
            NotificationChannel.HybridMail => state.Person.Address,
            NotificationChannel.Sms => state.Person.Phone,
            NotificationChannel.EGovPortal => state.Person.Iin,
            _ => null
        };

        /// <summary>Есть ли незавершённое уведомление того же вида (защита от дублей при повторном формировании).</summary>
        public static bool HasPending(long grantId, NotificationKind kind, IQueryExecuter queryExecuter)
            => new TbNotification()
                .AddFilter(t => t.flGrantId, grantId)
                .AddFilter(t => t.flKind, kind)
                .AddFilter(t => t.flStatus, new[] { NotificationStatus.Draft, NotificationStatus.Approved, NotificationStatus.Sent })
                .Count(queryExecuter) > 0;

        public static bool CreateDraft(GrantState state, NotificationKind kind, NotificationChannel channel, string createdBy, IQueryExecuter queryExecuter) {
            if (HasPending(state.GrantId.Id, kind, queryExecuter)) {
                return false;
            }
            var now = DateTime.Now;
            new TbNotification()
                .Insert()
                .SetT(t => t.flNotificationId, new BasicIdGen(new CurrentMomento()).NextId())
                .SetT(t => t.flGrantId, state.GrantId.Id)
                .SetT(t => t.flIin, state.Person.Iin)
                .SetT(t => t.flFullName, state.Person.FullName)
                .SetT(t => t.flKind, kind)
                .SetT(t => t.flChannel, channel)
                .SetT(t => t.flStatus, NotificationStatus.Draft)
                .SetT(t => t.flAddress, AddressFor(state, channel))
                .SetT(t => t.flText, BuildText(state, kind, now.Date))
                .SetT(t => t.flCreatedAt, now)
                .SetT(t => t.flCreatedBy, createdBy)
                .SetT(t => t.flStatusAt, now)
                .Execute(queryExecuter);
            return true;
        }

        public static int ApproveDrafts(string approvedBy, IQueryExecuter queryExecuter) {
            var count = new TbNotification().AddFilter(t => t.flStatus, NotificationStatus.Draft).Count(queryExecuter);
            if (count > 0) {
                var now = DateTime.Now;
                new TbNotification()
                    .AddFilter(t => t.flStatus, NotificationStatus.Draft)
                    .Update()
                    .SetT(t => t.flStatus, NotificationStatus.Approved)
                    .SetT(t => t.flApprovedAt, now)
                    .SetT(t => t.flApprovedBy, approvedBy)
                    .SetT(t => t.flStatusAt, now)
                    .Execute(queryExecuter);
            }
            return count;
        }

        public static int CancelDrafts(IQueryExecuter queryExecuter) {
            var count = new TbNotification().AddFilter(t => t.flStatus, NotificationStatus.Draft).Count(queryExecuter);
            new TbNotification()
                .AddFilter(t => t.flStatus, NotificationStatus.Draft)
                .Update()
                .SetT(t => t.flStatus, NotificationStatus.Cancelled)
                .SetT(t => t.flStatusAt, DateTime.Now)
                .Execute(queryExecuter);
            return count;
        }

        /// <summary>Отправка утверждённых уведомлений + отметка в истории гранта.</summary>
        public static async Task<(int sent, int failed)> SendApprovedAsync(INotificationGateway gateway, IQueryExecuter queryExecuter, IMemoryCache memoryCache, int batchSize = 200) {
            var pending = new TbNotification()
                .AddFilter(t => t.flStatus, NotificationStatus.Approved)
                .Order(t => t.flApprovedAt)
                .Select(t => new FieldAlias[] { t.flNotificationId, t.flGrantId, t.flIin, t.flFullName, t.flKind, t.flChannel, t.flAddress, t.flText }, queryExecuter)
                .Take(batchSize)
                .Select(r => new {
                    Message = new NotificationMessage(r.GetVal(t => t.flNotificationId), r.GetVal(t => t.flChannel), r.GetVal(t => t.flIin),
                        r.GetVal(t => t.flFullName), r.GetVal(t => t.flAddress), r.GetVal(t => t.flText)),
                    GrantId = r.GetVal(t => t.flGrantId),
                    Kind = r.GetVal(t => t.flKind),
                })
                .ToList();

            int sent = 0, failed = 0;
            foreach (var item in pending) {
                NotificationSendResult result;
                try {
                    result = await gateway.SendAsync(item.Message);
                } catch (Exception ex) {
                    result = new NotificationSendResult(false, null, ex.Message);
                }
                var now = DateTime.Now;
                new TbNotification()
                    .AddFilter(t => t.flNotificationId, item.Message.NotificationId)
                    .Update()
                    .SetT(t => t.flStatus, result.Ok ? NotificationStatus.Sent : NotificationStatus.Failed)
                    .SetT(t => t.flProviderId, result.ProviderId)
                    .SetT(t => t.flError, result.Error)
                    .SetT(t => t.flSentAt, result.Ok ? now : null)
                    .SetT(t => t.flStatusAt, now)
                    .Execute(queryExecuter);

                if (!result.Ok) {
                    failed++;
                    continue;
                }
                sent++;
                await markGrantAsync(item.GrantId, item.Kind, item.Message.Channel, now, queryExecuter, memoryCache);
            }
            return (sent, failed);
        }

        private static async Task markGrantAsync(long grantId, NotificationKind kind, NotificationChannel channel, DateTime sentAt, IQueryExecuter queryExecuter, IMemoryCache memoryCache) {
            try {
                var state = await GrantState.Get(new GrantId(grantId), queryExecuter, memoryCache);
                state = await AllGrantOps.AddNote.InvokeAsync(state,
                    new AddNoteModel($"Уведомление «{NotificationTexts.Kinds[kind]}» отправлено {sentAt:dd.MM.yyyy} ({NotificationTexts.Channels[channel]})"),
                    GrantOpUserContext.System, "system", queryExecuter, memoryCache);

                var notified = kind == NotificationKind.ObligationReminder
                    && state.Obligation?.MonitoringStatus is null or MonitoringStatus.NotArrived or MonitoringStatus.NotArrivedNotNotified;
                if (notified && AllGrantOps.ChangeMonitoringStatus.CheckAvailable(state, GrantOpUserContext.System).ok) {
                    await AllGrantOps.ChangeMonitoringStatus.InvokeAsync(state, new ChangeMonitoringStatusModel(MonitoringStatus.NotArrivedNotified, null),
                        GrantOpUserContext.System, "system", queryExecuter, memoryCache);
                }
            } catch (GrantOpException) {
                // отметка в истории — вспомогательная; её отсутствие не должно блокировать отправку
            }
        }

        public static async Task<int> RefreshDeliveryAsync(INotificationGateway gateway, IQueryExecuter queryExecuter, int batchSize = 500) {
            var sent = new TbNotification()
                .AddFilter(t => t.flStatus, NotificationStatus.Sent)
                .AddFilter(t => t.flProviderId, ConditionOperator.NotEqual, DBNull.Value)
                .Order(t => t.flStatusAt)
                .Select(t => new FieldAlias[] { t.flNotificationId, t.flChannel, t.flProviderId }, queryExecuter)
                .Take(batchSize)
                .Select(r => (id: r.GetVal(t => t.flNotificationId), channel: r.GetVal(t => t.flChannel), providerId: r.GetVal(t => t.flProviderId)))
                .ToList();

            var updated = 0;
            foreach (var (id, channel, providerId) in sent) {
                var status = await gateway.GetStatusAsync(channel, providerId);
                if (status is null or NotificationStatus.Sent) {
                    continue;
                }
                new TbNotification()
                    .AddFilter(t => t.flNotificationId, id)
                    .Update()
                    .SetT(t => t.flStatus, status.Value)
                    .SetT(t => t.flStatusAt, DateTime.Now)
                    .Execute(queryExecuter);
                updated++;
            }
            return updated;
        }
    }
}
