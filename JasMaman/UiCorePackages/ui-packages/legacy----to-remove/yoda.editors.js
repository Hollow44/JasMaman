/*
 *
 *
Большинство хороших программистов делают свою работу не потому, что ожидают оплаты или признания, а потому что получают удовольствие от программирования.
— Linus Torvalds  
 *
 *
 */

function $getJSONReference(refName, refGroup, refTable, parentVal, handler) {
    if(!refName) {
        throw "Имя справочника не может быть пустым";
    }
    if(!refGroup) {
        throw "Группа справочника не может быть пустым (передайте none если без группы)";
    }
    if(!refTable) {
        throw "Имя таблицы не может быть пустым";
    }
    return $.getJSON(
        rootDir + "reference-get/" + refTable + "/" + refGroup + "/" + refName + "/" + parentVal,
        handler
        );
}

function $getJSONReferenceFull(refName, refGroup, refTable, handler) {
    if(!refName) {
        throw "Имя справочника не может быть пустым";
    }
    if(!refGroup) {
        throw "Группа справочника не может быть пустым (передайте none если без группы)";
    }
    if(!refTable) {
        throw "Имя таблицы не может быть пустым";
    }
    return $.getJSON(
        rootDir + "reference-get-full/" + refTable + "/" + refGroup + "/" + refName,
        handler
        );
}

function $getJSONReferenceLimitedByLevel(refName, refGroup, refTable, refLevel, handler) {
    if(!refName) {
        throw "Имя справочника не может быть пустым";
    }
    if(!refGroup) {
        throw "Группа справочника не может быть пустым (передайте none если без группы)";
    }
    if(!refTable) {
        throw "Имя таблицы не может быть пустым";
    }
    return $.getJSON(
        rootDir + "reference-get-limited-by-level/" + refTable + "/" + refGroup + "/" + refName +"/" + refLevel,
        handler
        );
}

var uniqueIndex = 0;
function getUniqueIndex() {
    return (uniqueIndex++);
}

(function (jQuery) {
    jQuery.fn.hasAttr = function (name) {
        for (var i = 0, l = this.length; i < l; i++) {
            if (!!(this.attr(name) !== undefined)) {
                return true;
            }
        }
        return false;
    };
})(jQuery);


function ReferenceSelectDialog() {
    this._isClosed = false;
}

ReferenceSelectDialog.prototype.setOnClose = function(onCloseCallback) {
    this._onCloseFunc = onCloseCallback;
};

ReferenceSelectDialog.prototype.close = function () {
    if (this._onCloseFunc !== undefined) {
        this._onCloseFunc();
    }
    this._isClosed = true;
};
ReferenceSelectDialog.prototype.isClosed = function() {
    return this._isClosed;
};

ReferenceSelectDialog.prototype.markAsClosed = function() {
    this._isClosed = true;
};

var constRefSystemNullValue = "SYSTEM-NULL-VALUE";

