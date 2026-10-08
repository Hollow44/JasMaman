(function ($) {
    $.widget("yoda.filterInTextEditor", {
        _create: function () {
            var self = this;
            var val = self.options.value;
            self.element.append("<textarea value=''/>");
            if (val != undefined) {
                self.value(val);
            }
        },
        value: function (value) {
            if (value === undefined)
                return this.element.children("textarea").val();
            this.element.children("textarea").val(value);
            return undefined;
        },
        text: function () {
            return this.value();
        },
        destroy: function () {
            this.element.children("textarea").remove();
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));