(function ($) {
    $.widget("yoda.querySchemaFieldsTree", {
        _create: function () {
            var self = this;
            var querySchema = this.options.querySchema;
            var mode = this.options.mode; //"checkboxes", "radiobuttons", "none"
            if (isNullOrUndefined(mode)) {
                mode = "none";
            }
            var fieldClass = this.options.fieldClass;
            if (isNullOrUndefined(fieldClass)) {
                fieldClass = "";
            }
            var qUnitSchemas = this.options.qUnitsSchemas;

            var $getTableTree = function (tables) {
                var $tables = $("<div class='cs-query-tree-tables'>");
                tables.forEach(function (table) {
                    var $tableItem = $("<div class='cs-query-tree-table'>");
                    $tableItem.append("<span class='cs-query-tree-table-text'>{0}</span>".format(table.text));
                    $tableItem.append("<span class='cs-query-tree-fields-expander cs-tree-children-collpased'>{0}</span>".format("Поля"));
                    var $tableFields = $("<div class='cs-query-tree-fields-container cs-tree-container-collpased'>");
                    $tableItem.append($tableFields);
                    qUnitSchemas.forEach(function (qUnitSchema) {
                        if (qUnitSchema.id == table.id) {

                            var fieldsGroups = {};

                            qUnitSchema.fields.forEach(function (fieldMeta) {
                                var modeClass = "";
                                switch (mode) {
                                    case "multi":
                                        modeClass = "cs-query-field-checkbox";
                                        break;
                                    case "single":
                                        modeClass = "cs-query-field-radio";
                                        break;
                                    default:
                                        modeClass = "";
                                }

                                var items = fieldMeta.text.split("|");
                                if (items.length == 2) {
                                    var group = items[0];
                                    var fieldText = items[1];

                                    if (isNullOrUndefined(fieldsGroups[group])) {
                                        var $fieldsGroup = $("<div class='cs-query-tree-fields-group'>");
                                        $fieldsGroup.append("<span class='cs-query-tree-fields-group-title'>{0}</span>".format(group));
                                        var $fieldContainer = $("<div class='cs-query-tree-fields-group-fields-container'>");
                                        $fieldsGroup.append($fieldContainer);
                                        $tableFields.append($fieldsGroup);
                                        fieldsGroups[group] = $fieldContainer;
                                    }
                                    fieldsGroups[group].append("<span class='cs-query-tree-field  {3} {4}' parentId='{0}' fieldName='{1}'>{2}</span>".format(table.id, fieldMeta.name, fieldText, modeClass, fieldClass)); ;
                                } else {
                                    $tableFields.append("<span class='cs-query-tree-field {3} {4}' parentId='{0}' fieldName='{1}'>{2}</span>".format(table.id, fieldMeta.name, fieldMeta.text, modeClass, fieldClass));
                                }
                            });
                        }
                    });

                    if (!isNullOrUndefined(table.joinedTables)) {
                        var $subTables = $("<div class='cs-query-tree-joined'>");
                        $subTables.append($getTableTree(table.joinedTables));
                        $tableItem.append($subTables);
                    }
                    $tables.append($tableItem);
                });
                return $tables;
            };
            var $tree = $getTableTree([querySchema]);

            self.element.append($tree);

            if (mode == "multi") {
                $tree.delegate(".cs-query-tree-table-text", "click", function () {
                    var $fieldsContainer = $(this).closest(".cs-query-tree-table").children(".cs-query-tree-fields-container:first");
                    if ($fieldsContainer.find(".cs-query-tree-field").length != $fieldsContainer.find(".cs-query-field-selected").length) {
                        $fieldsContainer.find(".cs-query-tree-field").addClass("cs-query-field-selected");
                    } else {
                        $fieldsContainer.find(".cs-query-tree-field").removeClass("cs-query-field-selected");
                    }
                });
                $tree.delegate(".cs-query-tree-fields-group-title", "click", function () {
                    var $fieldsContainer = $(this).next(".cs-query-tree-fields-group-fields-container");
                    if ($fieldsContainer.find(".cs-query-tree-field").length != $fieldsContainer.find(".cs-query-field-selected").length) {
                        $fieldsContainer.find(".cs-query-tree-field").addClass("cs-query-field-selected");
                    } else {
                        $fieldsContainer.find(".cs-query-tree-field").removeClass("cs-query-field-selected");
                    }
                });
            }

            $tree.delegate(".cs-query-tree-fields-expander", "click", function () {
                $(this).toggleClass("cs-tree-children-collpased cs-tree-children-uncollpased");
                $(this).next().toggleClass("cs-tree-container-collpased cs-tree-container-uncollpased");
            });

            if (mode == "multi") {
                self.element.delegate(".cs-query-tree-field", "click", function () {
                    $(this).toggleClass("cs-query-field-selected");
                });
            }
            if (mode == "single") {
                self.element.delegate(".cs-query-tree-field", "click", function () {
                    self.element.find(".cs-query-field-selected").removeClass("cs-query-field-selected");
                    $(this).addClass("cs-query-field-selected");
                });
            }

            if (!isNullOrUndefined(this.options.selectedFields)) {
                self.selectedFields(this.options.selectedFields);
            }
        },
        selectedFields: function (selectedFields) {
            var self = this;
            var mode = this.options.mode;
            if (selectedFields !== undefined) {
                this.element.find(".cs-query-field-selected").removeClass("cs-query-field-selected");
                var setFieldSelected = function (field) {
                    self.element.find(".cs-query-tree-field[parentId='{0}'][fieldName='{1}']".format(field.parentId, field.name)).addClass("cs-query-field-selected");
                };
                if (mode == "multi") {
                    selectedFields.forEach(function (selectedField) {
                        setFieldSelected(selectedField);
                    });
                }
                if (mode == "single") {
                    if (selectedFields.length > 0) {
                        setFieldSelected(selectedFields[0]);
                    }
                }
                return undefined;
            }
            var ret = new Array();
            self.element.find(".cs-query-field-selected").each(function () {
                var $this = $(this);
                ret.push({
                    parentId: $this.attr("parentId"),
                    name: $this.attr("fieldName")
                });
            });
            return ret;
        },
        text: function () {
            var ret = new Array();
            this.element.find(".cs-query-field-selected").each(function () {
                var $this = $(this);
                ret.push($this.text());
            });
            return ret.join(", ");
        },
        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));