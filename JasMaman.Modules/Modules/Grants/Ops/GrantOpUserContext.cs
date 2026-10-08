using JasMaman.Modules.Common;
using JasMaman.Modules.Grants.States;
using Microsoft.Extensions.Caching.Memory;
using UsersResources;
using Yoda.Interfaces;

namespace JasMaman.Modules.Grants.Ops {
    /// <summary>Участник БП, от имени которого выполняется операция.</summary>
    [Flags]
    public enum GrantActor {
        None = 0,
        University = 1,
        Monitoring = 2,
        MonitoringHead = 4,
        Legal = 8,
        Accounting = 16,
        Moderator = 32,
        System = 64,
    }

    public class GrantOpUserContext {
        public static readonly GrantOpUserContext System = new(-2, "system", "system", "Система", GrantActor.System, isAuthenticated: true);

        public GrantOpUserContext(int userId, string login, string xin, string name, GrantActor actors, bool isAuthenticated) {
            UserId = userId;
            Login = login;
            Xin = xin;
            Name = name;
            Actors = actors;
            IsAuthenticated = isAuthenticated;
        }

        public int UserId { get; }
        public string Login { get; }
        /// <summary>ИИН пользователя или БИН организации (для сотрудников вуза).</summary>
        public string Xin { get; }
        public string Name { get; }
        public GrantActor Actors { get; }
        public bool IsAuthenticated { get; }

        /// <summary>Модератор и системный пользователь могут всё.</summary>
        public bool Is(GrantActor actors) => (Actors & (actors | GrantActor.Moderator | GrantActor.System)) != 0;

        /// <summary>Видит ли пользователь грант: сотрудники — все, вуз — только своих студентов.</summary>
        public bool CanSee(GrantState state)
            => Is(GrantActor.Monitoring | GrantActor.MonitoringHead | GrantActor.Legal | GrantActor.Accounting)
               || (Is(GrantActor.University) && OwnsUniversity(state.Study.UniversityBin));

        public bool OwnsUniversity(string? universityBin)
            => (Actors & GrantActor.University) != 0 && !string.IsNullOrEmpty(universityBin) && universityBin == Xin;

        public OpUser ToOpUser() => new(Login, Xin, Name);
    }

    public static class GrantOpUserContextExtensions {
        private static readonly MemoryCache _cache = new(new MemoryCacheOptions());

        public static GrantOpUserContext GetUserContextForGrantOp(this IYodaRequestContext context)
            => _cache.GetOrCreate($"GrantUser:{context.User.Name}", entry => {
                entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10);
                return build(context);
            })!;

        private static GrantOpUserContext build(IYodaRequestContext context) {
            if (!context.User.IsAuthentificated) {
                return new GrantOpUserContext(context.User.Id, "guest", "guest", "guest", GrantActor.None, isAuthenticated: false);
            }

            var qe = context.QueryExecuter;
            var actors = GrantActor.None;
            void add(string role, GrantActor actor) {
                if (context.User.HasRole(role, qe)) {
                    actors |= actor;
                }
            }
            add(Roles.Moderator, GrantActor.Moderator);
            add(Roles.Monitoring, GrantActor.Monitoring);
            add(Roles.MonitoringHead, GrantActor.MonitoringHead | GrantActor.Monitoring);
            add(Roles.Legal, GrantActor.Legal);
            add(Roles.Accounting, GrantActor.Accounting);
            add(Roles.University, GrantActor.University);

            return new GrantOpUserContext(
                context.User.Id,
                context.User.GetUserLogin(qe),
                context.User.GetUserXin(qe),
                context.User.GetUserFullName(qe),
                actors,
                isAuthenticated: true
            );
        }
    }
}
