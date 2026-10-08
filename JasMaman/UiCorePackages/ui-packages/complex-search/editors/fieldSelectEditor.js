(function ($) {
    $.widget("yoda.fieldSelectEditor", {
        _create: function () {
            var self = this;
            self._value = null;
            self._text = null;
            self.element.querySchemaFieldsTree({
                querySchema: self.options.querySchema.joinedTables[0],
                qUnitsSchemas: self.options.qUnitsSchemas,
                mode: "single",
                fieldClass: "cs-draggable-field"
            });
            self.element.addClass("cs-query-fields-selector");
            self.value(self.options.value);
        },
        value: function (value) {
            if (value === undefined) {
                var selectedFields = this.element.querySchemaFieldsTree('selectedFields');
                if (selectedFields.length > 0)
                    return JSON.stringify({ parentId: selectedFields[0].parentId, fieldName: selectedFields[0].name });
                return null;
            }
            //setter
            if (value == null || value == "") {
                return undefined;
            }
            var fieldSchema = $.parseJSON(value);
            if (fieldSchema.parentId === undefined && fieldSchema.fieldName === undefined) {
                return undefined;
            }
            this.element.querySchemaFieldsTree('selectedFields', [{ parentId: fieldSchema.parentId, name: fieldSchema.fieldName}]);
            return undefined;
        },
        text: function () {
            return this.element.querySchemaFieldsTree('text');
        },
        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));