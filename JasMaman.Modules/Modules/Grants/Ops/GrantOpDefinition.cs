using JasMaman.Modules.Grants.Menus;
using JasMaman.Modules.Grants.States;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using OpPatternAbstractions.Op;
using Yoda.Interfaces;
using Yoda.Interfaces.Forms;
using Yoda.Interfaces.Forms.Components;
using YodaApp;
using YodaApp.Yoda.Interfaces;
using YodaHelpers.ActionMenus;
using YodaHelpers.Components;
using YodaQuery;

namespace JasMaman.Modules.Grants.Ops {
    public class GrantOpQueryArgs : ActionQueryArgsBase {
        public long OperationId { get; set; }
        public long GrantId { get; set; }
    }

    /// <summary>Ошибка бизнес-правила при выполнении операции (показывается пользователю как есть).</summary>
    public class GrantOpException : Exception {
        public GrantOpException(string message) : base(message) { }
    }

    /// <summary>Контекст применения операции: время, пользователь, генератор id вложенных записей.</summary>
    public record GrantOpApplyContext(DateTime Now, GrantOpUserContext User, Func<long> NextId);

    /// <summary>Подготовленная, но ещё не записанная операция (для пакетной записи при миграции).</summary>
    public record PreparedGrantOp(GrantState State, StateChanges[] Changes);

    public interface IGrantOpManager {
        GrantOpType OpType { get; }
        /// <summary>Операцию можно запустить из карточки (false — только системно, например перенос из УМОСК).</summary>
        bool AvailableInUi { get; }
        (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user);
        string GetCreateUrl(IYodaRequestContext context, GrantId? grantId);
        void ConfigureActions(string moduleName, string menuName, ActionConfig<GrantOpQueryArgs> config);
    }

    /// <summary>
    /// Определение операции по гранту. Наследник описывает только правила (доступность, валидация,
    /// чистое преобразование состояния) и форму; запись состояния + журнала и мастер — здесь.
    /// </summary>
    public abstract class GrantOpDefinition<TModel> : IGrantOpManager where TModel : class {
        public abstract GrantOpType OpType { get; }
        public virtual bool AvailableInUi => true;

        public abstract (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user);
        public virtual IEnumerable<string> Validate(GrantState? state, TModel model, DateTime today) => Array.Empty<string>();
        public abstract GrantState Apply(GrantState? state, TModel model, GrantOpApplyContext ctx);
        public abstract string Summarize(TModel model);

        public abstract TModel EmptyModel(GrantState? state);
        /// <summary>Начальная модель мастера; переопределяется, если её нужно получить из внешнего сервиса (ГБД ФЛ и т.п.).</summary>
        public virtual Task<TModel> EmptyModelAsync(GrantState? state, IYodaRequestContext context) => Task.FromResult(EmptyModel(state));
        /// <summary>false — форма только показывает подготовленную модель (пользователь лишь подтверждает операцию).</summary>
        protected virtual bool HasEditableForm => true;
        public abstract void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, TModel model, bool readOnly);
        public virtual void ValidateForm(FormEnvironment env, GrantState? state) { }
        public abstract TModel ReadForm(FormEnvironment env, GrantState? state);

        protected static (bool ok, string? error) Ok() => (true, null);
        protected static (bool ok, string? error) Deny(string error) => (false, error);

        #region execution

        public PreparedGrantOp Prepare(GrantState? state, TModel model, GrantOpUserContext user, string ipAddress, ICurrentMomento momento) {
            var check = CheckAvailable(state, user);
            if (!check.ok) {
                throw new GrantOpException(check.error ?? "Операция недоступна");
            }
            var errors = Validate(state, model, momento.Now.Date).ToArray();
            if (errors.Length > 0) {
                throw new GrantOpException(string.Join("; ", errors));
            }

            var idGen = new OperationIdGen(momento);
            var applyContext = new GrantOpApplyContext(momento.Now, user, () => idGen.NextId().Id);

            var newState = Apply(state, model, applyContext).Save(momento, out var stateChanges);
            var operationId = new GrantOpId(idGen.NextId().Id);
            new GrantOpState<TModel>(
                newState.GrantId,
                newState.BaseRowVersion!.Value,
                operationId,
                OpType,
                $"G{NumberBaseConverter.Default.ToNumberWithCheckSum(operationId.Id)}",
                momento.Now,
                user.ToOpUser(),
                ipAddress,
                Summarize(model),
                model
            ).Save(momento, out var opChanges);

            return new PreparedGrantOp(newState, new[] { stateChanges, opChanges });
        }

        public async Task<GrantState> InvokeAsync(GrantState? state, TModel model, GrantOpUserContext user, string ipAddress, IQueryExecuter queryExecuter, IMemoryCache memoryCache) {
            var prepared = Prepare(state, model, user, ipAddress, new CurrentMomento());
            await new BatchStateChangesExecuter()
                .AddRange(prepared.Changes)
                .ExecuteAsync(queryExecuter, memoryCache);
            await AfterInvokeAsync(state, prepared.State, model, user, queryExecuter);
            return prepared.State;
        }

        /// <summary>Побочные действия после записи операции (например, черновик уведомления МС).</summary>
        protected virtual Task AfterInvokeAsync(GrantState? before, GrantState after, TModel model, GrantOpUserContext user, IQueryExecuter queryExecuter)
            => Task.CompletedTask;

        #endregion

        #region ui

