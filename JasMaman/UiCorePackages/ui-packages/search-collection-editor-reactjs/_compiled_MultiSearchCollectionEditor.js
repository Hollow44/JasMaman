var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var MultiSearchCollectionEditor = function (_React$Component) {
    _inherits(MultiSearchCollectionEditor, _React$Component);

    function MultiSearchCollectionEditor(props) {
        _classCallCheck(this, MultiSearchCollectionEditor);

        var _this = _possibleConstructorReturn(this, (MultiSearchCollectionEditor.__proto__ || Object.getPrototypeOf(MultiSearchCollectionEditor)).call(this, props));

        _this.state = {
            dialogState: "Closed"
        };

        _this.state.items = _this.props.items === null ? [] : _this.props.items;
        _this.onAdd = _this.onAdd.bind(_this);
        _this.addBtnClickHandler = _this.addBtnClickHandler.bind(_this);
        _this.removeBtnClickHandler = _this.removeBtnClickHandler.bind(_this);
        _this.onSearchDialogClose = _this.onSearchDialogClose.bind(_this);
        _this.getOpsCellOrNullIfReadonly = _this.getOpsCellOrNullIfReadonly.bind(_this);
        _this.changed = _this.changed.bind(_this);
        _this.onValueChange = _this.onValueChange.bind(_this);
        return _this;
    }

    _createClass(MultiSearchCollectionEditor, [{
        key: "onAdd",
        value: function onAdd(item) {
            if (this.state.items.some(function (x) {
                return x.SearchItemId === item.SearchItemId;
            })) {
                this.setState({
                    errorMessage: "Такая же запись была добавлена ранее"
                });
                return;
            }
            var items = $.extend(true, [], this.state.items);
            items.push(item);
            this.setState({
                items: items,
                dialogState: "Closed"
            });
            this.changed(items);
        }
    }, {
        key: "addBtnClickHandler",
        value: function addBtnClickHandler() {
            this.setState({
                dialogState: "Open",
                errorMessage: null
            });
        }
    }, {
        key: "removeBtnClickHandler",
        value: function removeBtnClickHandler(rowIndex) {
            if (confirm("Удалить запись?") !== true) {
                return;
            }
            var items = $.extend(true, [], this.state.items);
            items.splice(rowIndex, 1);
            this.setState({ items: items });
            this.changed(items);
        }
    }, {
        key: "onSearchDialogClose",
        value: function onSearchDialogClose() {
            this.setState({
                dialogState: "Closed"
            });
        }
    }, {
        key: "getOpsCellOrNullIfReadonly",
        value: function getOpsCellOrNullIfReadonly(rowIndex) {
            var _this2 = this;

            if (this.props.readonly === true) {
                return null;
            }
            return React.createElement(
                "td",
                null,
                React.createElement(
                    "span",
                    { className: "badge badge-danger", onClick: function onClick(e) {
                            return _this2.removeBtnClickHandler(rowIndex);
                        } },
                    "\u0423\u0434\u0430\u043B\u0438\u0442\u044C"
                )
            );
        }
    }, {
        key: "changed",
        value: function changed(value) {
            this.props.onChange(value);
        }
    }, {
        key: "onValueChange",
        value: function onValueChange(value) {
            this.props.onChange(value);
        }
    }, {
        key: "render",
        value: function render() {
            var _this3 = this;

            var emptyItem = this.state.items.length === 0 ? React.createElement(
                "tr",
                { className: "empty-item" },
                React.createElement(
                    "td",
                    { colSpan: this.props.readonly === true ? 2 : 3 },
                    T("Нет записей")
                )
            ) : null;
            var items = this.state.items.map(function (x, index) {
                return React.createElement(
                    "tr",
                    null,
                    React.createElement(
                        "td",
                        null,
                        index + 1
                    ),
                    _this3.getOpsCellOrNullIfReadonly(index),
                    React.createElement(
                        "td",
                        null,
                        x.SearchItemText
                    )
                );
            });

            var addBtn = this.props.readonly === true ? null : React.createElement(
                "div",
                null,
                React.createElement(
                    "button",
                    { className: "btn btn-primary", type: "button", onClick: function onClick(e) {
                            return _this3.addBtnClickHandler();
                        } },
                    "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C"
                )
            );

            var opColHeaderTd = this.props.readonly === true ? null : React.createElement(
                "th",
                { width: "180px" },
                "\u041E\u043F\u0435\u0440\u0430\u0446\u0438\u0438"
            );

            return React.createElement(
                "div",
                null,
                addBtn,
                React.createElement(SearchCollectionQueryEditor, { show: this.state.dialogState === "Open", onHide: function onHide(e) {
                        return _this3.onSearchDialogClose();
                    }, headerText: this.props.searchDialogHeaderText, onSelect: function onSelect(item) {
                        return _this3.onAdd(item);
                    }, searchCollectionUrl: this.props.searchCollectionUrl, queryInputPlaceholder: this.props.queryInputPlaceholder, querySettings: this.props.querySettings, errorMessage: this.state.errorMessage }),
                React.createElement(
                    "table",
                    { className: "table" },
                    React.createElement(
                        "thead",
                        null,
                        React.createElement(
                            "tr",
                            null,
                            React.createElement(
                                "th",
                                { width: "20px" },
                                "\u2116"
                            ),
                            opColHeaderTd,
                            React.createElement(
                                "th",
                                null,
                                "\u0414\u0430\u043D\u043D\u044B\u0435"
                            )
                        )
                    ),
                    React.createElement(
                        "tbody",
                        null,
                        emptyItem,
                        items
                    )
                ),
                React.createElement("input", { name: this.props.name, value: JSON.stringify(this.state.items), type: "hidden", onChange: this.onValueChange.bind(this) })
            );
        }
    }]);

    return MultiSearchCollectionEditor;
}(React.Component);