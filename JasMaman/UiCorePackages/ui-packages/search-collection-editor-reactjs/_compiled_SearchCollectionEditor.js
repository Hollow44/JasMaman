var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var SearchCollectionEditor = function (_React$Component) {
    _inherits(SearchCollectionEditor, _React$Component);

    function SearchCollectionEditor(props) {
        _classCallCheck(this, SearchCollectionEditor);

        var _this = _possibleConstructorReturn(this, (SearchCollectionEditor.__proto__ || Object.getPrototypeOf(SearchCollectionEditor)).call(this, props));

        var text = "";
        if (_this.props.value !== null && _this.props.value !== undefined) {
            text = _this.props.value.SearchItemText;
        }
        _this.state = {
            value: _this.props.value,
            text: text,
            dialogState: "Closed"
        };
        _this.onValueChange = _this.onValueChange.bind(_this);
        _this.onSearchButtonClick = _this.onSearchButtonClick.bind(_this);
        _this.onSearchDialogClose = _this.onSearchDialogClose.bind(_this);

        return _this;
    }

    _createClass(SearchCollectionEditor, [{
        key: "onValueChange",
        value: function onValueChange(item) {
            this.setState({
                value: item,
                text: item.SearchItemText,
                dialogState: "Closed"
            });
            if (this.props.onChange) {
                this.props.onChange(item);
            }
        }
    }, {
        key: "onSearchButtonClick",
        value: function onSearchButtonClick() {
            this.setState({
                dialogState: "Open"
            });
        }
    }, {
        key: "onSearchDialogClose",
        value: function onSearchDialogClose() {
            this.setState({
                dialogState: "Closed"
            });
        }
    }, {
        key: "render",
        value: function render() {
            var _this2 = this;

            var hiddenInputWithSerializedValue = this.props.dontPutHiddenInput === true ? null : React.createElement("input", { name: this.props.name, value: JSON.stringify(this.state.value), type: "hidden" });
            return this.props.readonly === true ? React.createElement(
                "span",
                { className: "form-control" },
                this.state.text
            ) : React.createElement(
                "div",
                { className: "input-group" },
                React.createElement("input", { type: "text", className: "form-control", "aria-label": "...", readOnly: true, value: this.state.text }),
                React.createElement(
                    "div",
                    { className: "input-group-btn" },
                    React.createElement(
                        "button",
                        { type: "button", className: "btn btn-primary", onClick: function onClick(e) {
                                return _this2.onSearchButtonClick();
                            } },
                        T("Выбрать")
                    )
                ),
                React.createElement(SearchCollectionQueryEditor, { twoFielded: this.props.twoFielded, show: this.state.dialogState === "Open", onHide: function onHide(e) {
                        return _this2.onSearchDialogClose();
                    }, headerText: this.props.searchDialogHeaderText, onSelect: function onSelect(item) {
                        return _this2.onValueChange(item);
                    }, searchCollectionUrl: this.props.searchCollectionUrl, queryInputPlaceholder: this.props.queryInputPlaceholder, querySettings: this.props.querySettings }),
                hiddenInputWithSerializedValue
            );
        }
    }]);

    return SearchCollectionEditor;
}(React.Component);