$(document).ready(
    function ($) {
        $("form").submit(
            function () {
                if ($(this).find("ref-loading").length > 0) {
                    alert("Необходимо дождаться полной загрузки справочных данных");
                    return false;
                }
            }
        );
        $("[date-box]").each(
            function () {
                $(this).datepicker({ dateFormat: 'dd.mm.yy', changeYear: true, changeMonth: true, yearRange: '1991:2030' });
            }
        );
        $("[date-time-box]").each(
            function () {
                /*$(this).datetime({ format: 'dd.mm.yyyy hh:ii', stepMins: 1 });*/
                $(this).datetimepicker({ controlType: 'select', dateFormat: 'dd.mm.yy' });
            }
        );

        $(".ref-plain-select").change(
            function () {
                var $this = $(this);
                if ($this.hasAttr("parent-val-changed") == true) {
                    return;
                }
                $this.find("option[value='" + constRefSystemNullValue + "']").remove();
                var selectedRefVal = $this.val();
                var prevValue = $this.attr("last-val");

                if (selectedRefVal == prevValue) {
                    return;
                }

                $this.attr("last-val", selectedRefVal);

                var refName = $this.attr("ref-name");
                var refGroup = $this.attr("ref-group-name");
                var refTable = $this.attr("ref-table-name");
                var refLevel = parseInt($this.attr("ref-level"));

                var childRefsArr = allOrderedChildRefPlainSelectCombo(refName, refGroup, refLevel);
                if (childRefsArr == 0)
                    return;

                $.each(childRefsArr, function (index, $refCombo) {
                    $refCombo.empty();
                    $refCombo.addClass("ref-loading");
                    $refCombo.removeAttr("ref-select-childs-need-reload");
                    $refCombo.attr("parent-val-changed", true);
                    $refCombo.append("<option selected>Загрузка...</option>");
                });
                var allocateChildRefItems = function (childRefItems) {
                    var curLevelItems = childRefItems;
                    $.each(
                        childRefsArr,
                        function (index, $refCombo) {
                            $refCombo.empty();
                            var initialVal = $refCombo.attr("ref-initial-selected-val");
                            $.each(curLevelItems, function (ind, refItem) {
                                var selected = false;
                                if (isNullOrUndefined(initialVal) || initialVal === "") {
                                    selected = ind == 0;
                                } else {
                                    selected = refItem.Value == initialVal;
                                }
                                $refCombo.append("<option value='" + refItem.Value + "' " + (selected ? "selected" : "") + ">" + refItem.Text + "</option>");
                            });

                            $refCombo.removeClass("ref-loading");
                            $refCombo.removeAttr("parent-val-changed");
                            $refCombo.change();
                            if (curLevelItems.length > 0) {
                                curLevelItems = curLevelItems[0].Items;
                            }
                        }
                    );
                };

                if ($(this).hasAttr("static-reference") == true) {
                    var selectedRefItem = window.References.GetReference(refName).Search(selectedRefVal);
                    allocateChildRefItems(selectedRefItem.Items);
                } else {
                    $getJSONReference(
                        refName, refGroup, refTable, selectedRefVal,
                        allocateChildRefItems
                    );
                }
            }
        );

        $("[ref-select-childs-need-reload='yes']").each(
            function () {
                //класс может быть удален во время вызова change, поэтому проверяем есть ли класс еще раз
                if ($(this).hasAttr("ref-select-childs-need-reload") == false) {
                    return;
                }
                var $this = $(this);
                var refName = $this.attr("ref-name");
                var refGroup = $this.attr("ref-group-name");
                var refLevel = parseInt($this.attr("ref-level"));
                //справочник первого уровня
                if (refLevel == 0) {
                    $(this).change();
                    return;
                }

                //проверяем родителя справочника

                var $parent = $getParentRefPlainSelectCombo(refName, refGroup, refLevel);
                //на форме нет справочника с первым уровнем?
                if ($parent.length == 0) {
                    alert("Ошибка при выполнении работы справочника");
                    return;
                }
                //если родитель тоже попадет в эту функцию, тогда ничего не делам
                if ($parent.hasAttr("ref-select-childs-need-reload") == true) {
                    return;
                } else {
                    $($parent).change();
                    return;
                }
            }
        );

        $(".ref-multi-select").click(
            function (e) {
                var $this = $(this);
                var $container = $this.closest(".ui-referencebox-multi");

                if ($container.hasClass("loading")) {
                    return;
                }

                var refValsId = $this.attr("ref-vals-id");
                var refDisplayId = $this.attr("ref-display-id");


                var refName = $this.attr("ref-name");
                var refGroup = $this.attr("ref-group-name");
                var refTable = $this.attr("ref-table-name");
                var refLevel = $this.attr("ref-level");
                var refDeepestLevel = parseInt($this.attr("ref-deepest-level"));

                var dialogTitle = $this.attr("dialog-title");
                var isStaticReference = $this.hasAttr("static-reference");
                /*var asDropMenu = $this.hasAttr('drop-as-context-menu');
                */
                var selectBtnSize = {
                    width: $this.width(),
                    height: $this.height()
                };

                showMultiRefSelect(e, false, $this.offset(), selectBtnSize, refName, refGroup, refTable, refLevel, refDeepestLevel, isStaticReference, refValsId, refDisplayId, dialogTitle);
            }
        );
        $(".ref-clear").click(
            function () {
                var $this = $(this);
                $("#" + $this.attr("ref-vals-id")).val("");
                $("#" + $this.attr("ref-display-id")).text(""); ;
            }
        );

        $(".ref-multiselect-sub-items-expander").click(
            function () {
                var $this = $(this);
                var $subItemsContainer = $("#" + $this.attr('ref-sub-items-container'));
                $subItemsContainer.toggleClass("ref-expanded ref-collapsed");
                $this.toggleClass("ref-expander-state-expanded ref-expander-state-collapsed");

                if ($subItemsContainer.hasClass("ref-collapsed")) {
                    $this.text("+");
                    return;
                }
                $this.text("-");

                if ($this.hasAttr("ref-loaded") == true) {
                    return;
                } else {
                    $subItemsContainer.html(dataLoadingDiv);
                }
            }
        );

        $(".ref-multiselect-item-checkbox").click(
            function () {
                var $this = $(this);
                var $subItemsContainer = $("#" + $this.attr('ref-sub-items-container'));

                if ($this.hasClass(checkedStyle)) {
                    funcRemoveAllClasses($this);
                    $this.addClass(uncheckedStyle);

                    $subItemsContainer.find(".ref-multiselect-item-checkbox").each(
                        function () {
                            funcRemoveAllClasses($(this));
                            $(this).addClass(uncheckedStyle);
                        }
                    );
                } else if ($this.hasClass(uncheckedStyle)) {
                    funcRemoveAllClasses($this);
                    $this.addClass(checkedStyle);

                    $subItemsContainer.find(".ref-multiselect-item-checkbox").each(
                        function () {
                            funcRemoveAllClasses($(this));
                            $(this).addClass(checkedStyle);
                        }
                    );
                } else if ($this.hasClass(intermediateStyle)) {
                    funcRemoveAllClasses($this);
                    $this.addClass(uncheckedStyle);

                    $subItemsContainer.find(".ref-multiselect-item-checkbox").each(
                        function () {
                            funcRemoveAllClasses($(this));
                            $(this).addClass(uncheckedStyle);
                        }
                    );
                }

                while (true) {
                    var $selfItemContainer = $this.closest(".ref-item-and-childs-container");
                    var $parentItemContainer = $selfItemContainer.parent().closest(".ref-item-and-childs-container");
                    $this = $parentItemContainer.find(".ref-multiselect-item-checkbox:first");
                    if ($this.length == 0)
                        break;

                    funcRemoveAllClasses($this);

                    var uncheckedExsists = $parentItemContainer.find("." + uncheckedStyle + ":first").length > 0;
                    var checkedExists = $parentItemContainer.find("." + checkedStyle + ":first").length > 0;

                    if (uncheckedExsists == true && checkedExists == true) {
                        $this.addClass(intermediateStyle);
                    } else if (checkedExists) {
                        $this.addClass(checkedStyle);
                    } else {
                        $this.addClass(uncheckedStyle);
                    }
                }
            }
        );

        $("label.ref-multiselect-item-label").click(
            function () {
                $("#" + $(this).attr("for")).click();
            }
        );


        $(".col-filter-value,.col-filter-operation").change(
            function () {
                var $this = $(this);
                var flTable = $this.attr("flTable");
                var $sharedContainer = $("#" + flTable).closest(".dataTables_scroll");
                var $header = $sharedContainer.find(".dataTables_scrollHead");
                if ($sharedContainer.find(".filters-changed").length > 0)
                    return;
                $header.after("<div class='filters-changed'><input type='submit' name='search' value='Применить фильтры'/></div>");
            }
        );

        $(".ref-plain-select").each(
            function () {
                var $this = $(this);
                var initVal = $this.attr("ref-initial-selected-val");
                if (initVal === undefined || initVal == "" || initVal == null || initVal == constRefSystemNullValue) {
                    $this.prepend("<option value='SYSTEM-NULL-VALUE'>" + T("Выберите значение") + "</option>");
                    $this.val(constRefSystemNullValue);
                }
            }
        );
        function refValEmpty(v) {
            return ((v === undefined || v == "" || v == null || v == constRefSystemNullValue));
        }

        $(".ref-plain-select").each(
            function () {
                var $this = $(this);
                var refName = $this.attr("ref-name");
                var refGroup = $this.attr("ref-group-name");
                var refLevel = parseInt($this.attr("ref-level"));
                var v = $this.val();
                if (refLevel == 0) {
                    return;
                }
                if (refValEmpty(v)) {
                    var $parent = $getParentRefPlainSelectCombo(refName, refGroup, refLevel);
                    var pval = $parent.val();
                    if (!refValEmpty(pval)) {
                        $parent.change();
                    }
                }
            }
        );
    }
);
        var dataLoadingDiv = "<div class='loading-data-element' style='display:block'>Загрузка данных...</div>";
        var checkedStyle = "ref-multiselect-item-state-checked";
        var uncheckedStyle = "ref-multiselect-item-state-unchecked";
        var intermediateStyle = "ref-multiselect-item-state-intermediate";

        var funcRemoveAllClasses = function ($checkbox) {
            $checkbox.removeClass(checkedStyle);
            $checkbox.removeClass(uncheckedStyle);
            $checkbox.removeClass(intermediateStyle);
        };

        var funcSetVals = function ($multiselectRefsContext, vals) {
            vals.forEach(function (val) {
                var $chb = $(".ref-multiselect-item-checkbox[ref-value='" + val + "']", $multiselectRefsContext);
                funcRemoveAllClasses($chb);
                $chb.addClass(checkedStyle);

                var $subItemsContainer = $("#" + $chb.attr('ref-sub-items-container'));
                $subItemsContainer.find(".ref-multiselect-item-checkbox").each(
                    function () {
                        funcRemoveAllClasses($(this));
                        $(this).addClass(checkedStyle);
                    }
                );
            });
            $multiselectRefsContext.find(".ref-multiselect-item-checkbox." + uncheckedStyle).each(
                function () {
                    var $this = $(this);
                    var $childItemsContainer = $this.closest(".ref-item-and-childs-container").find(".ref-sub-items-container");
                    var uncheckedExsists = $childItemsContainer.find("." + uncheckedStyle + ":first").length > 0;
                    var checkedExists = $childItemsContainer.find("." + checkedStyle + ":first").length > 0;

                    funcRemoveAllClasses($this);
                    if (uncheckedExsists == true && checkedExists == true) {
                        $this.addClass(intermediateStyle);
                    } else if (checkedExists) {
                        $this.addClass(checkedStyle);
                    } else {
                        $this.addClass(uncheckedStyle);
                    }
                }

            );
        };
        
    function showMultiRefSelect(e, asDropMenu, offset, clipRectangleSize, refName, refGroup, refTable, refLevel, refDeepestLevel, isStaticReference, refValuesStoreId, refItemsDisplayId, dialogTitle) {
        var refValsId = refValuesStoreId;
        var refDisplayId = refItemsDisplayId;
        
        var values = $("#" + refValsId).val();
        var divClass = "div-for-dialog-temp";
        var refItemsContainerId = "refContainer-" + getUniqueIndex();
        var div = "<div class='" + divClass + "' title='" + dialogTitle + "' id='" + refItemsContainerId + "'>" + dataLoadingDiv + "<div>";

        var $div = $(div);
        var lockOkButton = true;
        var onOpen = function () {
            var allocateReference = function (childRefItems) {
                var html = getRefMultiselectItemsHtml(refName, childRefItems, refDeepestLevel, 1, $div);
                $div.empty().html(html);
                callAllReadyInObjectContext($div);
                funcSetVals($div, values.split(','));
                lockOkButton = false;
            };

            if (isStaticReference == true) {
                var reference = window.References.GetReference(refName);
                var refItems = reference.Items;
                allocateReference(refItems);
            } else {
                $getJSONReferenceLimitedByLevel(
                                refName, refGroup, refTable, refLevel,
                                allocateReference
                            );
            }
        };
        var onOk = function () {
            if (lockOkButton == true) {
                alert("Данные еще не загружены");
                return;
            }
            var vals = new Array();
            var texts = new Array();
            $div.find("." + checkedStyle).each(
                        function () {
                            vals.push($(this).attr("ref-value"));
                            texts.push($(this).text());
                        }
                    );
            var prevVal = $("#" + refValsId).val();
            var curVal = vals.join(",");
            if (prevVal != curVal) {
                $("#" + refValsId).val(curVal);
                $("#" + refValsId).change();
                $("#" + refDisplayId).text(texts.join("; "));
            }
        };

        if (asDropMenu == true) {
            var refSelectDivSize = {
                width: 400,
                height: 500
            };

            $div.addClass("filter-editor");
            $div.css("width", refSelectDivSize.width);
            $div.css("height", refSelectDivSize.height);
            $div.appendTo('body');


            var tipOffset = getTipPrefferedOffset(offset, clipRectangleSize, refSelectDivSize);
            $div.css("top", tipOffset.top);
            $div.css("left", tipOffset.left);
            $div.click(function (e) { e.stopPropagation(); });
            onOpen();
            //TODO с селект диалогом надо как нить по другому решать...
            var selectContextDlg = new ReferenceSelectDialog();
            var onLooseFocus = function () {
                $(document).unbind('click', onLooseFocus);
                if(selectContextDlg.isClosed())
                    return;
                if (lockOkButton == true)
                    return;
                onOk();
                selectContextDlg.markAsClosed();
                selectContextDlg.close();
            };
            selectContextDlg.setOnClose(onLooseFocus);
            $(document).bind('click', onLooseFocus);

            e.stopPropagation();

            return selectContextDlg;
        } else {
            var selectDlg = new ReferenceSelectDialog();
            $div.dialog({
                height: 600,
                width: 800,
                modal: true,
                open: onOpen,
                buttons: {
                    "OK": function () {
                        selectDlg.close();
                    },
                    "Отмена": function () {
                        $div.dialog("close");
                    }
                },
                close: function (e, ui) {
                    $div.dialog('destroy');
                    $div.empty().remove();
                }
            });
            selectDlg.setOnClose(
                function() {
                    onOk();
                    $div.dialog("close");
                }
                );
            return selectDlg;
        }
    }

