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
        deplacedPoly = this.helperCalculus.getCanvasCoordinatesList(
                deplacedPoly,
                this.width,
                this.height,
                this.scale
                );
        this.resultPolygon.addPolygon(deplacedPoly, 0x0000ff, 0x0000ff, 0.25);
        
    }
}
