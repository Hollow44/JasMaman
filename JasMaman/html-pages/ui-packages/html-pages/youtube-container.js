$(document).ready(
    function ($) {
        var playStream = function (url) {
            var $videoContainer = $(".youtube-container");
            $videoContainer.empty();

            var video = '<iframe width="100%" height="400em" frameborder="0" src="' + url + '"></iframe>';

            $videoContainer.append(video);
        };

        $(".youtube-video-link").click(
            function () {
                $(".youtube-video-link-selected").removeClass("youtube-video-link-selected");
                $(this).addClass("youtube-video-link-selected");
                var streamUrl = $(this).attr("video-url");
                playStream(streamUrl);
            }
        );

        $("#modalVideo").on('hidden.bs.modal', function (e) {
            $("#modalVideo iframe").attr("src", $("#modalVideo iframe").attr("src"));
        });

    }
);
