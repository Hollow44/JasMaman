using JasMaman.Modules.Grants.Logic;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.Notifications;
using JasMaman.Modules.References;
using Yoda.Interfaces.Forms;
using Yoda.Interfaces.Forms.Components;
using static JasMaman.Modules.Grants.Ops.GrantOpRules;

namespace JasMaman.Modules.Grants.Ops {
    #region RecordWork — подтверждённый период работы (МТСЗН, МИО, КЦ, документы МС)

    public record RecordWorkModel(
        string? EmployerBin,
        string EmployerName,
        string? Position,
        DateTime From,
        DateTime? To,
        WorkConfirmationSource Source,
        string? Comment
    );

    public class RecordWorkOp : GrantOpDefinition<RecordWorkModel> {
        public override GrantOpType OpType => GrantOpType.RecordWork;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Visible(state, user), Actor(user, GrantActor.Monitoring), HasObligation(state));

        public override IEnumerable<string> Validate(GrantState? state, RecordWorkModel model, DateTime today) {
            if (model.To is { } to && to < model.From) {
                yield return "Дата окончания периода раньше даты начала";
            }
            if (model.From.Date > today) {
                yield return "Период работы не может начинаться в будущем";
            }
            if (model.EmployerBin != null && !GrantRules.IsValidBin(model.EmployerBin)) {
                yield return "БИН работодателя должен состоять из 12 цифр";
            }
        }

        public override GrantState Apply(GrantState? state, RecordWorkModel model, GrantOpApplyContext ctx) {
            var monitoring = state!.Obligation!.MonitoringStatus;
            var notArrived = monitoring is null or MonitoringStatus.NotArrived or MonitoringStatus.NotArrivedNotified
                or MonitoringStatus.NotArrivedNotNotified or MonitoringStatus.NotArrivedNoMioResponse
                or MonitoringStatus.NotArrivedIncompleteDocuments or MonitoringStatus.AwaitingSpecialistResponse;
            return state with {
                WorkPeriods = state.WorkPeriods.Safe().Add(new GrantWorkPeriod(
                    ctx.NextId(), model.EmployerBin, model.EmployerName, model.Position, model.From, model.To, model.Source, model.Comment)),
                Obligation = state.Obligation with { MonitoringStatus = notArrived ? MonitoringStatus.Arrived : monitoring },
            };
        }

        public override string Summarize(RecordWorkModel model) => $"{model.EmployerName}: {model.From:dd.MM.yyyy}–{model.To?.ToString("dd.MM.yyyy") ?? "н.в."}";

