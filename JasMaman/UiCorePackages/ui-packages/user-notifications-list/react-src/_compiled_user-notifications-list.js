var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var UserNotificationList = function (_React$Component) {
    _inherits(UserNotificationList, _React$Component);

    function UserNotificationList(props) {
        _classCallCheck(this, UserNotificationList);

        var _this = _possibleConstructorReturn(this, (UserNotificationList.__proto__ || Object.getPrototypeOf(UserNotificationList)).call(this, props));

        _this.state = {
            notifications: props.notifications,
            currentNotification: null,
            notificationBellBadge: null
        };
        _this.loadMoreIfNeed = _this.loadMoreIfNeed.bind(_this);
        _this.loadMore = _this.loadMore.bind(_this);
        _this.handleNotificationClick = _this.handleNotificationClick.bind(_this);
        return _this;
    }

    _createClass(UserNotificationList, [{
        key: 'componentWillMount',
        value: function componentWillMount() {
            window.addEventListener('scroll', this.loadMoreIfNeed);
            this.loadMore();
            this.notificationBellBadge = $("#notification-bell-badge");
        }
    }, {
        key: 'componentWillUnmount',
        value: function componentWillUnmount() {
            window.removeEventListener('scroll', this.loadMoreIfNeed);
        }
    }, {
        key: 'loadMoreIfNeed',
        value: function loadMoreIfNeed() {
            if (window.innerHeight + document.documentElement.scrollTop === document.scrollingElement.scrollHeight) {
                this.loadMore();
            }
        }
    }, {
        key: 'loadMore',
        value: function loadMore() {
            var _this2 = this;

            var lastTimeStamp = this.state.notifications.length > 0 ? this.state.notifications[this.state.notifications.length - 1].TimeStamp : null;

            var searchParams = new URLSearchParams();
            searchParams.append("FromDateStrInIso8601", lastTimeStamp);
            searchParams.append("Count", this.props.loadOldestCount);
            searchParams.toString();

            $.get(this.props.urlToLoadOldest + "/?" + searchParams.toString(), function (newLoadednotifications) {
                _this2.setState(function (prevState) {
                    return {
                        notifications: prevState.notifications.concat(newLoadednotifications)
                    };
                });
            });
        }
    }, {
        key: 'handleNotificationClick',
        value: function handleNotificationClick(notification) {
            //меняем знаяение не прчитаггых собщений возле колокольчика
            if (!notification.IsReaded) {
                var newUnreadNotificationsCount = parseInt(this.notificationBellBadge.text()) + 0 - 1;
                if (newUnreadNotificationsCount > 0) {
                    this.notificationBellBadge.text(newUnreadNotificationsCount);
                } else {
                    this.notificationBellBadge.text("");
                }
            }

            var searchParams = new URLSearchParams();
            searchParams.append("NotificationId", notification.Id);
            searchParams.toString();

            //асинхронный запрос на отметку данного уведомления как 'прочитанно'
            $.get(this.props.urlToMarkAsRead + "/?" + searchParams.toString());

            //обновляем ui
            var index = this.state.notifications.findIndex(function (x) {
                return x.Id === notification.Id;
            });
            var updatedNotification = Object.assign({}, this.state.notifications[index]);
            updatedNotification.IsReaded = true;

            this.setState(function (prevState) {
                return {
                    currentNotification: notification,
                    notifications: prevState.notifications.slice(0, index).concat(updatedNotification).concat(prevState.notifications.slice(index + 1))
                };
            });
        }
    }, {
        key: 'render',
        value: function render() {
            var _this3 = this;

            if (this.state.notifications.length == 0) {
                return React.createElement(
                    'h1',
                    null,
                    '\u041D\u0435\u0442 \u0441\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0439'
                );
            }
            var notificationsItems = this.state.notifications.map(function (x) {
                return React.createElement(
                    'div',
                    { className: 'card', key: x.Id },
                    React.createElement(
                        'div',
                        { className: 'card-body' },
                        React.createElement(
                            'div',
                            { className: 'media' },
                            React.createElement(
                                'div',
                                { className: 'avatar-sm d-none d-md-inline-block' },
                                React.createElement(
                                    'span',
                                    { className: x.IsReaded ? "avatar-title bg-secondary rounded-circle" : "avatar-title bg-primary rounded-circle" },
                                    React.createElement('i', { className: 'uil uil-envelope text-white font-24' })
                                )
                            ),
                            React.createElement(
                                'div',
                                { className: 'media-body pl-2 pt-1' },
                                React.createElement(
                                    'div',
                                    null,
                                    React.createElement(
                                        'span',
                                        { className: 'float-right pl-1 text-dark' },
                                        x.TimeStampPrettyStr
                                    ),
                                    React.createElement(
                                        'a',
                                        { className: x.IsReaded ? "mr-1 text-dark" : "mr-1 text-primary", onClick: function onClick() {
                                                return _this3.handleNotificationClick(x);
                                            }, 'data-toggle': 'modal', 'data-target': '#scrollable-modal' },
                                        React.createElement(
                                            'b',
                                            { className: '' },
                                            x.Msg.Title
                                        )
                                    ),
                                    ' ',
                                    React.createElement(
                                        'span',
                                        { className: 'badge badge-dark font-12' },
                                        x.Channel.PrettyName
                                    )
                                ),
                                x.Msg.IsHtml ? React.createElement('span', { className: 'text-truncate', style: { display: "block", width: "50vw" }, dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(x.Msg.Body, { USE_PROFILES: { html: true } }) } }) : React.createElement(
                                    'span',
                                    { className: 'text-truncate', style: { display: "block", width: "50vw" } },
                                    x.Msg.Body
                                ),
                                React.createElement(
                                    'div',
                                    { className: 'float-right' },
                                    x.Msg.Tags.map(function (tag) {
                                        return React.createElement(
                                            'span',
                                            { className: 'badge badge-outline-primary float-right ml-1 mt-1' },
                                            tag
                                        );
                                    })
                                )
                            ),
                            React.createElement('hr', null)
                        )
                    )
                );
            });

            return React.createElement(
                'div',
                null,
                notificationsItems,
                React.createElement(
                    'div',
                    { className: 'modal fade', id: 'scrollable-modal', tabindex: '-1', role: 'dialog', 'aria-labelledby': 'scrollableModalTitle', 'aria-hidden': 'true' },
                    React.createElement(
                        'div',
                        { className: 'modal-dialog modal-dialog-scrollable', role: 'document' },
                        React.createElement(
                            'div',
                            { className: 'modal-content' },
                            React.createElement(
                                'div',
                                { className: 'modal-header' },
                                React.createElement(
                                    'h5',
                                    { className: 'modal-title', id: 'scrollableModalTitle', style: { whiteSpace: "pre-line" } },
                                    this.state.currentNotification === null ? "Nope" : this.state.currentNotification.Msg.Title
                                ),
                                React.createElement(
                                    'button',
                                    { type: 'button', className: 'close', 'data-dismiss': 'modal', 'aria-label': 'Close' },
                                    React.createElement(
                                        'span',
                                        { 'aria-hidden': 'true' },
                                        '\xD7'
                                    )
                                )
                            ),
                            React.createElement(
                                'div',
                                { className: 'modal-body' },
                                React.createElement(
                                    'div',
                                    { className: 'text-dark mb-2' },
                                    React.createElement(
                                        'b',
                                        null,
                                        this.state.currentNotification === null ? "Nope" : new Date(this.state.currentNotification.TimeStamp).toLocaleDateString("ru-RU") + ", " + new Date(this.state.currentNotification.TimeStamp).toLocaleTimeString("ru-RU")
                                    )
                                ),
                                createModalBody(this.state.currentNotification != null && this.state.currentNotification.Msg.IsHtml, this.state.currentNotification != null ? this.state.currentNotification.Msg.Body : "Nope")
                            ),
                            React.createElement(
                                'div',
                                { className: 'modal-footer' },
                                React.createElement(
                                    'button',
                                    { type: 'button', className: 'btn btn-secondary', 'data-dismiss': 'modal' },
                                    T("Закрыть")
                                )
                            )
                        )
                    )
                )
            );
        }
    }]);

    return UserNotificationList;
}(React.Component);

var createModalBody = function createModalBody(isHtml, body) {
    if (isHtml) {
        return React.createElement('div', { dangerouslySetInnerHTML: { __html: DOMPurify.sanitize(body, { USE_PROFILES: { html: true } }) } });
    } else {
        return React.createElement(
            'div',
            null,
            body
        );
    }
};
$(document).ready(function () {
    $(".user-notifications-list").each(function () {
        var $this = $(this);
        var editorName = $this.data("editorName");
        var notifications = $this.data("notifications");
        var urlToLoadOldest = $this.data("urlToLoadOldest");
        var loadOldestCount = $this.data("loadOldestCount");
        var urlToMarkAsRead = $this.data("urlToMarkAsRead");
        ReactDOM.render(React.createElement(UserNotificationList, { name: editorName, notifications: notifications, urlToLoadOldest: urlToLoadOldest, loadOldestCount: loadOldestCount, urlToMarkAsRead: urlToMarkAsRead }), this);
    });
});