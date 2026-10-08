using Humanizer;
using Microsoft.AspNetCore.Html;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Newtonsoft.Json;
using Notifications.Models.Notifications;
using Yoda.Interfaces.Forms;
using Yoda.Interfaces.Forms.Components;
using Yoda.Interfaces.Menu;
using YodaApp.Yoda.Application.Notifications;
using YodaHelpers.ActionMenus;
using Yoda.Interfaces;
using Yoda.Application;
using System.Threading.Tasks;
using System.Collections.Generic;
using YodaQuery;
using System;

namespace Yoda.Controllers {
    [DefaultProject("systemProject")]
    public class NotificationModule : YodaModule {
        public override string Text {
            get { return "Конфигурационный модуль уведомлений."; }
        }

        public override MenuLink[] Menu() {
            return new MenuLink[] {
                new MnuGetUserNotifications()
                    .Path("get-notifications")
                    .ProjectsConfig("cabinet"),

                new MnuUserNotifications(nameof(NotificationModule), "Уведомления")
                    .ProjectsConfig("cabinet")
                    .Path("notifications/{MenuAction}"),
            };
        }
    }

    #region menus
    public class MnuUserNotifications : MnuActionsExt<UserNotificationsArgs> {
        public MnuUserNotifications(string moduleName, string text) : base(moduleName, nameof(MnuUserNotifications), text) {
            AsCallback();
        }

        public override void Configure(ActionConfig<UserNotificationsArgs> config) {
            config
            #region view-all
                .OnAction(UserNotificationsActions.ViewAll, action => action
                    .IsValid(e => {
                        if (e.User.IsAuthentificated) {
                            return new YodaHelpers.ActionMenus.OkResult();
                        }
                        return new AccessDeniedResult();
                    })
                    .OnRendering(e => {
                        var userLogin = e.User.Name;
                        var apiClient = e.RequestContext.AppEnv.ServiceProvider.GetRequiredService<INotificationsApiClientFactory>().CreateClient().Result;
                        var lastNotifications = apiClient.GetLastsAsync(userLogin).Result.ToArray();
                        var unreadedNotificationIds = apiClient.GetUnReadAsync(userLogin).Result.ToArray();

                        e.Form.AddComponent(new NotificationListComponent(lastNotifications.Where(x => !x.IsPrivate).Select(x => new NotificationListComponent.Notification(
                                  x.Id.ToString(),
                                  new NotificationListComponent.Channel(x.Channel.Id, x.Channel.PrettyName),
                                  unreadedNotificationIds.All(unread => unread.NotificationId != x.Id),
                                  new NotificationListComponent.Message(x.Msg.Title, x.Msg.Body, x.Msg.Tags.ToArray()),
                                  x.TimeStamp.ToString("yyyy-MM-ddTHH:mm:ss"),
                                  x.TimeStamp.Humanize(utcDate: x.TimeStamp.Kind == DateTimeKind.Utc)
                              )).ToArray(),
                            new NotificationListComponent.HowToLoadOldesInfo(e.RequestContext.GetUrlHelper().YodaAction(ModuleName, nameof(MnuGetUserNotifications)), 10),
                            e.RequestContext.GetUrlHelper().YodaAction(ModuleName, MenuName, new UserNotificationsArgs() { MenuAction = UserNotificationsActions.MarkAsRead })
                        ));
                    })
                )
            #endregion

            #region MarkAsRead
                .OnAction(UserNotificationsActions.MarkAsRead, action => action
                    .IsValid(e => {
                        if (e.User.IsAuthentificated) {
                            return new YodaHelpers.ActionMenus.OkResult();
                        }
                        return new AccessDeniedResult();
                    })
                    .OnRendering(e => {
                        e.Form.IsAjaxForm = true;
                        var userLogin = e.User.Name;
                        var apiClient = e.RequestContext.AppEnv.ServiceProvider.GetRequiredService<INotificationsApiClientFactory>().CreateClient().Result;
                        var readedNotificationId = e.Args.NotificationId;
                        apiClient.MarkAsWasReadAsync(userLogin, new[] { new Guid(readedNotificationId) }).Wait();
                        e.Redirect.SetRedirectToJson(new JsonResult(new { success = true }));
                    })
                );
            #endregion

        }

        public class UserNotificationsActions {
            public const string
               MarkAsRead = "mark-as-read",
               ViewAll = "view-all";
        }

    }
    public class UserNotificationsArgs : ActionQueryArgsBase {
        public string NotificationId { get; set; }
    }

