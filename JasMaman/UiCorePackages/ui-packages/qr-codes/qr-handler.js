$(document).ready(function () {
    $(".qr-code").each(function (el) {
        var qrcode = new QRCode($(".qr-code").attr("id"), {
            text: $(".qr-code").attr("qr-content"),
            width: 128,
            height: 128,
            colorDark: '#000000',
            colorLight: '#e6e7e8',
            correctLevel: QRCode.CorrectLevel.H
        });
        $("#qr-050540004455").append(qrcode);
    });
});


