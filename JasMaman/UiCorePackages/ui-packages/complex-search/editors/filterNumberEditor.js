(function ($) {
    $.widget("yoda.filterNumberEditor", {
        _create: function () {
            var self = this;
            var val = self.options.value;
            self.element.append("<input type='text' value=''>");
            if (val != undefined) {
                self.value(val);
            }
        },
        value: function (value) {
            if (value === undefined)
                return this.element.children("input").val();
            this.element.children("input").val(value);
            return undefined;
        },
        text: function () {
            return this.value();
        },
        destroy: function () {
            this.element.children("input").remove();
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));