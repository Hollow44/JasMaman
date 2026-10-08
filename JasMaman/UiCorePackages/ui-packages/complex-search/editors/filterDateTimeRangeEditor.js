(function ($) {
    $.widget("yoda.filterDateTimeRangeEditor", {
        _create: function () {
            var self = this;
            var val = self.options.value;
            var $wrapper = $("<div>");
            var $inputFrom = $("<input type='text' class='cs-filter-date-editor-from-value' value=''/>");
            $wrapper.append($("<span>{0}</span>".format("c")));
            $wrapper.append($inputFrom);
            $inputFrom.datetime({ format: 'dd.mm.yy hh:ii', stepMins: 1, inline: true });
            $wrapper.append($("<span>{0}</span>".format("по")));
            var $inputTo = $("<input type='text' class='cs-filter-date-editor-to-value' value=''/>");
            $wrapper.append($inputTo);
            $inputTo.datetime({ format: 'dd.mm.yy hh:ii', stepMins: 1, inline: true });
            self.element.append($wrapper);
            if (val != undefined) {
                self.value(val);
            }
        },
        value: function (value) {
            if (value === undefined) {
                return JSON.stringify({
                    fromValue: this.element.find(".cs-filter-date-editor-from-value").val(),
                    toValue: this.element.find(".cs-filter-date-editor-to-value").val()
                });
            }
            if (value != null && value != "") {
                var fromToValue = JSON.parse(value);
                this.element.find(".cs-filter-date-editor-from-value").val(fromToValue.fromValue);
                this.element.find(".cs-filter-date-editor-to-value").val(fromToValue.toValue);
            }
            return undefined;
        },
        text: function () {
            return "{0}: {1}; {2}: {3}".format(
                "c", this.element.find(".cs-filter-date-editor-from-value").val(),
                "по", this.element.find(".cs-filter-date-editor-to-value").val());
        },
        destroy: function () {
            this.element.children("input").remove();
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));