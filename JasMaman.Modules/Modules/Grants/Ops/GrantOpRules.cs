using JasMaman.Modules.Catalogs.DataSchema;
using JasMaman.Modules.Grants.Logic;
using JasMaman.Modules.Grants.QueryTables;
using JasMaman.Modules.Grants.States;
using JasMaman.Modules.References;
using YodaQuery;

namespace JasMaman.Modules.Grants.Ops {
    /// <summary>Общие проверки доступности операций.</summary>
    public static class GrantOpRules {
        public static (bool ok, string? error) Check(params (bool condition, string error)[] rules) {
            foreach (var (condition, error) in rules) {
                if (!condition) {
                    return (false, error);
                }
            }
            return (true, null);
        }

        public static (bool, string) Exists(GrantState? state) => (state != null && !state.IsEmpty, "Грантник не найден");
        public static (bool, string) Visible(GrantState? state, GrantOpUserContext user)
            => (state != null && user.CanSee(state), "Нет доступа к грантнику");
        public static (bool, string) Actor(GrantOpUserContext user, GrantActor actors)
            => (user.Is(actors), "Недостаточно прав для операции");
        public static (bool, string) HasObligation(GrantState? state)
            => (state?.Obligation != null, "Обязательство по отработке ещё не возникло (нет приказа об окончании)");
        public static (bool, string) ObligationOpen(GrantState? state)
            => (state != null && GrantRules.DeriveStage(state) == GrantStage.Obligation, "Обязательство закрыто");
        public static (bool, string) StillStudying(GrantState? state)
            => (state != null && state.Obligation == null, "Обучение завершено — изменение недоступно");

        /// <summary>Вузы работают только со своими студентами; сотрудники ФЦ — со всеми.</summary>
        public static (bool, string) UniversityOwnsOrStaff(GrantState? state, GrantOpUserContext user)
            => (user.Is(GrantActor.Monitoring | GrantActor.MonitoringHead) || (state != null && user.OwnsUniversity(state.Study.UniversityBin)),
                "Операция доступна только организации образования, где обучался грантник");
    }

    /// <summary>Поиск по справочникам (вузы, специальности) для форм операций.</summary>
    public static class CatalogLookup {
        public record UniversityRef(long Id, string Bin, string Name);
        public record SpecialityRef(long Id, string Code, string Name);

        public static UniversityRef? FindUniversity(string? bin, IQueryExecuter queryExecuter) {
            if (string.IsNullOrWhiteSpace(bin)) {
                return null;
            }
            return CatalogsStore.Instance.TbUniversity()
                .AddFilter(t => t.flBin, bin.Trim())
                .SelectFirstOrDefault(t => new FieldAlias[] { t.flUniversityId, t.flBin, t.flNameRu }, queryExecuter)
                .Transform(r => !r.IsFirstRowExists ? null : new UniversityRef(r.GetVal(t => t.flUniversityId), r.GetVal(t => t.flBin), r.GetVal(t => t.flNameRu)));
        }

        public static SpecialityRef? FindSpeciality(string? code, IQueryExecuter queryExecuter) {
            if (string.IsNullOrWhiteSpace(code)) {
                return null;
            }
            return CatalogsStore.Instance.TbSpeciality()
                .AddFilter(t => t.flCode, code.Trim())
                .SelectFirstOrDefault(t => new FieldAlias[] { t.flSpecialityId, t.flCode, t.flNameRu }, queryExecuter)
                .Transform(r => !r.IsFirstRowExists ? null : new SpecialityRef(r.GetVal(t => t.flSpecialityId), r.GetVal(t => t.flCode), r.GetVal(t => t.flNameRu)));
        }

        /// <summary>Есть ли у ИИН незакрытый грант на том же уровне образования (защита от дублей).</summary>
        public static bool HasOpenGrant(string iin, EducationLevel level, IQueryExecuter queryExecuter)
            => GrantsStore.Instance.TbState()
                .AddFilter(t => t.flIin, iin)
                .AddFilter(t => t.flEducationLevel, level)
                .AddFilter(t => t.flStage, new[] { GrantStage.Studying, GrantStage.ExpectedGraduation, GrantStage.Obligation })
                .Count(queryExecuter) > 0;
    }
}
