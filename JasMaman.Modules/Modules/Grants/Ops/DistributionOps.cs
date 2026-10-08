using JasMaman.Modules.Grants.Logic;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;
using Yoda.Interfaces.Forms;
using Yoda.Interfaces.Forms.Components;
using static JasMaman.Modules.Grants.Ops.GrantOpRules;

namespace JasMaman.Modules.Grants.Ops {
    #region Assign — ВУЗ.4 «Распределение» / ВУЗ.5 «Перераспределение»

    public record AssignModel(
        AssignmentKind Kind,
        string ProtocolNumber,
        DateTime ProtocolDate,
        PlacementType PlacementType,
        string? EmployerBin,
        string? EmployerName,
        string? Region,
        string? Position,
        string? DirectionNumber,
        DateTime? DirectionDate,
        DateTime? WorkStart,
        Benefit? Benefit,
        string? Comment
    );

    public class AssignOp : GrantOpDefinition<AssignModel> {
        public override GrantOpType OpType => GrantOpType.Assign;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Visible(state, user), Actor(user, GrantActor.University | GrantActor.Monitoring),
                UniversityOwnsOrStaff(state, user), HasObligation(state), ObligationOpen(state));

        public override IEnumerable<string> Validate(GrantState? state, AssignModel model, DateTime today) {
            if (model.Kind == AssignmentKind.Main && state!.Assignments.Safe().Any(a => a.Kind == AssignmentKind.Main)) {
                yield return "Основное распределение уже оформлено — используйте дополнительный протокол";
            }
            if (model.Kind == AssignmentKind.Additional && !state!.Assignments.Safe().Any()) {
                yield return "Дополнительный протокол оформляется после основного распределения";
            }
            if (model.PlacementType != PlacementType.CareerCenter && model.PlacementType != PlacementType.Army && string.IsNullOrWhiteSpace(model.EmployerName)) {
                yield return "Укажите работодателя";
            }
            if (model.EmployerBin != null && !GrantRules.IsValidBin(model.EmployerBin)) {
                yield return "БИН работодателя должен состоять из 12 цифр";
            }
        }

        public override GrantState Apply(GrantState? state, AssignModel model, GrantOpApplyContext ctx)
            => state! with {
                Assignments = state.Assignments.Safe().Add(new GrantAssignment(
                    ctx.NextId(), model.Kind, model.ProtocolNumber, model.ProtocolDate, model.PlacementType,
                    model.EmployerBin, model.EmployerName, model.Region, model.Position,
                    model.DirectionNumber, model.DirectionDate, model.WorkStart, model.Comment, ctx.Now)),
                Obligation = state.Obligation! with {
                    Benefit = model.Benefit ?? state.Obligation.Benefit,
                    MonitoringStatus = model.PlacementType == PlacementType.CareerCenter ? MonitoringStatus.EmploymentCenter : state.Obligation.MonitoringStatus,
                },
            };

        public override string Summarize(AssignModel model)
            => $"Протокол № {model.ProtocolNumber} от {model.ProtocolDate:dd.MM.yyyy}: {RefPlacementType.Texts[model.PlacementType]}{(model.EmployerName != null ? ", " + model.EmployerName : "")}";

