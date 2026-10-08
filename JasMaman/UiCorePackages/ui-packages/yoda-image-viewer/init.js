$(document).ready(function () {

    InitYodaImageViewer();

});


function InitYodaImageViewer() {
	$(".yoda-viewable-image").each(function () {
		ezoom.onInit($(this), {});
	});
}