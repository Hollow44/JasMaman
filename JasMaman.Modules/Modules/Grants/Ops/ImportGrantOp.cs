using System.Collections.Immutable;
using JasMaman.Modules.Grants.States;
using Newtonsoft.Json;
using Yoda.Interfaces.Forms;
using Yoda.Interfaces.Forms.Components;

namespace JasMaman.Modules.Grants.Ops {
    /// <summary>
    /// Модель переноса из УМОСК. В журнал пишутся только legacy-идентификаторы:
    /// состояние целиком уже лежит в самом гранте, дублировать его в журнале незачем.
    /// </summary>
    public record ImportGrantModel(
        long LegacyStudyId,
        long? LegacyPersonId,
        [property: JsonIgnore] GrantState? Snapshot
    );

    /// <summary>Создание/обновление гранта по данным fin_center. Только системный пользователь (задание миграции).</summary>
    public class ImportGrantOp : GrantOpDefinition<ImportGrantModel> {
        public override GrantOpType OpType => GrantOpType.Import;
        public override bool AvailableInUi => false;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => user.Is(GrantActor.System) ? Ok() : Deny("Перенос выполняет только системное задание миграции");

        public override IEnumerable<string> Validate(GrantState? state, ImportGrantModel model, DateTime today) {
            if (model.Snapshot == null) {
                yield return "Нет данных для переноса";
            }
        }

        /// <summary>
        /// Повторный перенос обновляет данные из УМОСК, но сохраняет то, что уже сделано в Jas Maman:
        /// грант создаётся заново только если его ещё нет.
        /// </summary>
        public override GrantState Apply(GrantState? state, ImportGrantModel model, GrantOpApplyContext ctx) {
            var snapshot = model.Snapshot!;
            if (state == null || state.IsEmpty) {
                return snapshot with { GrantId = new GrantId(ctx.NextId()), CreatedAt = ctx.Now, BaseRowVersion = null, Momento = null };
            }
            return state with {
                Person = snapshot.Person,
                Study = snapshot.Study,
                Obligation = snapshot.Obligation,
                Assignments = merge(state.Assignments, snapshot.Assignments, a => a.AssignmentId),
                WorkPeriods = merge(state.WorkPeriods, snapshot.WorkPeriods, w => w.WorkPeriodId),
                Deferrals = merge(state.Deferrals, snapshot.Deferrals, d => d.DeferralId),
                Payments = merge(state.Payments, snapshot.Payments, p => p.PaymentId),
            };
        }

        /// <summary>Legacy-записи заменяются свежими (по id), добавленные в Jas Maman — сохраняются.</summary>
        private static ImmutableArray<T> merge<T>(ImmutableArray<T> current, ImmutableArray<T> fromLegacy, Func<T, long> id) {
            var legacyIds = fromLegacy.Safe().Select(id).ToHashSet();
            return current.Safe().Where(x => !legacyIds.Contains(id(x))).Concat(fromLegacy.Safe()).ToImmutableArray();
        }

        public override string Summarize(ImportGrantModel model) => $"Перенос из УМОСК (обучение #{model.LegacyStudyId})";

        public override ImportGrantModel EmptyModel(GrantState? state) => new(0, null, null);

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, ImportGrantModel model, bool readOnly)
            => panel.Append(new Label($"Перенесено из УМОСК: запись обучения #{model.LegacyStudyId}, персона #{model.LegacyPersonId}"));

        public override ImportGrantModel ReadForm(FormEnvironment env, GrantState? state) => throw new NotSupportedException();
    }
}