    public class MnuGetUserNotifications : FrmMenu<MnuGetUserNotificationsArgs> {
        public MnuGetUserNotifications() : base(nameof(MnuGetUserNotifications), "Подгрузка новых уведомлений") {
            AsCallback();
            AccessCheck((args, context) => {
                if (context.User.IsAuthentificated) {
                    return new AccessCheckResult() { HasAccess = true };
                }
                return new AccessCheckResult() { HasAccess = false };
            });
            OnRendering(async re => {
                re.Form.IsAjaxForm = true;

                var from = string.IsNullOrEmpty(re.Args.FromDateStrInIso8601) ? DateTime.Now : DateTime.ParseExact(re.Args.FromDateStrInIso8601, "yyyy-MM-ddTHH:mm:ss", CultureInfo.InvariantCulture);
                var count = re.Args.Count;

                var userLogin = re.User.Name;
                var apiClient = await re.RequestContext.AppEnv.ServiceProvider.GetRequiredService<INotificationsApiClientFactory>().CreateClient();
                var unreadedNotificationIds = await apiClient.GetUnReadAsync(userLogin);

                var notifications = (await apiClient.GetAsync(userLogin, from, DateVector.Before, count, true));

                var notifications2render = notifications.Where(x => !x.IsPrivate).Select(x => new NotificationListComponent.Notification(
                    x.Id.ToString(),
                    new NotificationListComponent.Channel(x.Channel.Id, x.Channel.PrettyName),
                    unreadedNotificationIds.All(unread => unread.NotificationId != x.Id),
                    new NotificationListComponent.Message(x.Msg.Title, x.Msg.Body, x.Msg.Tags.ToArray()),
                    x.TimeStamp.ToString("yyyy-MM-ddTHH:mm:ss"), //ISO 8601
                    x.TimeStamp.Humanize(utcDate: x.TimeStamp.Kind == DateTimeKind.Utc)
                )).ToArray();

                re.Redirect.SetRedirectToJson(new JsonResult(notifications2render));
            });
        }
    }
    public class MnuGetUserNotificationsArgs {
        public string FromDateStrInIso8601 { get; set; }
        public int Count { get; set; }
    }
    #endregion

    #region comonents
    public class NotificationListComponent : YodaFormElement {
        private Notification[] _initialNotifications;
        private HowToLoadOldesInfo _howToLoadOldesInfo;
        private string _urlToMarkAsRead;

        public NotificationListComponent(Notification[] initialNotifications, HowToLoadOldesInfo howToLoadOldesInfo, string urlToMarkAsRead) {
            _initialNotifications = initialNotifications;
            _howToLoadOldesInfo = howToLoadOldesInfo;
            _urlToMarkAsRead = urlToMarkAsRead;
        }

        public override string[] GetRequireUiPackages() {
            return new[] { "user-notifications-list" };
        }

        public override HtmlString ToHtmlString(IHtmlHelper html) {
            Panel panel = new Panel("user-notifications-list");
            panel.Attributes.Add("data-notifications", JsonConvert.SerializeObject(_initialNotifications));
            panel.Attributes.Add("data-url-to-load-oldest", _howToLoadOldesInfo.UrlToLoadOldest);
            panel.Attributes.Add("data-load-oldest-count", _howToLoadOldesInfo.Count);
            panel.Attributes.Add("data-url-to-mark-as-read", _urlToMarkAsRead);
            return panel.ToHtmlString(html);
        }

        public class HowToLoadOldesInfo {
            /// <summary>
            /// ссылка на подгрузку старых уведомлений
            /// </summary>
            public string UrlToLoadOldest { get; }
            /// <summary>
            /// Количество подгружаемых старых уведомлений при достижении конца списка
            /// </summary>
            public int Count { get; }

            public HowToLoadOldesInfo(string urlToLoadOldest, int count) {
                UrlToLoadOldest = urlToLoadOldest;
                Count = count;
            }
        }

        public class Notification {
            public Notification(string id, Channel channel, bool isReaded, Message msg, string timeStamp, string timeStampPrettyStr) {
                Id = id;
                Channel = channel;
                IsReaded = isReaded;
                Msg = msg;
                TimeStamp = timeStamp;
                TimeStampPrettyStr = timeStampPrettyStr;
            }

            public string Id { get; }
            public Channel Channel { get; }
            public bool IsReaded { get; }
            public Message Msg { get; }
            public string TimeStamp { get; }
            public string TimeStampPrettyStr { get; }
        }

        public class Message {
            public Message(string title, string body, string[] tags) {
                Title = title;
                Body = body;
                Tags = tags;
            }

            public string Title { get; }
            public string Body { get; }
            public string[] Tags { get; }
        }

        public class Channel {
            public Channel(string id, string prettyName) {
                Id = id;
                PrettyName = prettyName;
            }

            public string Id { get; }
            public string PrettyName { get; }
        }
    }
    #endregion
}