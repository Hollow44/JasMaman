(function ($) {
    $.widget("yoda.filterDateTimeEditor", {
        _create: function () {
            var self = this;
            var val = self.options.value;
            var $wrapper = $("<div>");
            var $input = $("<input type='text' class='cs-filter-date-editor-value' value=''/>");
            $wrapper.append($input);
            $input.datetime({ format: 'dd.mm.yy hh:ii', stepMins: 1, inline: true });
            self.element.append($wrapper);
            if (val != undefined) {
                self.value(val);
            }
        },
        value: function (value) {
            if (value === undefined)
                return this.element.find(".cs-filter-date-editor-value").val();
            this.element.find(".cs-filter-date-editor-value").val(value);
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