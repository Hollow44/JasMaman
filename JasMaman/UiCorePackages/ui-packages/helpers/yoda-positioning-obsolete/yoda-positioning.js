function getTipPrefferedOffset(offset, containerToBoundTipSize, tipContainerSize) {
    var $doc = $(document);
    var docSize = {
        width: $doc.width(),
        height: $doc.height()
    };
    var vertDirection = "";
    if (offset.top + containerToBoundTipSize.height + tipContainerSize.height < docSize.height) {
        vertDirection = "down";
    } else {
        if (offset.top > docSize.height - (offset.top + containerToBoundTipSize.height)) {
            vertDirection = "up";
        } else {
            vertDirection = "down";
        }
    }
    var horDirection = "";
    if (offset.left + tipContainerSize.width < docSize.widht) {
        horDirection = "right";
    } else {
        if (offset.left + tipContainerSize.width > docSize.width - offset.left) {
            horDirection = "left";
        } else {
            horDirection = "right";
        }
    }

    // note temp fix
    vertDirection = "down";
    horDirection = "right";
    
    var retOffset = new Object();

    if (vertDirection == "up") {
        retOffset.top = offset.top - tipContainerSize.height;
    } else {
        retOffset.top = offset.top + containerToBoundTipSize.height;
    }
    if (horDirection == "right") {
        retOffset.left = offset.left;
    } else {
        retOffset.left = offset.left + containerToBoundTipSize.width - tipContainerSize.width;
    }
    
    return retOffset;
}