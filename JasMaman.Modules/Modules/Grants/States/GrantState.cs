using System.Collections.Immutable;
using JasMaman.Modules.Grants.Logic;
using JasMaman.Modules.Grants.QueryTables;
using Microsoft.Extensions.Caching.Memory;
using OpPatternAbstractions.Op;
using YodaApp;
using YodaQuery;

namespace JasMaman.Modules.Grants.States {
    public record GrantId(long Id);

    /// <summary>
    /// Агрегат «Грант»: молодой специалист × уровень образования, от поступления до закрытия обязательства.
    /// Неизменяем: операции получают новый экземпляр через with и сохраняют его <see cref="Save"/>.
    /// </summary>
    public record GrantState(
        GrantId GrantId,
        long? LegacyStudyId,
        long? LegacyPersonId,
        GrantPerson Person,
        GrantStudy Study,
        GrantObligation? Obligation,
        ImmutableArray<GrantAssignment> Assignments,
        ImmutableArray<GrantWorkPeriod> WorkPeriods,
        ImmutableArray<GrantDeferral> Deferrals,
        ImmutableArray<GrantPayment> Payments,
        ImmutableArray<GrantNote> Notes,
        DateTime CreatedAt,
        int? BaseRowVersion,
        DateTime? Momento
    ) {
        public bool IsEmpty => BaseRowVersion == null;

        public static GrantState New(GrantId grantId, GrantPerson person, GrantStudy study, DateTime createdAt) => new(
            grantId,
            LegacyStudyId: null,
            LegacyPersonId: null,
            person,
            study,
            Obligation: null,
            ImmutableArray<GrantAssignment>.Empty,
            ImmutableArray<GrantWorkPeriod>.Empty,
            ImmutableArray<GrantDeferral>.Empty,
            ImmutableArray<GrantPayment>.Empty,
            ImmutableArray<GrantNote>.Empty,
            createdAt,
            BaseRowVersion: null,
            Momento: null
        );

        /// <summary>Нормализует массивы после десериализации (null → пустые).</summary>
        public GrantState Normalize() => this with {
            Assignments = Assignments.Safe(),
            WorkPeriods = WorkPeriods.Safe(),
            Deferrals = Deferrals.Safe(),
            Payments = Payments.Safe(),
            Notes = Notes.Safe(),
        };

        private static readonly StateCacheGateway<GrantState, GrantId> _stateGateway = new(
            "GrantState",
            getNewerState: x => (x.state1.BaseRowVersion ?? 0) > (x.state2.BaseRowVersion ?? 0) ? x.state1 : x.state2,
            getStateKey: x => x.GrantId,
            convertKeyToString: key => key.Id.ToString(),
            loadState: val => Task.FromResult(
                GrantsStore.Instance.TbState()
                    .AddFilter(t => t.flGrantId, val.key.Id)
                    .SelectFirst(t => t.Fields.ToAliases(), val.queryExecuter)
                    .Transform(r => r.GetVal(t => t.flGrantState).Normalize())
            )
        );

        public static Task<GrantState> Get(GrantId grantId, IQueryExecuter queryExecuter, IMemoryCache memoryCache)
            => _stateGateway.Get(grantId, queryExecuter, memoryCache);

        /// <summary>Как <see cref="Get"/>, но null для несуществующего гранта (Get в этом случае бросает исключение).</summary>
        public static async Task<GrantState?> TryGet(GrantId grantId, IQueryExecuter queryExecuter, IMemoryCache memoryCache)
            => grantId.Id > 0 && GrantsStore.Instance.TbState().AddFilter(t => t.flGrantId, grantId.Id).Count(queryExecuter) > 0
                ? await Get(grantId, queryExecuter, memoryCache)
                : null;

        public static long? FindByLegacyStudyId(long legacyStudyId, IQueryExecuter queryExecuter)
            => GrantsStore.Instance.TbState()
                .AddFilter(t => t.flLegacyStudyId, legacyStudyId)
                .SelectScalar(t => t.flGrantId, queryExecuter) is { } id ? Convert.ToInt64(id) : null;

        private void EnsureValid() {
            if (GrantId == null || GrantId.Id == 0) {
                throw new InvalidStateException($"'{nameof(GrantId)}' cannot be empty");
            }
            if (!GrantRules.IsValidIin(Person?.Iin)) {
                throw new InvalidStateException("ИИН должен состоять из 12 цифр");
            }
            if (string.IsNullOrWhiteSpace(Person!.LastName)) {
                throw new InvalidStateException("Фамилия не может быть пустой");
            }
            if (Study == null) {
                throw new InvalidStateException($"'{nameof(Study)}' cannot be empty");
            }
        }

        public GrantState Save(ICurrentMomento currentMomento, out StateChanges changes) {
            EnsureValid();

            var isNew = BaseRowVersion == null;
            var newerState = Normalize() with {
                BaseRowVersion = (BaseRowVersion ?? 0) + 1,
                Momento = currentMomento.Now
            };

            var today = currentMomento.Now.Date;
            var lastAssignment = newerState.Assignments.OrderBy(a => a.CreatedAt).LastOrDefault();
            // незавершённая отсрочка (в т.ч. уже истёкшая — её закроет DeferralControlJob)
            var openDeferral = newerState.Deferrals.Where(d => d.EndedAt == null && d.Until != null).OrderByDescending(d => d.Until).FirstOrDefault();

            var query = GrantsStore.Instance.TbState()
                .Transform(t => isNew switch {
                    true => t
                        .Insert()
                        .SetT(t => t.flGrantId, newerState.GrantId.Id)
                        .SetT(t => t.flRowVersion, newerState.BaseRowVersion.Value)
                        .Set(t => t.flPrevRowVersion, 0),
                    false => t
                        .AddFilter(t => t.flGrantId, newerState.GrantId.Id)
                        .Update()
                        .SetT(t => t.flRowVersion, newerState.BaseRowVersion.Value)
                        .Set(t => t.flPrevRowVersion, new SqlQueryExp("flPrevRowVersion + 1"))
                })
                .SetT(t => t.flLegacyStudyId, newerState.LegacyStudyId)
                .SetT(t => t.flLegacyPersonId, newerState.LegacyPersonId)
                .SetT(t => t.flIin, newerState.Person.Iin)
                .SetT(t => t.flFullName, newerState.Person.FullName)
                .SetT(t => t.flUniversityId, newerState.Study.UniversityId)
                .SetT(t => t.flUniversityBin, newerState.Study.UniversityBin)
                .SetT(t => t.flUniversityName, newerState.Study.UniversityName)
                .SetT(t => t.flSpecialityId, newerState.Study.SpecialityId)
                .SetT(t => t.flSpecialityName, newerState.Study.SpecialityName)
                .SetT(t => t.flGrantCategory, newerState.Study.GrantCategory)
                .SetT(t => t.flEducationLevel, newerState.Study.EducationLevel)
                .SetT(t => t.flMovement, newerState.Study.Movement)
                .SetT(t => t.flGraduationYear, newerState.Study.GraduationYear)
                .SetT(t => t.flStage, GrantRules.DeriveStage(newerState))
                .SetT(t => t.flMonitoringStatus, newerState.Obligation?.MonitoringStatus)
                .SetT(t => t.flRecoveryStatus, newerState.Obligation?.RecoveryStatus)
                .SetT(t => t.flWorkedMonths, newerState.Obligation == null ? null : GrantRules.TotalWorkedMonths(newerState, today))
                .SetT(t => t.flRequiredMonths, newerState.Obligation?.RequiredMonths)
                .SetT(t => t.flDebtBalance, GrantRules.DebtBalance(newerState))
                .SetT(t => t.flArrivalDeadline, GrantRules.ArrivalDeadline(newerState))
                .SetT(t => t.flDeferralUntil, openDeferral?.Until)
                .SetT(t => t.flEmployerBin, newerState.WorkPeriods.OrderBy(w => w.From).LastOrDefault()?.EmployerBin ?? lastAssignment?.EmployerBin)
                .SetT(t => t.flGrantState, newerState)
                .SetT(t => t.flCreatedAt, newerState.CreatedAt)
                .SetT(t => t.flMomento, newerState.Momento)
                .Query();

            changes = new StateChanges(memCache => _stateGateway.UpdateCacheWithNewerState(memCache, newerState), query);
            return newerState;
        }
    }
}
