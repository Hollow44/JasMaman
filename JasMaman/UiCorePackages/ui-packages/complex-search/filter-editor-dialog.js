(function ($) {
    $.widget("yoda.filterDialog", {
        _create: function () {
            var self = this;
            this.$parent = this.element.parent();
            this.$prev = this.element.prev();

            var $dialogWrapper = $("<div class='fdialog-wrapper'>");
            var $dialogHeader = $("<div class='fdialog-header'>{0}</div>".format(this.options.title));
            var $dialogContentWrapper = $("<div class='fdialog-content-wrapper'>");
            $dialogContentWrapper.append(this.element);
            var $dialogBtns = $("<div class='fdialog-buttons'>");
            var $cancel = $("<button>{0}</button>".format(T("Отмена")));
            $cancel.click(function () { self.destroy(); });
            $dialogBtns.append($cancel);

            var $ok = $("<button>OK</button>");
            $dialogBtns.append($ok);
            $ok.click(function (event) {
                if (self._trigger("ok", event) === false) {
                    return;
                }
                self.destroy();
            });

            $dialogWrapper.append($dialogHeader);
            $dialogWrapper.append($dialogContentWrapper);
            $dialogWrapper.append($dialogBtns);

            this.$dialog = $dialogWrapper;

            $dialogWrapper.position({
                of: this.options.of,
                my: "left top",
                at: "left bottom",
                collision: "none none"
            });
            var $overlay = $("<div class='fdialog-overlay'>");
            $('body').append($overlay);
            $overlay.click(function () {
                if (self._trigger("close", { button: "none" }) === false) {
                    return;
                }
                self.destroy();
            });
            this.$overlay = $overlay;
            $dialogWrapper.appendTo("body");
        },
        destroy: function () {
            if (this._removed == true)
                return;
            if (this.$prev.length != 0) {
                this.$prev.after(this.element);
            } else if (this.$parent.length != 0) {
                $parent.prepend(this.element);
            } else {
                this._removed = true;
                this.element.remove();
            }
            this.$overlay.remove();
            this.$dialog.remove();
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));