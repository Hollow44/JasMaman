using Yoda.YodaReferences;
using YodaApp.UiSearch;

namespace JasMaman.Modules.References {
    /// <summary>Признак «да/нет» для полей, по которым нужен фильтр в поиске (BooleanField фильтры не поддерживают).</summary>
    [Newtonsoft.Json.JsonConverter(typeof(Newtonsoft.Json.Converters.StringEnumConverter))]
    public enum YesNo {
        Yes,
        No
    }

    public static class YesNoExtensions {
        public static readonly Dictionary<YesNo, (string text, BootstrapColor color)> Options = new() {
            [YesNo.Yes] = ("Да", BootstrapColor.Success),
            [YesNo.No] = ("Нет", BootstrapColor.Secondary),
        };
        public static string ToDisplayText(this YesNo yesNo) => Options[yesNo].text;
        public static BootstrapColor ToBootstrapColor(this YesNo yesNo) => Options[yesNo].color;
        public static YesNo ToYesNo(this bool value) => value ? YesNo.Yes : YesNo.No;
    }

    public class RfcYesNo : ReferenceEnum<YesNo> {
        public const string RefName = nameof(RfcYesNo);
        private static readonly Dictionary<YesNo, string> _options = YesNoExtensions.Options.ToDictionary(x => x.Key, x => x.Value.text);
        public RfcYesNo() : base(RefName, "Да/нет", _options) { }
    }
}
