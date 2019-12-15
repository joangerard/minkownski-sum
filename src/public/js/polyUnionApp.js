class PolyUnionApp {
    constructor(polyUnionBuilder) {
        this.app = new PIXI.Application({ antialias: true });
        document.body.appendChild(this.app.view);

        this.polyA = new PIXI.Graphics();
        this.polyB = new PIXI.Graphics();
        this.polyRes = new PIXI.Graphics();

        this.pointsA = [];
        this.pointsB = [];

        this.app.renderer.plugins.interaction.on('pointerdown', this._onPointerDown.bind(this));
        this.app.renderer.plugins.interaction.on('pointermove', this._onPointerMove);
        this.currentPoly = 0;
        this.firstPointA = true;
        this.firstPointB = true;
        this.lastPoint = null;
        this.polyUnionBuilder = polyUnionBuilder;
    }

    _onPointerMove(e) {
        document.getElementById('mouse-coord').innerHTML = `${e.data.global.x}, ${e.data.global.y}`;
    }

    _onPointerDown(e) {
        if (this.currentPoly < 2) {
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

    _drawPoints(points, color) {
        let polyRes = new PIXI.Graphics();
        for(let i = 0; i < points.length - 1; i++) {
            polyRes.beginFill(color);
            polyRes.lineStyle(4, color, 1);
            polyRes.moveTo(points[i].x, points[i].y);
            polyRes.lineTo(points[i+1].x, points[i+1].y);
            polyRes.endFill();
            this.app.stage.addChild(polyRes);
        }

        polyRes.beginFill(color);
        polyRes.lineStyle(4, color, 1);
        polyRes.moveTo(points[points.length - 1].x, points[points.length - 1].y);
        polyRes.lineTo(points[0].x, points[0].y);
        polyRes.endFill();
        this.app.stage.addChild(polyRes);

    }

    getUnion() {
        let intersections, polyUnion;
        let polys = JSON.parse("[[{\"id\":null,\"x\":141,\"y\":348},{\"id\":null,\"x\":259,\"y\":340},{\"id\":null,\"x\":229,\"y\":184},{\"id\":null,\"x\":133,\"y\":85},{\"id\":null,\"x\":59,\"y\":218},{\"id\":null,\"x\":37,\"y\":325}],[{\"id\":null,\"x\":37,\"y\":325},{\"id\":null,\"x\":155,\"y\":317},{\"id\":null,\"x\":229,\"y\":184},{\"id\":null,\"x\":133,\"y\":85},{\"id\":null,\"x\":55,\"y\":104},{\"id\":null,\"x\":33,\"y\":211}],[{\"id\":null,\"x\":259,\"y\":340},{\"id\":null,\"x\":272,\"y\":220},{\"id\":null,\"x\":242,\"y\":64},{\"id\":null,\"x\":190,\"y\":132},{\"id\":null,\"x\":116,\"y\":265},{\"id\":null,\"x\":155,\"y\":317}],[{\"id\":null,\"x\":155,\"y\":317},{\"id\":null,\"x\":229,\"y\":184},{\"id\":null,\"x\":242,\"y\":64},{\"id\":null,\"x\":164,\"y\":83},{\"id\":null,\"x\":112,\"y\":151},{\"id\":null,\"x\":116,\"y\":265}],[{\"id\":null,\"x\":259,\"y\":340},{\"id\":null,\"x\":229,\"y\":184},{\"id\":null,\"x\":190,\"y\":132},{\"id\":null,\"x\":133,\"y\":85},{\"id\":null,\"x\":59,\"y\":218},{\"id\":null,\"x\":155,\"y\":317}],[{\"id\":null,\"x\":155,\"y\":317},{\"id\":null,\"x\":229,\"y\":184},{\"id\":null,\"x\":190,\"y\":132},{\"id\":null,\"x\":133,\"y\":85},{\"id\":null,\"x\":55,\"y\":104},{\"id\":null,\"x\":59,\"y\":218}]]");
        let unionPoly = polys[0];
        for(let i = 1; i < polys.length; i++) {
            this.pointsA = unionPoly
            // this.pointsA = polys[0];
            this.pointsB = polys[5];
            // this._drawPoints(this.pointsA, 0x003300);
            // this._drawPoints(this.pointsB, 0x0000ff);
            [intersections, polyUnion]= this.polyUnionBuilder.swapLineSegmentsIntersectionAlgo(this.pointsA, this.pointsB);
    
            polyUnion.forEach(polygon => {
                if (polygon.type === 'EXT_POLY') {
                    let points = this.polyUnionBuilder.getPointsFromEdges(polygon.edges);
                    unionPoly = points;
                }
            });
        }

        unionPoly.forEach(unionPoint => {
            let point = new PIXI.Graphics();
            point.lineStyle(0);
            point.beginFill(0x123456, 1);
            point.drawCircle(0, 0, 8);
            point.x = unionPoint.x;
            point.y = unionPoint.y;
            point.endFill();
            this.app.stage.addChild(point);
        });
        
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