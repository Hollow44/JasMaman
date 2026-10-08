using System.Net;
using JasMaman.Modules.Grants.States;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using YodaApp.Yoda.Application.Helpers;
using YodaApp.Yoda.Application.IntegrationHub;
using static JasMaman.Modules.Grants.Ops.GrantOpRules;

namespace JasMaman.Modules.Grants.Ops {
    /// <summary>Данные персоны из ГБД ФЛ (заполняются при открытии мастера, пользователь только подтверждает).</summary>
    public record SyncPersonModel(string? LastName, string? FirstName, string? MiddleName, DateTime? BirthDate, string? Address, string? Error);

    /// <summary>
    /// «Проверка ГБД ФЛ»: актуализация ФИО, даты рождения и адреса прописки
    /// (адрес нужен для уведомлений гибридной почтой — БП 3.4).
    /// </summary>
    public class SyncPersonOp : GrantOpDefinition<SyncPersonModel> {
        public override GrantOpType OpType => GrantOpType.SyncPerson;
        protected override bool HasEditableForm => false;

        public override (bool ok, string? error) CheckAvailable(GrantState? state, GrantOpUserContext user)
            => Check(Exists(state), Visible(state, user), Actor(user, GrantActor.Monitoring | GrantActor.Legal));

        public override IEnumerable<string> Validate(GrantState? state, SyncPersonModel model, DateTime today) {
            if (model.Error != null) {
                yield return model.Error;
            }
            if (string.IsNullOrWhiteSpace(model.LastName)) {
                yield return "ГБД ФЛ не вернула фамилию";
            }
        }

        public override GrantState Apply(GrantState? state, SyncPersonModel model, GrantOpApplyContext ctx)
            => state! with {
                Person = state.Person with {
                    LastName = model.LastName!,
                    FirstName = model.FirstName ?? state.Person.FirstName,
                    MiddleName = model.MiddleName,
                    BirthDate = model.BirthDate ?? state.Person.BirthDate,
                    Address = model.Address ?? state.Person.Address,
                },
            };

        public override string Summarize(SyncPersonModel model) => "Данные актуализированы по ГБД ФЛ";

        public override SyncPersonModel EmptyModel(GrantState? state) => new(null, null, null, null, null, "Данные ГБД ФЛ не получены");

        public override async Task<SyncPersonModel> EmptyModelAsync(GrantState? state, IYodaRequestContext context) {
            if (state == null) {
                return EmptyModel(state);
            }
            try {
                var services = context.AppEnv.ServiceProvider;
                var hub = await services.GetRequiredService<IIntegrationHubClientFactory>().CreateClientAsync();
                var gbdFl = await hub.GetGbdFlInfoAsync(state.Person.Iin);
                if (!gbdFl.IsPersonFounded || gbdFl.Person == null) {
                    return EmptyModel(state) with { Error = "Физическое лицо по ИИН не найдено в ГБД ФЛ" };
                }

                string? address = null;
                try {
                    var refsApiUrl = services.GetRequiredService<IConfiguration>()["refsApiUrl"];
                    var found = await gbdFl.TryGetArFullAddressAsync(refsApiUrl);
                    address = found.Match(a => a.FullAddressRu, _ => (string?)null);
                } catch {
                    // адрес необязателен: ФИО и дата рождения нужны в любом случае
                }

                var person = gbdFl.Person;
                return new SyncPersonModel(
                    person.Surname?.Trim(),
                    person.Name?.Trim(),
                    string.IsNullOrWhiteSpace(person.Patronymic) ? null : person.Patronymic.Trim(),
                    person.BirthDate is { } birth && birth > DateTime.MinValue ? birth : null,
                    address,
                    null
                );
            } catch (Exception ex) {
                return EmptyModel(state) with { Error = "Не удалось получить данные из ГБД ФЛ: " + ex.Message };
            }
        }

        public override void RenderForm(WidgetBase panel, FormEnvironment env, GrantState? state, SyncPersonModel model, bool readOnly) {
            string e(object? v) => WebUtility.HtmlEncode(v?.ToString() ?? "—");
            var html = model.Error != null
                ? $"<div class=\"alert alert-warning\">{e(model.Error)}</div>"
                : "<table class=\"table table-sm\"><thead><tr><th></th><th>Сейчас</th><th>ГБД ФЛ</th></tr></thead><tbody>"
                    + $"<tr><td>Фамилия</td><td>{e(state?.Person.LastName)}</td><td>{e(model.LastName)}</td></tr>"
                    + $"<tr><td>Имя</td><td>{e(state?.Person.FirstName)}</td><td>{e(model.FirstName)}</td></tr>"
                    + $"<tr><td>Отчество</td><td>{e(state?.Person.MiddleName)}</td><td>{e(model.MiddleName)}</td></tr>"
                    + $"<tr><td>Дата рождения</td><td>{e(state?.Person.BirthDate?.ToString("dd.MM.yyyy"))}</td><td>{e(model.BirthDate?.ToString("dd.MM.yyyy"))}</td></tr>"
                    + $"<tr><td>Адрес прописки</td><td>{e(state?.Person.Address)}</td><td>{e(model.Address)}</td></tr>"
                    + "</tbody></table>";
            panel.Append(new HtmlTextV2(html, HtmlTextV2.HtmlSecurity.МойHtmlЗащищенОтCrossSiteScripting));
        }

        public override SyncPersonModel ReadForm(FormEnvironment env, GrantState? state) => throw new NotSupportedException();
    }
}
