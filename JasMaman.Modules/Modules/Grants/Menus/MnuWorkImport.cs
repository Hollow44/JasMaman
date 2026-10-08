using System.Net;
using System.Text;
using FileStoreInterfaces;
using JasMaman.Modules.Grants.Import;
using JasMaman.Modules.Grants.Ops;
using JasMaman.Modules.Grants.States;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.DependencyInjection;
using Yoda.Interfaces.Menu;
using YodaApp.Yoda.Interfaces;
using FileInfo = FileStoreInterfaces.FileInfo;

namespace JasMaman.Modules.Grants.Menus {
    public class WorkImportArgs {
        public string? ResultKey { get; set; }
    }

    /// <summary>
    /// Загрузка ответов МТСЗН / МИО / Карьерных центров (Excel) — массовое добавление периодов работы.
    /// Заменяет ручную построчную актуализацию по каждому МС (БП, раздел 3.2).
    /// </summary>
    public class MnuWorkImport : FrmMenu<WorkImportArgs> {
        public const string MnuName = nameof(MnuWorkImport);
        public const string FilesNamespace = "JasMaman:WorkConfirmations";

        private static FilesField fileField => new("flWorkImportFile", "Файл ответа (Excel .xlsx)", FilesNamespace,
            new FileUploadSettings { AllowedExtensions = new[] { "xlsx" }, RequireDescription = false, MaxFileSize = 1024L * 1024 * 30 });

        public MnuWorkImport() : base(MnuName, "Загрузка ответов о трудоустройстве") {
            AccessCheck((args, context) => new AccessCheckResult {
                HasAccess = context.User.IsAuthentificated && context.GetUserContextForGrantOp().Is(GrantActor.Monitoring)
            });

            OnRendering(re => {
                var env = re.AsFormEnv();
                if (re.Args.ResultKey != null && re.RequestContext.GetMemoryCache().TryGetValue<string>(re.Args.ResultKey, out var resultHtml)) {
                    re.Form.Append(new HtmlTextV2(resultHtml!, HtmlTextV2.HtmlSecurity.МойHtmlЗащищенОтCrossSiteScripting));
                }
                re.Form.Append(new HtmlTextV2(
                    "<div class=\"alert alert-info\">Файл Excel с колонками <b>ИИН</b>, <b>Дата начала</b> и, по возможности, <b>БИН</b>, "
                    + "<b>Работодатель</b>, <b>Должность</b>, <b>Дата окончания</b>. Заголовок ищется в первых 10 строках. "
                    + "Период добавляется к открытому обязательству по ИИН; повторная загрузка не создаёт дублей.</div>",
                    HtmlTextV2.HtmlSecurity.МойHtmlЗащищенОтCrossSiteScripting));
                GrantOpForm.Instance.flWorkSource.RenderT(re.Form, env, WorkConfirmationSource.Mtszn);
                fileField.RenderT(re.Form, env, Array.Empty<FileInfo>());
                re.Form.AddSubmitButton("Загрузить");
            });

            OnProcessing(async pe => {
                var env = pe.AsFormEnv();
                GrantOpForm.Instance.flWorkSource.ValidateT(env, o => o.Required());
                fileField.ValidateT(env, out var files, o => o.Required());
                if (!env.IsValid) {
                    return;
                }

                var context = pe.RequestContext;
                var bytes = await context.AppEnv.ServiceProvider.GetRequiredService<IFileManager>().ReadFileAsync(files!.First().FileId, pe.QueryExecuter);
                var parsed = WorkConfirmationParser.Parse(bytes);
                if (!parsed.Ok) {
                    env.AddError(fileField.FieldName, parsed.Error!);
                    return;
                }

                var lines = await WorkConfirmationImport.ApplyAsync(
                    parsed.Rows,
                    GrantOpForm.Instance.flWorkSource.GetValueOrNullT(env)!.Value,
                    context.GetUserContextForGrantOp(),
                    context.AppEnv.ServiceProvider.GetRequiredService<IUserIpAddressProvider>().GetUserIpAddress(),
                    pe.QueryExecuter,
                    context.GetMemoryCache());

                var key = $"WorkImport:{Guid.NewGuid():N}";
                context.GetMemoryCache().Set(key, renderResult(lines, context), TimeSpan.FromHours(1));
                pe.Redirect.SetRedirectToUrl(context.YodaActionUrl(GrantsModule.ModuleName, MnuName, new WorkImportArgs { ResultKey = key }));
                pe.SetPostbackMessage($"Обработано строк: {lines.Count}, добавлено: {lines.Count(l => l.Ok)}");
            });
        }

        private static string renderResult(IReadOnlyList<WorkImportLine> lines, IYodaRequestContext context) {
            var sb = new StringBuilder($"<div class=\"card mb-3\"><div class=\"card-body\"><h5 class=\"card-title\">Результат загрузки: успешно {lines.Count(l => l.Ok)} из {lines.Count}</h5>"
                + "<div class=\"table-responsive\"><table class=\"table table-sm\"><thead><tr><th>Строка</th><th>ИИН</th><th>Результат</th></tr></thead><tbody>");
            foreach (var line in lines.OrderBy(l => l.Ok).ThenBy(l => l.RowNumber)) {
                var iin = WebUtility.HtmlEncode(line.Iin);
                var cell = line.GrantId is { } id
                    ? $"<a href=\"{WebUtility.HtmlEncode(context.YodaActionUrl(GrantsModule.ModuleName, MnuGrantView.MnuName, new GrantViewQueryArgs { GrantId = id }))}\">{iin}</a>"
                    : iin;
                sb.Append($"<tr class=\"{(line.Ok ? "" : "table-warning")}\"><td>{line.RowNumber}</td><td>{cell}</td><td>{WebUtility.HtmlEncode(line.Result)}</td></tr>");
            }
            sb.Append("</tbody></table></div></div></div>");
            return sb.ToString();
        }
    }
}
