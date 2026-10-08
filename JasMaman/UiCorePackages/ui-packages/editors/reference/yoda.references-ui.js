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