function getRefMultiselectItemsHtml(refName, refItems, refDeepestLevel, loadedLevel) {
    var itemsHtml = "<div class='refs-container'>";

    refItems.forEach(function (refItem) {
        var chbxId = "checkbox-ref-multiselect-" + getUniqueIndex();
        var subItemsContainer = chbxId + "-container";

        var itemHtml = "<div class='ref-item-and-childs-container'><div class='ref-multiselect-item'>";
        var subItemsHtml = "";
        if (refItem.Items != null && refItem.Items.length != 0) {
            subItemsHtml = getRefMultiselectItemsHtml(refName, refItem.Items, refDeepestLevel, loadedLevel + 1);
            itemHtml += "<span class='ref-multiselect-sub-items-expander ref-expander-state-collapsed' ref-name='" + refName + "' ref-checkbox-id='" + chbxId + "' ref-sub-items-container='" + subItemsContainer + "' ref-sub-item-level='" + loadedLevel + "' ref-deepest-level='" + refDeepestLevel + "' ref-loaded>+</span>";
        }

        /*itemHtml += "<span id='" + chbxId + "' class='ref-multiselect-item-checkbox ref-multiselect-item-state-unchecked' type='checkbox' ref-value='" + refItem.Value + "' ref-sub-items-container=" + subItemsContainer + ">&nbsp;</span><label class='ref-multiselect-item-label' for='" + chbxId + "'>" + refItem.Text + "</label></div>";*/
        itemHtml += "<span id='" + chbxId + "' class='ref-multiselect-item-checkbox ref-multiselect-item-state-unchecked' type='checkbox' ref-value='" + refItem.Value + "' ref-sub-items-container=" + subItemsContainer + ">" + refItem.Text + "</span></div>";
        itemHtml += "<div id='" + subItemsContainer + "' class='ref-sub-items-container ref-collapsed'>" + subItemsHtml + "</div></div>";

        itemsHtml += itemHtml;
    });
    itemsHtml += "</div>";
    return itemsHtml;
}

