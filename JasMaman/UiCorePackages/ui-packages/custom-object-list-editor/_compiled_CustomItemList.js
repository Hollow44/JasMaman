var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CustomItemList = function (_React$Component) {
    _inherits(CustomItemList, _React$Component);

    function CustomItemList(props) {
        _classCallCheck(this, CustomItemList);

        var _this = _possibleConstructorReturn(this, (CustomItemList.__proto__ || Object.getPrototypeOf(CustomItemList)).call(this, props));

        var items = _this.props.items;
        if (items === undefined || items === null) {
            items = [];
        }
        items = items.map(function (x) {
            var inputs = $.extend(true, [], _this.props.inputs);
            for (var i = 0; i < inputs.length; i++) {
                var input = inputs[i];
                input.Value = x[input.Name];
                _this.prepareInput(input);
            }
            return { Inputs: inputs };
        });
        _this.state = {
            items: items,
            inputs: _this.props.inputs,
            showSelectModal: false,
            editRowIndex: null,
            editRequestId: 0
        };
        _this.prepareInput = _this.prepareInput.bind(_this);
        _this.getDateFromStr = _this.getDateFromStr.bind(_this);
        _this.getEmptyItem = _this.getEmptyItem.bind(_this);
        _this.getItemByRowIndex = _this.getItemByRowIndex.bind(_this);
        _this.showEditor = _this.showEditor.bind(_this);
        _this.closeEditor = _this.closeEditor.bind(_this);
        _this.saveItemAndCloseEditor = _this.saveItemAndCloseEditor.bind(_this);
        _this.getDownloadUrl = _this.getDownloadUrl.bind(_this);
        _this.redirectToFile = _this.redirectToFile.bind(_this);
        return _this;
    }

    _createClass(CustomItemList, [{
        key: "prepareInput",
        value: function prepareInput(input) {
            input.VisibleValue = input.Value;

            if (input.InputType === "Reference" && input.Value) {
                input.VisibleValue = input.RefItems.find(function (x) {
                    return x.Code === input.Value;
                }).Text;
            }

            if (input.InputType === "CollectionModel" && input.Value) {
                input.VisibleValue = input.Value.SearchItemText;
            }

            if (input.InputType === "CollectionModelList" && input.Value) {
                input.VisibleValue = input.Value.map(function (i) {
                    return i.SearchItemText;
                }).join(", ");
            }

            if (input.InputType === "Date" && input.Value) {
                var date = this.getDateFromStr(input.Value);
                input.Value = date;
                input.VisibleValue = Utils.dateToString(date);
                if (input.MinValue) {
                    input.MinValue = this.getDateFromStr(input.MinValue);
                }
                if (input.MaxValue) {
                    input.MaxValue = this.getDateFromStr(input.MaxValue);
                }
            }

            if (input.VisibleValue === null || input.VisibleValue === undefined) {
                input.VisibleValue = "";
            }
        }
    }, {
        key: "getDateFromStr",
        value: function getDateFromStr(newtonsoftJsonSerializedDateString) {
            if (newtonsoftJsonSerializedDateString instanceof Date) {
                return newtonsoftJsonSerializedDateString;
            }
            //2019-12-12T00:00:00+06:00 примерно вот так выглядит сериализованная строка. нас timezone не интересует, так как все даты считаются по времени Астаны
            var year = newtonsoftJsonSerializedDateString.substring(0, 4);
            var month = newtonsoftJsonSerializedDateString.substring(5, 7);
            var day = newtonsoftJsonSerializedDateString.substring(8, 10);
            return new Date(Date.parse(newtonsoftJsonSerializedDateString));
        }
    }, {
        key: "getEmptyItem",
        value: function getEmptyItem() {
            var inputs = $.extend(true, [], this.props.inputs);
            for (var i = 0; i < inputs.length; i++) {
                this.prepareInput(inputs[i]);
            }
            return {
                Inputs: inputs
            };
        }
    }, {
        key: "getItemByRowIndex",
        value: function getItemByRowIndex(rowIndex) {
            if (rowIndex === -1) {
                return this.getEmptyItem();
            } else {
                return this.state.items[rowIndex];
            }
        }
    }, {
        key: "showEditor",
        value: function showEditor(rowIndex) {
            this.setState({ editRowIndex: rowIndex, editRequestId: this.state.editRequestId + 1 });
        }
    }, {
        key: "redirectToFile",
        value: function redirectToFile(fileId) {
            $.ajax({
                url: "/ru/file/get-download-url/" + fileId,
                type: "GET"
            }).done(function (result) {
                window.location.href = result;
            });
        }
    }, {
        key: "tryRemove",
        value: function tryRemove(rowIndex) {
            if (confirm("Удалить запись?") !== true) {
                return;
            }
            var items = $.extend(true, [], this.state.items);
            items.splice(rowIndex, 1);
            this.setState({ items: items });
        }
    }, {
        key: "closeEditor",
        value: function closeEditor() {
            this.setState({ editRowIndex: null });
        }
    }, {
        key: "saveItemAndCloseEditor",
        value: function saveItemAndCloseEditor(inputs, rowIndex) {
            var _this2 = this;

            inputs = $.extend(true, [], inputs);
            inputs.forEach(function (input) {
                return _this2.prepareInput(input);
            });
            var items = $.extend(true, [], this.state.items);
            if (rowIndex === -1) {
                items.push({ Inputs: inputs });
            } else {
                items[rowIndex].Inputs = inputs;
            }
            this.setState({ items: items });
            this.closeEditor();
        }
    }, {
        key: "getOpsCellIfNotReadonly",
        value: function getOpsCellIfNotReadonly(rowIndex) {
            var _this3 = this;

            if (this.props.readonly) {
                return null;
            }
            return React.createElement(
                "td",
                null,
                React.createElement(
                    "span",
                    { className: "badge badge-success cursor-pointer", onClick: function onClick(e) {
                            return _this3.showEditor(rowIndex);
                        } },
                    "\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C"
                ),
                React.createElement(
                    "span",
                    null,
                    "\xA0"
                ),
                React.createElement(
                    "span",
                    { className: "badge badge-danger cursor-pointer", onClick: function onClick(e) {
                            return _this3.tryRemove(rowIndex);
                        } },
                    "\u0423\u0434\u0430\u043B\u0438\u0442\u044C"
                )
            );
        }
    }, {
        key: "getDownloadUrl",
        value: function getDownloadUrl(fileId) {
            var url = null;
            $.ajax({
                url: "/ru/file/get-download-url/" + fileId,
                success: function (result) {
                    url = result;
                }.bind(this)
            });
            return url;
        }
    }, {
        key: "render",
        value: function render() {
            var _this4 = this;

            var items = this.state.items.map(function (item, index) {
                return React.createElement(
                    "tr",
                    { key: item.Id, className: "custom-item" },
                    React.createElement(
                        "td",
                        null,
                        index + 1
                    ),
                    _this4.getOpsCellIfNotReadonly(index),
                    React.createElement(
                        "td",
                        null,
                        item.Inputs.map(function (itm) {
                            if (itm.InputType === "File" && itm.Value !== null) {
                                return itm.Value.map(function (file) {
                                    return React.createElement(
                                        "div",
                                        null,
                                        React.createElement(
                                            "a",
                                            { className: "file-name", target: "_blank", onClick: function onClick(e) {
                                                    return _this4.redirectToFile(file.FileId);
                                                } },
                                            file.FileName
                                        ),
                                        React.createElement(
                                            "span",
                                            { className: "file-size-info" },
                                            " ",
                                            file.HumanReadableFileSize
                                        )
                                    );
                                });
                            } else {
                                return React.createElement(
                                    "div",
                                    null,
                                    React.createElement(
                                        "b",
                                        null,
                                        itm.Text
                                    ),
                                    ": " + itm.VisibleValue.toString()
                                );
                            }
                        })
                    )
                );
            });

            var empty = null;
            if (this.state.items.length === 0) {
                empty = React.createElement(
                    "tr",
                    { key: "empty", className: "empty-item" },
                    React.createElement(
                        "td",
                        { colSpan: this.props.readonly === true ? 2 : 3 },
                        "\u041D\u0435\u0442 \u0437\u0430\u043F\u0438\u0441\u0435\u0439"
                    )
                );
            }

            var customItemEditor = null;
            if (this.state.editRowIndex !== null) {
                customItemEditor = React.createElement(CustomInputList, { show: true, key: this.state.editRequestId, text: this.props.text, inputs: this.getItemByRowIndex(this.state.editRowIndex).Inputs, onCancel: this.closeEditor, onSave: function onSave(inputs) {
                        return _this4.saveItemAndCloseEditor(inputs, _this4.state.editRowIndex);
                    } });
            }
            var val = this.state.items.map(function (x) {
                var ret = {};
                for (var inputIndex = 0; inputIndex < x.Inputs.length; inputIndex++) {
                    var curInput = x.Inputs[inputIndex];
                    ret[curInput.Name] = curInput.Value;
                }
                return ret;
            });
            var addBtn = null;
            var operationsHeaderCell = null;
            if (this.props.readonly !== true) {
                addBtn = React.createElement(
                    "div",
                    null,
                    React.createElement(
                        "button",
                        { className: "btn btn-primary", type: "button", onClick: function onClick(e) {
                                return _this4.showEditor(-1);
                            } },
                        "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C"
                    )
                );
                operationsHeaderCell = React.createElement(
                    "th",
                    { width: "180px" },
                    "\u041E\u043F\u0435\u0440\u0430\u0446\u0438\u0438"
                );
            }
            return React.createElement(
                "div",
                null,
                addBtn,
                React.createElement(
                    "div",
                    null,
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
                                operationsHeaderCell,
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
                            items,
                            empty
                        )
                    )
                ),
                customItemEditor,
                React.createElement("input", { type: "hidden", value: JSON.stringify(val), name: this.props.name })
            );
        }
    }]);

    return CustomItemList;
}(React.Component);

$(document).ready(function () {
    $(".custom-object-list-editor").each(function () {
        var $this = $(this);
        var editorName = $this.data("editorName");
        var isReadonly = $this.data("readonly");
        var items = $this.data("items");
        var inputs = $this.data("inputs");
        var text = $this.data("text");
        ReactDOM.render(React.createElement(CustomItemList, { name: editorName, text: text, readonly: isReadonly, items: items, inputs: inputs }), this);
    });
});