        public override AssignModel EmptyModel(GrantState? state)
            => new(state?.Assignments.Safe().Any() == true ? AssignmentKind.Additional : AssignmentKind.Main,
                "", DateTime.Today, PlacementType.Other, null, null, null, null, null, null, null, null, null);

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, AssignModel model, bool readOnly) {
            var f = GrantOpForm.Instance;
            var o = GrantOpForm.Options(readOnly);
            f.flAssignmentKind.RenderT(panel, env, model.Kind, o);
            f.flProtocolNumber.RenderT(panel, env, model.ProtocolNumber, o);
            f.flProtocolDate.RenderT(panel, env, model.ProtocolDate, o);
            f.flPlacementType.RenderT(panel, env, model.PlacementType, o);
            f.flEmployerBin.RenderT(panel, env, model.EmployerBin, o);
            f.flEmployerName.RenderT(panel, env, model.EmployerName, o);
            f.flRegion.RenderT(panel, env, model.Region, o);
            f.flPosition.RenderT(panel, env, model.Position, o);
            f.flDirectionNumber.RenderT(panel, env, model.DirectionNumber, o);
            f.flDirectionDate.RenderT(panel, env, model.DirectionDate, o);
            f.flWorkStart.RenderT(panel, env, model.WorkStart, o);
            f.flBenefit.RenderT(panel, env, model.Benefit, o);
            f.flComment.RenderT(panel, env, model.Comment, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            f.flAssignmentKind.ValidateT(env, o => o.Required());
            f.flProtocolNumber.ValidateT(env, o => o.Required());
            f.flProtocolDate.ValidateT(env, o => o.Required());
            f.flPlacementType.ValidateT(env, o => o.Required());
            f.flEmployerBin.ValidateT(env);
            f.flEmployerName.ValidateT(env);
            f.flRegion.ValidateT(env);
            f.flPosition.ValidateT(env);
            f.flDirectionNumber.ValidateT(env);
            f.flDirectionDate.ValidateT(env);
            f.flWorkStart.ValidateT(env);
            f.flBenefit.ValidateT(env);
            f.flComment.ValidateT(env);
        }

        public override AssignModel ReadForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            return new AssignModel(
                f.flAssignmentKind.GetValueOrNullT(env)!.Value,
                f.flProtocolNumber.GetValueOrNullT(env)!.Trim(),
                f.flProtocolDate.GetValueOrNullT(env)!.Value,
                f.flPlacementType.GetValueOrNullT(env)!.Value,
                GrantOpForm.Clean(f.flEmployerBin.GetValueOrNullT(env)),
                GrantOpForm.Clean(f.flEmployerName.GetValueOrNullT(env)),
                GrantOpForm.Clean(f.flRegion.GetValueOrNullT(env)),
                GrantOpForm.Clean(f.flPosition.GetValueOrNullT(env)),
                GrantOpForm.Clean(f.flDirectionNumber.GetValueOrNullT(env)),
                f.flDirectionDate.GetValueOrNullT(env),
                f.flWorkStart.GetValueOrNullT(env),
                f.flBenefit.GetValueOrNullT(env),
                GrantOpForm.Clean(f.flComment.GetValueOrNullT(env))
            );
        }
    }

    #endregion

    #region Release — освобождение от отработки (основной / доп. протокол)

    public record ReleaseModel(ReleaseReason Reason, string? ProtocolNumber, DateTime? ProtocolDate, string? DocumentNumber, DateTime? DocumentDate, string? Comment);

    public class ReleaseOp : GrantOpDefinition<ReleaseModel> {
        public override GrantOpType OpType => GrantOpType.Release;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Visible(state, user), Actor(user, GrantActor.University | GrantActor.Monitoring),
                UniversityOwnsOrStaff(state, user), HasObligation(state), ObligationOpen(state));

        public override GrantState Apply(GrantState? state, ReleaseModel model, GrantOpApplyContext ctx)
            => (state! with {
                Obligation = state.Obligation! with {
                    ReleaseReason = model.Reason,
                    ReleasedAt = model.ProtocolDate ?? model.DocumentDate ?? ctx.Now.Date,
                    MonitoringStatus = MonitoringStatus.Released,
                },
            }).AddNote(ctx, model.Comment);

        public override string Summarize(ReleaseModel model) => RefReleaseReason.Texts[model.Reason];

        public override ReleaseModel EmptyModel(GrantState? state) => new(ReleaseReason.NoVacancy, null, DateTime.Today, null, null, null);

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, ReleaseModel model, bool readOnly) {
            var f = GrantOpForm.Instance;
            var o = GrantOpForm.Options(readOnly);
            f.flReleaseReason.RenderT(panel, env, model.Reason, o);
            f.flProtocolNumber.RenderT(panel, env, model.ProtocolNumber, o);
            f.flProtocolDate.RenderT(panel, env, model.ProtocolDate, o);
            f.flDocumentNumber.RenderT(panel, env, model.DocumentNumber, o);
            f.flDocumentDate.RenderT(panel, env, model.DocumentDate, o);
            f.flComment.RenderT(panel, env, model.Comment, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            f.flReleaseReason.ValidateT(env, o => o.Required());
            f.flProtocolNumber.ValidateT(env, o => o.Required());
            f.flProtocolDate.ValidateT(env, o => o.Required());
            f.flDocumentNumber.ValidateT(env, o => o.Required());
            f.flDocumentDate.ValidateT(env);
            f.flComment.ValidateT(env);
        }

        public override ReleaseModel ReadForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            return new ReleaseModel(
                f.flReleaseReason.GetValueOrNullT(env)!.Value,
                GrantOpForm.Clean(f.flProtocolNumber.GetValueOrNullT(env)),
                f.flProtocolDate.GetValueOrNullT(env),
                GrantOpForm.Clean(f.flDocumentNumber.GetValueOrNullT(env)),
                f.flDocumentDate.GetValueOrNullT(env),
                GrantOpForm.Clean(f.flComment.GetValueOrNullT(env))
            );
        }
    }

    #endregion

    #region Defer — отсрочка с обязательной датой окончания

    public record DeferModel(DeferralType Type, DateTime From, DateTime Until, string? DocumentNumber, DateTime? DocumentDate, string? Comment);

    public class DeferOp : GrantOpDefinition<DeferModel> {
        public override GrantOpType OpType => GrantOpType.Defer;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Visible(state, user), Actor(user, GrantActor.University | GrantActor.Monitoring),
                UniversityOwnsOrStaff(state, user), HasObligation(state), ObligationOpen(state));

        public override IEnumerable<string> Validate(GrantState? state, DeferModel model, DateTime today) {
            if (model.Until <= model.From) {
                yield return "Дата окончания отсрочки должна быть позже даты начала";
            }
            if (state != null && GrantRules.HasActiveDeferral(state, today)) {
                yield return "У грантника уже есть действующая отсрочка — сначала завершите её";
            }
        }

        public override GrantState Apply(GrantState? state, DeferModel model, GrantOpApplyContext ctx)
            => state! with {
                Deferrals = state.Deferrals.Safe().Add(new GrantDeferral(
                    ctx.NextId(), model.Type, model.From, model.Until, model.DocumentNumber, model.DocumentDate, model.Comment, EndedAt: null)),
                Obligation = state.Obligation! with { MonitoringStatus = MonitoringStatus.TemporaryDeferral },
            };

        public override string Summarize(DeferModel model) => $"{RefDeferralType.Texts[model.Type]}: {model.From:dd.MM.yyyy}–{model.Until:dd.MM.yyyy}";

        public override DeferModel EmptyModel(GrantState? state) => new(DeferralType.MasterKz, DateTime.Today, DateTime.Today.AddYears(2), null, null, null);

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, DeferModel model, bool readOnly) {
            var f = GrantOpForm.Instance;
            var o = GrantOpForm.Options(readOnly);
            f.flDeferralType.RenderT(panel, env, model.Type, o);
            f.flDateFrom.RenderT(panel, env, model.From, o);
            f.flDateTo.RenderT(panel, env, model.Until, o);
            f.flDocumentNumber.RenderT(panel, env, model.DocumentNumber, o);
            f.flDocumentDate.RenderT(panel, env, model.DocumentDate, o);
            f.flComment.RenderT(panel, env, model.Comment, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            f.flDeferralType.ValidateT(env, o => o.Required());
            f.flDateFrom.ValidateT(env, o => o.Required());
            f.flDateTo.ValidateT(env, o => o.Required());
            f.flDocumentNumber.ValidateT(env, o => o.Required());
            f.flDocumentDate.ValidateT(env);
            f.flComment.ValidateT(env);
        }

        public override DeferModel ReadForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            return new DeferModel(
                f.flDeferralType.GetValueOrNullT(env)!.Value,
                f.flDateFrom.GetValueOrNullT(env)!.Value,
                f.flDateTo.GetValueOrNullT(env)!.Value,
                GrantOpForm.Clean(f.flDocumentNumber.GetValueOrNullT(env)),
                f.flDocumentDate.GetValueOrNullT(env),
                GrantOpForm.Clean(f.flComment.GetValueOrNullT(env))
            );
        }
    }

    #endregion

    #region EndDeferral — завершение отсрочки (получение диплома, демобилизация)

    public record EndDeferralModel(DateTime EndedAt, string? Comment);

    public class EndDeferralOp : GrantOpDefinition<EndDeferralModel> {
        public override GrantOpType OpType => GrantOpType.EndDeferral;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Visible(state, user), Actor(user, GrantActor.University | GrantActor.Monitoring),
                (state != null && state.Deferrals.Safe().Any(d => d.EndedAt == null), "Нет незавершённой отсрочки"));

        public override GrantState Apply(GrantState? state, EndDeferralModel model, GrantOpApplyContext ctx) {
            var deferral = state!.Deferrals.Last(d => d.EndedAt == null);
            var updated = state with {
                Deferrals = state.Deferrals.Replace(deferral, deferral with { EndedAt = model.EndedAt }),
            };
            // срок явки — 30 календарных дней после окончания отсрочки
            return (updated with {
                Obligation = updated.Obligation! with {
                    MonitoringStatus = updated.Obligation.MonitoringStatus == MonitoringStatus.TemporaryDeferral ? null : updated.Obligation.MonitoringStatus,
                    ArrivalDeadline = GrantRules.ArrivalDeadline(updated),
                },
            }).AddNote(ctx, model.Comment);
        }

        public override string Summarize(EndDeferralModel model) => $"Отсрочка завершена {model.EndedAt:dd.MM.yyyy}";

        public override EndDeferralModel EmptyModel(GrantState? state) => new(DateTime.Today, null);

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, EndDeferralModel model, bool readOnly) {
            var f = GrantOpForm.Instance;
            var o = GrantOpForm.Options(readOnly);
            f.flDate.RenderT(panel, env, model.EndedAt, o);
            f.flComment.RenderT(panel, env, model.Comment, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            GrantOpForm.Instance.flDate.ValidateT(env, o => o.Required());
            GrantOpForm.Instance.flComment.ValidateT(env);
        }

        public override EndDeferralModel ReadForm(FormEnvironment env, GrantState? state)
            => new(GrantOpForm.Instance.flDate.GetValueOrNullT(env)!.Value, GrantOpForm.Clean(GrantOpForm.Instance.flComment.GetValueOrNullT(env)));
    }

    #endregion
}
