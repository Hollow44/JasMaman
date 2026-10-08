$(document).ready(
    function ($) {
        $(".cs-editor").each(function () {
            var $editor = $(this);
            var getTableListUrl = $editor.attr("get-qunits-url");
            var queryExecuteUrl = $editor.attr("query-execute-url");
            var storeQueryInSessionUrl = $editor.attr("store-query-in-session-url");
            var downloadStoredQueryResult = $editor.attr("download-stored-query-result-url");
            var saveQueryUrl = $editor.attr("save-query-url");
            var loadSavedQueriesListUrl = $editor.attr("load-saved-queries-list-url");
            var loadSavedQueryUrl = $editor.attr("load-saved-query-url");
            var removeSavedQueryUrl = $editor.attr("remove-saved-query-url");
            getQUnits(getTableListUrl, function (qUnits) {
                $editor.complexSearchEditor({ qUnits: qUnits, qUnitsSchemas: [],
                    queryExecuteUrl: queryExecuteUrl,
                    storeQueryInSessionUrl: storeQueryInSessionUrl,
                    downloadStoredQueryResult: downloadStoredQueryResult,
                    saveQueryUrl: saveQueryUrl,
                    loadSavedQueriesListUrl: loadSavedQueriesListUrl,
                    loadSavedQueryUrl: loadSavedQueryUrl,
                    removeQueryUrl: removeSavedQueryUrl
                });
            });
        });

        $(".cs-group-search").each(function () {
            var $editor = $(this);
            var qUnitsXml = $editor.attr("qUnits");
            var qUnits = parseQUnitsXml(qUnitsXml);

            var $reportsList = $("<div class='cs-group-search-reports-list'>");
            for (var i = 0; i < qUnits.length; i++) {
                var $repItem = $("<div><span class='cs-group-search-rep-item' rep-name='{0}'>{1}</span></div>".format(qUnits[i].name, qUnits[i].text));
                $reportsList.append($repItem);
            }
            $editor.append($reportsList);
            var getQUnitByName = function (qUnitName) {
                for (var i = 0; i < qUnits.length; i++) {
                    if (qUnits[i].name == qUnitName)
                        return qUnits[i];
                }
                return null;
            };
            $editor.delegate(".cs-group-search-rep-item", "click", function () {
                var $this = $(this);
                $editor.find(".cs-group-search-rep-item").removeClass("rep-item-selected");
                $this.addClass("rep-item-selected");
                var qUnit = getQUnitByName($this.attr("rep-name"));
                $[qUnit.schemaHandler.name](qUnit, function (qUnitSchemaModified) {
                    var $input = $("<input type='hidden' name='selected-qunit-schema'>");
                    $input.val(qUnitToXml(qUnitSchemaModified));
                    $editor.append($input);
                    $editor.closest("form").submit();
                }, function () { }, []);

            });
        });
        $(".cs-group-search-select-main-table-fields").click(function () {
            var $this = $(this);
            var fields = JSON.parse($this.attr("main-table-fields"));
            var $selectFieldsPanel = $("<div>");
            for (var i = 0; i < fields.length; i++) {
                var $itemContainer = $("<div>");
                $itemContainer.appendTo($selectFieldsPanel);
                var $checkbox = $("<input type='checkbox' name='{0}' id='mf_{0}'/><label for='mf_{0}'>{1}</label>".format(fields[i].FieldName, fields[i].FieldText));
                if (fields[i].Selected == true) {
                    $checkbox.attr("checked", true);
                }
                $itemContainer.append($checkbox);
            }

            $selectFieldsPanel.dialog({
                title: "Выбор полей объекта",
                modal: true,
                buttons: [
                        { text: "OK", click: function () {
                            var selectedFieldsArr = new Array();
                            $selectFieldsPanel.find(":checked").each(function () {
                                selectedFieldsArr.push($(this).attr("name"));
                            });
                            var $form = $this.closest("form");
                            $form.find("#selected-main-table-fields-json").val(JSON.stringify(selectedFieldsArr));
                            $form.find(".exec-search-query").click();
                            $form.submit();
                        }
                        },
                        { text: "Отмена", click: function () {
                            $selectFieldsPanel.dialog("close");
                        }
                        }
                    ],
                close: function () {
                    $selectFieldsPanel.dialog("destroy");
                    $selectFieldsPanel.remove();
                }
            });
        });
        
        $(".cs-group-search-select-rep-fields").click(function () {
            var $this = $(this);
            var qUnitXml = $this.attr("qunit-schema");
            var qUnitSchema = qUnitFromQUnitXmlNode($(qUnitXml));
            var qUnitsXml = $this.attr("qUnits");
            var qUnits = parseQUnitsXml(qUnitsXml);
            var getQUnitByName = function (qUnitName) {
                for (var i = 0; i < qUnits.length; i++) {
                    if (qUnits[i].name == qUnitName)
                        return qUnits[i];
                }
                return null;
            };
            var qUnit = getQUnitByName(qUnitSchema.name);
            $[qUnit.schemaHandler.name](qUnit, function (qUnitSchemaModified) {
                var $form = $this.closest("form");
                var $input = $form.find("#selected-qunit-schema");
                $input.val(qUnitToXml(qUnitSchemaModified));

                $form.find(".exec-search-query").click();
                $form.submit();
            }, function () { }, qUnitSchema.fields);
        });

    }
);

function getQUnits(getQUnitsUrl, successCallback) {
    $.ajax({
        url: getQUnitsUrl,
        success: function (xml) {
            var qUnits = parseQUnitsXml(xml.Xml);
            successCallback(qUnits);
        }
    });
}

function parseQUnitsXml(xml) {
    var qUnits = [];
    var $tableListXml = $toXmlObject(xml);
    $tableListXml.find("QUnits").find("QUnit").each(function () {
        var qUnitNode = $(this);
        var qUnit = {
            name: qUnitNode.attr("Name"),
            text: qUnitNode.attr("Text"),
            canBeRoot: qUnitNode.attr("CanBeRoot") == "True",
            schemaHandler: {}
        };
        var handler = qUnitNode.find("JQueryHandler");
        qUnit.schemaHandler = {
            name: handler.attr("Name"),
            params: []
        };
        var params = handler.find("HandlerParam");
        params.each(function () {
            var param = $(this);
            qUnit.schemaHandler.params.push({
                name: param.attr("name"),
                value: param.attr("value")
            });
        });
        qUnits.push(qUnit);
    });
    return qUnits;
}