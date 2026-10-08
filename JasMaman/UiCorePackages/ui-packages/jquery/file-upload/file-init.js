/* $(document).ready(
    function() {
        $(".fileupload").each(function(){
            $(this).fileupload({
                type: "POST",
                dataType: 'json',
                autoUpload: false,
                singleFileUploads: false,
                done: function (e, data) {
                    $.each(data.result.files, function (index, file) {
                        $('<p/>').text(file.name).appendTo(document.body);
                    });
                }
            });
            $(this).bind("fileuploadadd", function (e, data) {
                var $dialog = $("<div>");
                $.each(data.files, function (index, file) {
                    var $fileItem = $("<span>");
                    $fileItem.text("Файл: " + file.name+ "; Описание: ");

                    var $description = $("<textarea name='file-{0}'></textarea>".format(index));
                    $dialog.append($fileItem);
                    $dialog.append("<br/>")
                    $dialog.append($description);
                    $description.data("fileName", file.name);
                });
                $dialog.dialog({
                    buttons: {
                        "Ok": function(){
                            data.formData = {};
                            var val = [];
                            $dialog.find("textarea").each(function(){
                                var $textarea = $(this);
                                val.push({
                                    fileName: $textarea.data("fileName"),
                                    description: $textarea.val()
                                });
                            });
                            
                            data.formData.descriptions = JSON.stringify(val);


                            data.submit()
                                .then(function (result) {
                                    if(result.result == "failure"){
                                        alert("Не удалось загрузить файлы на сервер");
                                    }
                                    $dialog.dialog("close");
                                }, function (jqXHR, textStatus, errorThrown) {
                                    alert("Не удалось загрузить файлы на сервер");
                                    $dialog.dialog("close");
                                })
                                ;

                        },
                        "Отмена": function(){
                            $dialog.dialog("destroy");
                        }
                    },
                    close: function(){
                        $dialog.dialog("destroy");
                    }
                });
            });
        });
    }
); */