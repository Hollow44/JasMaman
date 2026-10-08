var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CheckboxListEditor = function (_React$Component) {
    _inherits(CheckboxListEditor, _React$Component);

    function CheckboxListEditor(props) {
        _classCallCheck(this, CheckboxListEditor);

        var _this = _possibleConstructorReturn(this, (CheckboxListEditor.__proto__ || Object.getPrototypeOf(CheckboxListEditor)).call(this, props));

        var items = $.extend(true, [], props.items);

        for (var i = 0; i < items.length; i++) {
            var curItem = items[i];
            var item = props.selectedIds.find(function (id) {
                return curItem.Id === id;
            });
            curItem.selected = item !== undefined;
        }
        _this.onItemChecked = _this.onItemChecked.bind(_this);
        _this.onItemsChecked = _this.onItemsChecked.bind(_this);
        _this.state = {
            items: items,
            selectedAll: true,
            readonly: props.readonly
        };
        return _this;
    }

    _createClass(CheckboxListEditor, [{
        key: "onItemChecked",
        value: function onItemChecked(index) {
            if (!this.state.readonly) {
                var items = $.extend(true, [], this.state.items);
                items[index].selected = !items[index].selected;
                var allItemsCheck = !items.some(function (x) {
                    return x.selected === false;
                });
                this.setState({
                    items: items,
                    selectedAll: allItemsCheck
                });
            }
        }
    }, {
        key: "onItemsChecked",
        value: function onItemsChecked(selectedAll) {
            if (!this.state.readonly) {
                var items = $.extend(true, [], this.state.items);
                selectedAll = !selectedAll;
                for (var i = 0; i < items.length; i++) {
                    items[i].selected = selectedAll;
                }
                this.setState({
                    items: items,
                    selectedAll: selectedAll
                });
            }
        }
    }, {
        key: "render",
        value: function render() {
            var _this2 = this;

            var items = this.state.items.map(function (x, index) {
                return React.createElement(
                    "li",
                    { key: x.Id, className: "list-group-item list-group-item-selectable", onClick: function onClick(e) {
                            return _this2.onItemChecked(index);
                        } },
                    React.createElement("span", { className: x.selected ? "state-icon uil-check-square" : "state-icon uil-square-full" }),
                    x.Text
                );
            });
            var noRows = this.state.items.length === 0 ? React.createElement(
                "li",
                { className: "list-group-item no-rows-item" },
                "\u041D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0435\u0439"
            ) : null;
            return React.createElement(
                "div",
                null,
                React.createElement(
                    "div",
                    { onClick: function onClick(e) {
                            return _this2.onItemsChecked(_this2.state.selectedAll);
                        } },
                    React.createElement("span", { className: this.state.selectedAll ? "state-icon glyphicon glyphicon-check" : "state-icon glyphicon glyphicon-unchecked" }),
                    "\u0412\u044B\u0431\u0440\u0430\u0442\u044C \u0432\u0441\u0435"
                ),
                React.createElement(
                    "ul",
                    { className: "list-group" },
                    items,
                    noRows
                ),
                React.createElement("input", { name: this.props.name, type: "hidden", value: JSON.stringify(this.state.items.filter(function (x) {
                        return x.selected;
                    }).map(function (x) {
                        return x.Id;
                    })) })
            );
        }
    }]);

    return CheckboxListEditor;
}(React.Component);

$(document).ready(function () {
    $(".checkbox-list-editor").each(function () {
        var $this = $(this);
        var editorName = $this.data("editorName");
        var items = $this.data("items");
        var selectedIds = $this.data("selectedIds");

        ReactDOM.render(React.createElement(CheckboxListEditor, { name: editorName, items: items, selectedIds: selectedIds, noRowsText: $this.data("noRowsText"), readonly: $this.data("readonly") }), this);
    });
});