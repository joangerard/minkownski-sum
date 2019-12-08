class SwapLineApp {
    constructor(polyUnionBuilder) {
        this.app = new PIXI.Application({ antialias: true });
        document.body.appendChild(this.app.view);
        this.app.stage.interactive = true;
        this.polyUnionBuilder = polyUnionBuilder;

        // Just click on the stage to draw random lines
        window.app = this.app;
        this.app.renderer.plugins.interaction.on('pointerdown', this._onPointerDown.bind(this));
        this.app.renderer.plugins.interaction.on('pointermove', this._onPointerMove.bind(this));
        this.counter = 0;
        this.segments = [];
        this.lastPoint = null;
    }

    execute() {
        let intersections = this.polyUnionBuilder.swapLineSegmentsIntersectionAlgo(this.segments);
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

    _onPointerMove(e) {
        document.getElementById('mouse-coord').innerHTML = `${e.data.global.x}, ${e.data.global.y}`;
    }

    _onPointerDown(e) {
        let pos = e.data.global;

        let point = new PIXI.Graphics();
        

        point.lineStyle(0);
        point.beginFill(0xffffff, 1);
        point.drawCircle(0, 0, 4);
        point.x = pos.x;
        point.y = pos.y;
        point.endFill();
        this.app.stage.addChild(point);

        // counter is odd then create segment.
        if (this.counter % 2 !== 0) {
            let line = new PIXI.Graphics();
            line.lineStyle(2, 0xffffff, 1);
            line.beginFill(0xffffff, 1);
            line.moveTo(this.lastPoint.x, this.lastPoint.y);
            line.lineTo(point.x, point.y);
            line.endFill();
            this.app.stage.addChild(line);
            let pointA = new Point(this.lastPoint.x, this.lastPoint.y);
            let pointB = new Point(point.x, point.y);
            this.segments.push(new Segment(pointA, pointB));
            this.lastPoint = null;
        } else {
            this.lastPoint = point;
        }

        this.counter++;
    }
}