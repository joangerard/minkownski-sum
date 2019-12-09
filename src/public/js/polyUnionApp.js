class PolyUnionApp {
    constructor(polyUnionBuilder) {
        this.app = new PIXI.Application({ antialias: true });
        document.body.appendChild(this.app.view);

        this.polyA = new PIXI.Graphics();
        this.polyB = new PIXI.Graphics();

        this.pointsA = [];
        this.pointsB = [];

        this.app.renderer.plugins.interaction.on('pointerdown', this._onPointerDown.bind(this));
        this.currentPoly = 0;
        this.firstPointA = true;
        this.firstPointB = true;
        this.lastPoint = null;
        this.polyUnionBuilder = polyUnionBuilder;
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

    getUnion() {
        let intersections = this.polyUnionBuilder.swapLineSegmentsIntersectionAlgo(this.pointsA, this.pointsB);

        intersections.forEach(intersection => {
            let point = new PIXI.Graphics();
            point.lineStyle(0);
            point.beginFill(0x00ff00, 1);
            point.drawCircle(0, 0, 6);
            point.x = intersection.x;
            point.y = intersection.y;
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