class PolyUnionApp {
    constructor(polyUnionBuilder, canvasNameInput, canvasNameOutput, pointsA, pointsB) {
        this.app = new PIXI.Application({ antialias: true, width:500, height: 500});
        this.appOut = new PIXI.Application({ antialias: true, width:500, height: 500});

        document.getElementById(canvasNameOutput).appendChild(this.appOut.view);
        document.getElementById(canvasNameInput).appendChild(this.app.view);

        this.polyA = new PIXI.Graphics();
        this.polyB = new PIXI.Graphics();
        this.polyRes = new PIXI.Graphics();

        this.app.renderer.plugins.interaction.on('pointerdown', this._onPointerDown.bind(this));
        this.currentPoly = 0;
        this.firstPointA = true;
        this.firstPointB = true;
        this.lastPoint = null;
        this.polyUnionBuilder = polyUnionBuilder;

        if (!pointsA && !pointsB) {
            this.pointsA = [];
            this.pointsB = [];
        } else {
            this.pointsA = pointsA;
            this.pointsB = pointsB;
            this._drawPoints(pointsA, 0xffffff);
            this._drawPoints(pointsB, 0x0000ff);
        }
    }

    _onPointerMove(e) {
        document.getElementById('mouse-coord').innerHTML = `${e.data.global.x}, ${e.data.global.y}`;
    }

    _clickFirstPoint(point, points) {
        return (point.x >= points[0].x - 3  && point.x <= points[0].x + 3 
            && point.y >= points[0].y - 3  && point.y <= points[0].y + 3 );
    }

    _onPointerDown(e) {
        if (this.currentPoly < 2) {
            if (this.currentPoly === 0 && this.pointsA.length > 2 && this._clickFirstPoint(e.data.global, this.pointsA)) {
                this.closePolyA();
            } else if (this.currentPoly === 1 && this.pointsB.length > 2 && this._clickFirstPoint(e.data.global, this.pointsB)) {
                this.closePolyB();
            }
             else {
                let pos = e.data.global;
                let point = new PIXI.Graphics();
                point.lineStyle(0);
                point.beginFill(0xffffff, 1);
                point.drawCircle(0, 0, 4);
                point.x = pos.x;
                point.y = pos.y;
                point.endFill();
                this.app.stage.addChild(point);
    
                // first poly
                if (this.currentPoly === 0 ){
    
                    this.pointsA.push(new Point(pos.x, pos.y));
                    if (!this.firstPointA) {
                        this.polyA.beginFill(0xffffff);
                        this.polyA.lineStyle(4, 0xffffff, 1);
                        this.polyA.moveTo(this.lastPoint.x, this.lastPoint.y);
                        this.polyA.lineTo(pos.x, pos.y);
                        this.polyA.endFill();
                        this.app.stage.addChild(this.polyA);
                        this.lastPoint = point;
                    }
                    else {
                        this.lastPoint = point;
                        this.firstPointA = false;
                    }
                }
    
                // second poly 
                if (this.currentPoly === 1 ){
                    this.pointsB.push(new Point(pos.x, pos.y));
                    if (!this.firstPointB) {
                        
                        this.polyB.beginFill(0x0000ff);
                        this.polyB.lineStyle(4, 0x0000ff, 1);
                        this.polyB.moveTo(this.lastPoint.x, this.lastPoint.y);
                        this.polyB.lineTo(pos.x, pos.y);
                        this.polyB.endFill();
                        this.app.stage.addChild(this.polyB);
                        this.lastPoint = point;
                    }
                    else {
                        this.lastPoint = point;
                        this.firstPointB = false;
                    }
                }
            }
        }
    }

    _drawPoints(points, color, app=this.app) {
        let polyRes = new PIXI.Graphics();
        for(let i = 0; i < points.length - 1; i++) {
            polyRes.beginFill(color);
            polyRes.lineStyle(4, color, 1);
            polyRes.moveTo(points[i].x, points[i].y);
            polyRes.lineTo(points[i+1].x, points[i+1].y);
            polyRes.endFill();
            app.stage.addChild(polyRes);
        }

        polyRes.beginFill(color);
        polyRes.lineStyle(4, color, 1);
        polyRes.moveTo(points[points.length - 1].x, points[points.length - 1].y);
        polyRes.lineTo(points[0].x, points[0].y);
        polyRes.endFill();
        app.stage.addChild(polyRes);

    }

    getUnion() {
        let intersections, polyUnion;
        [intersections, polyUnion]= this.polyUnionBuilder.swapLineSegmentsIntersectionAlgo(this.pointsA, this.pointsB);
        let poly = 0, holes = 0;

        polyUnion.forEach(polygon => {
            let points = this.polyUnionBuilder.getPointsFromEdges(polygon.edges);
            this._drawPoints(points, 0xff0000, this.appOut);
            if (polygon.type === "EXT_POLY") {
                poly++;
            } else if (polygon.type === "INT_POLY"){
                holes++;
            }
        });
        
        return [poly, holes];
    }

    closePolyA () {
        this.polyA.beginFill(0xffffff);
        this.polyA.lineStyle(4, 0xffffff, 1);
        this.polyA.moveTo(this.lastPoint.x, this.lastPoint.y);
        this.polyA.lineTo(this.pointsA[0].x, this.pointsA[0].y);
        this.polyA.endFill();
        this.app.stage.addChild(this.polyA);
        this.currentPoly++;
        this.lastPoint = null;
    }

    closePolyB() {
        this.polyB.beginFill(0x0000ff);
        this.polyB.lineStyle(4, 0x0000ff, 1);
        this.polyB.moveTo(this.lastPoint.x, this.lastPoint.y);
        this.polyB.lineTo(this.pointsB[0].x, this.pointsB[0].y);
        this.polyB.endFill();
        this.app.stage.addChild(this.polyB);
        this.currentPoly++;
        this.lastPoint = null;
    }
}