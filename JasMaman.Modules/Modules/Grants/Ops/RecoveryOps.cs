using JasMaman.Modules.Grants.Logic;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.Notifications;
using JasMaman.Modules.References;
using Yoda.Interfaces.Forms;
using Yoda.Interfaces.Forms.Components;
using static JasMaman.Modules.Grants.Ops.GrantOpRules;

namespace JasMaman.Modules.Grants.Ops {
    #region ChangeRecoveryStatus — ТКС: передача в ЮРДЕП, ИП, архив, возврат из ЮД

    public record ChangeRecoveryStatusModel(RecoveryStatus Status, string? DocumentNumber, DateTime? DocumentDate, string? Comment);

    public class ChangeRecoveryStatusOp : GrantOpDefinition<ChangeRecoveryStatusModel> {
        public override GrantOpType OpType => GrantOpType.ChangeRecoveryStatus;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Actor(user, GrantActor.MonitoringHead | GrantActor.Legal), HasObligation(state));

        /// <summary>
        /// Кто какие статусы ставит: передать в ЮРДЕП / вернуть — руководство ДМ;
        /// ИП, решения суда, архив по суду — юристы.
        /// </summary>
        public static IEnumerable<string> ValidateTransition(RecoveryStatus from, RecoveryStatus to, GrantOpUserContext user) {
            if (from == to) {
                yield return "Статус не изменился";
                yield break;
            }
            var legalOnly = to is RecoveryStatus.EnforcementProceedings or RecoveryStatus.ArchiveByCourtDecision or RecoveryStatus.CourtDecisionRefused;
            if (legalOnly && !user.Is(GrantActor.Legal)) {
                yield return "Статусы по решению суда устанавливает юридический департамент";
            }
            if (to == RecoveryStatus.LegalDepartment && !user.Is(GrantActor.MonitoringHead)) {
                yield return "Передачу дела в ЮРДЕП выполняет руководство департамента мониторинга";
            }
        }

        public override IEnumerable<string> Validate(GrantState? state, ChangeRecoveryStatusModel model, DateTime today)
            => Array.Empty<string>();

        public override GrantState Apply(GrantState? state, ChangeRecoveryStatusModel model, GrantOpApplyContext ctx) {
            var errors = ValidateTransition(state!.Obligation!.RecoveryStatus, model.Status, ctx.User).ToArray();
            if (errors.Length > 0) {
                throw new GrantOpException(string.Join("; ", errors));
            }
            return (state with {
                Obligation = state.Obligation with {
                    RecoveryStatus = model.Status,
                    TerminationReason = model.Status == RecoveryStatus.ArchiveByCourtDecision ? TerminationReason.CourtDecision : state.Obligation.TerminationReason,
                },
            }).AddNote(ctx, model.Comment);
        }

        public override string Summarize(ChangeRecoveryStatusModel model) => RefRecoveryStatus.Texts[model.Status];