        public override RecordWorkModel EmptyModel(GrantState? state) {
            var assignment = state?.Assignments.Safe().OrderBy(a => a.CreatedAt).LastOrDefault();
            return new(assignment?.EmployerBin, assignment?.EmployerName ?? "", assignment?.Position, assignment?.WorkStart ?? DateTime.Today, null, WorkConfirmationSource.Mtszn, null);
        }

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, RecordWorkModel model, bool readOnly) {
            var f = GrantOpForm.Instance;
            var o = GrantOpForm.Options(readOnly);
            f.flEmployerBin.RenderT(panel, env, model.EmployerBin, o);
            f.flEmployerName.RenderT(panel, env, model.EmployerName, o);
            f.flPosition.RenderT(panel, env, model.Position, o);
            f.flDateFrom.RenderT(panel, env, model.From, o);
            f.flDateTo.RenderT(panel, env, model.To, o);
            f.flWorkSource.RenderT(panel, env, model.Source, o);
            f.flComment.RenderT(panel, env, model.Comment, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            f.flEmployerBin.ValidateT(env);
            f.flEmployerName.ValidateT(env, o => o.Required());
            f.flPosition.ValidateT(env);
            f.flDateFrom.ValidateT(env, o => o.Required());
            f.flDateTo.ValidateT(env);
            f.flWorkSource.ValidateT(env, o => o.Required());
            f.flComment.ValidateT(env);
        }

        public override RecordWorkModel ReadForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            return new RecordWorkModel(
                GrantOpForm.Clean(f.flEmployerBin.GetValueOrNullT(env)),
                f.flEmployerName.GetValueOrNullT(env)!.Trim(),
                GrantOpForm.Clean(f.flPosition.GetValueOrNullT(env)),
                f.flDateFrom.GetValueOrNullT(env)!.Value,
                f.flDateTo.GetValueOrNullT(env),
                f.flWorkSource.GetValueOrNullT(env)!.Value,
                GrantOpForm.Clean(f.flComment.GetValueOrNullT(env))
            );
        }
    }

    #endregion

    #region ChangeMonitoringStatus — итог проверки ДМ (Прибыл / КЦ / Не прибыл …)

    public record ChangeMonitoringStatusModel(MonitoringStatus Status, string? Comment);

    public class ChangeMonitoringStatusOp : GrantOpDefinition<ChangeMonitoringStatusModel> {
        public override GrantOpType OpType => GrantOpType.ChangeMonitoringStatus;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Visible(state, user), Actor(user, GrantActor.Monitoring), HasObligation(state), ObligationOpen(state));

        public override IEnumerable<string> Validate(GrantState? state, ChangeMonitoringStatusModel model, DateTime today) {
            if (model.Status is MonitoringStatus.Worked) {
                yield return "Отработку закрывает руководство операцией «Закрытие отработки»";
            }
            if (model.Status is MonitoringStatus.Released) {
                yield return "Освобождение оформляется операцией «Освобождение от отработки»";
            }
            if (model.Status is MonitoringStatus.TemporaryDeferral) {
                yield return "Отсрочка оформляется операцией «Отсрочка» с датой окончания";
            }
        }

        public override GrantState Apply(GrantState? state, ChangeMonitoringStatusModel model, GrantOpApplyContext ctx)
            => (state! with { Obligation = state.Obligation! with { MonitoringStatus = model.Status } }).AddNote(ctx, model.Comment);

        public override string Summarize(ChangeMonitoringStatusModel model) => RefMonitoringStatus.Texts[model.Status];

        public override ChangeMonitoringStatusModel EmptyModel(GrantState? state) => new(state?.Obligation?.MonitoringStatus ?? MonitoringStatus.Arrived, null);

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, ChangeMonitoringStatusModel model, bool readOnly) {
            var o = GrantOpForm.Options(readOnly);
            GrantOpForm.Instance.flMonitoringStatus.RenderT(panel, env, model.Status, o);
            GrantOpForm.Instance.flComment.RenderT(panel, env, model.Comment, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            GrantOpForm.Instance.flMonitoringStatus.ValidateT(env, o => o.Required());
            GrantOpForm.Instance.flComment.ValidateT(env);
        }

        public override ChangeMonitoringStatusModel ReadForm(FormEnvironment env, GrantState? state)
            => new(GrantOpForm.Instance.flMonitoringStatus.GetValueOrNullT(env)!.Value, GrantOpForm.Clean(GrantOpForm.Instance.flComment.GetValueOrNullT(env)));
    }

    #endregion

    #region CompleteObligation — закрытие отработки руководством

    public record CompleteObligationModel(DateTime CompletedAt, string? Comment);

    public class CompleteObligationOp : GrantOpDefinition<CompleteObligationModel> {
        public override GrantOpType OpType => GrantOpType.CompleteObligation;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Actor(user, GrantActor.MonitoringHead), HasObligation(state), ObligationOpen(state));

        public override IEnumerable<string> Validate(GrantState? state, CompleteObligationModel model, DateTime today) {
            var worked = GrantRules.TotalWorkedMonths(state!, today);
            if (worked < state.Obligation!.RequiredMonths) {
                yield return $"Отработано {worked} мес. из {state.Obligation.RequiredMonths} — закрыть отработку нельзя";
            }
        }

        public override GrantState Apply(GrantState? state, CompleteObligationModel model, GrantOpApplyContext ctx)
            => (state! with {
                Obligation = state.Obligation! with {
                    CompletedAt = model.CompletedAt,
                    MonitoringStatus = MonitoringStatus.Worked,
                    RecoveryStatus = RecoveryStatus.Worked,
                    TerminationReason = TerminationReason.ObligationFulfilled,
                },
            }).AddNote(ctx, model.Comment);

        public override string Summarize(CompleteObligationModel model) => $"Отработка закрыта {model.CompletedAt:dd.MM.yyyy}";

        /// <summary>Подтверждение МС об исполнении обязательства (через ПЭП, после утверждения руководителем).</summary>
        protected override Task AfterInvokeAsync(GrantState? before, GrantState after, CompleteObligationModel model, GrantOpUserContext user, IQueryExecuter queryExecuter) {
            NotificationService.CreateDraft(after, NotificationKind.ObligationCompleted, NotificationChannel.EGovPortal, user.Name, queryExecuter);
            return Task.CompletedTask;
        }

        public override CompleteObligationModel EmptyModel(GrantState? state) => new(DateTime.Today, null);

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, CompleteObligationModel model, bool readOnly) {
            if (state != null && !readOnly) {
                panel.Append(new Label($"Отработано: {GrantRules.TotalWorkedMonths(state, DateTime.Today)} мес. из {state.Obligation?.RequiredMonths}"));
            }
            var o = GrantOpForm.Options(readOnly);
            GrantOpForm.Instance.flDate.RenderT(panel, env, model.CompletedAt, o);
            GrantOpForm.Instance.flComment.RenderT(panel, env, model.Comment, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            GrantOpForm.Instance.flDate.ValidateT(env, o => o.Required());
            GrantOpForm.Instance.flComment.ValidateT(env);
        }

        public override CompleteObligationModel ReadForm(FormEnvironment env, GrantState? state)
            => new(GrantOpForm.Instance.flDate.GetValueOrNullT(env)!.Value, GrantOpForm.Clean(GrantOpForm.Instance.flComment.GetValueOrNullT(env)));
    }

    #endregion

    #region AddNote — примечание к делу

    public record AddNoteModel(string Text);

    public class AddNoteOp : GrantOpDefinition<AddNoteModel> {
        public override GrantOpType OpType => GrantOpType.AddNote;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Visible(state, user),
                Actor(user, GrantActor.Monitoring | GrantActor.Legal | GrantActor.Accounting | GrantActor.University));

        public override GrantState Apply(GrantState? state, AddNoteModel model, GrantOpApplyContext ctx) => state!.AddNote(ctx, model.Text);

        public override string Summarize(AddNoteModel model) => model.Text.Length > 200 ? model.Text[..200] + "…" : model.Text;

        public override AddNoteModel EmptyModel(GrantState? state) => new("");

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, AddNoteModel model, bool readOnly)
            => GrantOpForm.Instance.flComment.RenderT(panel, env, model.Text, GrantOpForm.Options(readOnly));

        public override void ValidateForm(FormEnvironment env, GrantState? state) => GrantOpForm.Instance.flComment.ValidateT(env, o => o.Required());

        public override AddNoteModel ReadForm(FormEnvironment env, GrantState? state) => new(GrantOpForm.Instance.flComment.GetValueOrNullT(env)!.Trim());
    }

    #endregion
}
