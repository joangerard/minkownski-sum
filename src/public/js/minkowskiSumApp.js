class MinkowskiSumApp {
    constructor(
        sourcePolygonR,
        sourcePolygonQ,
        resultPolygon,
        sourcePolygonRNotInverted,
        helperCalculus,
        polygonOperationHelper,
        polyUnionBuilder,
        width,
        height,
        scale,
        defaultInit = true) {
        this.sourcePolygonQ = sourcePolygonQ;
        this.sourcePolygonR = sourcePolygonR;
        this.resultPolygon = resultPolygon;
        this.sourcePolygonRNotInverted = sourcePolygonRNotInverted
        this.helperCalculus = helperCalculus;
        this.polygonOperationHelper = polygonOperationHelper;
        this.width = width;
        this.height = height;
        this.scale = scale;
        this.polyUnionBuilder = polyUnionBuilder;

        if (defaultInit) {
            this._initDefault();
        }

    }

    _initDefault() {
        this.sourcePolygonRNotInverted.addPoint(new Point(175.9999850802964,118.99996948242188));
        this.sourcePolygonRNotInverted.addPoint(new Point(142.99998787774084,168.99996948242188));
        this.sourcePolygonRNotInverted.addPoint(new Point(141.99998796251188,255.99996948242188));
        this.sourcePolygonRNotInverted.addPoint(new Point(197.99998321533346,252.99996948242188));
        this.sourcePolygonRNotInverted.addPoint(new Point(198.9999831305624,168.99996948242188));
        this.sourcePolygonRNotInverted.addPoint(new Point(175.9999850802964,118.99996948242188));

        this.sourcePolygonQ.addPoint(new Point(171.99998541938058,156.99993896484375));
        this.sourcePolygonQ.addPoint(new Point(112.99999042087212,201.99993896484375));
        this.sourcePolygonQ.addPoint(new Point(179.99998474121222,228.99993896484375));
        this.sourcePolygonQ.addPoint(new Point(245.99997914632337,196.99993896484375));
        this.sourcePolygonQ.addPoint(new Point(171.99998541938058,156.99993896484375));

        let diff = new InverseGridApplication(this.sourcePolygonRNotInverted, this.sourcePolygonR, new HelperCalculus(), this.width, this.height, this.scale);
        diff.getInverse();
        this.bruteForceAlgo();
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
        this.resultPolygon.addPolygon(this.sourcePolygonQ.getPoints(), 0x00ff00, 0x00ff00, 0.25);
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
    linearAlgo(){
        let pPolygonPosCoord = this.helperCalculus.getPositionCoordinatesList(
            this.sourcePolygonR.getPoints(),
            this.width,
            this.height,
            this.scale
        );

        let rPolygonPosCoord = this.helperCalculus.getPositionCoordinatesList(
            this.sourcePolygonQ.getPoints(),
            this.width,
            this.height,
            this.scale
        );

        // triangulate polygon R
        let copyR = this.polygonOperationHelper.copyPoints(this.sourcePolygonR.getPoints());
        if (this.polygonOperationHelper.isClockWise(copyR)) {
            // make it anti clockwise
            copyR = copyR.reverse();
        }
        let trianglesR = this.polygonOperationHelper.triangulatePoly(copyR, []);
        this.sourcePolygonR.addTriangles(trianglesR, 0xAA00BB);

        // triangulate polygon Q
        // let copyQ = this.polygonOperationHelper.copyPoints(this.sourcePolygonQ.getPoints());
        // if (this.polygonOperationHelper.isClockWise(copyQ)) {
        //     // make it anti clockwise
        //     copyQ = copyQ.reverse();
        // }
        // let trianglesQ = this.polygonOperationHelper.triangulatePoly(copyQ, []);
        // this.sourcePolygonQ.addTriangles(trianglesQ, 0xAA00BB);

        // minkownski sum 
        trianglesR.forEach((triangle) => {
            let polygonResult = this.polygonOperationHelper.minkownskiSumLinearAlgo(
                this.helperCalculus.getPositionCoordinatesList(triangle.getPoints(), this.width, this.height, this.scale),
                rPolygonPosCoord);

            polygonResult = this.helperCalculus.getCanvasCoordinatesList(polygonResult, this.width, this.height, this.scale);
            
            this.resultPolygon.addPolygon(polygonResult, 0x00ff00, 0x00ff00, 0.25);
        });

        this.resultPolygon.addPolygon(this.sourcePolygonQ.getPoints(), 0x0000ff, 0x0000ff, 0.25);    
    }

    _nonConvToConv(copyR, copyQ, sourcePolygonR) {
        console.log("Non-convex to Convex");
        let polygonsMS = [];

        let trianglesR = this.polygonOperationHelper.triangulatePoly(copyR, []);
        sourcePolygonR.addTriangles(trianglesR, 0xAA00BB);

        trianglesR.forEach((triangleR) => {
            let polygonResult = this.polygonOperationHelper.minkownskiSumLinearAlgo(
                this.helperCalculus.getPositionCoordinatesList(triangleR.getPoints(), this.width, this.height, this.scale),
                this.helperCalculus.getPositionCoordinatesList(copyQ, this.width, this.height, this.scale));

            polygonResult = this.helperCalculus.getCanvasCoordinatesList(polygonResult, this.width, this.height, this.scale);
            polygonsMS.push(polygonResult);
            this.resultPolygon.addPolygon(polygonResult, 0x00ff00, 0x00ff00, 0.25);
        });

        // union polygons to get a final result
        let unionOfPolygons = polygonsMS[0];
        for(let i = 1; i < polygonsMS.length; i++) {
            let intersectionPoints, polygons;
            this.polyUnionBuilder = new PolyUnionBuilder();
            [intersectionPoints, polygons] = this.polyUnionBuilder.swapLineSegmentsIntersectionAlgo(unionOfPolygons, polygonsMS[i]);
            for(let j = 0; j < polygons.length; j++){
                if (polygons[j].type === 'EXT_POLY') {
                    unionOfPolygons = this.polyUnionBuilder.getPointsFromEdges(polygons[j].edges);
                    break;
                }
            };
        }
        return unionOfPolygons;
    }

    linearAlgoNonConvex(){
        let pPolygonPosCoord = this.helperCalculus.getPositionCoordinatesList(
            this.sourcePolygonR.getPoints(),
            this.width,
            this.height,
            this.scale
        );

        let rPolygonPosCoord = this.helperCalculus.getPositionCoordinatesList(
            this.sourcePolygonQ.getPoints(),
            this.width,
            this.height,
            this.scale
        );

        // triangulate polygon R
        let copyR = this.polygonOperationHelper.copyPoints(this.sourcePolygonR.getPoints());
        if (this.polygonOperationHelper.isClockWise(copyR)) {
            // make it anti clockwise
            copyR = copyR.reverse();
        }

        // triangulate polygon Q
        let copyQ = this.polygonOperationHelper.copyPoints(this.sourcePolygonQ.getPoints());
        if (this.polygonOperationHelper.isClockWise(copyQ)) {
            // make it anti clockwise
            copyQ = copyQ.reverse();
        }

        let convexR = this.polygonOperationHelper.isConvex(copyR);
        let convexQ = this.polygonOperationHelper.isConvex(copyQ);
        let unionOfPolygons;
        let alpha = 0;
        
        //non-convex non-convex
        if (!convexR && !convexQ) {
            console.log('Non Convex to Non Convex');
            let trianglesR = this.polygonOperationHelper.triangulatePoly(copyR, []);
            this.sourcePolygonR.addTriangles(trianglesR, 0xAA00BB);
    
            
            let trianglesQ = this.polygonOperationHelper.triangulatePoly(copyQ, []);
            this.sourcePolygonQ.addTriangles(trianglesQ, 0xAA00BB);
    
            // minkownski sum 
            let polygonsMS = [];
            trianglesR.forEach((triangleR) => {
                trianglesQ.forEach((triangleQ) => {
                    let polygonResult = this.polygonOperationHelper.minkownskiSumLinearAlgo(
                        this.helperCalculus.getPositionCoordinatesList(triangleR.getPoints(), this.width, this.height, this.scale),
                        this.helperCalculus.getPositionCoordinatesList(triangleQ.getPoints(), this.width, this.height, this.scale));
        
                    polygonResult = this.helperCalculus.getCanvasCoordinatesList(polygonResult, this.width, this.height, this.scale);
                    polygonsMS.push(polygonResult);
                    this.resultPolygon.addPolygon(polygonResult, 0x00ff00, 0x00ff00, 0.25);
                });
            });

            // union polygons to get a final result
            unionOfPolygons = polygonsMS[0];
            for(let i = 1; i < polygonsMS.length; i++) {
                let intersectionPoints, polygons;
                this.polyUnionBuilder = new PolyUnionBuilder();
                [intersectionPoints, polygons] = this.polyUnionBuilder.swapLineSegmentsIntersectionAlgo(unionOfPolygons, polygonsMS[i]);
                for(let j = 0; j < polygons.length; j++){
                    if (polygons[j].type === 'EXT_POLY') {
                        unionOfPolygons = this.polyUnionBuilder.getPointsFromEdges(polygons[j].edges);
                        break;
                    }
                };
            }
        } 
        // non-convex convex
        else if(!convexR && convexQ) {
            unionOfPolygons = this._nonConvToConv(copyR, copyQ, this.sourcePolygonR);
        }
        // convex non-convex
        else if(convexR && !convexQ) {
            unionOfPolygons = this._nonConvToConv(copyQ, copyR, this.sourcePolygonQ);
        }
        // convex convex
        else if (convexR && convexQ) {
            console.log('Convex to Convex');
            unionOfPolygons = this.polygonOperationHelper.minkownskiSumLinearAlgo(
                this.helperCalculus.getPositionCoordinatesList(copyR, this.width, this.height, this.scale),
                this.helperCalculus.getPositionCoordinatesList(copyQ, this.width, this.height, this.scale));
            unionOfPolygons = this.helperCalculus.getCanvasCoordinatesList(unionOfPolygons, this.width, this.height, this.scale);
            alpha = 0.25;
        }
        
        this.resultPolygon.addPolygon(this.sourcePolygonQ.getPoints(), 0x0000ff, 0x0000ff, 0.25);
        
        

        this.resultPolygon.addPolygon(unionOfPolygons, 0xff0000, 0xff0000, alpha, 2);
    }
}