        public override ChangeRecoveryStatusModel EmptyModel(GrantState? state) => new(state?.Obligation?.RecoveryStatus ?? RecoveryStatus.None, null, null, null);

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, ChangeRecoveryStatusModel model, bool readOnly) {
            var f = GrantOpForm.Instance;
            var o = GrantOpForm.Options(readOnly);
            f.flRecoveryStatus.RenderT(panel, env, model.Status, o);
            f.flDocumentNumber.RenderT(panel, env, model.DocumentNumber, o);
            f.flDocumentDate.RenderT(panel, env, model.DocumentDate, o);
            f.flComment.RenderT(panel, env, model.Comment, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            f.flRecoveryStatus.ValidateT(env, o => o.Required());
            f.flDocumentNumber.ValidateT(env);
            f.flDocumentDate.ValidateT(env);
            f.flComment.ValidateT(env);
            if (env.IsValid && state?.Obligation != null) {
                foreach (var error in ValidateTransition(state.Obligation.RecoveryStatus, f.flRecoveryStatus.GetValueOrNullT(env)!.Value, env.RequestContext.GetUserContextForGrantOp())) {
                    env.AddError(f.flRecoveryStatus.FieldName, error);
                }
            }
        }

        public override ChangeRecoveryStatusModel ReadForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            return new ChangeRecoveryStatusModel(
                f.flRecoveryStatus.GetValueOrNullT(env)!.Value,
                GrantOpForm.Clean(f.flDocumentNumber.GetValueOrNullT(env)),
                f.flDocumentDate.GetValueOrNullT(env),
                GrantOpForm.Clean(f.flComment.GetValueOrNullT(env))
            );
        }
    }

    #endregion

    #region CalculateDebt — «Разнести сумму для взыскания»

    public record CalculateDebtModel(decimal Amount, int WorkedMonths, string? Comment);

    public class CalculateDebtOp : GrantOpDefinition<CalculateDebtModel> {
        public override GrantOpType OpType => GrantOpType.CalculateDebt;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Actor(user, GrantActor.Monitoring), HasObligation(state), ObligationOpen(state),
                (state?.Study.BudgetCost > 0, "Не указана сумма бюджетных расходов на обучение (приказ об окончании)"));

        public override IEnumerable<string> Validate(GrantState? state, CalculateDebtModel model, DateTime today) {
            if (model.Amount <= 0) {
                yield return "Сумма к возмещению должна быть больше нуля";
            }
            if (state?.Study.BudgetCost is { } cost && model.Amount > cost) {
                yield return "Сумма к возмещению не может превышать бюджетные расходы на обучение";
            }
        }

        public override GrantState Apply(GrantState? state, CalculateDebtModel model, GrantOpApplyContext ctx)
            => (state! with { Obligation = state.Obligation! with { DebtAmount = model.Amount } }).AddNote(ctx, model.Comment);

        public override string Summarize(CalculateDebtModel model) => $"К возмещению {model.Amount:N2} (отработано {model.WorkedMonths} мес.)";

        public override CalculateDebtModel EmptyModel(GrantState? state) {
            var worked = state == null ? 0 : GrantRules.TotalWorkedMonths(state, DateTime.Today);
            var amount = state?.Obligation == null || state.Study.BudgetCost == null
                ? 0
                : GrantRules.ProportionalDebt(state.Study.BudgetCost.Value, state.Obligation.RequiredMonths, worked);
            return new(amount, worked, null);
        }

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, CalculateDebtModel model, bool readOnly) {
            panel.Append(new Label($"Отработано {model.WorkedMonths} мес.; расходы бюджета {state?.Study.BudgetCost:N2}. Сумма рассчитана пропорционально неотработанному сроку, при необходимости скорректируйте."));
            var o = GrantOpForm.Options(readOnly);
            GrantOpForm.Instance.flAmount.RenderT(panel, env, model.Amount, o);
            GrantOpForm.Instance.flComment.RenderT(panel, env, model.Comment, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            GrantOpForm.Instance.flAmount.ValidateT(env, o => o.Required());
            GrantOpForm.Instance.flComment.ValidateT(env);
        }

        public override CalculateDebtModel ReadForm(FormEnvironment env, GrantState? state)
            => new(
                GrantOpForm.Instance.flAmount.GetValueOrNullT(env)!.Value,
                state == null ? 0 : GrantRules.TotalWorkedMonths(state, DateTime.Today),
                GrantOpForm.Clean(GrantOpForm.Instance.flComment.GetValueOrNullT(env))
            );
    }

    #endregion

    #region RecordPayment — «Ввод оплаты за обучение» (бухгалтерия)

    public record RecordPaymentModel(decimal Amount, DateTime PaidAt, string? DocumentNumber, string? Comment);

    public class RecordPaymentOp : GrantOpDefinition<RecordPaymentModel> {
        public override GrantOpType OpType => GrantOpType.RecordPayment;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Actor(user, GrantActor.Accounting), HasObligation(state),
                (state?.Obligation?.DebtAmount > 0, "Сумма к возмещению ещё не рассчитана"));

        public override IEnumerable<string> Validate(GrantState? state, RecordPaymentModel model, DateTime today) {
            if (model.Amount <= 0) {
                yield return "Сумма оплаты должна быть больше нуля";
            }
            if (model.PaidAt.Date > today) {
                yield return "Дата оплаты не может быть в будущем";
            }
        }

        public override GrantState Apply(GrantState? state, RecordPaymentModel model, GrantOpApplyContext ctx) {
            var updated = state! with {
                Payments = state.Payments.Safe().Add(new GrantPayment(ctx.NextId(), model.Amount, model.PaidAt, model.DocumentNumber, model.Comment)),
            };
            // при полном погашении статус ТКС по уровню образования автоматически становится «Архив»
            return GrantRules.DebtBalance(updated) == 0
                ? updated with {
                    Obligation = updated.Obligation! with { RecoveryStatus = RecoveryStatus.Archive, MonitoringStatus = MonitoringStatus.Paid },
                }
                : updated;
        }

        public override string Summarize(RecordPaymentModel model) => $"Оплата {model.Amount:N2} от {model.PaidAt:dd.MM.yyyy}";

        /// <summary>При полном погашении — уведомление МС о закрытии задолженности.</summary>
        protected override Task AfterInvokeAsync(GrantState? before, GrantState after, RecordPaymentModel model, GrantOpUserContext user, IQueryExecuter queryExecuter) {
            if (before != null && GrantRules.DebtBalance(before) > 0 && GrantRules.DebtBalance(after) == 0) {
                NotificationService.CreateDraft(after, NotificationKind.DebtRepaid, NotificationChannel.EGovPortal, user.Name, queryExecuter);
            }
            return Task.CompletedTask;
        }

        public override RecordPaymentModel EmptyModel(GrantState? state) => new(state == null ? 0 : GrantRules.DebtBalance(state) ?? 0, DateTime.Today, null, null);

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, RecordPaymentModel model, bool readOnly) {
            if (state != null && !readOnly) {
                panel.Append(new Label($"Остаток долга: {GrantRules.DebtBalance(state):N2}"));
            }
            var f = GrantOpForm.Instance;
            var o = GrantOpForm.Options(readOnly);
            f.flAmount.RenderT(panel, env, model.Amount, o);
            f.flDate.RenderT(panel, env, model.PaidAt, o);
            f.flDocumentNumber.RenderT(panel, env, model.DocumentNumber, o);
            f.flComment.RenderT(panel, env, model.Comment, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            f.flAmount.ValidateT(env, o => o.Required());
            f.flDate.ValidateT(env, o => o.Required());
            f.flDocumentNumber.ValidateT(env, o => o.Required());
            f.flComment.ValidateT(env);
        }

        public override RecordPaymentModel ReadForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            return new RecordPaymentModel(
                f.flAmount.GetValueOrNullT(env)!.Value,
                f.flDate.GetValueOrNullT(env)!.Value,
                GrantOpForm.Clean(f.flDocumentNumber.GetValueOrNullT(env)),
                GrantOpForm.Clean(f.flComment.GetValueOrNullT(env))
            );
        }
    }

    #endregion

    #region Terminate — прекращение обязательства (смерть, инвалидность, ликвидация работодателя …)

    public record TerminateModel(TerminationReason Reason, DateTime TerminatedAt, string? DocumentNumber, string? Comment);

    public class TerminateOp : GrantOpDefinition<TerminateModel> {
        public override GrantOpType OpType => GrantOpType.Terminate;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Actor(user, GrantActor.MonitoringHead), HasObligation(state), ObligationOpen(state));

        public override IEnumerable<string> Validate(GrantState? state, TerminateModel model, DateTime today) {
            if (model.Reason == TerminationReason.ObligationFulfilled) {
                yield return "Исполнение обязательства оформляется операцией «Закрытие отработки»";
            }
        }

        public override GrantState Apply(GrantState? state, TerminateModel model, GrantOpApplyContext ctx)
            => (state! with {
                Obligation = state.Obligation! with {
                    TerminationReason = model.Reason,
                    TerminatedAt = model.TerminatedAt,
                    RecoveryStatus = model.Reason == TerminationReason.Death ? RecoveryStatus.Deceased
                        : model.Reason == TerminationReason.Disability ? RecoveryStatus.Disability
                        : state.Obligation.RecoveryStatus,
                    MonitoringStatus = model.Reason == TerminationReason.Death ? MonitoringStatus.Deceased : state.Obligation.MonitoringStatus,
                },
            }).AddNote(ctx, model.Comment);

        public override string Summarize(TerminateModel model) => RefTerminationReason.Texts[model.Reason];

        public override TerminateModel EmptyModel(GrantState? state) => new(TerminationReason.EmployerLiquidation, DateTime.Today, null, null);

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, TerminateModel model, bool readOnly) {
            var f = GrantOpForm.Instance;
            var o = GrantOpForm.Options(readOnly);
            f.flTerminationReason.RenderT(panel, env, model.Reason, o);
            f.flDate.RenderT(panel, env, model.TerminatedAt, o);
            f.flDocumentNumber.RenderT(panel, env, model.DocumentNumber, o);
            f.flComment.RenderT(panel, env, model.Comment, o);
        }

        public override void ValidateForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            f.flTerminationReason.ValidateT(env, o => o.Required());
            f.flDate.ValidateT(env, o => o.Required());
            f.flDocumentNumber.ValidateT(env, o => o.Required());
            f.flComment.ValidateT(env);
        }

        public override TerminateModel ReadForm(FormEnvironment env, GrantState? state) {
            var f = GrantOpForm.Instance;
            return new TerminateModel(
                f.flTerminationReason.GetValueOrNullT(env)!.Value,
                f.flDate.GetValueOrNullT(env)!.Value,
                GrantOpForm.Clean(f.flDocumentNumber.GetValueOrNullT(env)),
                GrantOpForm.Clean(f.flComment.GetValueOrNullT(env))
            );
        }
    }

    #endregion
}
