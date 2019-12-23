class SwapLineApp {
    constructor(polyUnionBuilder, canvasName, segments) {
        this.app = new PIXI.Application({ antialias: true, width: 400, height: 400});

        document.getElementById(canvasName).appendChild(this.app.view);
        this.app.stage.interactive = true;
        this.polyUnionBuilder = polyUnionBuilder;

        // Just click on the stage to draw random lines
        window.app = this.app;
        this.app.renderer.plugins.interaction.on('pointerdown', this._onPointerDown.bind(this));
        this.counter = 0;

        if (segments) {
            this.segments = segments;
            this._drawSegments(this.segments);
        } else {
            this.segments = [];
        }
        
        this.lastPoint = null;
        
    }

    execute() {
        let intersections = this.polyUnionBuilder.swapLineSegmentsIntersectionAlgo(this.segments);
        intersections = intersections.sort((a, b) => {
            return a.x - b.x;
        });
        let line = new PIXI.Graphics();
        this.app.stage.addChild(line);
        let x = 0;
        let y = 400;
        let i = 0;

        this.app.ticker.add(() => {
        
            // intersection
            while (i < intersections.length && x === Math.round(intersections[i].x)) {
                let point = new PIXI.Graphics();
                point.lineStyle(0);
                point.beginFill(0x00ff00, 1);
                point.drawCircle(0, 0, 6);
                point.x = intersections[i].x;
                point.y = intersections[i].y;
                point.endFill();
                this.app.stage.addChild(point);
                i++;
            }

            line.clear();

            //reset 
            if (x < 401) {
                line.lineStyle(4, 0xff0000, 1);
                line.beginFill(0xffFF00, 0.5);

                line.moveTo(x, 0);
                line.lineTo(x, y);

                line.endFill();
                x++;
            }
        });
    }

    _drawPoint(pos) {
        let point = new PIXI.Graphics();
        point.lineStyle(0);
        point.beginFill(0xffffff, 1);
        point.drawCircle(0, 0, 4);
        point.x = pos.x;
        point.y = pos.y;
        point.endFill();
        this.app.stage.addChild(point);
    }

    _drawSegments(segments) {
        for(let i = 0; i < segments.length; i++) {
            let line = new PIXI.Graphics();
            line.lineStyle(2, 0xffffff, 1);
            line.beginFill(0xffffff, 1);
            line.moveTo(segments[i].a.x, segments[i].a.y);
            line.lineTo(segments[i].b.x, segments[i].b.y);
            line.endFill();
            this.app.stage.addChild(line);

            this._drawPoint(segments[i].a);
            this._drawPoint(segments[i].b);
        }
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