function $getNextRefPlainSelectCombo(refName, refGroup, refLevel) {
    var selector = ".ref-plain-select" + "[ref-group-name='" + refGroup + "']" + "[ref-name='" + refName + "']" + "[ref-level='" + (refLevel + 1) + "']";
    return $(selector);
}

function $getParentRefPlainSelectCombo(refName, refGroup, refLevel) {
    var selector = ".ref-plain-select" + "[ref-group-name='" + refGroup + "']" + "[ref-name='" + refName + "']" + "[ref-level='" + (refLevel - 1) + "']";
    return $(selector);
}

function allOrderedChildRefPlainSelectCombo(refName, refGroup, refLevel) {
    var retResult = new Array();
    var curRefLevel = refLevel;
    while (true) {
        var selector = ".ref-plain-select" + "[ref-group-name='" + refGroup + "']" + "[ref-name='" + refName + "']" + "[ref-level='" + (curRefLevel + 1) + "']";
        var $combo = $(selector);
        if ($combo.length == 0)
            break;
        retResult.push($combo);
        curRefLevel++;
    }
    return retResult;
}


(function ($) {
    $.fn.inputInitVal = function(value, text, params) {
        $(this).val(value);
    };
    $.fn.inputGetValueAndText = function() {
        return {
            Value: $(this).val(),
            Text: $(this).val()
        };
    };
    $.fn.inputActivateEditor = function() {
        $(this).focus();
    };

    $.fn.referenceInitValTextAndParams =
        function(value, text, params) {
            var $this = this;
            $this.find(".ref-items-container").remove();
            var nativeThis = $this.get(0);
            nativeThis.initVal = value;
            nativeThis.initText = text;

            /*var paramsObj = paramsToObject(params);*/

            var refName = params["ReferenceName"];
            var refGroup = params["ReferenceGroup"];
            if (!refGroup) {
                refGroup = "none";
            }
            var refTable = params["ReferenceTable"];
            var refLevel = params["ReferenceLevel"];
            if (!refTable) {
                refGroup = "none";
            }
            var refContainer = "<div class='ref-items-container'>" + dataLoadingDiv + "<div>";
            $this.append(refContainer);
            var $refContainer = $this.find(".ref-items-container");
            nativeThis.referenceLoaded = false;
            var allocateReference = function(childRefItems) {
                var html = "<div><span class='reference-select-all'>"+T("Выбрать все")+"</span><span class='reference-deselect-all'>"+T("Убрать все")+"</span></div>";
                html += getRefMultiselectItemsHtml(refName, childRefItems, -1, 1);
                $refContainer.empty().html(html);
                
                $refContainer.find(".reference-select-all").click(
                    function () {
                        $refContainer.find(".ref-multiselect-item-checkbox").each(
                            function () {
                                funcRemoveAllClasses($(this));
                                $(this).addClass(checkedStyle);
                            }
                        );
                    }
                );
                $refContainer.find(".reference-deselect-all").click(
                    function () {
                        $refContainer.find(".ref-multiselect-item-checkbox").each(
                            function () {
                                funcRemoveAllClasses($(this));
                                $(this).addClass(uncheckedStyle);
                            }
                        );
                    }
                );
                
                callAllReadyInObjectContext($refContainer);
                funcSetVals($refContainer, value.split(','));
                nativeThis.referenceLoaded = true;
            };

            $getJSONReferenceLimitedByLevel(refName, refGroup, refTable, refLevel, allocateReference);
        };
    $.fn.referenceGetValueAndText =
        function() {
            var $this = this;
            var nativeThis = $this.get(0);
            if(!nativeThis.referenceLoaded) {
                return {
                    Value: nativeThis.initValue,
                    Text: nativeThis.initText
                };
            }
            var vals = new Array();
            var texts = new Array();
            $this.find(".ref-items-container").find("." + checkedStyle).each(
                        function () {
                            vals.push($(this).attr("ref-value"));
                            texts.push($(this).text());
                        }
                    );
            return {
                Value: vals.join(","),
                Text: texts.join("; ")
            };
        };
    $.fn.referenceActivateEditor = function() { /*пусто потому, что редактор активированным открывается*/ };

    var getRangeInputEditors = function($rangeEditor) {
        var fromEditor = $rangeEditor.attr("from-editor");
        var toEditor = $rangeEditor.attr("to-editor");
        var ret = {
            $fromEditor: $rangeEditor.find("#" + fromEditor),
            $toEditor: $rangeEditor.find("#" + toEditor)
        };
        return ret;
    };
    
    $.fn.rangeInputInitVal = function(value, text, params) {
        var rangeEditors = getRangeInputEditors($(this));
        
        if(value == null || value === undefined || value == "") {
            rangeEditors.$fromEditor.val("");
            rangeEditors.$toEditor.val("");
            return;
        }
        
        var values = value.split('|');
        rangeEditors.$fromEditor.val(values[0]);
        rangeEditors.$toEditor.val(values[1]);
    };
    
    $.fn.rangeInputGetValueAndText = function() {
        var rangeEditors = getRangeInputEditors($(this));
        var fromVal = rangeEditors.$fromEditor.val();
        var toVal = rangeEditors.$toEditor.val();

        var retVal = "";
        var retText = "";
        var valExists = false;
        if(fromVal !== undefined && fromVal!=null && fromVal != "") {
            retVal += fromVal;
            retText += "c " + fromVal;
            valExists = true;
        }
        retVal += "|";
        if(toVal!==undefined && toVal != null && toVal != "") {
            retVal += toVal;
            retText += " по " + toVal;
            valExists = true;
        }
        
        if(valExists === true) {
            return {
                Value: retVal,
                Text: retText.trim()
            };
        }

        return {
            Value: "",
            Text: ""
        };
    };
    
    $.fn.rangeInputActivateEditor = function() {
        var rangeEditors = getRangeInputEditors($(this));
        rangeEditors.$fromEditor.focus();
    };

    
    
})(jQuery);

function checkIsReferenceFilterEditor($this) {
    return $this.hasClass("reference-filter-editor");
}