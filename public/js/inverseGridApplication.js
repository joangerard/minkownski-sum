class InverseGridApplication {
    constructor(sourceApp, destinationApp, helperCalculus, width, height, scale) {
        this.sourceApp = sourceApp;
        this.destinationApp = destinationApp;
        this.helperCalculus = helperCalculus;
        this.width = width;
        this.height = height;
        this.scale = scale;
    }

    getInverse() {
        let firstPoint = this.sourceApp.pointsGraphic[0];

        this.sourceApp.pointsGraphic.forEach(point => {
            let new_point = this.helperCalculus.getInvertedCoordinates(point, this.width, this.height);
            this.destinationApp.addPoint(new_point);
        });
        this.destinationApp.addPoint(this.helperCalculus.getInvertedCoordinates(firstPoint, this.width, this.height));
    }
}