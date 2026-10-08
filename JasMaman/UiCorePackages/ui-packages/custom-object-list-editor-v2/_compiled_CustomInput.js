var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CustomInput = function (_React$Component) {
    _inherits(CustomInput, _React$Component);

    function CustomInput(props) {
        _classCallCheck(this, CustomInput);

        return _possibleConstructorReturn(this, (CustomInput.__proto__ || Object.getPrototypeOf(CustomInput)).call(this, props));
    }

    _createClass(CustomInput, [{
        key: "onMultiSearchChange",
        value: function onMultiSearchChange(field, value) {
            this.setState(_defineProperty({}, field, value));
        }
    }, {
        key: "render",
        value: function render() {
            var _this2 = this;

            var input = this.props.input;
            this.props.blocked = input.IsReadOnly;
            if (input.InputType === "Decimal" || input.InputType === "Int") {
                return React.createElement("input", { className: "form-control", type: "number", onChange: function onChange(e) {
                        return _this2.props.onChange(e.target.valueAsNumber);
                    }, value: input.Value, disabled: this.props.blocked, name: input.Name, key: input.Name });
            }
            if (input.InputType === "Text") {
                if (input.IsMultiline) {
                    return React.createElement("textarea", { className: "form-control", onChange: function onChange(e) {
                            return _this2.props.onChange(e.target.value);
                        }, value: input.Value, disabled: this.props.blocked, name: input.Name, key: input.Name });
                }
                return React.createElement("input", { className: "form-control", onChange: function onChange(e) {
                        return _this2.props.onChange(e.target.value);
                    }, value: input.Value, disabled: this.props.blocked, name: input.Name, key: input.Name });
            }
            if (input.InputType === "Reference") {
                var emptyOption = !input.Value ? React.createElement(
                    "option",
                    null,
                    "-"
                ) : null;
                return React.createElement(
                    "select",
                    { className: "form-control", onChange: function onChange(e) {
                            return _this2.props.onChange(e.target.value);
                        }, value: input.Value, disabled: this.props.blocked, name: input.Name, key: input.Name },
                    emptyOption,
                    input.RefItems.map(function (i) {
                        return React.createElement(
                            "option",
                            { value: i.Code },
                            i.Text
                        );
                    })
                );
            }
            if (input.InputType === "Boolean") {
                return React.createElement(
                    "select",
                    { className: "form-control", onChange: function onChange(e) {
                            return _this2.props.onChange(e.target.value);
                        }, value: input.Value, disabled: this.props.blocked, name: input.Name, key: input.Name },
                    !input.Value ? React.createElement(
                        "option",
                        null,
                        "-"
                    ) : null,
                    input.RefItems.map(function (i) {
                        return React.createElement(
                            "option",
                            { value: i.Code },
                            i.Text
                        );
                    })
                );
            }
            if (input.InputType === "File") {
                //return <input className="form-control" type="file" onChange={e => this.props.onChange(e.target.value)} value={input.Value} disabled={this.props.blocked} name={input.Name} key={input.Name} />;
                return React.createElement(FileUploadEditor, { name: input.Name, files: input.Value, fileUploadUrl: input.FileUploadUrl, description: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B", onChange: function onChange(e) {
                        return _this2.props.onChange(e.target.value);
                    }, disabled: this.props.blocked });
            }
            if (input.InputType === "Date") {
                var valueForDateInput = "";
                if (input.Value) {
                    valueForDateInput = Utils.dateToInputDateValue(input.Value);
                }
                return React.createElement("input", { className: "form-control", type: "date", onChange: function onChange(e) {
                        return _this2.props.onChange(e.target.valueAsDate);
                    }, value: valueForDateInput, disabled: this.props.blocked, name: input.Name, key: input.Name, min: Utils.dateToInputDateValue(input.MinValue || new Date(1900, 0, 1)), max: Utils.dateToInputDateValue(input.MaxValue || new Date(2050, 0, 1)) });
            }

            if (input.InputType === "DateTime") {
                var valueForDateInput = "";
                if (input.Value) {
                    valueForDateInput = Utils.dateToInputDateValue(input.Value);
                }
                return React.createElement("input", { className: "form-control", type: "datetime-local", onChange: function onChange(e) {
                        return _this2.props.onChange(e.target.valueAsDate);
                    }, value: valueForDateInput, disabled: this.props.blocked, name: input.Name, key: input.Name, min: Utils.dateToInputDateValue(input.MinValue || new Date(1900, 0, 1)), max: Utils.dateToInputDateValue(input.MaxValue || new Date(2050, 0, 1)) });
            }

            if (input.InputType === "CollectionModel") {
                return React.createElement(SearchCollectionEditorV2, { name: input.Name, dontPutHiddenInput: true, onChange: function onChange(e) {
                        return _this2.props.onChange(e);
                    }, value: input.Value, querySettings: JSON.parse(input.QuerySettings), searchCollectionUrl: input.ModelCollectionUrl, searchDialogHeaderText: "\u0412\u044B\u0431\u043E\u0440", queryInputPlaceholder: "", key: input.Name });
            }

            if (input.InputType === "CollectionModelList") {
                return React.createElement(MultiSearchCollectionEditorV2, { name: input.Name, dontPutHiddenInput: true, onChange: function onChange(e) {
                        return _this2.props.onChange(e);
                    }, items: input.Value, querySettings: JSON.parse(input.QuerySettings), searchCollectionUrl: input.ModelCollectionUrl, searchDialogHeaderText: "\u0412\u044B\u0431\u043E\u0440", queryInputPlaceholder: "", key: input.Name });
            }

            throw "Не удалось определить редактор данных : " + input.InputType;
        }
    }]);

    return CustomInput;
}(React.Component);