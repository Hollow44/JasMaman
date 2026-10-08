(function ($) {
    $.widget("yoda.filterReferenceEditor", {
        _create: function () {
            var self = this;
            var referenceInfo = this.options.params;
            var $referenceItemsWrapper = $("<div class='ref-multi-wrapper'>");
            $referenceItemsWrapper.append(getAjaxLoadHtmlMarkup());
            self.element.append($referenceItemsWrapper);
            getReference({
                table: referenceInfo.referenceTable,
                name: referenceInfo.referenceName,
                level: referenceInfo.referenceLevel,
                group: referenceInfo.referenceGroup
            },
                { isLimitByLevel: true },
                function (referenceItems) {
                    $referenceItemsWrapper.empty();
                    var $referenceItems = self._$getReferenceItemsMarkup(referenceItems, self);
                    $referenceItems.delegate(".ref-multi-expander", "click", function () {
                        var $this = $(this);
                        $this.closest(".ref-multi-item-wrapper").children(".ref-multi-child-items").toggle();
                        $this.toggleClass("collapsed expanded");
                    });
                    $referenceItems.delegate(".ref-multi-item", "click", function () {
                        var $this = $(this);

                        if ($this.hasClass("unchecked") || $this.hasClass("intermediate")) {
                            self._setItemChecked($this, true);
                        } else {
                            self._setItemChecked($this, false);
                        }
                    });
                    $referenceItemsWrapper.append($referenceItems);
                    self.value(self.options.value);
                }
            );
        },
        value: function (value) {
            var self = this;
            if (value === undefined) {//getter
                return this._getValue();
            }

            //setter
            if (value == null)
                value = "";
            var $wrapper = this.element.children(".ref-multi-wrapper");
            value.split(',').forEach(function (val) {
                var $item = $wrapper.find(".ref-multi-item[value='{0}']".format(val));
                self._setItemChecked($item, true);
            });
            return undefined;
        },
        text: function () {
            return this._getText();
        },
        _$getReferenceItemsMarkup: function (referenceItems, self) {
            var $ref = $("<div>");
            referenceItems.forEach(function (referenceItem) {
                var $itemWrapper = $("<div class='ref-multi-item-wrapper'>");
                var $item = $("<span class='ref-multi-item unchecked' value='{0}'>{1}<span>".format(referenceItem.Value, referenceItem.Text));

                if (!isNullOrUndefined(referenceItem.Items) && referenceItem.Items.length != 0) {
                    var $expander = $("<span class='ref-multi-expander collapsed'></span>");

                    var $childItems = self._$getReferenceItemsMarkup(referenceItem.Items, self);
                    var $childItemsWrapper = $("<div class='ref-multi-child-items' style='display:none'>");
                    $childItemsWrapper.append($childItems);
                    $itemWrapper.append($expander);
                    $itemWrapper.append($item);
                    $itemWrapper.append($childItemsWrapper);
                } else {
                    $itemWrapper.append($item);
                }
                $ref.append($itemWrapper);
            });

            return $ref;
        },
        _setItemChecked: function ($item, checked) {
            var clearClasses = function ($obj) {
                $obj.removeClass("unchecked intermediate checked");
            };
            var setClass = function (className) {
                clearClasses($item);
                $item.addClass(className);
                //ставим у дочерних элементов чек такой же как и текущего
                $item.parent().find(".ref-multi-item").each(function () {
                    var $childItem = $(this);
                    clearClasses($childItem);
                    $childItem.addClass(className);
                });
                //проверяем родительские чеки
                var resolveParentClass = function ($curItem) {
                    var $parentWrapper = $curItem.closest(".ref-multi-child-items").closest(".ref-multi-item-wrapper");
                    if ($parentWrapper.length == 0)
                        return;

                    var $parent = $parentWrapper.children(".ref-multi-item");
                    clearClasses($parent);
                    var uncheckedExist = $parentWrapper.find(".unchecked:first").length > 0;
                    var checkedExists = $parentWrapper.find(".checked:first").length > 0;
                    if (uncheckedExist == true && checkedExists == true) {
                        $parent.addClass("intermediate");
                    } else if (checkedExists) {
                        $parent.addClass("checked");
                    } else {
                        $parent.addClass("unchecked");
                    }
                    resolveParentClass($parent);
                };
                resolveParentClass($item);
            };
            if (checked == true) {
                setClass("checked");
            } else {
                setClass("unchecked");
            }
        },
        _getValue: function () {
            var $refWrapper = this.element.children(".ref-multi-wrapper");
            var vals = new Array();
            $refWrapper.find(".checked").each(function () {
                vals.push($(this).attr("value"));
            });
            return vals.join(",");
        },
        _getText: function () {
            var $refWrapper = this.element.children(".ref-multi-wrapper");
            var texts = new Array();
            $refWrapper.find(".checked").each(function () {
                texts.push($(this).text());
            });
            return texts.join(", ");
        },
        destroy: function () {
            this.element.children(".ref-multi-wrapper").remove();
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));