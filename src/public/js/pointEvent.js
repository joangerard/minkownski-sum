class PointEvent {

    onPointDragStart(event) {
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.data = event.data;
        this.alpha = 0.5;
        this.dragging = true;
    }
    
    onPointDragEnd() {
        this.alpha = 1;
        this.dragging = false;
        // set the interaction data to null
        this.data = null;
    }
    
    onPointDragMove() {
        if (this.dragging) {
            const newPosition = this.data.getLocalPosition(this.parent);
            console.log(newPosition.x, newPosition.y, this.widhCanvas, this.heightCanvas);
            this.x = newPosition.x;
            this.y = newPosition.y;
        }
    }
}