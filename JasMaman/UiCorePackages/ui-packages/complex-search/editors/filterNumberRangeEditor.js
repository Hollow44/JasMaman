(function ($) {
    $.widget("yoda.filterNumberRangeEditor", {
        _create: function () {
            var self = this;
            var val = self.options.value;
            self.element.append("<span>{0}</span>".format("с"));
            self.element.append("<input type='text' class='cs-filter-editor-range-from' value=''>");
            self.element.append("<span>{0}</span>".format("по"));
            self.element.append("<input type='text' class='cs-filter-editor-range-to' value=''>");
            if (val != undefined) {
                self.value(val);
            }
        },
        value: function (value) {
            if (value === undefined) {
                return JSON.stringify({
                    fromValue: this.element.children(".cs-filter-editor-range-from").val(),
                    toValue: this.element.children(".cs-filter-editor-range-to").val()
                });
            }
            if (!isNullOrUndefined(value) && value != "") {
                var rangeValue = JSON.parse(value);
                this.element.children(".cs-filter-editor-range-from").val(rangeValue.fromValue);
                this.element.children(".cs-filter-editor-range-to").val(rangeValue.toValue);
            }
            return undefined;
        },
        text: function () {
            return "{0}: {1}; {2}: {3}".format("с", this.element.children(".cs-filter-editor-range-from").val(), "по", +this.element.children(".cs-filter-editor-range-to").val());
        },
        destroy: function () {
            this.element.children("input").remove();
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));