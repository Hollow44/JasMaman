using JasMaman.Modules.Common;
using YodaQuery;

namespace JasMaman.Modules.Grants.QueryTables {
    public class GrantsStore {
        public static readonly GrantsStore Instance = new();
        private GrantsStore() { }

        public string DbKey => DbKeys.DbJasMaman;

        public TbGrantState TbState() => new(DbKey);
        public TbGrantOpState TbOpState() => new(DbKey);

        public QueryTable[] DataSchema() => new QueryTable[] {
            TbState(),
            TbOpState(),
        };
    }
}
