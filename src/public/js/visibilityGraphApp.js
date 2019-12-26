class VisibilityGraphApp {
    constructor(polyOperationHelper, canvasName) {
        this.polyOperationHelper = polyOperationHelper;
        this.app = new PIXI.Application({ antialias: true, width:900, height: 500});
        document.getElementById(canvasName).appendChild(this.app.view);
        this.polygons = JSON.parse("[{\"vertices\":[{\"id\":null,\"x\":133,\"y\":219},{\"id\":null,\"x\":250,\"y\":126},{\"id\":null,\"x\":358,\"y\":279},{\"id\":null,\"x\":201,\"y\":340}]},{\"vertices\":[{\"id\":null,\"x\":418,\"y\":184},{\"id\":null,\"x\":625,\"y\":182},{\"id\":null,\"x\":455,\"y\":280}]},{\"vertices\":[{\"id\":null,\"x\":499,\"y\":32},{\"id\":null,\"x\":442,\"y\":147},{\"id\":null,\"x\":654,\"y\":107}]},{\"vertices\":[{\"id\":null,\"x\":515,\"y\":392},{\"id\":null,\"x\":573,\"y\":296},{\"id\":null,\"x\":677,\"y\":344},{\"id\":null,\"x\":720,\"y\":257},{\"id\":null,\"x\":841,\"y\":362},{\"id\":null,\"x\":620,\"y\":453}]},{\"vertices\":[{\"id\":null,\"x\":102,\"y\":400},{\"id\":null,\"x\":378,\"y\":377},{\"id\":null,\"x\":378,\"y\":464},{\"id\":null,\"x\":97,\"y\":459}]}]");
        this.currentPoly = 0;
        this.firstPoint = true;
        this.app.renderer.plugins.interaction.on('pointermove', this._onPointerMove.bind(this));
        this.lastPoint = null;
        this.polygonsGraph = new PIXI.Graphics();
        this.pointGraph = new PIXI.Graphics();
        this.pointGraphB = new PIXI.Graphics();
        this.app.stage.addChild(this.polygonsGraph);
        this.app.stage.addChild(this.pointGraph);
        this.app.stage.addChild(this.pointGraphB);
        this.point = new Point(30, 30);
        this.pointB = new Point(870, 30);

        this._addIndexToVertices(this.polygons, this.point, this.pointB);
        
        this._drawPoint(this.pointGraph, this.point);
        this._drawPoint(this.pointGraphB, this.pointB);
        this._drawPolygons();
        this._drawVisibilityGraph();
    }
    _addIndexToVertices(polygons, pointA, pointB) {
        let id = 0;
        polygons.forEach(polygon => {
            polygon.vertices.forEach(vertex => {
                vertex.id = id;
                id ++;
            }) 
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

    _drawVisibilityGraph() {
        let vg, g, path;
        [vg, g] = this.polyOperationHelper.getVisibilityGraph(this.polygons, this.point, this.pointB);
        path = g.path(this.point.id.toString(), this.pointB.id.toString());
        for (let i = 0; i < vg.length; i = i + 2) {
            this._drawLine(vg[i], vg[i+1], 0xff0000);
        }

        let lastVertex = this.point;
        if (path) {
            for (let i = 1; i < path.length - 1; i++) {
                let b = this._getVertexId(this.polygons, path[i]);
                this._drawLine(lastVertex, b, 0x00ff00);
                lastVertex = b;
            }
            this._drawLine(lastVertex, this.pointB, 0x00ff00);
        }
        
    }

    _drawPoint(graph, pos) {
        graph.lineStyle(0);
        graph.beginFill(0xffffff, 1);
        graph.drawCircle(0, 0, 4);
        graph.x = pos.x;
        graph.y = pos.y;
        graph.endFill();
    }

    _drawLine(a, b, color=0xffffff, thickness = 1) {
        this.polygonsGraph.beginFill(color);
        this.polygonsGraph.lineStyle(thickness, color, 1);
        this.polygonsGraph.moveTo(a.x, a.y);
        this.polygonsGraph.lineTo(b.x, b.y);
        this.polygonsGraph.endFill();
    }

    _drawPolygons() {
        this.polygons.forEach(polygon => {
            for (let i = 0; i < polygon.vertices.length - 1; i ++) {
                this._drawLine(polygon.vertices[i], polygon.vertices[i + 1], 0xffffff, 4);
            }
            this._drawLine(polygon.vertices[polygon.vertices.length - 1], polygon.vertices[0], 0xffffff, 4);
        });
    }

    _clickFirstPoint(point, vertices) {
        return (point.x >= vertices[0].x - 3  && point.x <= vertices[0].x + 3 
            && point.y >= vertices[0].y - 3  && point.y <= vertices[0].y + 3 );
    }

    _onPointerMove(e) {
        let pos = e.data.global;
        if (pos.x > 900) {
            pos.x = 900;
        }
        if (pos.y > 500) {
            pos.y = 500;
        }
        if (pos.x < 0) {
            pos.x = 0;
        }
        if (pos.y < 0) {
            pos.y = 0;
        }


        this.point.x = pos.x;
        this.point.y = pos.y;

        this.pointGraph.clear();
        this.polygonsGraph.clear();
        this._drawPolygons();

        this._drawPoint(this.pointGraph, pos);
        this._drawVisibilityGraph();
    }

    // _onPointerDown(e) {
    //     let pos = e.data.global;
    //     if (this.polygons.length > 0 && this.polygons[this.currentPoly] && this._clickFirstPoint(pos, this.polygons[this.currentPoly].vertices)) {
    //         // this._closePoly(this.polygons[this.currentPoly]);
    //         this.currentPoly++;
    //         this.firstPoint = true;
    //     }
    //     else {
    //         let point = new PIXI.Graphics();
    //         point.lineStyle(0);
    //         point.beginFill(0xffffff, 1);
    //         point.drawCircle(0, 0, 4);
    //         point.x = pos.x;
    //         point.y = pos.y;
    //         point.endFill();
    //         this.app.stage.addChild(point);

    //         if (!this.firstPoint) {
    //             this.polygonsGraph.beginFill(0xffffff);
    //             this.polygonsGraph.lineStyle(4, 0xffffff, 1);
    //             this.polygonsGraph.moveTo(this.lastPoint.x, this.lastPoint.y);
    //             this.polygonsGraph.lineTo(pos.x, pos.y);
    //             this.polygonsGraph.endFill();
    //         } else {
    //             this.firstPoint = false;
    //             let polygon = new Polygon();
    //             this.polygons.push(polygon);
    //         }
            
    //         this.lastPoint = point;
    //         this.polygons[this.currentPoly].addVertex(new Point(pos.x, pos.y));
    //     }
    // }
}