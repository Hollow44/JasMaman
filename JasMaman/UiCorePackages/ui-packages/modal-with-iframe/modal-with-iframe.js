//$('#modal-1').on('shown.bs.modal', function (e) {
//    alert("I want this to appear after the modal has opened!");
//});


$('.modal-with-frame-btn').click(function (e) {
    var link = $(this).data("iframeUrl");
    for (attr of this.attributes) {
        if (attr.name.startsWith("data-iframe-url")) {
            var iframeId = attr.name.split('-#-').pop();
            console.log(attr);
            console.log(iframeId);
            //$('#' + iframeId).attr('src', attr.value);
            $('.' + iframeId).prop('src', attr.value);
            //$('#' + iframeId).load(attr.value);
        }
    }

});