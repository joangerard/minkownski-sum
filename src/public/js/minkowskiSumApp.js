class MinkowskiSumApp {
    constructor(
        sourcePolygonR,
        sourcePolygonQ,
        resultPolygon,
        sourcePolygonRNotInverted,
        helperCalculus,
        polygonOperationHelper,
        width,
        height,
        scale) {
        this.sourcePolygonQ = sourcePolygonQ;
        this.sourcePolygonR = sourcePolygonR;
        this.resultPolygon = resultPolygon;
        this.sourcePolygonRNotInverted = sourcePolygonRNotInverted
        this.helperCalculus = helperCalculus;
        this.polygonOperationHelper = polygonOperationHelper;
        this.width = width;
        this.height = height;
        this.scale = scale;
    }

    bruteForceAlgo() {
        let polygonR = this.helperCalculus.getPositionCoordinatesList(
            this.sourcePolygonR.getPoints(),
            this.width,
            this.height,
            this.scale
        );

        let polygonRNotInverted = this.helperCalculus.getPositionCoordinatesList(
            this.sourcePolygonRNotInverted.getPoints(),
            this.width,
            this.height,
            this.scale
        );

        let polygonQ = this.helperCalculus.getPositionCoordinatesList(
            this.sourcePolygonQ.getPoints(),
            this.width,
            this.height,
            this.scale
        );
        
        let polygonResultPoints = this.polygonOperationHelper.minkownskiSumBruteForceAlgo(polygonR, polygonQ);

        polygonResultPoints.forEach(point => {
            this.resultPolygon.addPoint(this.helperCalculus.getCanvasCoordinates(
                point,
                this.width,
                this.height,
                this.scale
                ));
        });

        // add the first point to close polygon...
        this.resultPolygon.addPoint(this.helperCalculus.getCanvasCoordinates(
            polygonResultPoints[0],
            this.width,
            this.height,
            this.scale
            ))
        
        // add Q polygon to app
        this.resultPolygon.addPolygon(this.sourcePolygonQ.getPoints(), 0x00ff00, 0x00ff00, 0.25)
        let deplacedPoly = this.helperCalculus.deplacePoints(
            polygonRNotInverted,
            polygonResultPoints[0]);
        let deplacedPolyCanvas = this.helperCalculus.getCanvasCoordinatesList(
                deplacedPoly,
                this.width, 
                this.height,
                this.scale
                );  
        let animatedPolygon = this.resultPolygon.addPolygon(deplacedPolyCanvas, 0x0000ff, 0x0000ff, 0.25);

        let index = 0;
        let index1 = 1;
        let count = 0;

        this.resultPolygon.app.ticker.add(() => {
            // calculate the line equation between one point and the next one.
            let m = (polygonResultPoints[index1].y - polygonResultPoints[index].y) / (polygonResultPoints[index1].x - polygonResultPoints[index].x);
            let b = polygonResultPoints[index].y - m * polygonResultPoints[index].x
            let delta = 100;
            let deltaX = (polygonResultPoints[index1].x - polygonResultPoints[index].x)/delta;
            let x_init = polygonResultPoints[index].x;

            // at each tick get the x/and y that is bounded by the polygon
            let x = x_init + count * deltaX;
            let y = m * x + b;

            // create new point that will be the new center of the deplaced polygon
            let newPoint = new Point(x, y);
            if (count < delta) {
                // remove previous polygon from grid
                this.resultPolygon.removePolygon(animatedPolygon);
                let deplacedPoly = this.helperCalculus.deplacePoints(
                    polygonRNotInverted,
                    newPoint);
                let deplacedPolyCanvas = this.helperCalculus.getCanvasCoordinatesList(
                        deplacedPoly,
                        this.width, 
                        this.height,
                        this.scale
                        );
                // deplace polygon
                animatedPolygon = this.resultPolygon.addPolygon(deplacedPolyCanvas, 0x0000ff, 0x0000ff, 0.25);
                count++;
            } else if(index === polygonResultPoints.length - 2){
                // do all the same operations with the last point and the first one.
                index = polygonResultPoints.length - 1;
                index1 = 0;
                count = 0;
            } else if(index === polygonResultPoints.length - 1){
                // the polygon has turned around so start again
                index = 0;
                index1 = 1;
                count = 0;
            } else {
                // now calculate from next points.
                index++;
                index1++;
                count = 0;
            }
        });
                
    }
}
