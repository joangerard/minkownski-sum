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
        this.app.stage.addChild(this.polygonsGraph);
        this.app.stage.addChild(this.pointGraph);
        this.point = new Point(30, 30);
        
        this._drawPoint(this.point);
        this._drawPolygons();
        this._drawVisibilityGraph();
    }

    _drawVisibilityGraph() {
        let vg = this.polyOperationHelper.getVisibilityGraph(this.polygons, this.point);
        for (let i = 0; i < vg.length; i = i + 2) {
            this._drawLine(vg[i], vg[i+1], 0xff0000);
        }
    }

    _drawPoint(pos) {
        this.pointGraph.lineStyle(0);
        this.pointGraph.beginFill(0xffffff, 1);
        this.pointGraph.drawCircle(0, 0, 4);
        this.pointGraph.x = pos.x;
        this.pointGraph.y = pos.y;
        this.pointGraph.endFill();
    }

    _drawLine(a, b, color=0xffffff) {
        this.polygonsGraph.beginFill(color);
        this.polygonsGraph.lineStyle(2, color, 1);
        this.polygonsGraph.moveTo(a.x, a.y);
        this.polygonsGraph.lineTo(b.x, b.y);
        this.polygonsGraph.endFill();
    }

    _drawPolygons() {
        this.polygons.forEach(polygon => {
            for (let i = 0; i < polygon.vertices.length - 1; i ++) {
                this._drawLine(polygon.vertices[i], polygon.vertices[i + 1]);
            }
            this._drawLine(polygon.vertices[polygon.vertices.length - 1], polygon.vertices[0]);
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


        this.point = new Point(pos.x, pos.y);

        this.pointGraph.clear();
        this.polygonsGraph.clear();
        this._drawPolygons();
        this._drawPoint(pos);

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