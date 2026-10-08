using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.QueryTables;
using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using OpPatternAbstractions.Op;
using YodaApp;
using YodaQuery;

namespace JasMaman.Modules.Grants.States {
    public record GrantOpId(long Id);
    public record OpUser(string Login, string Xin, string? Name);

    /// <summary>Запись журнала операций по гранту. Операции исполняются сразу, запись неизменяема.</summary>
    public record GrantOpState<TModel>(
        GrantId GrantId,
        int GrantRowVersion,
        GrantOpId OperationId,
        GrantOpType OpType,
        string OpNumber,
        DateTime InvokedAt,
        OpUser InvokedBy,
        string InvokeIpAddress,
        string? Summary,
        TModel Model
    ) {
        private static readonly StateCacheGateway<GrantOpState<TModel>, GrantOpId> _stateGateway = new(
            "GrantOpState",
            getNewerState: x => x.state1,
            getStateKey: x => x.OperationId,
            convertKeyToString: key => key.Id.ToString(),
            loadState: val => Task.FromResult(
                GrantsStore.Instance.TbOpState()
                    .AddFilter(t => t.flOperationId, val.key.Id)
                    .SelectFirst(t => t.Fields.ToAliases(), val.queryExecuter)
                    .Transform(r => new GrantOpState<TModel>(
                        new GrantId(r.GetVal(t => t.flGrantId)),
                        r.GetVal(t => t.flGrantRowVersion),
                        new GrantOpId(r.GetVal(t => t.flOperationId)),
                        r.GetVal(t => t.flOperationType),
                        r.GetVal(t => t.flOperationNumber),
                        r.GetVal(t => t.flInvokedAt),
                        new OpUser(r.GetVal(t => t.flInvokedByLogin), r.GetVal(t => t.flInvokedByXin), r.GetVal(t => t.flInvokedByName)),
                        r.GetVal(t => t.flInvokeIpAddress),
                        r.GetVal(t => t.flSummary),
                        JsonConvert.DeserializeObject<TModel>(r.GetVal(t => t.flOpModel))!
                    ))
            )
        );

        public static Task<GrantOpState<TModel>> Get(GrantOpId opId, IQueryExecuter queryExecuter, IMemoryCache memoryCache)
            => _stateGateway.Get(opId, queryExecuter, memoryCache);

        public GrantOpState<TModel> Save(ICurrentMomento momento, out StateChanges changes) {
            if (GrantId == null || OperationId == null || string.IsNullOrWhiteSpace(OpNumber) || InvokedBy == null || Model == null) {
                throw new InvalidOperationException("Запись операции заполнена не полностью");
            }

            var query = GrantsStore.Instance.TbOpState()
                .Insert()
                .SetT(t => t.flOperationId, OperationId.Id)
                .SetT(t => t.flGrantId, GrantId.Id)
                .SetT(t => t.flGrantRowVersion, GrantRowVersion)
                .SetT(t => t.flInvokedByXin, InvokedBy.Xin)
                .SetT(t => t.flInvokedByLogin, InvokedBy.Login)
                .SetT(t => t.flInvokedByName, InvokedBy.Name)
                .SetT(t => t.flOperationNumber, OpNumber)
                .SetT(t => t.flOperationType, OpType)
                .SetT(t => t.flSummary, Summary)
                .SetT(t => t.flOpModel, JsonConvert.SerializeObject(Model))
                .SetT(t => t.flInvokeIpAddress, InvokeIpAddress)
                .SetT(t => t.flInvokedAt, InvokedAt)
                .SetT(t => t.flMomento, momento.Now)
                .Query();

            changes = new StateChanges(memCache => _stateGateway.UpdateCacheWithNewerState(memCache, this), query);
            return this;
        }
    }
}