        public string CreateActionName => $"{OpType}Create";
        public string ViewActionName => $"{OpType}View";

        public string GetCreateUrl(IYodaRequestContext context, GrantId? grantId)
            => context.YodaActionUrl(GrantsModule.ModuleName, MnuGrantOp.MnuName, new GrantOpQueryArgs {
                GrantId = grantId?.Id ?? -1,
                OperationId = -1,
                MenuAction = CreateActionName
            });

        private static async Task<GrantState?> loadState(long grantId, IYodaRequestContext context)
            => await GrantState.TryGet(new GrantId(grantId), context.QueryExecuter, context.GetMemoryCache());

        private static string backUrl(IYodaRequestContext context, long grantId)
            => grantId > 0
                ? context.YodaActionUrl(GrantsModule.ModuleName, MnuGrantView.MnuName, new GrantViewQueryArgs { GrantId = grantId })
                : context.YodaActionUrl(GrantsModule.ModuleName, GrantsModule.MenuNames.All);

        public void ConfigureActions(string moduleName, string menuName, ActionConfig<GrantOpQueryArgs> config) {
            config.OnAction(CreateActionName, action => action
                .IsValid(async env => {
                    var state = await loadState(env.Args.GrantId, env.RequestContext);
                    var check = CheckAvailable(state, env.RequestContext.GetUserContextForGrantOp());
                    return check.ok
                        ? new OkResult()
                        : new RedirectResult(new RedirectToUrlData(backUrl(env.RequestContext, env.Args.GrantId)), check.error);
                })
                .Wizard(wizard => wizard
                    .Args(async env => new GrantOpWizardArgs(await loadState(env.Args.GrantId, env.RequestContext)))
                    .Model(async (env, args) => await EmptyModelAsync(args.State, env.RequestContext))
                    .CancelBtn("Отмена", env => backUrl(env.RequestContext, env.Args.GrantId))
                    .FinishBtn("Сохранить")
                    .Step(OpType.ToDisplayText(), step => step
                        .OnRendering(re => {
                            if (re.Args.State is { } state) {
                                GrantCardRenderer.RenderShortInfo(re.Panel, state);
                            }
                            RenderForm(re.Panel, re.Env, re.Args.State, re.Model, readOnly: false);
                        })
                        .OnValidating(ve => {
                            ValidateForm(ve.Env, ve.Args.State);
                            if (!ve.Env.IsValid) {
                                return;
                            }
                            var model = HasEditableForm ? ReadForm(ve.Env, ve.Args.State) : ve.Model;
                            foreach (var error in Validate(ve.Args.State, model, DateTime.Today)) {
                                ve.Env.AddError(GrantOpForm.GeneralErrorKey, error);
                            }
                        })
                        .OnProcessing(pe => {
                            if (HasEditableForm) {
                                pe.Model = ReadForm(pe.Env, pe.Args.State);
                            }
                        })
                    )
                    .BuildWithAsyncHanlders(
                        onEveryStepProcessing: async (env, args, info) => {
                            if (!env.IsValid || !info.IsLastStepExecutedSuccessfully) {
                                return;
                            }
                            var context = env.RequestContext;
                            try {
                                var newState = await InvokeAsync(
                                    args.State,
                                    info.Model,
                                    context.GetUserContextForGrantOp(),
                                    context.AppEnv.ServiceProvider.GetRequiredService<IUserIpAddressProvider>().GetUserIpAddress(),
                                    context.QueryExecuter,
                                    context.GetMemoryCache()
                                );
                                if (env.Redirect.Empty) {
                                    env.Redirect.SetRedirectToUrl(backUrl(context, newState.GrantId.Id));
                                }
                                env.SetPostbackMessage(env.T("Операция выполнена"));
                            } catch (GrantOpException ex) {
                                env.AddError(GrantOpForm.GeneralErrorKey, ex.Message);
                            }
                        }
                    )
                )
            );

            config.OnAction(ViewActionName, action => action
                .IsValid(async env => {
                    var state = await loadState(env.Args.GrantId, env.RequestContext);
                    return state != null && env.RequestContext.GetUserContextForGrantOp().CanSee(state)
                        ? new OkResult()
                        : new AccessDeniedResult();
                })
                .OnRendering(async re => {
                    var context = re.RequestContext;
                    var state = (await loadState(re.Args.GrantId, context))!;
                    var opState = await GrantOpState<TModel>.Get(new GrantOpId(re.Args.OperationId), context.QueryExecuter, context.GetMemoryCache());

                    new Panel("alert alert-light")
                        .Append(new Label($"{opState.OpType.ToDisplayText()} № {opState.OpNumber} от {opState.InvokedAt:dd.MM.yyyy HH:mm}, {opState.InvokedBy.Name ?? opState.InvokedBy.Login}"))
                        .AppendTo(re.Form);
                    RenderForm(re.Form, re, state, opState.Model, readOnly: true);
                    re.Form.Append(new LinkUrl(re.T("К карточке"), backUrl(context, state.GrantId.Id), "btn btn-secondary"));
                })
            );
        }

        #endregion
    }

    public record GrantOpWizardArgs(GrantState? State);

    public static class GrantOpMenuExtensions {
        public static void UseGrantOperations(this ActionConfig<GrantOpQueryArgs> config, string moduleName, string menuName, IEnumerable<IGrantOpManager> managers) {
            foreach (var manager in managers) {
                manager.ConfigureActions(moduleName, menuName, config);
            }
        }
    }
}
