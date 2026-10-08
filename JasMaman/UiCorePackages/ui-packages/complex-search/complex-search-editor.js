(function ($) {
    $.widget("yoda.complexSearchEditor", {
        _create: function () {
            var self = this;
            var qUnits = self.options.qUnits; //find all queryMeta
            var queryExecuteUrl = self.options.queryExecuteUrl;
            var $editor = self._$getLayoutMarkup();
            self.element.append($editor);

            var $qUnitsList = $editor.find(".cs-qunits-list");
            $qUnitsList.disableSelection();

            qUnits.forEach(function (qUnit) {
                var $qUnitItem = $("<span class='cs-qunit-item' name='{0}' text='{1}'>{1}</span>".format(qUnit.name, qUnit.text));
                if(qUnit.canBeRoot == true) {
                    $qUnitItem.addClass("can-be-root");
                }
                $qUnitsList.append($qUnitItem);
                $qUnitItem.draggable({ revert: true, helper: "clone" });
            });

            var $savedQueries = $editor.find(".cs-saved-queries-list");
            $savedQueries.disableSelection();

            var $queriesSection = $editor.find(".cs-queries-list");
            $queriesSection.disableSelection();
            var $queryToolbar = $editor.find(".cs-query-toolbar:first");
            var $queryExecuteResultSection = $editor.find(".cs-query-action-workarea");
            var $appendNewQueryContainer = $("<div class='new-query-container'>{0}</div>".format("Новый запрос"));
            $queriesSection.append($appendNewQueryContainer);

            $queryExecuteResultSection.width($queryToolbar.width());

            $(window).resize(function () {
                $queryExecuteResultSection.width(100);
                var toolbarWidth = $queryToolbar.width();
                $queryExecuteResultSection.width(toolbarWidth);
            });

            $appendNewQueryContainer.droppable({
                accept: ".cs-qunit-item,.cs-saved-query-item",
                activeClass: "cs-new-query-active",
                /*cancel: "span",*/
                drop: function (event, draggedQueryItemUi) {
                    if (draggedQueryItemUi.draggable.hasClass("cs-saved-query-item")) {
                        var queryName = draggedQueryItemUi.draggable.attr("queryName");
                        self._loadQuery(queryName);
                    } else {
                        var draggedQUnit = self._getQUnitItemInfo($(draggedQueryItemUi.draggable));
                        if(draggedQUnit.canBeRoot !== true) {
                            alert(T("Для составление нового запроса сначала разместите элементы со звездочкой."));
                            return;
                        }
                            
                        var $query = self._$getQueryContainerMarkup();
                        $query.attr("query-disabled", "true");
                        var $ajaxLoad = $(getAjaxLoadHtmlMarkup());
                        $query.append($ajaxLoad);
                        $queriesSection.append($query);
                        
                        draggedQUnit.id = self._getQUnitId(draggedQUnit.name);
                        self._onQUnitItemDrop(draggedQUnit, function() {
                            $query.attr("query-disabled", "false");
                            var $tableMarkup = self._$getTableMarkupForAddToQuery(draggedQUnit, false);
                            $ajaxLoad.remove();
                            $query.append($tableMarkup);
                            self._addEventTableDropped($tableMarkup);
                        }, function() {
                            $query.remove();
                        });
                    }
                }

            });

            $queriesSection.delegate(".cs-join-condition", "click", function () {
                var $joinCondition = $(this);
                var $joinedTable = $joinCondition.closest(".cs-query-table");
                var jsonJoinCondition = $joinedTable.attr("json-join-condition");
                var joinConditionsGroup = JSON.parse(jsonJoinCondition);

                var $joinedToTable = $joinedTable.parent().closest(".cs-query-table");
                var $queryRootTable = self._$getQueryRootTable($joinedToTable);
                var leftQuerySchemaTable = self._getQuerySchemaTableForSegment(self, $queryRootTable, self._getTableInfoFromJoinedTable($joinedToTable));
                var rightQuerySchemaTable = self._getTableInfoFromJoinedTable($joinedTable);
                self._prepareQUnitSchemasForConditions();
                self._showJoinConditionsGroupDialog(leftQuerySchemaTable, rightQuerySchemaTable, joinConditionsGroup, function (conditionsGroup) {
                    $joinedTable.attr("json-join-condition", JSON.stringify(conditionsGroup));
                },
                    function () {
                        self._resetQUnitSchemasToDefault();
                    }
                );
            });
            $queriesSection.delegate(".cs-join-type", "click", function() {
                var $joinType = $(this);
                var $joinedTable = $joinType.closest(".cs-query-table");
                var $div = $("<div>");
                $div.append("<span class='cs-join-type-item' joinType='inner'>Сильная связка</span>");
                $div.append("<span class='cs-join-type-item' joinType='left'>Слабая связка</span>");
                $div.delegate(".cs-join-type-item", "click", function() {
                    var joinType = $(this).attr("joinType");
                    $joinedTable.attr("joinType", joinType);
                    $joinedTable.find(".cs-join-condition:first").removeClass("cs-join-type-inner cs-join-type-left").addClass("cs-join-type-" + joinType);
                    $div.filterDialog("destroy");
                });

                $div.filterDialog({
                    title: "Выберите тип связки",
                    of: $joinType
                });
            });
            $queriesSection.delegate(".cs-query-table-title", "click", function () {
                var $this = $(this);
                $queryExecuteResultSection.children(".cs-query-result-section-empty").remove();
                $queryExecuteResultSection.children(".cs-query-result-content").hide();
                $queriesSection.find(".cs-selected-query-table").removeClass("cs-selected-query-table");
                $queriesSection.find(".selected-item").removeClass("selected-item");
                $this.addClass("cs-selected-query-table");
                $this.closest(".cs-query-table-title-wrapper").children(".cs-query-table-begin-corner").addClass("selected-item");
                $queryToolbar.empty();
                $queryToolbar.append("<span class='cs-query-filter' title='{0}'></span>".format("Установить фильтр"));
                $queryToolbar.append("<span class='cs-query-show-result' title='{0}'></span>".format("Показать результат запроса"));
                $queryToolbar.append("<span class='cs-query-convert-to-excel' title='{0}'></span>".format("Конвертировать результат запроса в Excel"));
                $queryToolbar.append("<span class='cs-query-group-by' title='{0}'></span>".format("Ограничение на дублирование записей"));
                $queryToolbar.append("<span class='cs-query-edit-schema' title='{0}'></span>".format("Изменить выбранные поля"));

                var $queryTable = $this.closest(".cs-query-table");
                var tableId = $queryTable.attr('id');
                var $content = $queryExecuteResultSection.find(".cs-query-result-content[tableId='{0}']".format(tableId));
                if ($content.length != 0) {
                    $content.show();
                } else {
                    $queryExecuteResultSection.append("<div class='cs-query-result-content' tableId='{0}'><div class='cs-query-result-content-empty'>{1}</div></div>".format(tableId, "Пусто. Для просмотра результата выборки нажмити кнопку \"Показать результат запроса\"."));
                }
            });
            $queriesSection.delegate(".cs-query-save", "click", function () {
                var $query = $(this).closest(".cs-query");
                if($query.attr("query-disabled")== "true") {
                    return;
                }
                var $queryTitle = $query.find(".cs-query-title");
                var queryText = $queryTitle.attr("text");
                if (!isNullOrUndefined(queryText) && queryText != "") {
                    self._saveQuery($query, queryText);
                    return;
                }
                queryText = "";
                self._showNameInputDialog(queryText, function (inputText) {
                    $queryTitle.text("Запрос: " + inputText);
                    $queryTitle.attr("title", inputText);
                    $queryTitle.attr("text", inputText);
                    self._saveQuery($query, inputText);
                });
            });
            $queriesSection.delegate(".cs-query-save-as", "click", function () {
                var $query = $(this).closest(".cs-query");
                if($query.attr("query-disabled")== "true") {
                    return;
                }
                var $queryTitle = $query.find(".cs-query-title");
                var queryText = $queryTitle.attr("text");
                if (isNullOrUndefined(queryText)) {
                    queryText = "";
                }
                self._showNameInputDialog(queryText, function (inputText) {
                    $queryTitle.text("Запрос: " + inputText);
                    $queryTitle.attr("title", inputText);
                    $queryTitle.attr("text", inputText);
                    self._saveQuery($query, inputText);
                });
            });

            $queriesSection.delegate(".cs-query-remove", "click", function () {
                var $query = $(this).closest(".cs-query");
                if ($query.find(".cs-selected-query-table").length > 0) {
                    self._initEmptyWorkArea($editor);
                }
                $query.remove(); //TODO clear qUnitSchemas

            });

            var $getSelectedTable = function () {
                return $queriesSection.find(".cs-selected-query-table").closest(".cs-query-table");
            };
            
            $queryToolbar.delegate(".cs-query-filter", "click", function () {
                var $table = $getSelectedTable();
                var $allJoinedTables = $table.find(".cs-query-table");
                var $mostButtomJoinedTable;
                if ($allJoinedTables.length > 0) {
                    $mostButtomJoinedTable = $allJoinedTables[$allJoinedTables.length - 1];
                } else {
                    $mostButtomJoinedTable = $table;
                }
                var leftQuerySchemaTable = self._getQuerySchemaTableForSegment(self, $table, $mostButtomJoinedTable);
                var conditionsGroup = null;
                var filterConditionJsonValue = $table.attr("json-filter-condition");
                if (!isNullOrUndefined(filterConditionJsonValue) && filterConditionJsonValue != "") {
                    conditionsGroup = JSON.parse(filterConditionJsonValue);
                }
                self._prepareQUnitSchemasForConditions(false);
                self._showJoinConditionsGroupDialog(leftQuerySchemaTable, leftQuerySchemaTable, conditionsGroup, function (editorConditionsGroup) {
                    $table.attr("json-filter-condition", JSON.stringify(editorConditionsGroup));
                },
                    function () {
                        self._resetQUnitSchemasToDefault();
                    });
            });
            
            $queryToolbar.delegate(".cs-query-show-result", "click", function () {
                var $selectedTable = $getSelectedTable();
                self._getExecuteQuery(self, $selectedTable, function (queryXml) {
                    var tableId = $selectedTable.attr("id");
                    $queryExecuteResultSection.children(".cs-query-result-content[tableId='{0}']".format(tableId)).remove();
                    var $content = $("<div class='cs-query-result-content' tableId='{0}'>".format(tableId));
                    $queryExecuteResultSection.append($content);
                    $content.append(getAjaxLoadHtmlMarkup());
                    $.ajax({
                        url: queryExecuteUrl,
                        type: "POST",
                        data: { queryXml: queryXml },
                        success: function (html) {
                            $content.html(html);
                            callAllReadyInObjectContext($content);
                        }
                    });
                });
            });
            $queryToolbar.delegate(".cs-query-convert-to-excel", "click", function () {
                self._getExecuteQuery(self, $getSelectedTable(), function (queryXml) {
                    $.ajax({
                        url: self.options.storeQueryInSessionUrl,
                        type: "POST",
                        data: { queryXml: queryXml },
                        dataType: "JSON",
                        success: function (queryId) {
                            var downloadUrl = self.options.downloadStoredQueryResult.replace("(QueryId)", queryId.QueryId);
                            $('body').find("iframe").remove();
                            var $frame = $("<iframe name='download-query-result-file'>");
                            $("body").append($frame);
                            $frame.hide();
                            $frame.attr("src", downloadUrl);
                        }
                    });
                });
            });

            $queryToolbar.delegate(".cs-query-edit-schema", "click", function() {
                var $table = $getSelectedTable();
                var id = $table.attr("id");
                
                self.options.qUnitsSchemas.forEach(function(qUnitSchema) {
                    if(qUnitSchema.id == id) {
                        
                        self.options.qUnits.forEach(function(qUnit) {
                            if(qUnit.name == qUnitSchema.name) {
                                $[qUnit.schemaHandler.name](qUnit, function(qUnitSchemaModified) {
                                    qUnitSchemaModified.id = qUnitSchema.id;
                                    self.options.qUnitsSchemas.push(qUnitSchemaModified);
                                    if (qUnitSchema != null)
                                        self.options.qUnitsSchemas.remove(qUnitSchema);
                                }, 
                                function() {}, 
                                qUnitSchema.fields);
                            }
                        });
                    }
                });
            });

            $queryToolbar.delegate(".cs-query-group-by", "click", function () {
                var $fields = $("<div class='cs-query-group-by-editor-fields-tree' style='height: 600px; overflow:scroll;'>");
                var $table = $getSelectedTable();

                var rowNumOver = {
                    partitionBy: [],
                    orderBy: []
                };
                var jsonRowNumOver = $table.attr("json-row-num-over");
                if (!isNullOrUndefined(jsonRowNumOver)) {
                    rowNumOver = JSON.parse(jsonRowNumOver);
                }

                var $lastChildTable = self._$getTableLastChildren($table);
                var querySchema = self._getQuerySchemaTableForSegment(self, $table, $lastChildTable);
                $fields.querySchemaFieldsTree({
                    querySchema: querySchema,
                    qUnitsSchemas: self.options.qUnitsSchemas,
                    mode: "none",
                    fieldClass: "cs-draggable-field"
                });
                $fields.find(".cs-draggable-field").draggable({ revert: true, helper: "clone" });

                var $getFieldsDroppableContainer = function (title, $getFieldMarkup) {
                    var $fieldsSortable = $("<ul class='droppable-sortable-fields-list'>");
                    $fieldsSortable.append("<li class='cs-empty-item'>Перетащите сюда поле<li>");
                    $fieldsSortable.sortable({
                        items: "li:not(.cs-empty-item)"
                    });
                    $fieldsSortable.disableSelection();
                    $fieldsSortable.droppable({
                        accept: ".cs-draggable-field",
                        drop: function (event, draggedFieldUi) {
                            var $field = draggedFieldUi.draggable;
                            var field = {
                                parentId: $field.attr("parentId"),
                                name: $field.attr("fieldName")
                            };
                            var $li = $("<li>");
                            $li.append($getFieldMarkup(field));
                            $fieldsSortable.append($li);
                        }
                    });

                    var $fieldsDroppableWrapper = $("<div class='cs-query-fields-droppable-wrapper'>");
                    $fieldsDroppableWrapper.append("<span class='cs-query-fields-droppable-list-title'>{0}</span>".format(title));
                    $fieldsDroppableWrapper.append($fieldsSortable);
                    return $fieldsDroppableWrapper;
                };
                var $getPartitionByFieldSpan = function(field) {
                    return $("<span class='cs-query-item-field' parentId='{0}' fieldName='{1}'>{2}</span><span class='cs-remove-field-item'><span>".format(field.parentId, field.name, self._getFieldText(field)));
                };
                var $partitionByFields = $getFieldsDroppableContainer("Группа полей для разбивки записей", $getPartitionByFieldSpan);
                $partitionByFields.delegate(".cs-remove-field-item", "click", function () {
                    $(this).closest("li").remove();
                });
                rowNumOver.partitionBy.forEach(function(partitionByField) {
                    var $li = $("<li>");
                    $li.append($getPartitionByFieldSpan(partitionByField));
                    $partitionByFields.find("ul").append($li);
                });

                var $getOrderByField = function(field) {
                    return $("<span class='cs-query-item-field-order-type cs-order-asc'></span><span class='cs-query-item-field' parentId='{0}' fieldName='{1}'>{2}</span><span class='cs-remove-field-item'><span>".format(field.parentId, field.name, self._getFieldText(field)));
                };
                var $orderByFields = $getFieldsDroppableContainer("Поля для сортировки", $getOrderByField);

                rowNumOver.orderBy.forEach(function(orderBy) {
                    var $li = $("<li>");
                    $li.append($getOrderByField(orderBy));
                    var $orderType = $li.find(".cs-query-item-field-order-type");
                    $orderType.removeClass("cs-order-asc");
                    if(orderBy.orderType == "desc") {
                        $orderType.addClass("cs-order-desc");
                    }else {
                        $orderType.addClass("cs-order-asc");
                    }
                    $orderByFields.find("ul").append($li);
                });

                $orderByFields.delegate(".cs-query-item-field-order-type", "click", function () {
                    $(this).toggleClass("cs-order-asc cs-order-desc");
                });
                $orderByFields.delegate(".cs-remove-field-item", "click", function () {
                    $(this).closest("li").remove();
                });

                var $groupByEditorLayout = $("<table class='cs-query-group-by'><tr><td class='cs-query-group-by-editor-col1'></td><td class='cs-query-group-by-editor-col2'></td></tr></table>");
                $groupByEditorLayout.find(".cs-query-group-by-editor-col1").append($fields);
                $groupByEditorLayout.find(".cs-query-group-by-editor-col2").append($partitionByFields);
                $groupByEditorLayout.find(".cs-query-group-by-editor-col2").append($orderByFields);


                $groupByEditorLayout.dialog({
                    title: "Выборка первых записей",
                    modal: true,
                    width: 800,
                    height: 600,
                    resizable:false,
                    buttons: [
                        { text: "Ok", click: function () {
                            rowNumOver.partitionBy = [];
                            rowNumOver.orderBy = [];
                            $partitionByFields.find("ul").children("li:not(.cs-empty-item)").each(function () {
                                var $field = $(this).find(".cs-query-item-field");
                                if($field.length == 0)
                                    return;
                                rowNumOver.partitionBy.push({ parentId: $field.attr("parentId"), name: $field.attr("fieldName") });
                            });
                            $orderByFields.find("ul").children("li:not(.cs-empty-item)").each(function () {
                                var $field = $(this).find(".cs-query-item-field");
                                if($field.length == 0)
                                    return;
                                var $orderType = $(this).find(".cs-query-item-field-order-type");
                                var orderByField = {
                                    parentId: $field.attr("parentId"),
                                    name: $field.attr("fieldName"),
                                    orderType: "asc"
                                };
                                if ($orderType.hasClass("cs-order-desc")) {
                                    orderByField.orderType = "desc";
                                }
                                rowNumOver.orderBy.push(orderByField);
                            });

                            $table.attr("json-row-num-over", JSON.stringify(rowNumOver));

                            $groupByEditorLayout.dialog("close");
                        }
                        },
                        { text: T("cancel"), click: function () { $groupByEditorLayout.dialog("close"); } }
                    ],
                    close: function () {
                        $groupByEditorLayout.dialog("destroy");
                        $groupByEditorLayout.remove();
                    }
                });
            });

            $savedQueries.delegate(".cs-remove-saved-query", "click", function () {
                var queryName = $(this).attr("queryName");
                self._removeQuery(queryName);
            });

            self._fillSavedQueriesList();
        },
        _getFieldText: function (field) {
            var fieldText;
            this.options.qUnitsSchemas.forEach(function (qUnitSchema) {
                if (qUnitSchema.id == field.parentId) {
                    qUnitSchema.fields.forEach(function (fieldSchema) {
                        if (field.name == fieldSchema.name) {
                            fieldText = fieldSchema.text;
                        }
                    });
                }
            });
            return fieldText;
        },
        _$getQueryContainerMarkup: function (queryName) {
            var $queryContainer = $("<div class='cs-query'><span class='cs-query-title'>{0}</span><span class='cs-query-save' title='{1}'></span><span class='cs-query-save-as' title='{2}'></span><span class='cs-query-remove' title='{3}'></span></div>".format("Запрос", "Сохранить запрос", "Сохранить запрос как", "Удалить"));
            if (queryName !== undefined) {
                var $queryTitle = $queryContainer.find(".cs-query-title");
                $queryTitle.text("Запрос: " + trimIfLong(queryName));
                $queryTitle.attr("title", queryName);
                $queryTitle.attr("text", queryName);
            }
            return $queryContainer;
        },
        _showNameInputDialog: function (initialText, onTextInputSuccess) {
            var $querySave = $("<div><span>{0}</span><input type='text' name='queryName' value='{1}' style='width:98%'/></div>".format("Имя запроса", initialText));
            $querySave.dialog({
                title: "Укажите имя запроса",
                modal: true,
                buttons: [{
                    text: "Ok",
                    click: function () {
                        var $input = $querySave.find("input");
                        var val = $input.val();
                        if (isNullOrUndefined(val) || val == "") {
                            $input.addClass("cs-query-name-error");
                        } else {
                            //try save
                            onTextInputSuccess(val);
                            $querySave.dialog("destroy");
                        }
                    }
                },
                    {
                        text: T("cancel"),
                        click: function () {
                            $querySave.dialog("destroy");
                        }
                    }
                ]
            });
        },
        _saveQuery: function ($query, queryName) {
            var self = this;
            self._getExecuteQuery(self, $query.find(".cs-query-table:first"), function (queryXml) {
                var $savedQueriesList = self.element.find(".cs-saved-queries-list");
                $savedQueriesList.empty();
                $savedQueriesList.append(getAjaxLoadHtmlMarkup());
                $.ajax({
                    url: self.options.saveQueryUrl,
                    data: { queryName: queryName, queryXml: queryXml },
                    type: "POST",
                    success: function () {
                        self._fillSavedQueriesList();
                    }
                });
            }, false);
        },
        _removeQuery: function (queryName) {
            var self = this;
            
            $.ajax({
                url: self.options.removeQueryUrl,
                data: { queryName: queryName },
                success: function () {
                    self._fillSavedQueriesList();
                }
            });
        },
        _fillSavedQueriesList: function () {
            var self = this;
            var $savedQueriesList = self.element.find(".cs-saved-queries-list");
            $savedQueriesList.empty();
            $savedQueriesList.append(getAjaxLoadHtmlMarkup());
            $.ajax({
                url: self.options.loadSavedQueriesListUrl,
                type: "JSON",
                success: function (savedQueriesList) {
                    $savedQueriesList.empty();
                    savedQueriesList.forEach(function (savedQueryName) {
                        var $savedQueryMarkup = $("<div class='cs-saved-query-item-wrapper'><span class='cs-saved-query-item' queryName='{0}'>{0}</span><span class='cs-remove-saved-query' queryName='{0}' title='{2}'></span></div>".format(savedQueryName, "Добавить запрос в рабочий список запросов", "Удалить запрос из списка сохраненных"));
                        $savedQueriesList.append($savedQueryMarkup);
                        $savedQueriesList.find(".cs-saved-query-item").draggable({ revert: true, helper: "clone" });
                    });
                    $savedQueriesList.disableSelection();
                }
            });
        },
        _loadQuery: function (queryName) {
            var self = this;
            var $queryContainerMarkup = self._$getQueryContainerMarkup(queryName);
            var $ajaxLoad = $(getAjaxLoadHtmlMarkup());
            $queryContainerMarkup.append($ajaxLoad);
            self.element.find(".cs-queries-list").append($queryContainerMarkup);
            $.ajax({
                url: self.options.loadSavedQueryUrl,
                data: { queryName: queryName },
                type: "JSON",
                success: function (xmlSchema) {
                    var xml = xmlSchema.Xml;
                    var querySchemaXml = $toXmlObject(xml);
                    var changedIds = new Object();
                    querySchemaXml.find("QUnitsSchemas").find("QUnitSchema").each(function () {
                        var qUnitSchema = qUnitFromQUnitXmlNode($(this));
                        var newId = self._getQUnitId(qUnitSchema.name);
                        changedIds[qUnitSchema.id] = newId;
                        qUnitSchema.id = newId;
                        self.options.qUnitsSchemas.push(qUnitSchema);
                    });
                    var qUnitItemNode = querySchemaXml.children("QUnitItem");
                    var querySchema = self._getQuerySchema(qUnitItemNode, changedIds);
                    $ajaxLoad.remove();
                    $queryContainerMarkup.append(self._$getTableMarkupForAddToQuery(querySchema));
                    $queryContainerMarkup.find(".cs-query-table").each(function () {
                        var $table = $(this);
                        self._addEventTableDropped($table);
                    });
                }
            });
        },
        _getQuerySchema: function (qUnitItemXmlNode, changedIds) {
            var self = this;
            var table = {
                name: qUnitItemXmlNode.attr("Name"),
                text: qUnitItemXmlNode.attr("Text"),
                id: changedIds[qUnitItemXmlNode.attr("Id")],
                joinedTables: [],
                selectedFields: [],
                joinType: "inner",
                rowNumOver: {
                    partitionBy:[],
                    orderBy:[]
                }
            };

            var joinConditionsGroupNode = qUnitItemXmlNode.children("JoinConditions").children("ConditionsGroup");
            if (joinConditionsGroupNode.length > 0) {
                table.joinConditionsGroup = self._parseConditionsGroup(joinConditionsGroupNode, changedIds);
            }

            var filterConditionsGroupNode = qUnitItemXmlNode.children("FilterConditions").children("ConditionsGroup");
            if (filterConditionsGroupNode.length > 0) {
                table.filterConditionsGroup = self._parseConditionsGroup(filterConditionsGroupNode, changedIds);
            }

            qUnitItemXmlNode.children("SelectedFields").find("Field").each(function () {
                var fieldNode = $(this);
                table.selectedFields.push({
                    parentId: changedIds[fieldNode.attr("ParentId")],
                    name: fieldNode.attr("FieldName")
                });
            });
            qUnitItemXmlNode.children("JoinType").each(function() {
                table.joinType = $(this).attr("Value");
            });
            qUnitItemXmlNode.children("RowNumOver").each(function() {
                $(this).children("PartitionBy").children("Field").each(function() {
                    var fieldNode = $(this);
                    table.rowNumOver.partitionBy.push({
                        parentId: changedIds[fieldNode.attr("ParentId")],
                        name: fieldNode.attr("Name")
                    });
                });
                $(this).children("OrderBy").children("Field").each(function() {
                    var fieldNode = $(this);
                    table.rowNumOver.orderBy.push({
                        parentId: changedIds[fieldNode.attr("ParentId")],
                        name: fieldNode.attr("Name"),
                        orderType: fieldNode.attr("OrderType")
                    });
                });
            });

            qUnitItemXmlNode.children("JoinedTables").children("QUnitItem").each(
                function () {
                    var qUnitSubItemXmlNode = $(this);
                    var tableSchema = self._getQuerySchema(qUnitSubItemXmlNode, changedIds);
                    table.joinedTables.push(tableSchema);
                }
            );
            return table;
        },
        _getQueryMarkupByQuerySchema: function (querySchema) {
            var self = this;
            self._$getTableMarkupForAddToQuery(querySchema);
        },
        _onQUnitItemDrop: function (qUnitInfo, onGetQUnitSchemaSuccess, notSuccessCallback) {
            var self = this;
            $[qUnitInfo.schemaHandler.name](qUnitInfo, function (qUnitSchema) {
                qUnitSchema.id = qUnitInfo.id;
                self.options.qUnitsSchemas.push(qUnitSchema);
                onGetQUnitSchemaSuccess(qUnitSchema);
            }, notSuccessCallback);
        },
        _getExecuteQuery: function (self, $table, queryXmlCallback, selectOutputFields) {
            if (isNullOrUndefined(selectOutputFields)) {
                selectOutputFields = true;
            }
            var $mostButtomJoinedTable = this._$getTableLastChildren($table);
            var jsonPrevSelectedFields = $table.attr("json-selected-fields");
            var prevSelectedFields = null;
            if (!isNullOrUndefined(jsonPrevSelectedFields) && jsonPrevSelectedFields != "") {
                prevSelectedFields = JSON.parse(jsonPrevSelectedFields);
            }
            var leftQuerySchemaTable = self._getQuerySchemaTableForSegment(self, $table, $mostButtomJoinedTable);

            var buildXmlAndCallCallback = function () {
                var querySchemaXml = self._buildQueryXml(self, $table);
                var qUnitsSchemaIds = new Object();
                qUnitsSchemaIds[$table.attr("id")] = true;
                $table.find(".cs-query-table").each(function () {
                    qUnitsSchemaIds[$(this).attr("id")] = true;
                });

                var qUnitsSchemasXml = self._getQUnitsSchemasXml(qUnitsSchemaIds);
                var fullXml = "<Xml>" + qUnitsSchemasXml + querySchemaXml + "</Xml>";
                queryXmlCallback(fullXml);
            };

            if (selectOutputFields === true) {
                self._showFieldsSelectDialog(
                    { joinedTables: [leftQuerySchemaTable] },
                    prevSelectedFields,
                    function (selectedFields) {
                        $table.attr("json-selected-fields", JSON.stringify(selectedFields));
                        buildXmlAndCallCallback();
                    });
            } else {
                buildXmlAndCallCallback();
            }
        },
        _$getTableLastChildren: function ($table) {
            var $allJoinedTables = $table.find(".cs-query-table");
            var $mostButtomJoinedTable;
            if ($allJoinedTables.length > 0) {
                $mostButtomJoinedTable = $allJoinedTables[$allJoinedTables.length - 1];
            } else {
                $mostButtomJoinedTable = $table;
            }
            return $mostButtomJoinedTable;
        },
        _getQUnitsSchemasXml: function (qUnitsSchemaIds) {
            var self = this;
            var qUnitsSchemas = self.options.qUnitsSchemas;
            var retXml = "<QUnitsSchemas>";
            qUnitsSchemas.forEach(function (qUnitSchema) {
                if (qUnitsSchemaIds[qUnitSchema.id] == true) {
                    retXml += qUnitToXml(qUnitSchema);
                }
            });
            retXml += "</QUnitsSchemas>";
            return retXml;
        },
        _buildQueryXml: function (self, $tableToGetXml) {
            var ret = "<QUnitItem {0}>".format(objToXmlAttrs({ Name: $tableToGetXml.attr("tableName"), Id: $tableToGetXml.attr("id"), Text: $tableToGetXml.attr("Text") }));
            var jsonJoinCondition = $tableToGetXml.attr("json-join-condition");
            if (!isNullOrUndefined(jsonJoinCondition) && jsonJoinCondition != "")
                ret += "<JoinConditions>{0}</JoinConditions>".format(self._getConditionsGroupXml(JSON.parse(jsonJoinCondition)));
            else ret += "<JoinConditions></JoinConditions>";

            var jsonFilterCondition = $tableToGetXml.attr("json-filter-condition");
            if (!isNullOrUndefined(jsonFilterCondition) && jsonFilterCondition != "")
                ret += "<FilterConditions>{0}</FilterConditions>".format(self._getConditionsGroupXml(JSON.parse(jsonFilterCondition)));
            else
                ret += "<FilterConditions></FilterConditions>";
            var jsonSelectedFields = $tableToGetXml.attr("json-selected-fields");
            if (!isNullOrUndefined(jsonSelectedFields) && jsonSelectedFields != "") {
                ret += "<SelectedFields>{0}</SelectedFields>".format(self._getSelectedFieldsXml(JSON.parse(jsonSelectedFields)));
            } else {
                ret += "<SelectedFields></SelectedFields>";
            }
            var joinType = $tableToGetXml.attr("joinType");
            if(isNullOrUndefined(joinType))
                joinType = "inner";
            ret += "<JoinType {0} />".format(objToXmlAttrs({ Value: joinType }));
            var jsonRowNumOver = $tableToGetXml.attr("json-row-num-over");
            if(!isNullOrUndefined(jsonRowNumOver) && jsonRowNumOver != "") {
                ret += "<RowNumOver>";
                ret += self._getRowNumOverXml(JSON.parse(jsonRowNumOver));
                ret += "</RowNumOver>";
            }else {
                ret += "<RowNumOver></RowNumOver>";
            }

            ret += "<JoinedTables>";
            $tableToGetXml.children(".cs-sub-query").children(".cs-query-table").each(function () {
                ret += self._buildQueryXml(self, $(this));
            });
            ret += "</JoinedTables>";
            ret += "</QUnitItem>";
            return ret;
        },
        _getRowNumOverXml:function (rowNumOver) {
            var ret = "<PartitionBy>";
            rowNumOver.partitionBy.forEach(function(field) {
                ret += "<Field {0}/>".format(objToXmlAttrs({ ParentId: field.parentId, Name: field.name }));
            });
            ret += "</PartitionBy>";
            ret += "<OrderBy>";
            rowNumOver.orderBy.forEach(function(orderByField) {
                ret += "<Field {0}/>".format(objToXmlAttrs({ ParentId: orderByField.parentId, Name: orderByField.name, OrderType: orderByField.orderType}));
            });
            ret += "</OrderBy>";
            return ret;
        },
        _getSelectedFieldsXml: function (selectedFields) {
            var retXml = "";
            selectedFields.forEach(function (selectedField) {
                retXml += "<Field {0}/>".format(objToXmlAttrs({ ParentId: selectedField.parentId, FieldName: selectedField.name }));
            });
            return retXml;
        },
        _getConditionsGroupXml: function (conditionsGroup) {
            var buildCondtionsGroupXml = function (condsGroup) {
                if (condsGroup === undefined) {
                    return "";
                }
                var ret = "<ConditionsGroup>";
                ret += "<GroupOp {0}/>".format(objToXmlAttrs({ Operator: condsGroup.groupOp }));
                ret += "<Conditions>";
                condsGroup.conditions.forEach(function (condition) {
                    ret += "<Condition>";
                    ret += "<LeftParam {0}/>".format(objToXmlAttrs({ ParentId: condition.leftParam.parentId, FieldName: condition.leftParam.fieldName }));
                    ret += "<ConditionOp {0}/>".format(objToXmlAttrs({ Value: condition.conditionOp }));
                    ret += "<RightParam {0}/>".format(objToXmlAttrs({ EditorName: condition.rightParam.editorName, Value: condition.rightParam.value, Text: condition.rightParam.text }));
                    ret += "</Condition>";
                });
                ret += "</Conditions>";
                ret += "<ConditionsGroups>";
                condsGroup.conditionsGroups.forEach(function (subConditionGroup) {
                    ret += buildCondtionsGroupXml(subConditionGroup);
                });
                ret += "</ConditionsGroups>";
                ret += "</ConditionsGroup>";
                return ret;
            };
            return buildCondtionsGroupXml(conditionsGroup);
        },
        _parseConditionsGroup: function (conditionsGroupXmlNode, changedIds) {
            var self = this;
            var conditionGroup = {
                conditions: [],
                conditionsGroups: []
            };
            conditionGroup.groupOp = conditionsGroupXmlNode.children("GroupOp").attr("Operator");
            conditionsGroupXmlNode.children("Conditions").children("Condition").each(function () {
                var conditionNode = $(this);
                var leftParamNode = conditionNode.children("LeftParam");
                var conditionOpNode = conditionNode.children("ConditionOp");
                var rightParam = conditionNode.children("RightParam");
                var condition = {
                    leftParam: {
                        parentId: changedIds[leftParamNode.attr("ParentId")],
                        fieldName: leftParamNode.attr("FieldName")
                    },
                    conditionOp: conditionOpNode.attr("Value"),
                    rightParam: {
                        editorName: rightParam.attr("EditorName"),
                        value: rightParam.attr("Value"), //TODO replace ids
                        text: rightParam.attr("Text")
                    }
                };

                if (condition.rightParam.editorName === "fieldSelectEditor") {
                    if (condition.rightParam.value != "") {
                        var value = JSON.parse(condition.rightParam.value);
                        value.parentId = changedIds[value.parentId];
                        condition.rightParam.value = JSON.stringify(value);
                    }
                }

                conditionGroup.conditions.push(condition);
            });
            conditionsGroupXmlNode.children("ConditionsGroups").children("ConditionsGroup").each(function () {
                var subConditionsGroupNode = $(this);
                var subConditionsGroup = self._parseConditionsGroup(subConditionsGroupNode, changedIds);
                conditionGroup.conditionsGroups.push(subConditionsGroup);
            });
            return conditionGroup;
        },
        _showFieldsSelectDialog: function (querySchema, prevSelectedFields, successCallback) {
            if (isNullOrUndefined(prevSelectedFields)) {
                prevSelectedFields = [];
            }
            
            var $fieldsTree = $("<div class='cs-query-tree-choose-multiple-fields'>");
            $fieldsTree.querySchemaFieldsTree({
                querySchema: querySchema.joinedTables[0],
                qUnitsSchemas: this.options.qUnitsSchemas,
                mode: "multi"
            });
            $fieldsTree.querySchemaFieldsTree('selectedFields', prevSelectedFields);
            
            $fieldsTree.dialog({
                title: "Выберите поля",
                modal: true,
                width: 800,
                height: 500,
                buttons: [
                        { text: "OK", click: function () {
                            var selectedFields = $fieldsTree.querySchemaFieldsTree('selectedFields');
                            successCallback(selectedFields);
                            $fieldsTree.querySchemaFieldsTree('destroy');
                            $fieldsTree.dialog("close");
                        }
                        }, {
                            text: T("cancel"), click: function () {
                                $fieldsTree.dialog("close");
                            }
                        }
                    ],
                close: function () {
                    $fieldsTree.dialog('destroy');
                    $fieldsTree.remove();
                }
            });

        },
        _prepareQUnitSchemasForConditions: function (setFieldSelectEditorAsDefault) {
            if(setFieldSelectEditorAsDefault === undefined) {
                setFieldSelectEditorAsDefault = true;
            }
            var self = this;
            var qUnitSchemas = self.options.qUnitsSchemas;
            qUnitSchemas.forEach(function (qUnitSchema) {
                qUnitSchema.fields.forEach(function (field) {
                    field.prevDefaultConditionOp = field.defaultConditionOp;
                    field.defaultConditionOp = "Equal";

                    field.availableConditionOps.forEach(function (conditionOp) {
                        conditionOp.prevDefaultEditor = conditionOp.defaultEditor;
                    });
                    var setConditionOpAccessibleWithFeildSelectEditor = function (conditionOp) {
                        var conditionOpExists = false;
                        field.availableConditionOps.forEach(function (availableConditionOp) {
                            if (availableConditionOp.conditionOp == conditionOp) {
                                if(setFieldSelectEditorAsDefault === true) {
                                    availableConditionOp.defaultEditor = "fieldSelectEditor";
                                }
                                conditionOpExists = true;
                                var editorExists = false;
                                availableConditionOp.editors.forEach(function (editor) {
                                    if (editor.editorName == "fieldSelectEditor") {
                                        editorExists = true;
                                    }
                                });
                                if (editorExists != true) {
                                    availableConditionOp.editors.push({ removeOnReset: true, editorName: "fieldSelectEditor", editorParams: {} });
                                }
                            }
                        });
                        if (conditionOpExists != true) {
                            field.availableConditionOps.push({ conditionOp: conditionOp, removeOnReset: true, editors: [{ editorName: "fieldSelectEditor", editorParams: {}}] });
                        }
                    };
                    setConditionOpAccessibleWithFeildSelectEditor("Equal");
                    setConditionOpAccessibleWithFeildSelectEditor("NotEqual");
                });
            });
        },
        _resetQUnitSchemasToDefault: function () {
            var self = this;
            var qUnitSchemas = self.options.qUnitsSchemas;
            qUnitSchemas.forEach(function (qUnitSchema) {
                qUnitSchema.fields.forEach(function (field) {
                    field.defaultConditionOp = field.prevDefaultConditionOp;

                    var conditionOpsToRemove = Array();
                    field.availableConditionOps.forEach(function (conditionOp) {
                        conditionOp.defaultEditor = conditionOp.prevDefaultEditor;
                        if (conditionOp.removeOnReset == true) {
                            conditionOpsToRemove.push(conditionOp);
                        } else {
                            var editorsToRemove = [];
                            conditionOp.editors.forEach(function (editor) {
                                if (editor.removeOnReset == true) {
                                    editorsToRemove.push(editor);
                                }
                            });
                            editorsToRemove.forEach(function (editorToRemove) {
                                conditionOp.editors.remove(editorToRemove);
                            });
                        }
                    });
                    conditionOpsToRemove.forEach(function (conditionOpToRemove) {
                        field.availableConditionOps.remove(conditionOpToRemove);
                    });
                });
            });
        },
        _showJoinConditionsGroupDialog: function (leftQuerySchemaTable, rightQuerySchemaTable, conditionsGroup, successCallback, closeCallback) {
            var $joinConditionsEditor = $("<div style='padding:10px; margin:3px;'>");
            if (isNullOrUndefined(closeCallback))
                closeCallback = function () { };

            $joinConditionsEditor.filterEditor({
                qUnitsSchemas: this.options.qUnitsSchemas,
                querySchema: {
                    joinedTables: [
                            leftQuerySchemaTable
                        ]
                },
                rightQuerySchema: {
                    joinedTables: [
                            rightQuerySchemaTable
                        ]
                },
                conditionsGroup: conditionsGroup
            });

            $joinConditionsEditor.dialog({
                modal: true,
                title: "Установить фильтры",
                width: 800,
                height: 500,
                buttons: [{
                    text: "Ok",
                    click: function () {
                        var editorConditionsGroup = $joinConditionsEditor.filterEditor('conditionsGroup');
                        successCallback(editorConditionsGroup);
                        $joinConditionsEditor.dialog('close');

                    }
                }, {
                    text: T("cancel"),
                    click: function () {
                        $joinConditionsEditor.dialog('close');
                    }
                }
                    ],
                close: function () {
                    $joinConditionsEditor.dialog('destroy');
                    $joinConditionsEditor.remove();
                    closeCallback();
                }
            });
        },
        _$getLayoutMarkup: function () {
            var $layoutMarkup = $("<table class='cs-complex-search-editor'><tr><td class='cs-query-items-toolbox'><div class='cs-query-items-toolbox-inner-wrapper'><span class='cs-qunits-list-title'>{0}</span><div class='cs-qunits-list'></div><span class='cs-saved-queries-list-title'>{1}</span><div class='cs-saved-queries-list'><span class='cs-no-saved-queries'>{2}</span></div></div></td><td class='cs-queries-list'></td><td class='cs-query-detailed-view'><div class='cs-query-toolbar'></div><div class='cs-query-action-workarea'></div></td></tr></table>".format("Стандартные элементы запроса", "Сохраненные запросы", "Пусто"));
            this._initEmptyWorkArea($layoutMarkup);
            return $layoutMarkup;
        },
        _initEmptyWorkArea: function ($editor) {
            $editor.find(".cs-query-toolbar").empty();
            var $workArea = $editor.find(".cs-query-action-workarea");
            $workArea.empty();
            $workArea.html("<div class='cs-query-result-section-empty'>{0}</div>".format("Выберите элемент запроса для выполнения операций(установка фильтра, выполнения запроса и т.д.) над ними"));
        },
        _$getTableMarkupForAddToQuery: function (table, showJoinCondition) {
            var self = this;
            if (showJoinCondition === undefined)
                showJoinCondition = false;
            var $tableMarkup = $("<div class='cs-query-table'>");
            $tableMarkup.attr("tableName", table.name);
            $tableMarkup.attr("text", table.text);
            $tableMarkup.attr("id", table.id);
            $tableMarkup.attr("joinType", table.joinType);
            if (!isNullOrUndefined(table.joinConditionsGroup)) {
                $tableMarkup.attr("json-join-condition", JSON.stringify(table.joinConditionsGroup));
            }
            if (!isNullOrUndefined(table.filterConditionsGroup)) {
                $tableMarkup.attr("json-filter-condition", JSON.stringify(table.filterConditionsGroup));
            }
            if (!isNullOrUndefined(table.selectedFields)) {
                $tableMarkup.attr("json-selected-fields", JSON.stringify(table.selectedFields));
            }
            if(!isNullOrUndefined(table.rowNumOver)) {
                $tableMarkup.attr("json-row-num-over", JSON.stringify(table.rowNumOver));
            }
            var $titleWrapper = $("<div class='cs-query-table-title-wrapper'>");
            $titleWrapper.append("<span class='cs-query-table-begin-corner'>&nbsp;</span>");
            if (showJoinCondition == true) {
                var $join = $("<span class='cs-join-condition'>");
                $join.addClass("cs-join-type-" + table.joinType);
                $titleWrapper.append($join);
                $titleWrapper.append("<span class='cs-join-type'>");
            }
            $titleWrapper.append("<span class='cs-query-table-title' title='{0}'>{1}</span>".format(table.text, trimIfLong(table.text)));
            $tableMarkup.append($titleWrapper);
            var $subQuery = $("<div class='cs-sub-query'>");
            $tableMarkup.append($subQuery);

            if (!isNullOrUndefined(table.joinedTables)) {
                table.joinedTables.forEach(function (joinedTable) {
                    var $joinedTableMarkup = self._$getTableMarkupForAddToQuery(joinedTable, true);
                    $subQuery.append($joinedTableMarkup);
                });
            }

            return $tableMarkup;
        },
        _getQUnitItemInfo: function ($qUnitItem) {
            var name = $qUnitItem.attr("name");
            var retQUnitInfo = null;
            this.options.qUnits.forEach(function (qUnit) {
                if (qUnit.name == name) {
                    retQUnitInfo = qUnit;
                }
            });
            return retQUnitInfo;
        },
        _getTableInfoFromJoinedTable: function ($queryTable) {
            return {
                name: $queryTable.attr("tableName"),
                text: $queryTable.attr("text"),
                id: $queryTable.attr("id")
            };
        },
        _getQUnitId: function (tableName) {
            return tableName + "_" + randomString(8);
        },
        _$getQueryRootTable: function ($table) {
            return $table.closest(".cs-query").children(".cs-query-table");
        },
        _addEventTableDropped: function ($table) {
            var self = this;
            var $rootTable = self._$getQueryRootTable($table);
            var tableInfo = {
                name: $table.attr("tableName"),
                text: $table.attr("text"),
                id: $table.attr("id")
            };
            $table
                .find(".cs-query-table-title")
                .droppable({
                    accept: ".cs-qunit-item",
                    activeClass: "cs-query-table-accept-drop-state",
                    drop: function (event2, droppedQUnitUi) {
                        var droppedQUnit = self._getQUnitItemInfo(droppedQUnitUi.draggable);
                        droppedQUnit.id = self._getQUnitId(droppedQUnit.name);

                        self._onQUnitItemDrop(droppedQUnit, function (qUnitSchema) {
                            var leftQuerySchemaTable = self._getQuerySchemaTableForSegment(self, $rootTable, tableInfo);
                            var rightQuerySchemaTable = qUnitSchema;


                            var joinByConditions = function(conditionsGroup) {
                                var jsonString = JSON.stringify(conditionsGroup);
                                var $joinedTableMarkup = self._$getTableMarkupForAddToQuery(droppedQUnit, true);
                                $joinedTableMarkup.attr("json-join-condition", jsonString);
                                $table.children(".cs-sub-query").append($joinedTableMarkup);
                                self._addEventTableDropped($joinedTableMarkup);
                            };
                            var twoSchemasLinked = false;

                            var leftQUnitSchema = null;
                            self.options.qUnitsSchemas.forEach(function(qUnit) {
                                if(qUnit.id == leftQuerySchemaTable.id) {
                                    leftQUnitSchema = qUnit;
                                }
                            });

                            leftQUnitSchema.fields.forEach(function(leftField) {
                                rightQuerySchemaTable.fields.forEach(function(rightField) {
                                    if(twoSchemasLinked == true) {
                                        return;
                                    }
                                    if(!isNullOrUndefined(leftField.linkGroup) && leftField.linkGroup!="") {
                                        if(leftField.linkGroup == rightField.linkGroup) {
                                            var conditionsGroup = {
                                                groupOp: "And",
                                                conditions:[],
                                                conditionsGroups:[]
                                            };
                                            var condition = { leftParam: { }, conditionOp: "Equal", rightParam: { } };
                                            condition.leftParam.parentId = leftQUnitSchema.id;
                                            condition.leftParam.fieldName = leftField.name;
                                            condition.rightParam.value = JSON.stringify({ parentId: rightQuerySchemaTable.id, fieldName: rightField.name });
                                            condition.rightParam.text = rightField.text;
                                            condition.rightParam.editorName = "fieldSelectEditor";
                                            conditionsGroup.conditions.push(condition);
                                            joinByConditions(conditionsGroup);
                                            twoSchemasLinked = true;
                                        }
                                    }
                                });
                            });
                            if(twoSchemasLinked == true)
                                return;

                            self._prepareQUnitSchemasForConditions();
                            self._showJoinConditionsGroupDialog(leftQuerySchemaTable, rightQuerySchemaTable, null, joinByConditions, 
                                function () {
                                    self._resetQUnitSchemasToDefault();
                                }
                            );
                        });
                    }
                });
        },
        _getQuerySchemaTableForSegment: function (self, $rootTable, tableWhereToJoin) {
            var tableHierarchy = self._buildTablesHierarchyRecursive(self, $rootTable, tableWhereToJoin);
            return tableHierarchy.table;
        },
        _buildTablesHierarchyRecursive: function (self, $rootTable, tableWhereToJoin) {
            var table = {
                name: $rootTable.attr("tableName"),
                text: $rootTable.attr("text"),
                id: $rootTable.attr("id"),
                joinedTables: []
            };

            var stopIteration = false;
            if (table.id == tableWhereToJoin.id) {
                return {
                    stopIteration: true,
                    table: table
                };
            }
            $rootTable
                .children(".cs-sub-query")
                .children(".cs-query-table")
                .each(function () {
                    var $joinedTable = $(this);
                    var subJoinedTable = self._buildTablesHierarchyRecursive(self, $joinedTable, tableWhereToJoin);
                    table.joinedTables.push(subJoinedTable.table);
                    if (subJoinedTable.stopIteration == true) {
                        stopIteration = true;
                        return false;
                    }
                    return undefined;
                });
            return {
                stopIteration: stopIteration,
                table: table
            };
        },
        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));