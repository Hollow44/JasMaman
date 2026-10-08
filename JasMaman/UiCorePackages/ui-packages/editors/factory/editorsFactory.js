function getPreparedCsv(str) {
    var re = /(^|[\n\t])([^\"][^\n\t]*\"[^\n\t]*)([\n\t]|$)/gm;
    function replacer(str, p1, p2, p3, offset, s) {
        var replaceAll = function(find, replace, s) {
            return s.replace(new RegExp(find, 'g'), replace);
        };
        return p1 + '"' + replaceAll('"', '""', p2) + '"' + p3;
    }
    var ret = str;
    ret = ret.replace(re, replacer)
			.replace(re, replacer);
    return (ret);
}

var _editorsProviders = new Object();

function registerEditorProvider(propType, provider) {
    _editorsProviders[propType] = provider;
}

function getRegisteredEditorsProviders() {
    return _editorsProviders;
}

function _getEditorProvider(propType) {
    return _editorsProviders[propType];
}

/*
objectSchema: {
    flFieldName: {type:'text', text:'Field name'}
},
callbacks: {
    onValueChanged:function(){}
}
*/

(function ($) {
    $.widget("yoda.objectEditor", {
        _create: function () {
            var callbacks = {};
            var editor = getObjectEditorWidget(this.options.schema, callbacks);
            if(this.options.value) {
                editor.setVal(this.options.value);
            }
            this.element.append(editor.$widget);
            this.editor = editor;
            if(this.options.onValueChanged){
                editor.setOnValueChangedCallback(this.options.onValueChanged)
            }
        },
        setVal:function (value) {
            this.editor.setVal(value);
        },
        getVal:function () {
            return this.editor.getVal();
        },
        setPropValue :function(propName, value) {
            this.editor.setPropValue(propName, value);
        },
        getPropValue :function(propName, value) {
            this.editor.getPropValue(propName, value);
        },
        setPropEnabled : function(propName, value) {
            this.editor.setPropEnable(propName, value);
        },
        setCommonErrors: function(errors) {
            this.editor.setCommonErrors(errors);
        },
        clearCommonErrors: function() {
            this.editor.clearCommonErrors();
        },
        setPropError: function(propName, error) {
            this.editor.setPropError(propName, error);
        },
        removePropError: function(propName) {
            this.editor.removePropError(propName);
        },
        clearAllPropErrors: function(propName) {
            this.editor.clearAllPropErrors();
        },
        clearAllErrors: function() {
            this.editor.clearAllPropErrors();
            this.editor.clearCommonErrors();
        },
        isErrorExists: function() {
            return this.editor.isErrorExists();
        },
        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));

function getObjectEditorWidget(objectSchema, callbacks) {
    var ret = {
        $widget: $("<div>"),
        onValueChangedCallbacks: new Array()
    };
    var $ulErrors = $("<ul class='widget-common-errors'></ul>");
    ret.$widget.append($ulErrors);
    
    if(callbacks == undefined || callbacks == null) {
        callbacks = { };
    }
    
    if(callbacks.onValueChanged == undefined || callbacks.onValueChanged == null) {
        callbacks.onValueChanged = function() { };
    }

    ret.onValueChangedCallbacks.push(callbacks.onValueChanged);
    
    
    var propEditorsAndWidgets = {};
    var propName;
    for (propName in objectSchema) {
        var prop = objectSchema[propName];
        if(prop.type == undefined) {
            prop.type = "text";
        }
        var editorProvider = _getEditorProvider(prop.type);
        var $propWidget = editorProvider.getWidget(prop);
        propEditorsAndWidgets[propName] = {
            editorProvider: editorProvider,
            $widget: $propWidget
        };
        editorProvider.setOnValueChangedCallback($propWidget, getOnValueChangedEvent(propName, ret.onValueChangedCallbacks));
        
        var $propEditorWrapper = $("<div class='prop-wrapper' field-name='{0}'>".format(propName));
        var $propText = $("<div class='prop-text'>{0}</div>".format(prop.text));
        
        if(prop.title) {
            $propText.attr("title", prop.title);
        }

        var $propEditor = $("<div class='prop-editor'></div>");
        $propEditor.append($propWidget);

        $propEditorWrapper.append($propText);
        $propEditorWrapper.append($propEditor);

        ret.$widget.append($propEditorWrapper);
        
        if(prop.hidden==true) {
            $propEditorWrapper.hide();
        }
    }

    for (propName in objectSchema) {
        var propEditorAndWidget = propEditorsAndWidgets[propName];
        var propEditorProvider = propEditorAndWidget.editorProvider;
        if(propEditorProvider.onObjEditorBuildComplete!=undefined) {
            propEditorProvider.onObjEditorBuildComplete(ret.$widget, propEditorAndWidget.$widget, objectSchema[propName]);
        }
    }
    
    ret._refresh = function () {
        for (var propName1 in objectSchema) {
            var propVal = ret._val == null ? null : ret._val[propName1];

            var editorProviderAndWidget = propEditorsAndWidgets[propName1];
            editorProviderAndWidget.editorProvider.setValue(editorProviderAndWidget.$widget, propVal);
        }
    };
    
    ret.refresh = ret._refresh;

    ret.setCommonErrors = function(errors) {
        $ulErrors.empty();
        for(var i=0;i<errors.length;i++) {
            var $li = $("<li>");
            $li.text(errors[i]);
            $ulErrors.append($li);
        }
    };
    ret.clearCommonErrors = function(){
        $ulErrors.empty();
    };
    
    ret.setPropError = function(propName, error) {
        var $propWrapper = ret.$widget.find(".prop-wrapper[field-name='{0}']".format(propName));

        var $errorPanel = $propWrapper.find(".prop-error-panel");
        if($errorPanel.length == 0) {
            $errorPanel = $("<div class='prop-error-panel validation-error-text'>");
            $propWrapper.append($errorPanel);
        }
        $errorPanel.text(error);
    };
    
    ret.clearAllPropErrors = function () {
        ret.$widget.find(".prop-error-panel").remove();
    };

    ret.removePropError = function(propName) {
        ret.$widget.find(".prop-wrapper[field-name='{0}'] .prop-error-panel").remove();
    };

    ret.isErrorExists = function() {
        return $ulErrors.find("li").length > 0 || ret.$widget.find(".prop-error-panel").length > 0;
    };
    ret.setVal = function (val) {
        ret._val = val;
        ret._refresh();
    };

    ret.getVal = function () {
        var retVal = {};
        for (var propName1 in objectSchema) {
            var editorProviderAndWidget = propEditorsAndWidgets[propName1];
            retVal[propName1] = editorProviderAndWidget.editorProvider.getValue(editorProviderAndWidget.$widget);
        }
        return retVal;
    };
    ret.getText = function (val) {
        if (val == undefined || val == null) {
            val = new Object();
        }
        var retText = {};
        for (var propName1 in objectSchema) {
            if (objectSchema[propName1].hidden == true) {
                continue;
            }
            var editorProviderAndWidget = propEditorsAndWidgets[propName1];
            if (val[propName1] == undefined) {
                retText[propName1] = "";
            } else {
                retText[propName1] = editorProviderAndWidget.editorProvider.getText(val[propName1], objectSchema[propName1]);
            }
        }
        return retText;
    };

    ret.parse = function (textArray) {
        var retVal = {};
        var curIndex = 0;
        for (var propName1 in objectSchema) {
            if (objectSchema[propName1].hidden == true) {
                retVal[propName1] = undefined;
                continue;
            }
            var editorProviderAndWidget = propEditorsAndWidgets[propName1];
            var curText = textArray[curIndex];
            if (curText == undefined) {
                retVal[propName1] = "";
            } else {
                retVal[propName1] = editorProviderAndWidget.editorProvider.parse(curText, objectSchema[propName1]);
            }
            curIndex++;
        }
        return retVal;
    };

    ret.parseObject = function(obj) {
        var retVal = {};
        for(var objProp in obj) {
            if(!objectSchema.hasOwnProperty(objProp))
                continue;
            if (objectSchema[objProp].hidden == true) {
                retVal[objProp] = undefined;
                continue;
            }
            var editorProviderAndWidget = propEditorsAndWidgets[objProp];
            var curText = obj[objProp];
            if (curText == undefined) {
                retVal[objProp] = "";
            } else {
                retVal[objProp] = editorProviderAndWidget.editorProvider.parse(curText, objectSchema[objProp]);
            }
        }
        return retVal;
    };

    ret.setOnValueChangedCallback = function(callback) {
        if (callback == undefined || callback == null) {
            ret.onValueChangedCallbacks = new Array();
        } else {
            ret.onValueChangedCallbacks.push(callback);
        }
    };

    ret.getPropEditorProvider = function (propName) {
        var editorProviderAndWidget = propEditorsAndWidgets[propName];
        return editorProviderAndWidget.editorProvider;
    };
    ret.getPropWidget = function (propName) {
        var editorProviderAndWidget = propEditorsAndWidgets[propName];
        return editorProviderAndWidget.$widget;
    };
    ret.setPropValue = function(propName, val) {
        var editorProvider = ret.getPropEditorProvider(propName);
        var $widget = ret.getPropWidget(propName);
        editorProvider.setValue($widget, val);
    }
    ret.getPropValue = function(propName, val) {
        var editorProvider = ret.getPropEditorProvider(propName);
        var $widget = ret.getPropWidget(propName);
        editorProvider.getValue($widget, val);
    }
    ret.setPropEnable = function(propName, enabled) {
        var editorProvider = ret.getPropEditorProvider(propName);
        var $widget = ret.getPropWidget(propName);
        editorProvider.setEnabled($widget, enabled);
    }
    // ret.setPropError = function(propName, error){
    //     var $propWrapper = ret.$widget.find(".prop-wrapper[field-name='{0}']".format(propName));
    //     var $error = $("<span class='validation-error-text'>");
    //     $error.text(error);
    //     var $editor = $propWrapper.find(".prop-editor");
    //     $editor.append($error);
    //     $editor.addClass("validation-error");
    // }
    return ret;
}



function getOnValueChangedEvent(propName, onValueChangedCallbacks) {
    return function(newValue) {
        for (var index = 0; index < onValueChangedCallbacks.length; index++) {
            onValueChangedCallbacks[index](propName, newValue);
        }
    };
}

/*
    options: {
        defaultValue: {},//значение применяемое при добавлении объекта
        buttons:{add:true, remove:true, edit:true}
    },
    callbacks: {
        onValueChanged: function(fieldName, newValue, $editorWidget){}
    }
*/

var _efInternalId = 0;
function efGenId() {
    _efInternalId++;
    return _efInternalId;
}

var listEditorInstance = { };
listEditorInstance.defaultSettings = {
    editorDialogWidth: 450,
    readonly: false,
    toolbarItems: [],
    buttons: { add: true, addMulti: true, addMultiWithHeader: false, remove: true, removeAll: false, edit: true },
    uiCss: {
        tableClass: "items-editor-table table",
        addBtnClass: "editor-factory-btn btn btn-primary",
        addItemsBtnClass: "editor-factory-btn btn btn-primary",
        editBtnClass: "editor-factory-btn",
        removeBtnClass: "editor-factory-btn",
        removeAllBtnClass: "items-editor-table-btn-remove-all",
        noRowsClass: "items-editor-table-now-rows",
        actionsThClass: "items-editor-table-actions-th",
    },
    uiText : {
        addBtnText: T("Добавить"),
        addItemsBtnText: T("Добавить группу записей"),
        addItemsWitHeaderBtnText: T("Добавить группу записей с заголовками"),
        editBtnText: T("Редактировать"),
        removeBtnText: T("Удалить"),
        removeAllBtnText: T("Удалить все")
    },
    callbacks: {
        afterRowPrinted: function(value, $tr) {
        },
        onValueChanged: function(fieldName, newValue, $schemaWidget) {
        },
        onEditorDialogOpen: function(value, $schemaWidget) {
        },
        onValidate: function(schemaValue) { return { }; },
        onBeforeValueAccepted: function(schemaValue) { return schemaValue; },
        onSourceChanged: function() {
        },
        onCellPrinted: function(propInfo, $td, value) {
        },
        onActionCellPrinted: function(value, $td) {
        },
        onAddMultiHeadersNotFound: function(notFoundedHeaders) {
            alert("Не найдены следующие столбцы: " + notFoundedHeaders.join("; "));
            return false;
        },
        onAddMultiWithHeadersParsed: function(headerNames) {
        },
        onAddMultiWithHeadersDetected: function(headerTexts) {
        }
    }
};

function getListEditorWidget(objectSchema, options) {
    var ret = new Object();
    ret.objectSchema = objectSchema;
    ret.objEditor = getObjectEditorWidget(ret.objectSchema);
    
    ret.settings = $.extend(true, {}, listEditorInstance.defaultSettings, (options || {}));

    var settings = ret.settings;

    var $widget = $("<div>");

    ret.rebuildUi = function () {
        $widget.empty();
        var editor = getObjectEditorWidget(ret.objectSchema);
        ret._editor = editor;
        ret._ui = {};

        var printItemToTr = function (item, $tr) {
            $tr.empty();
            $tr.attr("_itemId", item._efInternalId);
            var itemText = ret._editor.getText(item);
            if (settings.readonly == true) {
                $tr.append("<td></td>");
            } else {
                var actionsHtml = "";
                if (settings.buttons.edit === true) {
                    actionsHtml += "<span class='edit-item {1}'><span class='fa fa-pencil'></span></span>".format(settings.uiText.editBtnText, settings.uiCss.editBtnClass);
                }
                if (settings.buttons.remove === true) {
                    actionsHtml += "<span class='remove-item {1}'><span class='fa fa-remove'></span></span>".format(settings.uiText.removeBtnText, settings.uiCss.removeBtnClass);
                }

                var $actionTd = $("<td>{0}</td>".format(actionsHtml));
                settings.callbacks.onActionCellPrinted(item, $actionTd);
                $tr.append($actionTd);
            }

            for (var propName1 in itemText) {
                if (ret.objectSchema[propName1].hidden == true)
                    continue;
                var $td = $("<td>{0}</td>".format(itemText[propName1]));
                settings.callbacks.onCellPrinted({
                    name: propName1,
                    value: item[propName1],
                    text: itemText[propName1]
                }, $td);

                if (item._errors && item._errors[propName1]) {
                    $td.addClass("validate-error");
                    $td.attr("title", item._errors[propName1]);
                }

                $tr.append($td);
            }
            settings.callbacks.afterRowPrinted(item, $tr);
        };
        ret._printItemToTr = printItemToTr;

        var showEditor = function (val, onOkCallback) {
            var $dialog = $("<div>");
            var $commonErrorsPane = $("<ul class='common-errors'>");
            $commonErrorsPane.hide();
            $dialog.append($commonErrorsPane);
            var itemEditor = getObjectEditorWidget(ret.objectSchema);
            itemEditor.setOnValueChangedCallback(function (fieldName, newValue) {
                settings.callbacks.onValueChanged.call(itemEditor, fieldName, newValue, itemEditor.$widget);
            });
            if (val != null) {
                itemEditor.setVal(val);
            }
            $dialog.append(itemEditor.$widget);
            $dialog.dialog({
                modal: true,
                width: settings.editorDialogWidth,
                open: function () {
                    settings.callbacks.onEditorDialogOpen.call(itemEditor, val, itemEditor.$widget);
                },
                buttons: [{
                    text: "Ok", click: function () {
                        var editedVal = itemEditor.getVal();

                        var vr = settings.callbacks.onValidate.call(itemEditor, editedVal);
                        var errorExists = false;

                        $commonErrorsPane.empty();
                        itemEditor.$widget.find(".prop-editor").removeClass("prop-error");
                        itemEditor.$widget.find(".prop-error-info").remove();

                        if (vr != null) {
                            for (var propName1 in vr) {
                                errorExists = true;
                                var propError = vr[propName1];

                                if (ret.objectSchema[propName1] == undefined) {
                                    $commonErrorsPane.show();
                                    $commonErrorsPane.append("<li>{0}</li>".format(propError));
                                } else {
                                    var $propEditor = itemEditor.$widget.find(".prop-wrapper[field-name='{0}']".format(propName1));
                                    $propEditor.find(".prop-editor").addClass("prop-error");
                                    $propEditor.append("<div class='prop-error-info'>{0}</div>".format(propError));
                                }
                            }
                        }
                        if (errorExists == true) {
                            return;
                        }
                        settings.callbacks.onBeforeValueAccepted.call(itemEditor, editedVal);

                        onOkCallback(editedVal);
                        $dialog.dialog("close");
                        $dialog.remove();
                    }
                }, {
                    text: T("Отмена"), click: function () { $dialog.dialog("close"); $dialog.remove(); }
                }]
            });
        };

        var $removeAllBtn = $("<span style='display:none' class='{1}'>{0}</span>".format(settings.uiText.removeAllBtnText, settings.uiCss.removeAllBtnClass));
        if (settings.readonly == false) {
            $widget.append($removeAllBtn);
        }

        var $addBtn = $("<span style='display:none;' class='add-item {1}'><span class='fa fa-plus'></span>{0}</span>".format(settings.uiText.addBtnText, settings.uiCss.addBtnClass));
        if (settings.readonly == false)
            $widget.append($addBtn);

        var $addTabbedCsvString = $("<span style='display:none;' class='add-items  {1}'><span class='fa fa-plus'></span>{0}</span>".format(settings.uiText.addItemsBtnText, settings.uiCss.addItemsBtnClass));
        if (settings.readonly == false && settings.buttons.addMulti == true)
            $widget.append($addTabbedCsvString);

        var $addTabbedCsvStringWithHeaders = $("<span style='display:none;' class='{1}'>{0}</span>".format(settings.uiText.addItemsWitHeaderBtnText, settings.uiCss.addItemsBtnClass));
        if (settings.readonly == false && settings.buttons.addMultiWithHeader == true) {
            $widget.append($addTabbedCsvStringWithHeaders);
        }

        for (var i = 0; i < settings.toolbarItems.length; i++) {
            $widget.append(settings.toolbarItems[i]);
        }

        ret._ui.$table = $("<table class='{0}'>".format(settings.uiCss.tableClass));
        ret._ui.$thead = $("<thead>");
        ret._ui.$tbody = $("<tbody>");

        function printPlainHeader() {
            ret._ui.$theadRow = $("<tr>");
            ret._ui.$theadRow.append("<th class='{0}'>&nbsp;</th>".format(settings.uiCss.actionsThClass));
            for (var propName in ret.objectSchema) {
                var prop = ret.objectSchema[propName];
                if (prop.hidden == true)
                    continue;
                ret._ui.$theadRow.append("<th class='{1}'>{0}</th>".format(prop.text, (prop.thClass || "")));
            }
            ret._ui.$thead.append(ret._ui.$theadRow);
        }

        function printGroupedHeader() {
            var $theadRow1 = $("<tr>");
            $theadRow1.append("<th class='{0}' rowspan='2'>&nbsp;</th>".format(settings.uiCss.actionsThClass));
            var $theadRow2 = $("<tr>");

            ret._ui.$theadRow1 = $theadRow1;
            ret._ui.$theadRow2 = $theadRow2;
            ret._ui.$thead.append($theadRow1);
            ret._ui.$thead.append($theadRow2);

            var cellsToPrint = {};
            for (var propName in ret.objectSchema) {
                var prop = ret.objectSchema[propName];
                if (prop.hidden == true)
                    continue;
                cellsToPrint[propName] = { prop: prop, isPrinted: false };
            }

            for (var propName in cellsToPrint) {
                var curCellToPrint = cellsToPrint[propName];
                if (curCellToPrint.isPrinted == true) {
                    continue;
                }
                var prop = curCellToPrint.prop;
                if (prop.groupHeader) {
                    var colSpan = 1;
                    $theadRow2.append("<th class='{1}'>{0}</th>".format(prop.text, (prop.thClass || "")));
                    curCellToPrint.isPrinted = true;
                    for (var propName2 in cellsToPrint) {
                        var curCellToPrint2 = cellsToPrint[propName2];
                        if (curCellToPrint2.isPrinted == true) {
                            continue;
                        }
                        if (curCellToPrint2.prop.groupHeader == prop.groupHeader) {
                            colSpan++;
                            $theadRow2.append("<th class='{1}'>{0}</th>".format(curCellToPrint2.prop.text, (curCellToPrint2.prop.thClass || "")));
                            curCellToPrint2.isPrinted = true;
                        }
                    }

                    $theadRow1.append("<th colspan='{1}'>{0}</th>".format(prop.groupHeader, colSpan));
                } else {
                    $theadRow1.append("<th class='{1}' rowspan='2'>{0}</th>".format(prop.text, (prop.thClass || "")));
                    curCellToPrint.isPrinted = true;
                }
            }
        }

        var groupedHeaderExists = false;
        for (var propName in ret.objectSchema) {
            var prop = ret.objectSchema[propName];
            if (prop.groupHeader) {
                groupedHeaderExists = true;
                break;
            }
        }
        if (groupedHeaderExists == false) {
            printPlainHeader();
        } else {
            printGroupedHeader();
        }



        ret._ui.$table.append(ret._ui.$thead);
        ret._ui.$table.append(ret._ui.$tbody);

        var $tableHolder = $("<div class='items-editor-table-wrapper'>");
        $tableHolder.append(ret._ui.$table);
        $widget.append($tableHolder);

        var tryPrintNoRows = function () {
            if (ret._ui.$tbody.find("tr").length == 0) {
                ret._ui.$tbody.append("<tr class='no-rows {2}'><td colspan='{1}'>{0}</td></tr>".format(T("Нет записей"), ret._ui.$table.find("thead th").length, settings.uiCss.noRowsClass));
            }
        };

        ret._ui.$tbody.empty();
        for (var index = 0; index < ret._items.length; index++) {
            var item = ret._items[index];
            if (!item)
                continue;
            var $tr = $("<tr>");
            printItemToTr(item, $tr);
            ret._ui.$tbody.append($tr);
        }
        tryPrintNoRows();

        $removeAllBtn.click(function () {
            var $dialog = $("<div>{0}</div>".format(T("Удалить все записи?")));
            $dialog.dialog({
                modal: true,
                title: "Удаление",
                buttons: [
                    {
                        text: "Да",
                        click: function () {
                            ret.setItems([]);
                            $dialog.dialog("close");
                            $dialog.remove();
                        }
                    }, {
                        text: "Отмена",
                        click: function () {
                            $dialog.dialog("close");
                            $dialog.remove();
                        }
                    }
                ]
            });
        });

        $addBtn.click(function () {
            showEditor(options.defaultVal == undefined ? null : options.defaultVal, function (editedVal) {
                editedVal._efInternalId = efGenId();
                editedVal._errors = settings.callbacks.onValidate(editedVal);
                var $tr = $("<tr>");
                printItemToTr(editedVal, $tr);
                ret._ui.$tbody.append($tr);
                ret._items.push(editedVal);
                ret._ui.$tbody.find("tr.no-rows").remove();

                settings.callbacks.onSourceChanged();
            });
        });




        $addTabbedCsvString.click(function () {
            var $dialog = $("<div><textarea rows='25' cols='200'></textarea></div>");
            $dialog.dialog({
                modal: true,
                width: $(document).width() - 150,
                title: T("Группа записей"),
                buttons: [
                    { text: "Ok", click: function () {
                        var csvVal = getPreparedCsv($dialog.find("textarea").val());
                        var lines = $.csv.toArrays(csvVal, { separator: '\t' });
                        for (var index = 0; index < lines.length; index++) {
                            var val = ret._editor.parse(lines[index]);

                            val._efInternalId = efGenId();
                            val._errors = settings.callbacks.onValidate(val);
                            ret._items.push(val);

                            var $tr = $("<tr>");
                            printItemToTr(val, $tr);
                            ret._ui.$tbody.append($tr);
                        }
                        if (lines.length > 0) {
                            ret._ui.$tbody.find("tr.no-rows").remove();
                        }
                        settings.callbacks.onSourceChanged();
                        $dialog.dialog("close");
                        $dialog.remove();
                    }
                    },
                    { text: T("Отмена"), click: function () {
                        $dialog.dialog("close");
                        $dialog.remove();
                    }
                    },
                ]
            });
        });

        $addTabbedCsvStringWithHeaders.click(function () {
            var $dialog = $("<div><div><span>Внимание! Первая строка должна содержать наименование столбцов.</span></div> <textarea rows='25' cols='200'></textarea></div>");
            $dialog.dialog({
                modal: true,
                width: $(document).width() - 150,
                title: "Группа записей",
                buttons: [
                    { text: "Ok", click: function () {
                        var lines = Papa.parse($dialog.find("textarea").val()).data;
                        if (lines.length < 2) {
                            alert("Необходимо добавить записи");
                            return;
                        }
                        var headerLine = lines[0];

                        settings.callbacks.onAddMultiWithHeadersDetected(headerLine);

                        var headers = [];
                        var notFoundedHeaders = [];
                        var founededHeaders = [];
                        for (var i = 0; i < headerLine.length; i++) {
                            var curHeaderText = headerLine[i];
                            var founded = false;
                            for (var key in ret.objectSchema) {
                                if (!ret.objectSchema.hasOwnProperty(key)) {
                                    continue;
                                }

                                if (ret.objectSchema[key].text == curHeaderText) {
                                    founded = true;
                                    headers.push(key);
                                    founededHeaders.push(key);
                                }
                            }
                            if (founded == false) {
                                headers.push(null);
                                notFoundedHeaders.push(curHeaderText);
                            }
                        }

                        if (notFoundedHeaders.length > 0 && settings.callbacks.onAddMultiHeadersNotFound(notFoundedHeaders) != true) {
                            return;
                        }

                        settings.callbacks.onAddMultiWithHeadersParsed(founededHeaders);

                        for (var index = 1; index < lines.length; index++) {
                            var curLine = lines[index];
                            var curObj = {};
                            for (var hIndex = 0; hIndex < headers.length; hIndex++) {
                                var curHeader = headers[hIndex];
                                if (curHeader == null)
                                    continue;
                                curObj[curHeader] = curLine[hIndex];
                            }

                            var val = ret._editor.parseObject(curObj);

                            val._efInternalId = efGenId();
                            val._errors = settings.callbacks.onValidate(val);
                            ret._items.push(val);

                            var $tr = $("<tr>");
                            printItemToTr(val, $tr);
                            ret._ui.$tbody.append($tr);
                        }
                        if (lines.length > 0) {
                            ret._ui.$tbody.find("tr.no-rows").remove();
                        }
                        settings.callbacks.onSourceChanged();
                        $dialog.dialog("close");
                        $dialog.remove();
                    }
                    },
                    { text: "Отмена", click: function () {
                        $dialog.dialog("close");
                        $dialog.remove();
                    }
                    },
                ]
            });
        });


        function getItemIndexById(itemId) {
            for (var i = 0; i < ret._items.length; i++) {
                var curItem = ret._items[i];
                if (!curItem)
                    continue;
                if (curItem._efInternalId == itemId) {
                    return i;
                }
            }
            return -1;
        }

        ret._getItemIndexById = getItemIndexById;

        ret._ui.$table.delegate(".edit-item", "click", function () {
            var $tr = $(this).closest("tr");
            var itemId = $tr.attr("_itemId");
            var itemValIndex = getItemIndexById(itemId);
            var itemVal = ret._items[itemValIndex];
            showEditor(itemVal, function (editedVal) {
                editedVal._efInternalId = ret._items[itemValIndex]._efInternalId;
                ret._items[itemValIndex] = editedVal;
                editedVal._errors = settings.callbacks.onValidate(editedVal);
                printItemToTr(editedVal, $tr);
                settings.callbacks.onSourceChanged();
            });
        });

        ret._ui.$table.delegate(".remove-item", "click", function () {
            var $tr = $(this).closest("tr");
            var $dialog = $("<div>{0}</div>".format(T("Удалить запись?")));
            $dialog.dialog({
                modal: true,
                title: T("Удаление"),
                buttons: [
                    { text: T("Да"), click: function () {
                        var itemId = $tr.attr("_itemId");
                        var itemValIndex = getItemIndexById(itemId);
                        ret._items[itemValIndex] = undefined;
                        $tr.remove();
                        tryPrintNoRows();
                        settings.callbacks.onSourceChanged();

                        $dialog.dialog("close");
                        $dialog.remove();
                    }
                    },
                    { text: T("Отмена"), click: function () {
                        $dialog.dialog("close"); $dialog.remove();
                    }
                    },
                ]
            });
        });

        if (settings.buttons.add == true) {
            $addBtn.show();
        }
        if (settings.buttons.addMulti == true) {
            $addTabbedCsvString.show();
        }
        if (settings.buttons.addMultiWithHeader == true) {
            $addTabbedCsvStringWithHeaders.show();
        }
        if (settings.buttons.removeAll == true) {
            $removeAllBtn.show();
        }
    };


    ret.setObjectSchema = function (objSchema) {
        ret.objectSchema = objSchema;
        ret.rebuildUi();
    };

    ret.setItems = function (items, suppressSourceChangedEvent) {
        ret._items = items;
        for (var i = 0; i < ret._items.length; i++) {
            var curItem = ret._items[i];
            curItem._efInternalId = efGenId();
            curItem._errors = settings.callbacks.onValidate(curItem);
        }
        ret.rebuildUi();
        if (suppressSourceChangedEvent != true) {
            settings.callbacks.onSourceChanged();    
        }
    };

    ret.appendItems = function (items) {
        for (var i = 0; i < items.length; i++) {
            var val = items[i];
            val._efInternalId = efGenId();
            val._errors = settings.callbacks.onValidate(val);
            ret._items.push(val);

            var $tr = $("<tr>");
            ret._printItemToTr(val, $tr);
            ret._ui.$tbody.append($tr);
        }
        if(items.length>0) {
            ret._ui.$tbody.find("tr.no-rows").remove();
        }
        settings.callbacks.onSourceChanged();
    };

    ret.getItemFromTr = function ($tr) {
        var itemId = $tr.attr("_itemId");
        var itemValIndex = ret._getItemIndexById(itemId);
        var retItem = JSON.parse(JSON.stringify(ret._items[itemValIndex]));
        delete retItem._efInternalId;
        delete retItem._errors;
        return retItem;
    };

    ret.getItems = function () {
        var retItems = [];

        //deep copy
        var items = JSON.parse(JSON.stringify(ret._items));

        for (var i = 0; i < items.length; i++) {
            var curItem = items[i];
            if (!curItem)
                continue;

            delete curItem._efInternalId;
            delete curItem._errors;
            retItems.push(curItem);
        }
        return retItems;
    };
    
    ret.$widget = $widget;

    ret.setItems([], true);
    
    return ret;
}

(function ($) {
    $.widget("yoda.listEditor", {
        _create: function () {
            var editor = getListEditorWidget(this.options.schema, this.options);
            if(this.options.items) {
                editor.setItems(this.options.items);
            }
            this.element.append(editor.$widget);
            this.editor = editor;
        },
        readonly: function(isReadonly) {
            this.editor.settings.readonly = isReadonly;
            this.editor.rebuildUi();
        },
        setItems:function (items) {
            this.editor.setItems(items);
        },
        getItems:function () {
            return this.editor.getItems();
        },
        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));



registerEditorProvider("int", {
    getWidget: function (options) {
        var $ret = $("<input type='text' dataType='int' class='form-control'/>");
        if (options.readonly == true) {
            $ret.prop("disabled", true);
        }
        return $ret;
    },
    setValue: function ($widget, value) {
        $widget.val(value);
    },
    getValue: function ($widget) {
        return $widget.val();
    },
    getText: function (value) {
        return value;
    },
    parse: function (text) {
        return text;
    },
    setEnabled: function($widget, enabled) {
        $widget.prop("readonly", enabled != true);
    },
    setOnValueChangedCallback: function ($widget, callback) {
        $widget.change(function () {
            callback($widget.val());
        });
    }
});

registerEditorProvider("decimal", {
    getWidget: function (options) {
        var $input = $("<input type='text' dataType='decimal' class='form-control'/>");
        if (options.readonly == true) {
            $input.attr("disabled", true);
        }
        return $input;
    },
    setValue: function ($widget, value) {
        $widget.val(value);
    },
    getValue: function ($widget) {
        return $widget.val();
    },
    getText: function (value) {
        return value;
    },
    parse: function (text) {
        return text;
    },
    setEnabled: function($widget, enabled) {
        $widget.prop("readonly", enabled != true);
    },
    setOnValueChangedCallback: function ($widget, callback) {
        $widget.change(function () {
            callback($widget.val());
        });
    }
});



registerEditorProvider("text", {
    getWidget: function (options) {
        if (options.multiline == true) {
            return $("<textarea />");
        }
        var $input = $("<input type='text' class='form-control'/>");
        if (options.readonly == true) {
            $input.attr("disabled", true);
        }
        return $input;
    },
    setValue: function ($widget, value) {
        $widget.val(value);
    },
    getValue: function ($widget) {
        return $widget.val();
    },
    getText: function (value, options) {
        if(options.multiline == true) {
            return (value+"").replace(/(?:\r\n|\r|\n)/g, '<br />');
        }
        return value;
    },
    parse: function (text) {
        return text;
    },
    setEnabled: function($widget, enabled) {
        $widget.prop("readonly", enabled != true);
    },
    setOnValueChangedCallback: function ($widget, callback) {
        $widget.change(function () {
            callback($widget.val());
        });
    }
});

registerEditorProvider("date", {
    getWidget: function (options) {
        var $widget = $("<input type='text' dataType='date' class='form-control'/>");
        $widget.datepicker({ dateFormat: 'dd.mm.yy', changeYear: true, changeMonth: true, yearRange: '1991:2030' });
        return $widget;
    },
    setValue: function ($widget, value) {
        $widget.val(value);
    },
    getValue: function ($widget) {
        return $widget.val();
    },
    getText: function (value) {
        return value;
    },
    parse: function (text) {
        return text;
    },
    setEnabled: function($widget, enabled) {
        $widget.prop("readonly", enabled != true);
    },
    setOnValueChangedCallback: function ($widget, callback) {
        $widget.change(function () {
            callback($widget.val());
        });
    }
});

registerEditorProvider("datetime", {
    getWidget: function (options) {
        var $widget = $("<input type='text' dataType='datetime' class='form-control'/>");
        $widget.datetimepicker({controlType: 'select'});
        return $widget;
    },
    setValue: function ($widget, value) {
        $widget.val(value);
    },
    getValue: function ($widget) {
        return $widget.val();
    },
    getText: function (value) {
        return value;
    },
    parse: function (text) {
        return text;
    },
    setEnabled: function($widget, enabled) {
        $widget.prop("readonly", enabled != true);
    },
    setOnValueChangedCallback: function ($widget, callback) {
        $widget.change(function () {
            callback($widget.val());
        });
    }
});



registerEditorProvider("reference", {
    getWidget: function (options) {
        if (options.refLevel == undefined) {
            options.refLevel = -1;
        }

        var reference = options.reference;
        var input = "";
        var buildOptions = function (items, curLevel, maxLevel) {
            for (var index = 0; index < items.length; index++) {
                var refItem = items[index];
                if (curLevel < maxLevel && refItem.Items != undefined && refItem.Items != null && refItem.Items.length > 0) {
                    input += "<optgroup label='{0}'>".format(refItem.Text);
                    buildOptions(refItem.Items, curLevel + 1, maxLevel);
                    input += "</optgroup>";
                } else {
                    input += "<option value='{0}'>{1}</option>".format(refItem.Value, refItem.Text);
                }
            }
        };

        input = "<select refName='{0}' refLevel='{1}' class='form-control'>".format(options.refName, options.refLevel);
        input += "<option disabled selected value='NULL'>-</option>";

        /*не печатаем вложенные элементы справочников. это делается при вызове метода onObjEditorBuildComplete текущего редактора*/
        if (options.refLevel == -1) {
            buildOptions(reference, 0, 10);
        } else if (options.refLevel == 0) {
            buildOptions(reference, 0, 0);
        }

        input += "</select>";
        
        var $input = $(input);
        if(options.readonly == true){
            $input.prop("disabled", true);
        }
        return $input;
    },
    setValue: function ($widget, value) {
        var curVal = this.getValue($widget);
        if (value == null || value == undefined || value == "") {
            $widget.val("NULL");
            if(curVal) {
                $widget.change();
            }
            return;
        }
        $widget.attr("setted-value", value);
        $widget.val(value);
        if(curVal!=value){
            $widget.change();
        }
    },
    getValue: function ($widget) {
        var val = $widget.val();
        if (val == "NULL")
            return "";
        return val;
    },
    getText: function (value, options) {
        var reference = options.reference;
        var find;
        find = function (refItems) {
            for (var index = 0; index < refItems.length; index++) {
                var ri = refItems[index];
                if (ri.Value == value) {
                    return ri.Text;
                }
                if (ri.Items != undefined && ri.Items != null) {
                    var foundedText = find(ri.Items);
                    if (foundedText != null)
                        return foundedText;
                }
            }
            return null;
        };
        var ret = find(reference);
        if (ret == null)
            return "";
        return ret;
    },
    parse: function (text, options) {
        var reference = options.reference;
        var find;
        find = function (refItems) {
            for (var index = 0; index < refItems.length; index++) {
                var ri = refItems[index];
                if (ri.Text == text) {
                    return ri.Value;
                }
                if (ri.Items != undefined && ri.Items != null) {
                    var foundedVal = find(ri.Items);
                    if (foundedVal != null)
                        return foundedVal;
                }
            }
            return null;
        };
        var ret = find(reference);
        if (ret == null)
            return "";
        return ret;
    },
    setEnabled: function($widget, enabled) {
        $widget.prop("disabled", enabled != true);
    },
    setOnValueChangedCallback: function ($widget, callback) {
        $widget.change(function () {
            callback($widget.val());
        });
    },
    onObjEditorBuildComplete: function ($fullWidget, $widget, options) {
        if (options.refLevel == undefined)
            return;
        if (options.refLevel > 0) {
            var findRefChildItems = null;
            findRefChildItems = function (refItems, parentVal) {
                for (var index = 0; index < refItems.length; index++) {
                    var refItem = refItems[index];
                    if (refItem.Value == parentVal) {
                        if (refItem.Items == undefined && refItem.Items != null) {
                            return new Array();
                        }
                        return refItem.Items;
                    }
                    if (refItem.Items != undefined && refItem.Items != null) {
                        var ret = findRefChildItems(refItem.Items, parentVal);
                        if (ret != null)
                            return ret;
                    }
                }
                return null;
            };

            var $parentSelect = $fullWidget.find("select[refName='{0}'][refLevel='{1}']".format(options.refName, options.refLevel - 1));
            $parentSelect.change(function () {
                var val = $parentSelect.val();
                var refItems = findRefChildItems(options.reference, val);
                if (refItems == null)
                    refItems = new Array();
                $widget.empty();
                $widget.append("<option disabled selected value='NULL'>-</option>");
                for (var index = 0; index < refItems.length; index++) {
                    var refItem = refItems[index];
                    $widget.append("<option value='{0}'>{1}</option>".format(refItem.Value, refItem.Text));
                }
                var valTriedToSet = $widget.attr("setted-value");

                $widget.val(valTriedToSet);
                $widget.change();
            });
        }
    }
});