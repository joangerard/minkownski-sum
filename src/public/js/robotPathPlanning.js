class RobotPathPlanning {
    constructor(polyOperationHelper, helperCalculus, canvasName) {
        this.polyOperationHelper = polyOperationHelper;
        this.helperCalculus = helperCalculus;
        this.app = new PIXI.Application({ antialias: true, width:900, height: 500});
        document.getElementById(canvasName).appendChild(this.app.view);
        this.polygons = JSON.parse("[{\"vertices\":[{\"id\":null,\"x\":133,\"y\":219},{\"id\":null,\"x\":250,\"y\":126},{\"id\":null,\"x\":358,\"y\":279},{\"id\":null,\"x\":201,\"y\":340}]},{\"vertices\":[{\"id\":null,\"x\":418,\"y\":184},{\"id\":null,\"x\":625,\"y\":182},{\"id\":null,\"x\":455,\"y\":280}]},{\"vertices\":[{\"id\":null,\"x\":499,\"y\":32},{\"id\":null,\"x\":442,\"y\":147},{\"id\":null,\"x\":654,\"y\":107}]},{\"vertices\":[{\"id\":null,\"x\":515,\"y\":392},{\"id\":null,\"x\":573,\"y\":296},{\"id\":null,\"x\":575,\"y\":392},{\"id\":null,\"x\":677,\"y\":344},{\"id\":null,\"x\":620,\"y\":453}]},{\"vertices\":[{\"id\":null,\"x\":102,\"y\":400},{\"id\":null,\"x\":378,\"y\":377},{\"id\":null,\"x\":378,\"y\":464},{\"id\":null,\"x\":97,\"y\":459}]}]");
        this.currentPoly = 0;
        this.firstPoint = true;
        // this.app.renderer.plugins.interaction.on('pointermove', this._onPointerMove.bind(this));
        this.lastPoint = null;
        this.polygonsGraph = new PIXI.Graphics();
        this.pointGraph = new PIXI.Graphics();
        this.pointGraphB = new PIXI.Graphics();
        this.visibilityGraph = new PIXI.Graphics();
        this.pathGraph = new PIXI.Graphics();
        this.minkownskiSumGraph = new PIXI.Graphics();
        this.robotGraph = new PIXI.Graphics();
        this.app.stage.addChild(this.polygonsGraph);
        this.app.stage.addChild(this.visibilityGraph);
        this.app.stage.addChild(this.pathGraph);
        this.app.stage.addChild(this.pointGraph);
        this.app.stage.addChild(this.pointGraphB);
        this.app.stage.addChild(this.minkownskiSumGraph);
        this.app.stage.addChild(this.robotGraph);

        this.pointGraph.interactive = true;
        this.pointGraph.buttonMode = true;
        this.pointGraphB.interactive = true;
        this.pointGraphB.buttonMode = true;

        this.pointGraph
            .on('pointerdown', this._onDragStart)
            .on('pointerup', this._onDragEnd)
            .on('pointerupoutside', this._onDragEnd)
            .on('pointermove', this._onDragMove);

        this.pointGraphB
            .on('pointerdown', this._onDragStart)
            .on('pointerup', this._onDragEnd)
            .on('pointerupoutside', this._onDragEnd)
            .on('pointermove', this._onDragMove);

        this.point = new Point(400, 90);
        this.pointB = new Point(870, 30);
        this.visibilityGraphActive = true;
        this.showMinkowskiSumsActive = true;

        this.width = 900;
        this.height = 500;
        this.scale = 10;
        this.robot = null;
        
        this._drawPoint(this.pointGraph, this.point);
        this._drawPoint(this.pointGraphB, this.pointB);
        this._drawPolygons(this.polygons, this.polygonsGraph, 0xffffff, 4);
        
    }

    _onDragStart(event) {
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.data = event.data;
        this.alpha = 0.5;
        this.dragging = true;
    }
    
    _onDragEnd() {
        this.alpha = 1;
        this.dragging = false;
        // set the interaction data to null
        this.data = null;
    }
    
    _onDragMove() {
        if (this.dragging) {
            const newPosition = this.data.getLocalPosition(this.parent);
            this.x = newPosition.x;
            this.y = newPosition.y;
        }
    }

    translateRobot(robot, pointTr) {
        let canvasRobot = [];
        robot.forEach(point => {
            let newPoint = new Point(point.x - this.width/2 + pointTr.x, point.y - this.height/2  + pointTr.y);
            canvasRobot.push(newPoint);
        });
        
        return canvasRobot;
    }

    invertRobot(robot) {
        let canvasRobot = [];
        robot.forEach(point => {
            let newPoint = new Point(this.width - point.x, this.height  - point.y);
            canvasRobot.push(newPoint);
        });
        
        return canvasRobot;
    }

    cleanCanvas() {
        this.visibilityGraph.clear();
        this.robotGraph.clear();
        this.minkownskiSumGraph.clear();
        this.pathGraph.clear();
    }

    execShortestPath(robot) {
        this.robot = robot;
        this.point = new Point(this.pointGraph.x, this.pointGraph.y);
        this.pointB = new Point(this.pointGraphB.x, this.pointGraphB.y);

        this._drawPolygon(this.translateRobot(this.robot, this.point), 0xffff00, this.robotGraph);
        this.robot = this.invertRobot(this.robot);
        this.cObstacles = this.getCObstacles();
        this._drawPolygons(this.cObstacles,this.minkownskiSumGraph, 0x72A0C1);
        let path = this._drawVisibilityGraph(this.cObstacles, this.point, this.pointB);
        this._drawPath(path, this.cObstacles, this.point, this.pointB);
    }

    _addIndexToVertices(polygons, pointA, pointB) {
        let id = 0;
        polygons.forEach(polygon => {
            polygon.vertices.forEach(vertex => {
                vertex.id = id;
                id ++;
            });
        });
        pointA.id = id;
        id ++;
        pointB.id = id;
    }

    _getVertexId(polygons, id) {
        let vertexFound = false;
        let vertexC;
        polygons.forEach(polygon => {
            if (!vertexFound) {
                polygon.vertices.forEach(vertex => {
                    if (vertex.id == id) {
                        vertexC = vertex;
                        vertexFound = true;
                    }
                });
            }
        });
        return vertexC;
    }

    _nonConvToConv(copyR, copyQ, sourcePolygonR) {
        console.log("Non-convex to Convex");
        let polygonsMS = [];

        let trianglesR = this.polyOperationHelper.triangulatePoly(copyR, []);

        trianglesR.forEach((triangleR) => {
            let polygonResult = this.polyOperationHelper.minkownskiSumLinearAlgo(
                this.helperCalculus.getPositionCoordinatesList(triangleR.getPoints(), this.width, this.height, this.scale),
                this.helperCalculus.getPositionCoordinatesList(copyQ, this.width, this.height, this.scale));

            polygonResult = this.helperCalculus.getCanvasCoordinatesList(polygonResult, this.width, this.height, this.scale);
            polygonsMS.push(polygonResult);
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

    getMinkowskiSum(robot, poly) {

        // triangulate polygon R
        let copyR = this.polyOperationHelper.copyPoints(robot);
        if (this.polyOperationHelper.isClockWise(copyR)) {
            // make it anti clockwise
            copyR = copyR.reverse();
        }

        // triangulate polygon Q
        let copyQ = this.polyOperationHelper.copyPoints(poly);
        if (this.polyOperationHelper.isClockWise(copyQ)) {
            // make it anti clockwise
            copyQ = copyQ.reverse();
        }

        let convexR = this.polyOperationHelper.isConvex(copyR);
        let convexQ = this.polyOperationHelper.isConvex(copyQ);
        let unionOfPolygons;
        let alpha = 0;
        
        //non-convex non-convex
        if (!convexR && !convexQ) {
            console.log('Non Convex to Non Convex');
            let trianglesR = this.polyOperationHelper.triangulatePoly(copyR, []);
            let trianglesQ = this.polyOperationHelper.triangulatePoly(copyQ, []);
    
            // minkownski sum 
            let polygonsMS = [];
            trianglesR.forEach((triangleR) => {
                trianglesQ.forEach((triangleQ) => {
                    let polygonResult = this.polyOperationHelper.minkownskiSumLinearAlgo(
                        this.helperCalculus.getPositionCoordinatesList(triangleR.getPoints(), this.width, this.height, this.scale),
                        this.helperCalculus.getPositionCoordinatesList(triangleQ.getPoints(), this.width, this.height, this.scale));
        
                    polygonResult = this.helperCalculus.getCanvasCoordinatesList(polygonResult, this.width, this.height, this.scale);
                    polygonsMS.push(polygonResult);
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
            unionOfPolygons = this.polyOperationHelper.minkownskiSumLinearAlgo(
                this.helperCalculus.getPositionCoordinatesList(copyR, this.width, this.height, this.scale),
                this.helperCalculus.getPositionCoordinatesList(copyQ, this.width, this.height, this.scale));
            unionOfPolygons = this.helperCalculus.getCanvasCoordinatesList(unionOfPolygons, this.width, this.height, this.scale);
            alpha = 0.25;
        }
        
        return unionOfPolygons;
    }

    isOnePoly(poly) {
        let numPoly = 0;
        poly.forEach(polygon => {
            if (polygon.type === 'EXT_POLY') {
                numPoly++;
            }
        });

        return numPoly === 1;
    }

    getExtPoly(poly) {
        for (let i = 0; i < poly.length; i++) {
            if (poly[i].type === 'EXT_POLY') {
                return poly[i];
            }
        }
        return null;
    }

    showVisibilityGraph() {
        this.visibilityGraphActive = !this.visibilityGraphActive;
        if (this.visibilityGraphActive) {
            this._drawVisibilityGraph(this.cObstacles, this.point, this.pointB);
        }
        else {
            this.visibilityGraph.clear();
        }
    }

    showMinkowskiSums() {
        this.showMinkowskiSumsActive = !this.showMinkowskiSumsActive;
        if (this.showMinkowskiSumsActive) {
            this._drawPolygons(this.cObstacles, this.minkownskiSumGraph, 0x72A0C1);
        }
        else {
            this.minkownskiSumGraph.clear();
        }
    }

    getCObstacles() {
        let msPolygons = [];
        // get MS
        this.polygons.forEach(poly => {
            let msPolygon = this.getMinkowskiSum(this.robot, poly.vertices);
            msPolygons.push(msPolygon);
            // this._drawPolygon(msPolygon, 0x00ff00);
        });

        // get Union of MS polygons
        for (let i = 0; i < msPolygons.length; i++) {
            for (let j = i + 1; j < msPolygons.length; j++){
                let unionPoly, intersectionPoints;

                [intersectionPoints, unionPoly] = this.polyUnionBuilder.swapLineSegmentsIntersectionAlgo(msPolygons[i], msPolygons[j]);
                if (this.isOnePoly(unionPoly)) {
                    unionPoly = this.getExtPoly(unionPoly);
                    unionPoly = this.polyUnionBuilder.getPointsFromEdges(unionPoly.edges);
                    msPolygons.splice(i, 1, unionPoly);
                    msPolygons.splice(j, 1);
                    j--;
                }
            }
           
        }
        
        let polys = [];
        // draw polygons
        msPolygons.forEach(polygon => {
            let poly = new Polygon();
            poly.vertices = polygon;
            polys.push(poly);
            this._addIndexToVertices(polys, this.point, this.pointB);
            // this._drawPolygon(polygon, 0x0000ff);
        });

        return polys;
    }

    _drawPath(path, polygons, point, pointB) {
        let lastVertex = point;
        // draw path
        if (path) {
            for (let i = 1; i < path.length - 1; i++) {
                let b = this._getVertexId(polygons, path[i]);
                this._drawLine(lastVertex, b, 0x00ff00, this.pathGraph);
                lastVertex = b;
            }
            this._drawLine(lastVertex, pointB, 0x00ff00, this.pathGraph);
        }
    }

    _drawVisibilityGraph(polygons, point, pointB) {
        let vg, g, path;
        [vg, g] = this.polyOperationHelper.getVisibilityGraph(polygons, point, pointB);
        path = g.path(point.id.toString(), pointB.id.toString());
        for (let i = 0; i < vg.length; i = i + 2) {
            this._drawLine(vg[i], vg[i+1], 0xff0000, this.visibilityGraph);
        }

        return path;
    }

    _drawPoint(graph, pos) {
        graph.lineStyle(0);
        graph.beginFill(0xffffff, 1);
        graph.drawCircle(0, 0, 4);
        graph.x = pos.x;
        graph.y = pos.y;
        graph.endFill();
    }

    _drawLine(a, b, color=0xffffff, graph = this.polygonsGraph, thickness = 1) {
        graph.beginFill(color);
        graph.lineStyle(thickness, color, 1);
        graph.moveTo(a.x, a.y);
        graph.lineTo(b.x, b.y);
        graph.endFill();
    }

    _drawPolygon(robot, color=0xffffff, graph = this.polygonsGraph) {
        for (let i = 0; i < robot.length - 1; i++) {
            this._drawLine(robot[i], robot[i+1], color, graph);
        }
        this._drawLine(robot[robot.length - 1], robot[0], color, graph);
    }

    _drawPolygons(polygons, graph = this.polygonsGraph, color = 0xffffff, thickness = 1) {
        polygons.forEach(polygon => {
            for (let i = 0; i < polygon.vertices.length - 1; i ++) {
                this._drawLine(polygon.vertices[i], polygon.vertices[i + 1], color, graph, thickness);
            }
            this._drawLine(polygon.vertices[polygon.vertices.length - 1], polygon.vertices[0], color, graph, thickness);
        });
    }
}