using JasMaman.Modules.Catalogs.DataSchema;
using Yoda.Interfaces.Forms;
using Yoda.Interfaces.Forms.Components;
using Yoda.Interfaces.Menu;
using YodaApp.UiSearch;
using YodaQuery;

namespace JasMaman.Modules.Catalogs.Menus {
    public class MnuUniversityList : FrmMenu {
        public MnuUniversityList(string menuName) : base(menuName, "Организации образования") {
            OnRendering(re => {
                CatalogsStore.Instance.TbUniversity()
                    .Order(t => t.flNameRu)
                    .Search(search => search
                        .Filtering(filter => filter
                            .AddField(t => t.flBin)
                            .AddField(t => t.flNameRu)
                            .AddField(t => t.flRegion)
                            .AddField(t => t.flIsCollege)
                            .AddField(t => t.flHasYoungSpecialists)
                            .AddField(t => t.flIsActive)
                        )
                        .TablePresentation(
                            t => new FieldAlias[] {
                                t.flUniversityId, t.flBin, t.flNameRu, t.flNameKz, t.flRegion,
                                t.flIsCollege, t.flHasYoungSpecialists, t.flIsActive,
                            },
                            t => new[] {
                                t.Column(t => t.flBin),
                                t.Column(t => re.RequestContext.Language == "kz" ? t.flNameKz : t.flNameRu),
                                t.Column(t => t.flRegion),
                                t.Column(t => t.flIsCollege),
                                t.Column(t => t.flHasYoungSpecialists),
                                t.Column(t => t.flIsActive),
                            }
                        )
                        .ExcelPresentation(
                            t => new FieldAlias[] { t.flUniversityId, t.flBin, t.flNameRu, t.flNameKz, t.flRegion, t.flIsCollege, t.flIsActive },
                            t => new[] {
                                t.ExcelColumn(t => t.flUniversityId, width: 14),
                                t.ExcelColumn(t => t.flBin, width: 14),
                                t.ExcelColumn(t => t.flNameRu, width: 60),
                                t.ExcelColumn(t => t.flNameKz, width: 60),
                                t.ExcelColumn(t => t.flRegion, width: 30),
                                t.ExcelColumn(t => t.flIsCollege, width: 10),
                                t.ExcelColumn(t => t.flIsActive, width: 10),
                            }
                        )
                    )
                    .Print(re.Form, re.AsFormEnv(), re.Form);
            });
        }
    }

    public class MnuSpecialityList : FrmMenu {
        public MnuSpecialityList(string menuName) : base(menuName, "Специальности") {
            OnRendering(re => {
                CatalogsStore.Instance.TbSpeciality()
                    .Order(t => t.flCode)
                    .Search(search => search
                        .Filtering(filter => filter
                            .AddField(t => t.flCode)
                            .AddField(t => t.flNameRu)
                            .AddField(t => t.flIsYoungSpecialist)
                        )
                        .TablePresentation(
                            t => new FieldAlias[] { t.flSpecialityId, t.flCode, t.flNameRu, t.flNameKz, t.flStudyYears, t.flIsYoungSpecialist },
                            t => new[] {
                                t.Column(t => t.flCode),
                                t.Column(t => re.RequestContext.Language == "kz" ? t.flNameKz : t.flNameRu),
                                t.Column(t => t.flStudyYears),
                                t.Column(t => t.flIsYoungSpecialist),
                            }
                        )
                        .ExcelPresentation(
                            t => new FieldAlias[] { t.flSpecialityId, t.flCode, t.flNameRu, t.flNameKz, t.flStudyYears },
                            t => new[] {
                                t.ExcelColumn(t => t.flSpecialityId, width: 14),
                                t.ExcelColumn(t => t.flCode, width: 16),
                                t.ExcelColumn(t => t.flNameRu, width: 60),
                                t.ExcelColumn(t => t.flNameKz, width: 60),
                                t.ExcelColumn(t => t.flStudyYears, width: 10),
                            }
                        )
                    )
                    .Print(re.Form, re.AsFormEnv(), re.Form);
            });
        }
    }
}
