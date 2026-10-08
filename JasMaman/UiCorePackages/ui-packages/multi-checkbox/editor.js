$(document).ready(function() {
    $(".multi-checkbox").each(function () {
        let $this = $(this);

        let $items = $(JSON.parse($this.attr("items")));
        let $texts = JSON.parse($this.attr("texts"));
        let readOnly = $this.hasAttr("readOnly");

        let $infoLabel = $this.find(".multi-checkbox-info");
        $infoLabel.val(_getSelectedItemsString($items, JSON.parse($this.attr("selectedItems"))));

        if (readOnly) {
            let $viewButton = $this.find(".multi-checkbox-view-button");
            $viewButton.click(function () {
                let $modalDialogHeader = getModalDialogHeader($texts.DialogHeaderText);
                let $modalDialogContainer = getModalDialogContainer(readOnly, $items);
                function processElement() {
                    let $currentElement = $(this);
                    var $parentElement = $modalDialogContainer.find("div[key='" + $currentElement.attr("parent-key") + "']");
                    if ($parentElement.length > 0) {
                        var allChecked = true;
                        var allUnchecked = true;
                        var $parentDaughterElements = $modalDialogContainer.find("div[parent-key='" + $parentElement.attr("key") + "']");
                        $parentDaughterElements.each(function (index, daughterElement) {
                            if ($(daughterElement).find("input").prop("checked")) {
                                allUnchecked = false;
                                if ($(daughterElement).find("label").hasClass("custom-switch-warn")) {
                                    allChecked = false;
                                }
                            } else {
                                allChecked = false;
                            }
                        });
                        $parentElement.off("change", bindChildCheckableEvent);
                        if (allChecked) {
                            $parentElement.find("label").removeClass("custom-switch-warn");
                            $parentElement.find("input").prop("checked", true);
                        } else if (allUnchecked) {
                            $parentElement.find("label").removeClass("custom-switch-warn");
                            $parentElement.find("input").prop("checked", false);
                        } else {
                            $parentElement.find("label").addClass("custom-switch-warn");
                            $parentElement.find("input").prop("checked", true);
                        }
                        $parentElement.change();
                        $parentElement.change(bindChildCheckableEvent);
                    }
                }
                function bindChildCheckableEvent() {
                    let $currentElement = $(this);
                    var $daughterElements = $modalDialogContainer.find("div[parent-key='" + $currentElement.attr("key") + "']");
                    $daughterElements.each(function (index, daughterElement) {
                        $(daughterElement).find("input").prop("checked", $currentElement.find("input").prop("checked"));
                    });
                    $daughterElements.each(function (index, daughterElement) {
                        $(daughterElement).find("input").change();
                    });
                }
                $modalDialogContainer.find("div[key]").each(function (index, currentElement) {
                    let $currentElement = $(currentElement);
                    var $daughterElements = $modalDialogContainer.find("div[parent-key='" + $currentElement.attr("key") + "']");
                    if ($daughterElements.length > 0) {
                        $currentElement.change(bindChildCheckableEvent);
                    }
                    $currentElement.change(processElement);
                });

                $(JSON.parse($this.attr("selectedItems"))).each(function (index, selectedItem) {
                    var $switch = $($modalDialogContainer.find("div[key='" + selectedItem + "']").find("input"));
                    $switch.prop("checked", true);
                    $switch.change();
                });

                $modalDialogContainer.find("div[key]").each(function (index, currentElement) {
                    let $currentElement = $(currentElement);
                    $currentElement
                });

                let $modalDialogBody = getModalDialogBody();
                $modalDialogBody.append($modalDialogContainer);
                let $modalDialogFooter = getModalDialogFooter(readOnly, $texts.DialogButtonOkText, $texts.DialogButtonCancelText, $texts.DialogButtonCheckAllText, $texts.DialogButtonUncheckAllText);
                let $modalContent = getModalContent();
                $modalContent.append($modalDialogHeader);
                $modalContent.append($modalDialogBody);
                $modalContent.append($modalDialogFooter);
                let $modalDialog = getModalDialog();
                $modalDialog.append($modalContent);
                let $modalFade = getModalFade();
                $modalFade.append($modalDialog);
                $modalDialogFooter.find("#ok").on("click", function (e) {
                    let selectedItems = [];
                    $modalDialogContainer.find("input:checked").each(function (i, currentElement) {
                        let $currentElement = $(currentElement);
                        if ($modalDialogContainer.find("div[parent-key='" + $currentElement.attr("id") + "']").length == 0) {
                            selectedItems.push($currentElement.closest("div").attr("key"));
                        }
                    });
                    $this.attr("selectedItems", JSON.stringify(selectedItems));
                    if (selectedItems.length > 0) {
                        $infoLabel.val(_getSelectedItemsString($items, JSON.parse($this.attr("selectedItems"))));
                    } else {
                        $infoLabel.val("");
                    }
                    $modalFade.modal('hide');
                    $modalFade.html("");
                });
                $modalDialogFooter.find("#check-all").on("click", function (e) {
                    $modalDialogContainer.find("input:not(:checked)").each(function (i, currentElement) {
                        let $currentElement = $(currentElement);
                        if ($modalDialogContainer.find("div[parent-key='" + $currentElement.attr("id") + "']").length == 0) {
                            $currentElement.prop("checked", true);
                            $currentElement.change();
                        }
                    });
                });
                $modalDialogFooter.find("#uncheck-all").on("click", function (e) {
                    $modalDialogContainer.find("input:checked").each(function (i, currentElement) {
                        let $currentElement = $(currentElement);
                        if ($modalDialogContainer.find("div[parent-key='" + $currentElement.attr("id") + "']").length == 0) {
                            $currentElement.prop("checked", false);
                            $currentElement.change();
                        }
                    });
                });
                $modalFade.find(".close-modal").on("click", function (e) {
                    $(window).off("resize", _resizeDialog);
                    $modalFade.modal('hide');
                    $modalFade.html("");
                });
                function _resizeDialog() {
                    $modalDialogContainer.height(_getDialogSize());
                }
                $(window).on("resize", _resizeDialog);
                $modalFade.modal('show');
                _resizeDialog();
            });
        } else {
            let $selectButton = $this.find(".multi-checkbox-select-button");
            let $clearButton = $this.find(".multi-checkbox-clear-button")
            $selectButton.click(function () {
                let $modalDialogHeader = getModalDialogHeader($texts.DialogHeaderText);
                let $modalDialogContainer = getModalDialogContainer(readOnly, $items);
                function processElement() {
                    let $currentElement = $(this);
                    var $parentElement = $modalDialogContainer.find("div[key='" + $currentElement.attr("parent-key") + "']");
                    if ($parentElement.length > 0) {
                        var allChecked = true;
                        var allUnchecked = true;
                        var $parentDaughterElements = $modalDialogContainer.find("div[parent-key='" + $parentElement.attr("key") + "']");
                        $parentDaughterElements.each(function (index, daughterElement) {
                            if ($(daughterElement).find("input").prop("checked")) {
                                allUnchecked = false;
                                if ($(daughterElement).find("label").hasClass("custom-switch-warn")) {
                                    allChecked = false;
                                }
                            } else {
                                allChecked = false;
                            }
                        });
                        $parentElement.off("change", bindChildCheckableEvent);
                        if (allChecked) {
                            $parentElement.find("label").removeClass("custom-switch-warn");
                            $parentElement.find("input").prop("checked", true);
                        } else if (allUnchecked) {
                            $parentElement.find("label").removeClass("custom-switch-warn");
                            $parentElement.find("input").prop("checked", false);
                        } else {
                            $parentElement.find("label").addClass("custom-switch-warn");
                            $parentElement.find("input").prop("checked", true);
                        }
                        $parentElement.change();
                        $parentElement.change(bindChildCheckableEvent);
                    }
                }
                function bindChildCheckableEvent() {
                    let $currentElement = $(this);
                    var $daughterElements = $modalDialogContainer.find("div[parent-key='" + $currentElement.attr("key") + "']");
                    $daughterElements.each(function (index, daughterElement) {
                        $(daughterElement).find("input").prop("checked", $currentElement.find("input").prop("checked"));
                    });
                    $daughterElements.each(function (index, daughterElement) {
                        $(daughterElement).find("input").change();
                    });
                }
                $modalDialogContainer.find("div[key]").each(function (index, currentElement) {
                    let $currentElement = $(currentElement);
                    var $daughterElements = $modalDialogContainer.find("div[parent-key='" + $currentElement.attr("key") + "']");
                    if ($daughterElements.length > 0) {
                        $currentElement.change(bindChildCheckableEvent);
                    }
                    $currentElement.change(processElement);
                });

                $(JSON.parse($this.attr("selectedItems"))).each(function (index, selectedItem) {
                    var $switch = $($modalDialogContainer.find("div[key='" + selectedItem + "']").find("input"));
                    $switch.prop("checked", true);
                    $switch.change();
                });

                $modalDialogContainer.find("div[key]").each(function (index, currentElement) {
                    let $currentElement = $(currentElement);
                    $currentElement
                });

                let $modalDialogBody = getModalDialogBody();
                $modalDialogBody.append($modalDialogContainer);
                let $modalDialogFooter = getModalDialogFooter(readOnly, $texts.DialogButtonOkText, $texts.DialogButtonCancelText, $texts.DialogButtonCheckAllText, $texts.DialogButtonUncheckAllText);
                let $modalContent = getModalContent();
                $modalContent.append($modalDialogHeader);
                $modalContent.append($modalDialogBody);
                $modalContent.append($modalDialogFooter);
                let $modalDialog = getModalDialog();
                $modalDialog.append($modalContent);
                let $modalFade = getModalFade();
                $modalFade.append($modalDialog);
                $modalDialogFooter.find("#ok").on("click", function (e) {
                    let selectedItems = [];
                    $modalDialogContainer.find("input:checked").each(function (i, currentElement) {
                        let $currentElement = $(currentElement);
                        if ($modalDialogContainer.find("div[parent-key='" + $currentElement.attr("id") + "']").length == 0) {
                            selectedItems.push($currentElement.closest("div").attr("key"));
                        }
                    });
                    $this.attr("selectedItems", JSON.stringify(selectedItems));
                    if (selectedItems.length > 0) {
                        $infoLabel.val(_getSelectedItemsString($items, JSON.parse($this.attr("selectedItems"))));
                    } else {
                        $infoLabel.val("");
                    }
                    $modalFade.modal('hide');
                    $modalFade.html("");
                });
                $modalDialogFooter.find("#check-all").on("click", function (e) {
                    $modalDialogContainer.find("input:not(:checked)").each(function (i, currentElement) {
                        let $currentElement = $(currentElement);
                        if ($modalDialogContainer.find("div[parent-key='" + $currentElement.attr("id") + "']").length == 0) {
                            $currentElement.prop("checked", true);
                            $currentElement.change();
                        }
                    });
                });
                $modalDialogFooter.find("#uncheck-all").on("click", function (e) {
                    $modalDialogContainer.find("input:checked").each(function (i, currentElement) {
                        let $currentElement = $(currentElement);
                        if ($modalDialogContainer.find("div[parent-key='" + $currentElement.attr("id") + "']").length == 0) {
                            $currentElement.prop("checked", false);
                            $currentElement.change();
                        }
                    });
                });
                $modalFade.find(".close-modal").on("click", function (e) {
                    $(window).off("resize", _resizeDialog);
                    $modalFade.modal('hide');
                    $modalFade.html("");
                });
                function _resizeDialog() {
                    $modalDialogContainer.height(_getDialogSize());
                }
                $(window).on("resize", _resizeDialog);
                $modalFade.modal('show');
                _resizeDialog();
            });
            $clearButton.click(function () {
                $this.attr("selectedItems", "[]");
                $infoLabel.val("");
            });
        }

        $this.closest("form").submit(function(){
            let $input = $("<input type='hidden' name='{0}'>".format($this.attr("editorName")));
            $input.val($this.attr("selectedItems"));
            $this.append($input);
        });
    });
});