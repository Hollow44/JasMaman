(function ($) {
    $.widget("yoda.queryFieldSelector", {
        _create: function () {
            var self = this;
            self.element.querySchemaFieldsTree({
                querySchema: self.options.querySchema.joinedTables[0],
                qUnitsSchemas: self.options.qUnitsSchemas,
                mode: "none",
                fieldClass: "cs-field-selectable"
            });
            
            self.element.filterDialog({ title: "Выберите поле", of: self.options.of });

            self.element.delegate(".cs-field-selectable", "click", function () {
                var eventArgs = { parentId: $(this).attr("parentId"), fieldName: $(this).attr("fieldName") };
                self._trigger("selected", 0, eventArgs);
                self.element.filterDialog("destroy");
                self.destroy();
            });
        },
        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));