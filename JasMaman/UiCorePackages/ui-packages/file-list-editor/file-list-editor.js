$(document).ready(function () {
    $(".file-list-editor").each(function () {
        var $this = $(this);
        var editorName = $this.data("editorName");
        if ($this.data("readonly") == "True") {
            return;
        }
        var isImageCollection = $this.data("mode") == "ImageCollection";
        var files = $this.data("files");
        var uploadUrl = $this.data("fileUploadUrl");

        var $uploadBtn = $this.find(".fileinput-button");

        var $files = $this.find(".files-container");
        if (isImageCollection) {
            $files.addClass("files-image-collection");
        }
        function redrawFiles() {
            $files.empty();
            if (files.length == 0) {
                $files.html("<span class='file-no-items'>Перенесите файлы сюда</span>");
                return;
            }

            for (var i = 0; i < files.length; i++) {
                var curFileItem = files[i];
                if (isImageCollection) {
                    var $markup = $(
                        "<div class='file-item-container'>"
                        + "<span class='file-remove-btn fa fa-remove'></span>"
                        + " <span class='file-size-info'></span>"
                        + " <a class='file-name' target='_blank'><img class='file-img'/></a>"
                        + " <span class='file-description-info'><span>"
                        + "</div>"
                    );

                    var $removeFile = $markup.find(".file-remove-btn");
                    $removeFile.data("file", curFileItem);

                    var $fileLink = $markup.find(".file-name");
                    $fileLink.prop("href", curFileItem.DownloadUrl);
                    //$fileLink.text(curFileItem.FileName);
                    var $img = $markup.find(".file-img");
                    $img.prop("src", curFileItem.DownloadUrl);

                    var $fileSize = $markup.find(".file-size-info");
                    $fileSize.text(curFileItem.HumanReadableFileSize);

                    if (curFileItem.Description) {
                        var $description = $markup.find(".file-description-info");
                        $description.text("Описание: " + curFileItem.Description);
                    }
                    $files.append($markup);
                } else {
                    var $markup = $(
                        "<div class='file-item-container'>"
                        + "<button class='file-remove-btn btn btn-xs btn-danger'>Удалить</button>"
                        + " <a class='file-name' target='_blank'></a>"
                        + " <span class='file-size-info'></span>"
                        + " <span class='file-description-info'><span>"
                        + "</div>"
                    );

                    var $removeFile = $markup.find(".file-remove-btn");
                    $removeFile.data("file", curFileItem);

                    var $fileLink = $markup.find(".file-name");
                    $fileLink.prop("href", curFileItem.DownloadUrl);
                    $fileLink.text(curFileItem.FileName);

                    var $fileSize = $markup.find(".file-size-info");
                    $fileSize.text("(" + curFileItem.HumanReadableFileSize + ")");

                    if (curFileItem.Description) {
                        var $description = $markup.find(".file-description-info");
                        $description.text("Описание: " + curFileItem.Description);
                    }
                    $files.append($markup);
                }
            }
        }
        redrawFiles();

        $this.on("click", ".file-remove-btn", function () {
            var file = $(this).data("file");
            var newFiles = [];
            for (var i = 0; i < files.length; i++) {
                if (files[i].FileId == file.FileId) {
                    continue;
                }
                newFiles.push(files[i]);
            }
            files = newFiles;
            redrawFiles();
        });

        $uploadBtn.fileupload({
            type: "POST",
            dataType: 'json',
            autoUpload: false,
            singleFileUploads: false,
            dropZone: $this,
            done: function (e, data) { }
        });
        $uploadBtn.bind("fileuploadadd", function (e, data) {
            var $dialog = $("<div>");
            data.url = uploadUrl;
            $.each(data.files, function (index, file) {
                var $fileItem = $("<span>");
                $fileItem.text("Файл: " + file.name + "; Описание: ");

                var $description = $("<textarea class='form-control' name='file-{0}'></textarea>".format(index));
                $dialog.append($fileItem);
                $dialog.append("<br/>")
                $dialog.append($description);
                $description.data("fileName", file.name);
            });
            $dialog.dialog({
                buttons: {
                    "Ok": function () {
                        data.formData = {};
                        var val = [];
                        $dialog.find("textarea").each(function () {
                            var $textarea = $(this);
                            val.push({
                                fileName: $textarea.data("fileName"),
                                description: $textarea.val()
                            });
                        });

                        data.formData.descriptions = JSON.stringify(val);
                        data.formData.__RequestVerificationToken = $('input[name="__RequestVerificationToken"]', $this.closest("form")).val();

                        $.blockUI({
                            message: "<h3>Идет загрузка файлов. Пожалуйста ждите.</h3>",
                            css: {
                                border: 'none',
                                padding: '15px',
                                backgroundColor: '#000',
                                '-webkit-border-radius': '10px',
                                '-moz-border-radius': '10px',
                                opacity: .5,
                                color: '#fff'
                            },
                            baseZ: 2000
                        });

                        data.submit()
                            .then(function (result) {
                                $.unblockUI();
                                if (result.result == "OK") {
                                    for (var i = 0; i < result.savedFiles.length; i++) {
                                        files.push(result.savedFiles[i]);
                                    }
                                    redrawFiles();
                                    $dialog.dialog("close");
                                } else {
                                    if (result.message) {
                                        alert(result.message);
                                    } else {
                                        alert("Не удалось загрузить файлы на сервер");
                                        $dialog.dialog("close");
                                    }
                                }
                            }, function (jqXHR, textStatus, errorThrown) {
                                $.unblockUI();
                                alert("Не удалось загрузить файлы на сервер");
                                $dialog.dialog("close");
                            })
                            ;

                    },
                    "Отмена": function () {
                        $dialog.dialog("close");
                    }
                },
                close: function () {
                    $dialog.dialog("destroy");
                }
            });
        });



        $this.closest("form").submit(function () {
            var $form = $(this);
            $form.find("[name='{0}']".format(editorName)).remove();
            var $input = $("<input type='hidden'>");
            $input.attr("name", editorName);
            $input.val(JSON.stringify(files));
            $form.append($input);
        });
    });
});


