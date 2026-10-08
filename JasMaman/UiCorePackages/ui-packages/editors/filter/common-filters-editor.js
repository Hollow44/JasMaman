$(document).ready(function ($) {
    $(".common-filter-editor").each(function () {
        var $this = $(this);
        var filtersConfig = JSON.parse($this.attr("config"));
        var filters = JSON.parse($this.attr("filterItems"));
        var isReadonly = $this.data("isReadonly");
        var canAddFilterItem = $this.data("canAddFilterItem");

        $this.commonFilterEditor({
            filtersConfig: filtersConfig,
            filterItems: filters,
            isReadonly: isReadonly,
            canAddFilterItem: canAddFilterItem
        });

        $this.closest("form").submit(function () {
            var editorName = $this.attr("editor-name");
            $this.find("input[name='" + editorName + "']").remove();
            var filterItems = $this.commonFilterEditor("getFilterItems");
            var $input = $("<input type='hidden'>");
            $input.attr("name", editorName);
            $input.val(JSON.stringify(filterItems));
            $this.append($input);
        });
    });
});


(function ($) {
    $.widget("yoda.commonFilterEditor", {
        _create: function () {
            var defaultOptions = {
                isReadonly: false,
                canAddFilterItem: true
            };
            this.options = $.extend({}, defaultOptions, this.options);
            if(this.options.isReadonly == true) {
                this.options.canAddFilterItem = false;
            }
            var filtersConfig = this.options.filtersConfig;
            var filterItems = this.options.filterItems;
            var that = this;
            var $this = this.element;

            
            var $addFilterItem = $("<span class='btn-add-filter-item btn btn-default'><span class='mdi mdi-plus-box-outline'></span>" + T("Добавить условие") + "</span>");
            $addFilterItem.click(function() {
                showSelectFilterItemDialog(null, function(configItem) {
                    var $filterItem = that._$getFilterMarkup(configItem);
                    var filterItem = { Name: configItem.Name, Operator: configItem.Operators[0].Name };
                    that._setFilterVal(filterItem, $filterItem);
                    $this.append($filterItem);
                    $filterItem.find(".filter-item-value").click();
                }, $addFilterItem);
            });
            
            if(this.options.canAddFilterItem) {
                $this.append($addFilterItem);
            }

            for(var i=0;i<filterItems.length;i++) {
                var curFilterItem = filterItems[i];

                var filterConfig = null;
                for(var j=0;j<filtersConfig.length;j++) {
                    if(filtersConfig[j].Name == curFilterItem.Name) {
                        filterConfig = filtersConfig[j];
                        break;
                    }
                }
                
                var $filterItem = that._$getFilterMarkup(filterConfig);
                that._setFilterVal(curFilterItem, $filterItem);
                $this.append($filterItem);
            }
            
            function showSelectFilterItemDialog(filterItem, onSelect, $displayPosition) {
                var $dlg = $("<div>");
                for(i=0;i<filtersConfig.length;i++) {
                    $dlg.append("<span class='select-filter-item-option' filter-item-index='{1}'> {0}<span>".format(filtersConfig[i].Text, i));
                }
                $dlg.contextDialog({
                    of: $displayPosition,
                    close: function () {
                        $dlg.contextDialog("destroy");
                        $dlg.remove();
                    }
                });
                $dlg.delegate(".select-filter-item-option", "click", function() {
                    var filterItemIndex = $(this).attr("filter-item-index");
                    var config = filtersConfig[filterItemIndex];
                    onSelect(config);
                    $dlg.contextDialog("destroy");
                    $dlg.remove();
                });
            }
            
            if(this.options.isReadonly != true) {
                $this.delegate(".filter-item-name", "click", function() {
                    var $filterItem = $(this).closest(".filter-item");
                    showSelectFilterItemDialog($filterItem.data("filterItem"), function(configItem) {
                        that._setFilterVal(null, $filterItem);
                        that._setFilterConfig(configItem, $filterItem);
                        that._setFilterVal({ Name: configItem.Name, Operator: configItem.Operators[0].Name }, $filterItem);
                    }, $(this));
                });
                $this.delegate(".filter-item-operator", "click", function() {
                    var $filterItem = $(this).closest(".filter-item");
                    var $dlg = $("<div>");
                    var filterConfig = $filterItem.data("filterConfig");
                    for(var i=0;i<filterConfig.Operators.length;i++) {
                        $dlg.append("<span class='select-filter-operator-option' operator-index='{1}'>{0}</span>".format(filterConfig.Operators[i].Text, i));
                    }
                    $dlg.contextDialog({
                        of: $(this),
                        close: function () {
                            $dlg.contextDialog("destroy");
                            $dlg.remove();
                        }
                    });
                    $dlg.delegate(".select-filter-operator-option", "click", function() {
                        var opIndex = $(this).attr("operator-index");
                        var operator = filterConfig.Operators[opIndex];
                        var filterItem = $filterItem.data("filterItem");
                        var val = null;
                        var valText = null;
                        if(filterItem && filterItem.Name && filterItem.Operator && filterItem.Value) {
                            for(var cIndex=0;cIndex<filtersConfig.length;cIndex++) {
                                var curConf = filtersConfig[cIndex];
                                if(curConf.Name == filterItem.Name) {
                                    for(var oIndex=0;oIndex<curConf.Operators.length;oIndex++) {
                                        var curOp = curConf.Operators[oIndex];
                                        if(curOp.Name == filterItem.Operator) {
                                            if(curOp.JQueryWidgetName == operator.JQueryWidgetName) {
                                                val = filterItem.Value;
                                                valText = filterItem.Text;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        that._setFilterVal({ Name: filterConfig.Name, Operator: operator.Name, Value: val, Text: valText }, $filterItem);
                        $dlg.contextDialog("destroy");
                        $dlg.remove();
                        $filterItem.find(".filter-item-value").click();
                    });
                });
                $this.delegate(".filter-item-value", "click", function() {
                    var $filterItem = $(this).closest(".filter-item");
                    var $dlg = $("<div>");
                    var filterConfig = $filterItem.data("filterConfig");
                    var filterItem = $filterItem.data("filterItem");
                    if(filterItem == null || !filterItem.Operator)
                        return;

                    var operatorItem = null;
                    for(var i=0;i<filterConfig.Operators.length;i++) {
                        if(filterConfig.Operators[i].Name == filterItem.Operator) {
                            operatorItem = filterConfig.Operators[i];
                            break;
                        }
                    }
                    if(operatorItem == null) {
                        return;
                    }
                    
                    var $editorPnl = $("<div>");
                    var settings = { };
                    if(operatorItem.SettingsJson)
                        settings = JSON.parse(operatorItem.SettingsJson);
                    settings.value = filterItem.Value;

                    var onEditorCloseListener = null;

                    settings.onEditorClose = function(acceptVal) {
                        onEditorCloseListener(acceptVal);
                    };

                    $editorPnl[operatorItem.JQueryWidgetName](settings);
                    var instance = $editorPnl[operatorItem.JQueryWidgetName]("instance");

                    var customDialog = false;

                    if(instance.customDialog) {
                        customDialog = instance.customDialog();
                    }

                    if(customDialog!==true) {
                        onEditorCloseListener = function(acceptVal) {
                            $dlg.contextDialog("close", acceptVal);
                        };

                        $dlg.append($editorPnl);

                        $dlg.contextDialog({
                            of: $(this),
                            close: function(acceptVal) {
                                if (acceptVal !== false) {
                                    that._setFilterVal({ Name: filterConfig.Name, Operator: operatorItem.Name, Value: $editorPnl[operatorItem.JQueryWidgetName]("value"), Text: $editorPnl[operatorItem.JQueryWidgetName]("text") }, $filterItem);
                                }
                                $dlg.contextDialog("destroy");
                                $dlg.remove();
                            }
                        });
                    } else {
                        onEditorCloseListener = function(acceptVal) {
                            if (acceptVal !== false) {
                                that._setFilterVal({ Name: filterConfig.Name, Operator: operatorItem.Name, Value: $editorPnl[operatorItem.JQueryWidgetName]("value"), Text: $editorPnl[operatorItem.JQueryWidgetName]("text") }, $filterItem);
                            }
                            $editorPnl.remove();
                        };
                    }
                    $editorPnl.find(".auto-focus").focus();
                });
                $this.delegate(".filter-item-clear", "click", function() {
                    var $filterItem = $(this).closest(".filter-item");
                    var filterItem = $filterItem.data("filterItem");
                    if(filterItem == null || !filterItem.Operator)
                        return;
                    filterItem.Value = null;
                    filterItem.Text = null;
                    that._setFilterVal(filterItem, $filterItem);
                });
                $this.delegate(".filter-item-remove", "click", function() {
                    var $filterItem = $(this).closest(".filter-item");
                    $filterItem.remove();
                });    
            }
            
        },
        getFilterItems: function () {
            var ret = [];
            this.element.find(".filter-item").each(function() {
                ret.push($(this).data("filterItem"));
            });
            return ret;
        },
        _$getFilterMarkup:function (filterConfig) {
            var $filterItem = $("<div class='filter-item'>");
            this._setFilterConfig(filterConfig, $filterItem);
            return $filterItem;
        },
        _setFilterConfig: function (filterConfig, $filterItem) {
            $filterItem.data("filterConfig", filterConfig);
            this._refreshFilterItem($filterItem);
        },
        _setFilterVal: function (filterItem, $filterItem) {
            $filterItem.data("filterItem", filterItem);
            this._refreshFilterItem($filterItem);
        },
        _refreshFilterItem: function ($filterItem) {
            $filterItem.empty();
            var config = $filterItem.data("filterConfig");
            var filter = $filterItem.data("filterItem");
            if(!config) {
                return;
            }
            $filterItem.append("<span class='filter-item-name'>{0}</span>".format(config.Text));

            var opNoText = T("[Не задано]");
            var operatorText = opNoText;
            if(filter != null && filter.Operator) {
                operatorText = filter.Operator;
                for (var i = 0; i < config.Operators.length; i++) {
                    if (config.Operators[i].Name == filter.Operator) {
                        operatorText = config.Operators[i].Text;
                        break;
                    }
                }
            }

            var caretSpan = "<span class='caret'></span>";

            $filterItem.append("<span class='filter-item-operator'>{0} {1}</span>".format(operatorText, caretSpan));

            var val = T("[Не задано]");
            if(filter!=null && filter.Text) {
                val = filter.Text;
            }

            var valCaretSpan = "";
            if(opNoText != operatorText) {
                valCaretSpan = caretSpan;
            }
            $filterItem.append("<span class='filter-item-value'>{0} {1}</span>".format(val, valCaretSpan));

            if(this.options.isReadonly != true){
                $filterItem.append("<span class='filter-item-remove mdi mdi-minus-box-outline' title='{0}' aria-label='{0}'></span>".format("Удалить"));
            }
//            $filterItem.append("<span class='clear'></span>");
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

(function ($) {
    $.widget("yoda.yaFilterTextEditor", {
        _create: function () {
            var self = this;
            var val = self.options.value;
            self.element.append("<input type='text' value='' class='auto-focus'/>");
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
(function ($) {
    $.widget("yoda.yaFilterNumberEditor", {
        _create: function () {
            var self = this;
            var val = self.options.value;
            self.element.append("<input type='text' value='' class='auto-focus'>");
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
(function ($) {
    $.widget("yoda.yaFilterDateEditor", {
        _create: function () {
            var self = this;
            var val = self.options.value;
            var $wrapper = $("<div>");
            var $input = $("<input type='text' class='cs-filter-date-editor-value auto-focus' value=''/>");
            $wrapper.append($input);
            $input.datepicker({ dateFormat: 'dd.mm.yy', changeYear: true, changeMonth: true, yearRange: '1991:2030', inline: true, beforeShow:function ($in, inst) {
                    inst.dpDiv.addClass("ya-filter-editor-el");
                } });
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
(function ($) {
    $.widget("yoda.yaFilterDateRangeEditor", {
        _create: function () {
            var self = this;
            var val = self.options.value;
            var $wrapper = $("<div>");
            var $inputFrom = $("<input type='text' class='cs-filter-date-editor-from-value auto-focus' value=''/>");
            $wrapper.append($("<span>{0}</span>".format("c")));
            $wrapper.append($inputFrom);
            $inputFrom.datepicker({ dateFormat: 'dd.mm.yy', changeYear: true, changeMonth: true, yearRange: '1991:2030', inline: true, 
                beforeShow: function($input, inst) {
                    inst.dpDiv.addClass("ya-filter-editor-el");
                } });
            $wrapper.append($("<span>{0}</span>".format("по")));
            var $inputTo = $("<input type='text' class='cs-filter-date-editor-to-value' value=''/>");
            $wrapper.append($inputTo);
            $inputTo.datepicker({ dateFormat: 'dd.mm.yy', changeYear: true, changeMonth: true, yearRange: '1991:2030', inline: true,
                beforeShow:function ($input, inst) {
                    inst.dpDiv.addClass("ya-filter-editor-el");
                }
            });
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
(function ($) {
    $.widget("yoda.yaFilterDateTimeEditor", {
        _create: function () {
            var self = this;
            var val = self.options.value;
            var $wrapper = $("<div>");
            var $input = $("<input type='text' class='cs-filter-date-editor-value auto-focus' value=''/>");
            $wrapper.append($input);
            $input.datetime({ format: 'dd.mm.yy hh:ii', stepMins: 1});
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
(function ($) {
    $.widget("yoda.yaFilterDateTimeRangeEditor", {
        _create: function () {
            var self = this;
            var val = self.options.value;
            var $wrapper = $("<div>");
            var $inputFrom = $("<input type='text' class='cs-filter-date-editor-from-value auto-focus' value=''/>");
            $wrapper.append($("<span>{0}</span>".format("c")));
            var $div = $("<div>");
            $div.append($inputFrom);
            $wrapper.append($div);
            $inputFrom.datetime({ format: 'dd.mm.yy hh:ii', stepMins: 1});
            $wrapper.append($("<span>{0}</span>".format("по")));
            var $inputTo = $("<input type='text' class='cs-filter-date-editor-to-value' value=''/>");
            $wrapper.append($inputTo);
            $inputTo.datetime({ format: 'dd.mm.yy hh:ii', stepMins: 1});
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
(function ($) {
    $.widget("yoda.yaFilterInTextEditor", {
        _create: function () {
            var self = this;
            var val = self.options.value;
            self.element.append("<textarea value='' rows='8' cols='20' class='auto-focus'/>");
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

(function ($) {
    $.widget("yoda.yaFilterNumberRangeEditor", {
        _create: function () {
            var self = this;
            var val = self.options.value;
            self.element.append("<span>{0}</span>".format("с"));
            self.element.append("<input type='text' class='cs-filter-editor-range-from auto-focus' value=''>");
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

(function ($) {
    $.widget("yoda.yaFilterBooleanEditor", {
        _create: function () {
            var self = this;

            self.element.yaFilterReferenceEditor({
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
            return this.element.yaFilterReferenceEditor("value", value);
        },
        text: function () {
            return this.element.yaFilterReferenceEditor("text");
        },
        destroy: function () {
            this.element.yaFilterReferenceEditor("destroy");
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));


(function ($) {
    $.widget("yoda.yaFilterExtSourceEditor", {
        _create: function () {
            var self = this;
            var $div = $("<div title='Выбор объекта' class='ext-source-select-dialog' style='width:800px;height:600px;padding-bottom: 40px;/*display:inline-block*/ overflow:auto'><div class='container'><div class='loading-data-element' style='display:block'>Загрузка данных...</div></div></div>");
            var selectUrl = this.options.selectDataSourceUrl;
            
            jQuery.ajax({
                    url: selectUrl,
                    success: function(html) {
                        $div.html(html);
                        callAllReadyInObjectContext($div);
                    },
                    error: function(jqXhr, textStatus, errorThrown) {
                        getAjaxErrorTextHtml(jqXhr, textStatus, errorThrown);
                    }
                }
            );

            var valueSelected = false;
            
            
            $div.dialog({
                modal:true,
                width: 800,
                heigh: 600,
                position: "top",
                close:function () {
                    self.options.onEditorClose(valueSelected);
                    $div.dialog("destroy");
                }
            });
            
            $div.delegate(".set-selected-data-source-item", "click", function() {
                self._value = $(this).attr("val");
                self._text = $(this).attr("display-text");
                //self.options.onEditorClose(true);
                valueSelected = true;
                $div.dialog("close");
            });
            //self.element.append($div);
        },
        customDialog: function () {
            return true;
        },
        value: function (value) {
            if (value === undefined) {
                return this._value;
            }
            this._value = value;
            return undefined;
        },
        text: function () {
            if(!this._text) {
                return null;
            }
            return this._text;
        },
        destroy: function () {
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));


(function ($) {
    $.widget("yoda.yaFilterReferenceEditor", {
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



(function ($) {
    $.widget("yoda.contextDialog", {
        _create: function () {
            this.element.addClass("ya-filter-context-dialog ya-filter-editor-el");
            this.element.css("position", "absolute");
            this.element.appendTo($("body"));
            this.element.position({
                my: "left top",
                
                of: this.options.of,
                at: "left bottom",
                collision :"flipfit flipfit",
                within : $("body")
            });
            var that = this;

            var skipEvent = true;//первое нажатие пропускается
            

            var onBodyClick = function(event) {
                if(skipEvent==true) {
                    skipEvent = false;
                    return;
                }
                
                if($(event.target).closest(".ya-filter-editor-el").length> 0)
                    return;

                closeEditor(true);
            };

            var closeEditor = function(acceptVal) {
                var result = that.options.close(acceptVal);
                if (result === false) {
                    return;
                }
                $("body").unbind("click", onBodyClick);
            };

            this._closeEditor = closeEditor;
            this._onBodyClick= onBodyClick;

            $("body").bind("click", this._onBodyClick);

            this.element.keydown(function(e) {
                if (e.keyCode == $.ui.keyCode.ENTER) {
                    var $target = $(e.target);
                    if ($target.closest("textarea").length > 0) {
                        if (e.ctrlKey == true) {
                            closeEditor(true);
                        }
                    } else {
                        closeEditor(true);
                    }
                } else if (e.keyCode == $.ui.keyCode.ESCAPE) {
                    closeEditor(false);
                }
            });

        },
        close: function (acceptVal) {
            this._closeEditor(acceptVal);
        },
        value: function (value) {
            return this.element.filterReferenceEditor("value", value);
        },
        text: function () {
            return this.element.filterReferenceEditor("text");
        },
        destroy: function () {
            $("body").unbind("click", this._onBodyClick);
            $.Widget.prototype.destroy.call(this);
        }
    });
} (jQuery));


