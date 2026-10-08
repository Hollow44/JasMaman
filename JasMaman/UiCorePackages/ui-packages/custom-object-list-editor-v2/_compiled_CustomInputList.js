var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CustomInputList = function (_React$Component) {
    _inherits(CustomInputList, _React$Component);

    function CustomInputList(props) {
        _classCallCheck(this, CustomInputList);

        var _this = _possibleConstructorReturn(this, (CustomInputList.__proto__ || Object.getPrototypeOf(CustomInputList)).call(this, props));

        _this.state = {
            asyncRequestRunning: false,
            asyncRequestId: 0,
            asyncRequestError: null,
            inputs: _this.props.inputs
        };
        _this.onChange = _this.onChange.bind(_this);
        _this.onSave = _this.onSave.bind(_this);
        _this.validate = _this.validate.bind(_this);
        _this.isNull = _this.isNull.bind(_this);
        _this.isNullOrEmpty = _this.isNullOrEmpty.bind(_this);
        _this.validateRanges = _this.validateRanges.bind(_this);
        return _this;
    }

    _createClass(CustomInputList, [{
        key: "onChange",
        value: function onChange(name, val) {
            var _this2 = this;

            var inputs = $.extend(true, [], this.state.inputs);
            var input = inputs.find(function (x) {
                return x.Name === name;
            });
            input.Value = val;
            input.Error = this.validate(input);
            var generalError = this.state.generalError;
            if (inputs.every(function (input) {
                return _this2.isNullOrEmpty(input.Error);
            })) {
                generalError = null;
            }
            if (input.HiddenField != null) {
                if (val === "Другое" || val === "Другое2") {
                    $("input[name=" + input.HiddenField + "]").closest("div").removeAttr("hidden");
                    $("input[name=" + input.HiddenField + "]").closest("div").show();
                } else {
                    $("input[name=" + input.HiddenField + "]").closest("div").attr("hidden");
                    $("input[name=" + input.HiddenField + "]").closest("div").hide();
                }
            }
            this.setState({ inputs: inputs, generalError: generalError });
        }
    }, {
        key: "onSave",
        value: function onSave() {
            var _this3 = this;

            var inputs = $.extend(true, [], this.state.inputs);

            inputs.forEach(function (input) {
                input.Error = _this3.validate(input);
            });
            this.validateRanges(function (input) {
                return input.Name;
            }, inputs.filter(function (input) {
                return _this3.isNullOrEmpty(input.Error);
            }));
            this.validateRanges(function (input) {
                return input.Alias;
            }, inputs.filter(function (input) {
                return _this3.isNullOrEmpty(input.Error) && !_this3.isNullOrEmpty(input.Alias);
            }));

            if (inputs.some(function (input) {
                return !_this3.isNullOrEmpty(input.Error);
            })) {
                this.setState({
                    inputs: inputs, generalError: inputs.map(function (input) {
                        if (!_this3.isNullOrEmpty(input.Error)) {
                            return input.Text + ": " + input.Error + "; ";
                        }
                    }) });
            } else {
                this.props.onSave(inputs);
            }
        }
    }, {
        key: "validateRanges",
        value: function validateRanges(getInputNameLambda, inputs) {
            var fromSuffix = "From";
            var toSuffix = "To";

            var froms = inputs.filter(function (input) {
                return getInputNameLambda(input).endsWith(fromSuffix);
            });
            froms.forEach(function (from) {
                var fromInputName = getInputNameLambda(from);
                var inputToName = fromInputName.substring(0, fromInputName.length - fromSuffix.length) + toSuffix;
                var inputTo = inputs.find(function (input) {
                    return getInputNameLambda(input) === inputToName;
                });

                if (inputTo) {
                    if (inputTo.Value < from.Value) {
                        inputTo.Error = "Значение должно быть больше, чем \"" + from.Text + "\"";
                    }
                }
            });
        }
    }, {
        key: "isNull",
        value: function isNull(val) {
            if (val === undefined || val === null) {
                return true;
            }
            return false;
        }
    }, {
        key: "isNullOrEmpty",
        value: function isNullOrEmpty(val) {
            if (this.isNull(val)) {
                return true;
            }
            return val === "";
        }
    }, {
        key: "validate",
        value: function validate(input) {
            if (input.InputType === "File") {
                return null;
            }
            if (!input.IsRequired) {
                return null;
            }

            if (!input.Value && !input.IsHidden) {
                return "поле обязательно для заполнения";
            }

            if (input.InputType === "Date") {
                if (input.MinValue && input.Value < input.MinValue) {
                    return "значение не может быть меньше " + Utils.dateToString(input.MinValue);
                }
                if (input.MaxValue && input.Value > input.MaxValue) {
                    return "значение не может быть больше " + Utils.dateToString(input.MaxValue);
                }
            }
            if (input.InputType === "Int" || input.InputType === "Decimal") {
                if (input.MinValue && input.Value < input.MinValue) {
                    return "значение не может быть меньше " + input.MinValue;
                }
                if (input.MaxValue && input.Value > input.MaxValue) {
                    return "значение не может быть больше " + input.MaxValue;
                }
            }
            return null;
        }
    }, {
        key: "render",
        value: function render() {
            var _this4 = this;

            if (!this.props.show) {
                return null;
            }

            var Modal = ReactBootstrap.Modal;
            var Button = ReactBootstrap.Button;

            var generalErrorPanel = null;
            if (this.state.generalError) {
                generalErrorPanel = React.createElement(
                    "div",
                    { className: "alert alert-danger", role: "alert" },
                    this.state.generalError
                );
            }

            return React.createElement(
                "div",
                null,
                React.createElement(
                    Modal,
                    { show: true, backdrop: "static", onHide: this.props.onCancel },
                    React.createElement(
                        Modal.Header,
                        { closeButton: true },
                        React.createElement(
                            Modal.Title,
                            { id: "contained-modal-title-lg" },
                            this.props.text
                        )
                    ),
                    React.createElement(
                        Modal.Body,
                        null,
                        generalErrorPanel,
                        React.createElement(
                            "div",
                            null,
                            this.state.inputs.map(function (input) {
                                var classNames = ["form-group"];
                                var inputErrorMsg = null;

                                if (input.Error) {
                                    classNames.push("hasError");
                                    inputErrorMsg = React.createElement(
                                        "span",
                                        { id: "helpBlock2", className: "help-block" },
                                        input.Error
                                    );
                                }
                                return React.createElement(
                                    "div",
                                    { className: classNames.join(" "), hidden: input.IsHidden, key: input.Id },
                                    React.createElement(
                                        "label",
                                        null,
                                        input.Text
                                    ),
                                    React.createElement(CustomInput, { input: input, onChange: function onChange(val) {
                                            return _this4.onChange(input.Name, val);
                                        } }),
                                    inputErrorMsg
                                );
                            })
                        )
                    ),
                    React.createElement(
                        Modal.Footer,
                        null,
                        React.createElement(
                            Button,
                            { onClick: this.onSave },
                            "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C"
                        ),
                        React.createElement(
                            Button,
                            { className: "btn btn-secondary", onClick: this.props.onCancel },
                            "\u041E\u0442\u043C\u0435\u043D\u0430"
                        )
                    )
                )
            );
        }
    }]);

    return CustomInputList;
}(React.Component);