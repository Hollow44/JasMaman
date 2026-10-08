using JasMaman.Modules.Common;
using YodaQuery;

namespace JasMaman.Modules.Catalogs.DataSchema {
    public class CatalogsStore {
        public static readonly CatalogsStore Instance = new();
        private CatalogsStore() { }

        public string DbKey => DbKeys.DbJasMaman;

        public TbUniversity TbUniversity() => new(DbKey);
        public TbSpeciality TbSpeciality() => new(DbKey);

        public QueryTable[] DataSchema() => new QueryTable[] {
            TbUniversity(),
            TbSpeciality(),
        };
    }
}
