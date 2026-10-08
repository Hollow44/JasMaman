/**
 * Renders a progress bar.
 * @param {HTMLElement} el The target element.
 * @class
 */
function Progress(el) {
    this.el = el;
    this.loading = 0;
    this.loaded = 0;
}

/**
 * Increment the count of loading tiles.
 */
Progress.prototype.addLoading = function () {
    if (this.loading === 0) {
        this.show();
    }
    ++this.loading;
    this.update();
};

/**
 * Increment the count of loaded tiles.
 */
Progress.prototype.addLoaded = function () {
    const this_ = this;
    setTimeout(function () {
        ++this_.loaded;
        this_.update();
    }, 100);
};

/**
 * Update the progress bar.
 */
Progress.prototype.update = function () {
    const width = ((this.loaded / this.loading) * 100).toFixed(1) + '%';
    this.el.style.width = width;
    if (this.loading === this.loaded) {
        this.loading = 0;
        this.loaded = 0;
        const this_ = this;
        setTimeout(function () {
            this_.hide();
        }, 500);
    }
};

/**
 * Show the progress bar.
 */
Progress.prototype.show = function () {
    this.el.style.visibility = 'visible';
};

/**
 * Hide the progress bar.
 */
Progress.prototype.hide = function () {
    if (this.loading === this.loaded) {
        this.el.style.visibility = 'hidden';
        this.el.style.width = 0;
    }
};