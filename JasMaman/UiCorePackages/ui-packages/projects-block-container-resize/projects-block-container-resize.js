$(document).ready(function () {
    var fitProjectsBlockContainer = function () {
        var $projectBlockContainer = $(".project-block-container");
        var $projectBlock = $projectBlockContainer.find(".project-block");
        var marginLeftRight = 30;
        var projectBlockDivWidth = $projectBlock.outerWidth(true);
        var docWidth = $(document).width() - marginLeftRight * 2;
        var blocksCount = Math.min(Math.floor(docWidth / projectBlockDivWidth), $projectBlock.length);
        
        $projectBlockContainer.width(projectBlockDivWidth * blocksCount);
    };

    fitProjectsBlockContainer();

    $(window).resize(function () {
        fitProjectsBlockContainer();
    });
});