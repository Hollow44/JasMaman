(function ($) {
    $.widget("yoda.filterEditor", {
        _create: function () {
            var self = this;
            if (isNullOrUndefined(this.options.querySchema)) {
                this.options.querySchema = {
                    joinedTables: []
                };
            }
            if (isNullOrUndefined(this.options.conditionsGroup)) {
                this.options.conditionsGroup = {
                    groupOp: "And"
                };
            }

            var $editor = this._$getFilterEditorMarkup(this.options.conditionsGroup, this.options.qUnitsSchemas, this.options.querySchema);
            this.element.append($editor);
            $editor.delegate(".cs-condition-field", "click", function () {
                var $this = $(this);
                var $condition = $this.parent();
                var conditionMeta = self._getConditionMeta($condition, self.options.qUnitsSchemas, self.options.querySchema);
                $("<div class='cs-query-fields-selector' style='overflow:auto'>").queryFieldSelector({
                    querySchema: self.options.querySchema,
                    qUnitsSchemas: self.options.qUnitsSchemas,
                    of: $this,
                    selected: function (event, field) {
                        conditionMeta.setField(field.parentId, field.fieldName);
                        self._setConditionMeta($condition, conditionMeta);
                    }
                });
            });
            $editor.delegate(".cs-condition-op", "click", function () {
                var $condition = $(this).parent();
                var conditionMeta = self._getConditionMeta($condition, self.options.qUnitsSchemas, self.options.querySchema);
                var fieldMeta = conditionMeta.getFieldMeta();
                var $div = $("<div class='cs-condition-operator-selector'>");
                fieldMeta.getConditionOpsMeta().forEach(function (conditionOpMeta) {
                    var op = conditionOpMeta.getOperator();
                    $div.append("<span class='cs-condition-operator-item' operator='{0}'>{1}</span>".format(op, self._getConditionOpText(op)));
                });
                $div.delegate(".cs-condition-operator-item", "click", function () {
                    conditionMeta.setConditionOp($(this).attr("operator"));
                    self._setConditionMeta($condition, conditionMeta);
                    $div.filterDialog('destroy');
                });
                $div.filterDialog({ of: $(this), title: T("Выберите значение") });
            });
            $editor.delegate(".cs-condition-value", "click", function () {
                var $condition = $(this).parent();
                var conditionMeta = self._getConditionMeta($condition, self.options.qUnitsSchemas, self.options.querySchema);

                var editorName = conditionMeta.getEditorMeta().getEditorName();
                var $div = $("<div>");
                $div[editorName]({
                    params: conditionMeta.getEditorMeta().getEditorParams(),
                    value: conditionMeta.getEditorValueText().getValue(),
                    querySchema: self.options.rightQuerySchema,
                    qUnitsSchemas: self.options.qUnitsSchemas
                });
                $div.filterDialog({ of: $(this), title: T("Выберите значение"),
                    ok: function () {
                        var val = $div[editorName]("value");
                        var text = $div[editorName]("text");
                        conditionMeta.setEditor(editorName);

                        if (!isEmpty(val)) {
                            conditionMeta.setEditorValueAndText(new ConditionValueText(val, text));
                        } else {
                            conditionMeta.setEditorValueAndText(new ConditionValueText(null, null));
                        }
                        self._setConditionMeta($condition, conditionMeta);
                        $div.filterDialog('destroy');
                    }
                });
            });
            $editor.delegate(".cs-select-condition-editor", "click", function () {
                var $condition = $(this).parent();
                var conditionMeta = self._getConditionMeta($condition, self.options.qUnitsSchemas, self.options.querySchema);
                var curEditorMeta = conditionMeta.getEditorMeta();
                var editors = conditionMeta.getConditionOpMeta().getEditorsMeta();
                var $div = $("<div>");
                editors.forEach(function (editorMeta) {
                    var $editorItem = $("<span class='cs-editor-item'>");
                    $editorItem.text(editorMeta.getEditorName());
                    $editorItem.attr("editorName", editorMeta.getEditorName());
                    $div.append($editorItem);
                });
                $div.delegate(".cs-editor-item", "click", function () {
                    var editorName = $(this).attr("editorName");
                    if (curEditorMeta.getEditorName() != editorName) {
                        conditionMeta.setEditorValueAndText(new ConditionValueText(null, null));
                        conditionMeta.setEditor(editorName);
                        self._setConditionMeta($condition, conditionMeta);
                    }
                    $div.filterDialog("destroy");
                });
                $div.filterDialog({
                    of: $(this),
                    title: T("Выберите значение")
                });
            });
            $editor.delegate(".cs-remove-condition", "click", function () {
                var $condition = $(this).parent();
                $condition.remove();
            });
            $editor.delegate(".cs-remove-condition-group", "click", function () {
                var $conditionsGroups = $(this).closest(".cs-conditions-group");
                $conditionsGroups.remove();
            });
            $editor.delegate(".cs-group-op", "click", function () {
                var $this = $(this);
                var $div = $("<div class='cs-group-items'>");
                $div.append($("<span class='cs-group-op-item' group-op='{0}'>{1}</span>".format("And", self._getConditionsGroupOpText("And"))));
                $div.append($("<span class='cs-group-op-item' group-op='{0}'>{1}</span>".format("Or", self._getConditionsGroupOpText("Or"))));
                $div.filterDialog({ of: $(this), title: T("Выберите значение") });
                $div.delegate(".cs-group-op-item", "click",
                    function () {
                        var groupOp = $(this).attr("group-op");
                        $this.attr("group-op", groupOp);
                        $this.text(self._getConditionsGroupOpText(groupOp));
                        $div.filterDialog('destroy');
                    });
            });
            $editor.delegate(".cs-add-condition", "click", function () {
                var $conditionEmpty = self._$getEmptyMetaConditionMarkup();
                var $conditionsGroup = $(this).closest(".cs-conditions-group");
                var $conditions = $conditionsGroup.find(".cs-conditions:first");
                $conditions.append($conditionEmpty);
            });

            $editor.delegate(".cs-add-conditions-group", "click", function () {
                var $subConditionsGroup = self._$getFilterEditorMarkup({ groupOp: "And", conditions: [{ leftParam: null, conditionOp: null, rightParam: null }] }, self.options.qUnitsSchemas, self.options.querySchema, false);
                var $conditionsGroup = $(this).closest(".cs-conditions-group");
                var $conditionsGroups = $conditionsGroup.find(".cs-sub-conditions-groups:first");
                $conditionsGroups.append($subConditionsGroup);
            });


        },
        conditionsGroup: function () {
            return this._getConditionsGroup(this, this.element.find(".cs-conditions-group:first"));
        },
        _getConditionsGroup: function (self, $rootConditionsGroup) {
            var conditionsGroup = {
                groupOp: "And",
                conditions: [],
                conditionsGroups: []
            };
            var $groupOp = $rootConditionsGroup.find(".cs-group-op:first");
            conditionsGroup.groupOp = $groupOp.attr("group-op");
            $rootConditionsGroup.children(".cs-conditions").children(".cs-condition").each(
                function () {
                    var $condition = $(this);
                    var conditionMeta = self._getConditionMeta($condition, self.options.qUnitsSchemas, self.options.querySchema);
                    var condition = { leftParam: null, conditionOp: null, rightParam: null };
                    if (!conditionMeta.isEmpty()) {
                        condition = { leftParam: {}, conditionOp: {}, rightParam: {} };
                        var fieldMeta = conditionMeta.getFieldMeta();
                        var valueText = conditionMeta.getEditorValueText();

                        condition.leftParam.parentId = fieldMeta.getParentId();
                        condition.leftParam.fieldName = fieldMeta.getFieldName();
                        condition.conditionOp = conditionMeta.getConditionOpMeta().getOperator();
                        condition.rightParam.editorName = conditionMeta.getEditorMeta().getEditorName();
                        condition.rightParam.value = valueText.getValue();
                        condition.rightParam.text = valueText.getText();
                    }
                    conditionsGroup.conditions.push(condition);
                }
            );
            $rootConditionsGroup.children(".cs-sub-conditions-groups").children(".cs-conditions-group").each(
                function () {
                    var subConditionsGroup = self._getConditionsGroup(self, $(this));
                    conditionsGroup.conditionsGroups.push(subConditionsGroup);
                }
            );
            return conditionsGroup;
        },
        _getConditionRightParamEditorInfo: function (condition) {
            var fieldInfo = self._getFieldInfo(condition.leftParam);
            var editorName = condition.rightParam.editorName;
            fieldInfo.conditionOps.forEach(function (conditionOperator) {
                if (conditionOperator.operator == condition.conditionOp) {
                    conditionOperator.editors.forEach(function (editor) {
                        if (editor.name == editorName) {
                            return {
                                name: editorName,
                                editorParams: editor.editorParams
                            };
                        }
                    });
                }
            });
            return null;
        },
        _getEmptyConditionMeta: function () {
            return new ConditionMeta({ leftParam: null, conditionOp: null, rightParam: null }, this.options.qUnitsSchemas, this.options.querySchema);
        },
        _getConditionMeta: function ($condition, qUnitsSchemas, querySchema) {
            var condition = {};
            var $field = $condition.children(".cs-condition-field");
            condition.leftParam = {
                parentId: $field.attr("parentId"),
                fieldName: $field.attr("fieldName")
            };
            if (condition.leftParam.parentId == "" && condition.leftParam.fieldName == "") {
                condition.leftParam = null;
                condition.conditionOp = null;
                condition.rightParam = null;
                return new ConditionMeta(condition, qUnitsSchemas, querySchema);
            }
            condition.conditionOp = $condition.children(".cs-condition-op").attr("operator");

            var $rightParam = $condition.children(".cs-condition-value");
            var val = $rightParam.attr("value");
            var text = $rightParam.text();
            if (val == "") {
                val = null;
                text = null;
            }

            condition.rightParam = {
                editorName: $rightParam.attr("editor"),
                value: val,
                text: text
            };
            return new ConditionMeta(condition, qUnitsSchemas, querySchema);
        },
        _setConditionMeta: function ($condition, conditionMeta) {
            var $field = $condition.children(".cs-condition-field");
            var $op = $condition.children(".cs-condition-op");
            var $rightParam = $condition.children(".cs-condition-value");
            if (conditionMeta.isEmpty()) {
                $field.attr("parentId", "");
                $field.attr("fieldName", "");
                $field.text(this._getNotSettedText());
                $op.attr("operator", "");
                $op.text(this._getNotSettedText());
                $rightParam.attr("value", "");
                $rightParam.text(this._getNotSettedText());
            } else {
                var fieldMeta = conditionMeta.getFieldMeta();
                $field.attr("parentId", fieldMeta.getParentId());
                $field.attr("fieldName", fieldMeta.getFieldName());
                $field.text(fieldMeta.getFieldText());

                var condOpMeta = conditionMeta.getConditionOpMeta();
                $op.attr("operator", condOpMeta.getOperator());
                $op.text(this._getConditionOpText(condOpMeta.getOperator()));

                $rightParam.attr("editor", conditionMeta.getEditorMeta().getEditorName());
                var valText = conditionMeta.getEditorValueText();
                if (valText.getValue() == null) {
                    $rightParam.attr("value", "");
                    $rightParam.text(this._getNotSettedText());
                } else {
                    $rightParam.attr("value", valText.getValue());
                    $rightParam.text(valText.getText());
                }
            }
        },
        _$getFilterEditorMarkup: function (conditionsGroup, qUnitsSchemas, querySchema, isRoot) {
            if (isRoot === undefined) {
                isRoot = true;
            }
            var self = this;
            var groupOp = conditionsGroup.groupOp;
            var conditions = !isNullOrUndefined(conditionsGroup.conditions) ? conditionsGroup.conditions : [];
            var conditionsGroups = !isNullOrUndefined(conditionsGroup.conditionsGroups) ? conditionsGroup.conditionsGroups : [];

            var $filterEditor = $("<div class='cs-conditions-group'>");
            var $editorToolbar = self._$getFilterEditorToolbarMarkup(groupOp, isRoot);

            var $conditions = $("<div class='cs-conditions'>");
            conditions.forEach(function (conditionSchema) {
                var condMeta = new ConditionMeta(conditionSchema, qUnitsSchemas, querySchema);
                var $condition = self._$getConditionMarkup();
                self._setConditionMeta($condition, condMeta);
                $conditions.append($condition);
            });
            var $subConditionsGroups = $("<div class='cs-sub-conditions-groups'>");
            conditionsGroups.forEach(function (subConditionsGroups) {
                var $subFilterEditor = self._$getFilterEditorMarkup(subConditionsGroups, qUnitsSchemas, querySchema, false);
                $subConditionsGroups.append($subFilterEditor);
            });

            $filterEditor.append($editorToolbar);
            $filterEditor.append($conditions);
            $filterEditor.append($subConditionsGroups);
            return $filterEditor;
        },
        _$getFilterEditorToolbarMarkup: function (conditionsGroupOp, isRoot) {
            var $toolbar = $("<div class='cs-conditions-group-toolbar'>");
            $toolbar.append($("<span group-op='{0}' class='cs-group-op'>{1}</span>".format(conditionsGroupOp, this._getConditionsGroupOpText(conditionsGroupOp))));
            $toolbar.append($("<span class='cs-add-condition' title='{0}'></span>".format(T("Добавить условие"))));
            $toolbar.append($("<span class='cs-add-conditions-group' title='{0}'></span>".format(T("Добавить группу условии"))));
            if (isRoot != true) {
                $toolbar.append($("<span class='cs-remove-condition-group' title='{0}'></span>".format(T("Удалить"))));
            }
            return $toolbar;
        },
        _$getConditionMarkup: function () {
            var $condition = $("<div class='cs-condition'>");

            var $leftField = $("<span class='cs-condition-field'>");
            $condition.append($leftField);

            var $conditionOp = $("<span class='cs-condition-op'>");
            $condition.append($conditionOp);

            var $rightValue = $("<span class='cs-condition-value'>");
            $condition.append($rightValue);

            $condition.append($("<span class='cs-select-condition-editor' title='{0}'></span>".format(T("Редактор"))));
            $condition.append($("<span class='cs-remove-condition' title='{0}'><span>".format(T("Удалить"))));
            return $condition;
        },
        _$getEmptyMetaConditionMarkup: function () {
            var $condition = this._$getConditionMarkup();
            this._setConditionMeta($condition, this._getEmptyConditionMeta());
            return $condition;
        },
        _getConditionsGroupOpText: function (filterOp) {
            return T(filterOp);
        },
        _getConditionOpText: function (condOp) {
            return T(condOp);
        },
        _getNotSettedText: function () {
            return T("[Не задано]");
        },
        _applyOptions: function ($this, args) {
            $.Widget.prototype._setOption.apply($this, args);
        },
        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));