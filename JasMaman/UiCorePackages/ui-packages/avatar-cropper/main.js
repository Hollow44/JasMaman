var $avatarCropper = $(".avatar-cropper");
var $avatar = $(".editable-avatar");
var $avatarHover = $(".avatar-hover");

var Cropper = window.Cropper;
var URL = window.URL || window.webkitURL;
var container = document.querySelector('.img-container');
var image = container.getElementsByTagName('img').item(0);
var download = document.getElementById('download');
var resultValue = document.getElementById($avatarCropper.attr("result-input"));
var actions = document.getElementById('actions');
var inputImage = document.getElementById('inputImage');
var options = {
    aspectRatio: 1,
    preview: '.img-preview'
};
var cropper;
var uploadedImageType = 'image/jpeg';
var uploadedImageName = 'cropped.jpg';
var uploadedImageURL;

$avatar.click(function () {
    $(inputImage).click();
});
$avatarHover.click(function() { $avatar.click() });

$(".upload-image").hide();
$(".crop-workspace").hide();
$(".docs-preview").hide();
$(".reset-image").hide();
$(".accept-image").hide();

// Buttons
if (!document.createElement('canvas').getContext) {
    $('button[data-method="getCroppedCanvas"]').prop('disabled', true);
}

// Methods
actions.querySelector('.docs-buttons').onclick = function (event) {
    var e = event || window.event;
    var target = e.target || e.srcElement;
    var result;
    var data;

    if (!cropper) {
        return;
    }

    while (target !== this) {
        if (target.getAttribute('data-method')) {
            break;
        }

        target = target.parentNode;
    }

    if (target === this || target.disabled || target.className.indexOf('disabled') > -1) {
        return;
    }

    data = {
        method: target.getAttribute('data-method'),
        target: target.getAttribute('data-target'),
        option: target.getAttribute('data-option') || undefined,
        secondOption: target.getAttribute('data-second-option') || undefined
    };

    cropped = cropper.cropped;

    if (data.method) {
        switch (data.method) {
            case 'getCroppedCanvas':
                try {
                    data.option = JSON.parse(data.option);
                } catch (e) {
                    console.log(e.message);
                }

                if (uploadedImageType === 'image/jpeg') {
                    if (!data.option) {
                        data.option = {};
                    }

                    data.option.fillColor = '#fff';
                }

                break;
        }

        result = cropper[data.method](data.option, data.secondOption);

        switch (data.method) {
            case 'getCroppedCanvas':
                if (result) {

                    var canvas = document.createElement("canvas");
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(result, 0, 0);

                    var MAX_SIZE = 200;
                    var width = result.width;
                    var height = result.height;

                    if (width > MAX_SIZE) {
                        height /= height / MAX_SIZE;
                        width /= width / MAX_SIZE;
                    }
                    canvas.width = width;
                    canvas.height = height;
                    var ctx = canvas.getContext("2d");
                    ctx.drawImage(result, 0, 0, width, height);

                    var newdataURL = canvas.toDataURL("image/jpeg");

                    resultValue.value = newdataURL;
                    $("form").first().submit();
                }

                break;
        }

    }
};

// Import image
if (URL) {
    inputImage.onchange = function () {
        var files = this.files;
        var file;

        if (files && files.length) {
            file = files[0];

            if (/^image\/\w+/.test(file.type)) {

                $(".crop-workspace").show();
                $(".docs-preview").show();
                $(".reset-image").show();
                $(".accept-image").show();

                uploadedImageType = file.type;
                uploadedImageName = file.name;

                if (uploadedImageURL) {
                    URL.revokeObjectURL(uploadedImageURL);
                }

                image.src = uploadedImageURL = URL.createObjectURL(file);

                if (cropper) {
                    cropper.destroy();
                }

                cropper = new Cropper(image, options);


                $(window).resize(function () {
                    $(".reset-image").click();
                });

                $avatarCropper.modal();

            } else {
                window.alert('Please choose an image file.');
            }
        }
    };
} else {
    inputImage.disabled = true;
    inputImage.parentNode.className += ' disabled';
}