(function ($) {
    $.widget("yoda.fileListEditor", {
        _create: function () {
            var that = this;
            var options = $.extend({
                uploadUrl: null,
                mode: "Files",
                readOnly: false,
                files: [],
                onChange: function (files) { },
                description: null
            },
                this.options);
            var isImgMode = (options.mode === "ImageCollection");

            this._files = options.files;

            var $widget = $("<div>");

            if (options.readOnly !== true) {
                $widget.append(
                    "<span class='btn btn-success btn-sm fileinput-button'>" +
                    "<i class='glyphicon glyphicon-plus'></i >" +
                    "<span>Добавить файл</span>" +
                    "<input class='fileupload' type='file' name='files[]' data-url='{0}' multiple>".format(
                        options.uploadUrl) +
                    "</span >"
                );
            }

            if (options.description) {
                $widget.append($("<span class='files-description'>").text(options.description));
            }
            $widget.append("<div class='files-container'>");

            var $uploadBtn = $widget.find(".fileinput-button");

            var $files = $widget.find(".files-container");
            if (isImgMode) {
                $files.addClass("files-image-collection");
            }

            $widget.on("click", ".file-remove-btn", function () {
                var file = $(this).data("file");
                var newFiles = [];
                for (var i = 0; i < that._files.length; i++) {
                    if (that._files[i].FileId == file.FileId) {
                        continue;
                    }
                    newFiles.push(that._files[i]);
                }
                that._files = newFiles;
                options.onChange(that._files);
                that._redrawFiles();
            });

            $uploadBtn.fileupload({
                type: "POST",
                dataType: 'json',
                autoUpload: false,
                singleFileUploads: false,
                dropZone: $widget,
                done: function (e, data) { }
            });
            $uploadBtn.bind("fileuploadadd", function (e, data) {
                var $dialog = $("<div>");
                data.url = options.uploadUrl;
                $.each(data.files, function (index, file) {
                    var $fileItem = $("<span>");
                    $fileItem.text("Файл: " + file.name + "; Описание: ");

                    var $description = $("<textarea name='file-{0}'></textarea>".format(index));
                    $dialog.append($fileItem);
                    $dialog.append("<br/>");
                    $dialog.append($description);
                    $description.data("fileName", file.name);
                });
                $dialog.dialog({
                    buttons: {
                        "Ok": function () {
                            data.formData = {};
                            var val = [];
                            $dialog.find("textarea").each(function () {
                                var $textarea = $(this);
                                val.push({
                                    fileName: $textarea.data("fileName"),
                                    description: $textarea.val()
                                });
                            });

                            data.formData.descriptions = JSON.stringify(val);
                            data.formData.__RequestVerificationToken = $('input[name="__RequestVerificationToken"]').val();

                            $.blockUI({
                                message: "<h3>Идет загрузка файлов. Пожалуйста ждите.</h3>",
                                css: {
                                    border: 'none',
                                    padding: '15px',
                                    backgroundColor: '#000',
                                    '-webkit-border-radius': '10px',
                                    '-moz-border-radius': '10px',
                                    opacity: .5,
                                    color: '#fff'
                                },
                                baseZ: 2000
                            });

                            data.submit()
                                .then(function (result) {
                                    $.unblockUI();
                                    if (result.result == "OK") {
                                        for (var i = 0; i < result.savedFiles.length; i++) {
                                            that._files.push(result.savedFiles[i]);
                                        }
                                        options.onChange(that._files);
                                        that._redrawFiles();
                                        $dialog.dialog("close");
                                    } else {
                                        if (result.message) {
                                            alert(result.message);
                                        } else {
                                            alert("Не удалось загрузить файлы на сервер");
                                            $dialog.dialog("close");
                                        }
                                    }
                                }, function (jqXhr, textStatus, errorThrown) {
                                    $.unblockUI();
                                    alert("Не удалось загрузить файлы на сервер");
                                    $dialog.dialog("close");
                                })
                                ;

                        },
                        "Отмена": function () {
                            $dialog.dialog("close");
                        }
                    },
                    close: function () {
                        $dialog.dialog("destroy");
                    }
                });
            });

            this.element.append($widget);
            this._$files = $files;
            this._$widget = $widget;

            this._redrawFiles();
        },
        files: function (value) {
            if (value) {
                this._files = value;
                this.options.onChange(this._files);
                this._redrawFiles();
            } else {
                return this._files;
            }
        },
        _redrawFiles: function () {
            this._$files.empty();
            var isImgMode = (this.options.mode === "ImageCollection");
            if (this._files.length === 0) {
                if (this.options.readOnly === true) {
                    this._$files.html("<span class='files-empty-info'>Нет файлов</span>");
                } else {
                    this._$files.html("<span class='file-no-items'>Перенесите файлы сюда</span>");
                }
                return;
            }

            for (var i = 0; i < this._files.length; i++) {
                var curFileItem = this._files[i];
                var $markup = $("<div class='file-item-container'>");


                if (isImgMode) {
                    $markup.append("<span class='file-remove-btn fa fa-remove'></span>");
                    $markup.append(" <span class='file-size-info'></span>");
                    $markup.append(" <a class='file-name' target='_blank'><img class='file-img'/></a>");
                    $markup.append(" <span class='file-description-info'><span>");
                } else {
                    $markup.append("<button class='file-remove-btn btn btn-xs btn-danger'>Удалить</button>");
                    $markup.append("<a class='file-name' target='_blank'></a>");
                    $markup.append("<span class='file-size-info'></span>");
                    $markup.append("<span class='file-description-info'><span>");
                }

                var $removeFile = $markup.find(".file-remove-btn");
                $removeFile.data("file", curFileItem);
                if (this.options.readOnly === true) {
                    $removeFile.remove();
                }

                var $fileLink = $markup.find(".file-name");
                $fileLink.prop("href", curFileItem.DownloadUrl);
                $fileLink.text(isImgMode ? "" : curFileItem.FileName);

                if (isImgMode) {
                    var $img = $markup.find(".file-img");
                    $img.prop("src", curFileItem.DownloadUrl);
                }

                var $fileSize = $markup.find(".file-size-info");

                $fileSize.text(
                    isImgMode
                        ? curFileItem.HumanReadableFileSize
                        : "({0})".format(curFileItem.HumanReadableFileSize)
                );

                if (curFileItem.Description) {
                    var $description = $markup.find(".file-description-info");
                    $description.text("Описание: " + curFileItem.Description);
                }
                this._$files.append($markup);
            }
        },
        destroy: function () {
            this._$widget.remove();
            $.Widget.prototype.destroy.call(this);
        }
    });
})(jQuery);
