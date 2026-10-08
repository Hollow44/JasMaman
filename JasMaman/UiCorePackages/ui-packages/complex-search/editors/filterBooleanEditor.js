(function ($) {
    $.widget("yoda.filterBooleanEditor", {
        _create: function () {
            var self = this;
            var val = self.options.value;

            self.element.filterReferenceEditor({
                params: {
                    referenceTable: "none",
                    referenceName: "CsFilterBooleanReferenceEditor",
                    referenceLevel: 0,
                    referenceGroup: "none"
                },
                value: self.options.value
            });
        },
        value: function (value) {
            return this.element.filterReferenceEditor("value", value);
        },
        text: function () {
            return this.element.filterReferenceEditor("text");
        },
        destroy: function () {
            this.element.filterReferenceEditor("destroy");
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));