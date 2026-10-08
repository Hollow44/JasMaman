$(document).ready(function ($) {
    var printFileUploader = function ($containerToPrint, uploadFileUrl, onSuccess, onError, allowedExtensions) {
        var $fileUploaderContainer = $("<div>");
        $containerToPrint.append($fileUploaderContainer);
        $fileUploaderContainer.append("<input type='file' name='audit-file'/>");
        
        $fileUploaderContainer.on("change", "input[name='audit-file']", function (e, data) {
            var auditFile = $("input[name='audit-file']").prop('files')[0];
            var formData = new FormData();
            formData.append('file', auditFile);
            formData.append('descriptions', "[{FileName:'FileName', Description:'audit file'}]");
            $.ajax({
                url: uploadFileUrl,  
                dataType: 'json',  
                cache: false,
                contentType: false,
                processData: false,
                data: formData,
                type: 'post',
                success: function (data) {
                    $("#UploadedFileId").val(data.savedFiles[0].FileId);
                    $("#UploadedFileNameText").val(data.savedFiles[0].FileName);
                    var uploadedFileInfo = {
                        FileId: data.savedFiles[0].FileId,
                        FileName: data.savedFiles[0].FileName,
                        FileSize: data.savedFiles[0].FileSize
                    };
                    onSuccess(uploadedFileInfo);
                    $fileUploaderContainer.remove();
                }
            });
        });
    };

    $(".audit-files-editor").each(function () {
        var $filesEditor = $(this);
        var fileDownloadUrl = $filesEditor.attr("fileDownloadUrl");
        var filesModel = JSON.parse($filesEditor.attr("files-model-json"));
        var allowedExtensions = $filesEditor.attr("allowedExtensions");
        var editorEditable = $filesEditor.attr("editable") == "True";
        var descriptionRequired = $filesEditor.attr("description-required") == "True";

        var $addFileBtn = $("<span class='audit-files-add-item'>{0}</span>".format(T("Прикрепить файл")));
        if (editorEditable) {
            $filesEditor.append($addFileBtn);
        }
        var $auctionFilesTable = $("<table class='audit-files-table'><thead><tr><tr></thead></table>");
        var $auctionFilesTableHeadRow = $auctionFilesTable.find("thead tr:first");

        $auctionFilesTableHeadRow
            .append("<th class='audit-files-operation'>{0}</th>".format(T("Операции")))
            .append("<th class='audit-files-report-date'>{0}</th>".format(T("Дата отчета")))
            //.append("<th class='audit-files-auditor-id'>{0}</th>".format(T("Id аудитора")))
            .append("<th class='audit-files-auditor-name'>{0}</th>".format(T("Аудитор")))
            .append("<th class='audit-files-year-begin'>{0}</th>".format(T("Год начало")))
            .append("<th class='audit-files-year-end'>{0}</th>".format(T("Год конец")))
            .append("<th class='audit-files-auditor-opinion'>{0}</th>".format(T("Мнение аудитора по отчетности")))
            .append("<th class='audit-files-file-name'>{0}</th>".format(T("Имя файла")))
            .append("<th class='audit-files-file-description'>{0}</th>".format(T("Описание файла")))
            .append("<th class='audit-files-file-size'>{0}</th>".format(T("Размер файла")));

        $filesEditor.append($auctionFilesTable);

        var printModelToRow = function ($trToPrint, fileModelToPrint) {
            $trToPrint.attr("fileModelJson", JSON.stringify(fileModelToPrint));
            $trToPrint.empty();

            var $actionsTd = $("<td>");
            $actionsTd.append("<a href='{1}' target='_blank' class='audit-file-op-download' title='{0}'>{0}</a>".format(T("Скачать"), fileDownloadUrl.replace("&FileId=0", "&FileId={0}".format(fileModelToPrint.FileId))));

            if (editorEditable) {
                $actionsTd.append("<span class='audit-file-op-edit' title='{0}'>{0}</span><span class='audit-file-op-remove' title='{1}'>{1}</span>".format(T("Редактировать"), T("Удалить")));
            }

            $trToPrint.append($actionsTd);
            $trToPrint
                .append("<td>{0}</td>".format(fileModelToPrint.ReportDate))
                .append("<td>{0}</td>".format(fileModelToPrint.AuditorName))
                .append("<td>{0}</td>".format(fileModelToPrint.YearBegin))
                .append("<td>{0}</td>".format(fileModelToPrint.YearEnd))
                .append("<td>{0}</td>".format(fileModelToPrint.OpinionText))
                .append("<td>{0}</td>".format(fileModelToPrint.FileName))
                .append("<td>{0}</td>".format(fileModelToPrint.FileDescription))
                .append("<td>{0}</td>".format(bytesToSize(fileModelToPrint.FileSize, 2)));
        };

        var printEmptyRow = function () {
            var colspan = editorEditable ? "4" : "4";
            $auctionFilesTable.append("<tr class='audit-files-tr-no-rows'><td colspan='{1}'>{0}</td></tr>".format(T("Нет записей"), colspan));
        };

        if (filesModel.length == 0) {
            printEmptyRow();
        }

        for (var fileIndex = 0; fileIndex < filesModel.length; fileIndex++) {
            var fileModel = filesModel[fileIndex];
            var $tr = $("<tr>");
            printModelToRow($tr, fileModel);
            $auctionFilesTable.append($tr);
        }

        var funcOpenEditor = function (fileModelToEdit, onOkCallback) {
            var $div = $("<div class='file-form-editor'>");
            var fileUploaded = false;
            var uploadedFileInfo = null;
            var isNullOrEmpty = function (val) {
                if (val == undefined || val == null || val == "")
                    return true;
                return false;
            };
            $div.dialog({
                title: T("Редактирование файла"),
                modal: true,
                width: 500,
                height: 500,
                open: function () {
                    if (fileModelToEdit == null) {
                        printFileUploader($div, $filesEditor.attr("fileUploadUrl"), function (uploadedFileInfoArg) {
                            fileUploaded = true;
                            uploadedFileInfo = uploadedFileInfoArg;
                            $div.append("<span>{0}</span><textarea name='{1}' id='{1}'></textarea>".format(T("Описание файла"), "FileDescription"));
                        }, function (msg) {
                            $div.append("<span class='error-msg'>{0}</span>".format(msg));
                        }, allowedExtensions);
                    } else {
                        fileUploaded = true;
                        uploadedFileInfo = fileModelToEdit;
                        $div.append("<span>{0}</span><textarea name='{1}' id='{1}'>{2}</textarea>".format(T("Описание файла"), "FileDescription", fileModelToEdit.FileDescription));
                    }
                    var loaderUrl = $filesEditor.attr("fileContentLoadUrl");
                    if (fileModelToEdit != null) {
                        loaderUrl = loaderUrl.replace("&FileId=0", "&FileId=" + parseInt(fileModelToEdit.FileId));
                    }
                    $.ajax({
                        url: loaderUrl,
                        success: function(html) {
                            try {
                                $div.append(html);
                                $div.find(".search-collection-item-editor").each(function () {
                                    console.log($div.find(".search-collection-item-editor").length + " - in search collection");
                                    var $this = $(this);
                                    var editorName = $(this).data("editorName");
                                    var querySettings = $(this).data("querySettings");
                                    $this.searchCollectionItemWidget({
                                        searchCollectionUrl: $this.data("searchCollectionUrl"),
                                        queryInputPlaceholder: $this.data("searchQueryInputPlaceholder"),
                                        querySettings: querySettings,
                                        isReadonly: $this.data("isReadonly"),
                                        value: $this.data("value")
                                    });
                                });
                                if (fileModelToEdit != null) {
                                    $div.find("#flReportDate").val(fileModelToEdit.ReportDate);
                                    $div.find("#UploadedFileNameText").val(fileModelToEdit.FileName);
                                    $div.find(".search-collection-item-editor").searchCollectionItemWidget("setValue", { IdToken: fileModelToEdit.IdToken, Item: { SearchItemId: fileModelToEdit.AuditorId, SearchItemText: fileModelToEdit.AuditorName } });
                                    $div.find("#flYearBegin").val(fileModelToEdit.YearBegin);
                                    $div.find("#flYearEnd").val(fileModelToEdit.YearEnd);
                                    $div.find("#flOpinion").val(fileModelToEdit.Opinion);
                                }
                            } finally {
                                callAllReadyInObjectContext($div);
                            }
                        }
                    });
                },
                buttons: [
                        { text: "Ok", click: function () {
                            if (fileUploaded == false)
                                return;
                            var description = $div.find("textarea[name='FileDescription']").val();
                            var reportDate = $div.find("#flReportDate").val();
                            var auditorId = $div.find(".search-collection-item-editor").searchCollectionItemWidget("getValue").Item.SearchItemId;
                            var auditorDescription = $div.find(".search-collection-item-editor").searchCollectionItemWidget("getValue").Item.SearchItemText;
                            
                            var yearBegin = $div.find("#flYearBegin").val();
                            var yearBeginTxt = $div.find("#flYearBegin option:selected").text();
                            var yearEnd = $div.find("#flYearEnd").val();
                            var yearEndTxt = $div.find("#flYearEnd option:selected").text();
                            var opinion = $div.find("#flOpinion").val();
                            var optionText = $div.find("#flOpinion option:selected").text();
                            if (descriptionRequired && isNullOrEmpty(description)) {
                                $div.find(".error-msg").remove();
                                $div.append("<span class='error-msg'>{0}</span>".format("Описание файла обязательно для заполнения"));
                                return;
                            }
                            var editedFileModel = {
                                FileId: uploadedFileInfo.FileId,
                                FileName: uploadedFileInfo.FileName,
                                FileDescription: description,
                                FileSize: uploadedFileInfo.FileSize,

                                ReportDate: reportDate,
                                AuditorId: auditorId,
                                AuditorName: auditorDescription,
                                YearBegin: yearBegin,
                                YearEnd: yearEnd,
                                Opinion: opinion,
                                OpinionText: optionText,

                                IdToken: $div.find(".search-collection-item-editor").searchCollectionItemWidget("getValue").IdToken,

                            };
                            onOkCallback(editedFileModel);
                            $div.dialog("close");
                        }
                        },
                        { text: T("Отмена"), click: function () { $div.dialog("close"); } },
                    ],
                close: function () {
                    $div.remove();
                }
            });
        };

        $addFileBtn.click(function () {
            funcOpenEditor(null, function (editedModel) {
                var $newTr = $("<tr>");
                printModelToRow($newTr, editedModel);
                $auctionFilesTable.append($newTr);
                $auctionFilesTable.find(".audit-files-tr-no-rows").remove();
            });

        });

        $filesEditor.delegate(".audit-file-op-edit", "click", function () {
            var $curTr = $(this).closest("tr");
            var curFileModel = JSON.parse($curTr.attr("fileModelJson"));
            funcOpenEditor(curFileModel, function (editedModel) {
                printModelToRow($curTr, editedModel);
            });
        });

        $filesEditor.delegate(".audit-file-op-remove", "click", function () {
            $(this).closest("tr").remove();
            if ($auctionFilesTable.find("tbody > tr").length == 0) {
                printEmptyRow();
            }
        });

        $filesEditor.closest("form").submit(function () {
            var files = new Array();
            $auctionFilesTable.find("tr[filemodeljson]").each(function () {
                var $curTr = $(this);
                if ($curTr.hasClass("audit-files-tr-no-rows"))
                    return;
                var curFilesModel = JSON.parse($curTr.attr("fileModelJson"));
                files.push(curFilesModel);
            });

            var $input = $("#" + $filesEditor.attr("val-store-input-name"));
            $input.val(JSON.stringify(files));
        });
    });
});
