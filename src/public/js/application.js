class GridApplication {
    constructor(PIXI, width, height, pointEvent, helperCalculus, interaction = true, scale, color=0x650A5A) {

        this.width = width;
        this.height = height;
        //Create a Pixi Application - setup
        this.app = new PIXI.Application({width: this.width, height: this.height});
        this._addBackground();
        
        // points generator
        this.pointsGraphic = [];
        this.polygon = new PIXI.Graphics();
        this.limitClosestPoint = 20;
        this.shouldStopDrawingPoints = false;
        this.polygonIsClosed = false;
        this.dragPoint = false;
        this.pointEvent = pointEvent;
        this.interaction = interaction;
        this.helperCalculus = helperCalculus;
        this.scale = scale;
        this.otherPolygons = [];
        this.color = color;

        this.style = new PIXI.TextStyle({
            fontFamily: 'Arial',
            fontSize: 10,
            fontStyle: 'italic'
        });

        document.body.appendChild(this.app.view);

        this._addEventListeners();
        this._drawCoordinatesSystem();
    }

    _drawCoordinatesSystem() {
        const realPath = new PIXI.Graphics();

        realPath.lineStyle(2, 0x0, 1);
        realPath.moveTo(Math.floor(this.width/2), 0);
        realPath.lineTo(Math.floor(this.width/2), this.height);
        realPath.moveTo(0, Math.floor(this.height/2));
        realPath.lineTo(this.width, Math.floor(this.height/2))
        this.app.stage.addChild(realPath);
    }

    _addBackground() {
        // create a texture from an image path
        const texture = PIXI.Texture.from('img/Grid.jpg');

        /* create a tiling sprite ...
        * requires a texture, a width and a height
        * in WebGL the image size should preferably be a power of two
        */
        const tilingSprite = new PIXI.TilingSprite(
            texture,
            this.app.screen.width,
            this.app.screen.height,
        );
        this.app.stage.addChild(tilingSprite);
    }

    _createPolygon(closePolygon = function(){}, beginFill = function() {}, endFill = function() {}) {
        // create a path
        if (this.pointsGraphic.length > 1) {

            this.polygon.destroy();
            this.app.stage.removeChild(this.polygon);

            this.polygon = new PIXI.Graphics();

            beginFill();
            this.polygon.lineStyle(2, this.color, 1);
            this.polygon.moveTo(this.pointsGraphic[0].x, this.pointsGraphic[0].y);
            this.pointsGraphic.slice(1, this.pointsGraphic.length).forEach(point => {
                this.polygon.lineTo(point.x, point.y);
            });
            closePolygon();
            endFill();
            this.app.stage.addChild(this.polygon);
        }
    }

    _addEventListeners() {
        if (this.interaction) {
            this.app.renderer.plugins.interaction.on('mousedown', this._onClickCanvas.bind(this));
            this.app.renderer.plugins.interaction.on('touchstart', this._onClickCanvas.bind(this));
        }
    }

    _onClickCanvas(e){
        let new_pos = e.data.global;

        // create a point
        let point = new Point(new_pos.x, new_pos.y);

        this.addPoint(point);
    }

    addPoint(point) {
        if (!this.shouldStopDrawingPoints && !this.dragPoint) {
            // if user draws point next to the beginning then close it
            if (this._closePolygon(point)) {
                this._createPolygon(
                    () => this.polygon.closePath(),
                    () => this.polygon.beginFill(this.color, 0.25),
                    () => this.polygon.endFill());
                this.shouldStopDrawingPoints = true;
                this.polygonIsClosed = true;
            } else {
                this._createPoint(point);
                this._createPolygon();
            }
        }
    }

    removePolygon(poly) {
        poly.destroy();
        this.app.stage.removeChild(poly);
    }

    addPolygon(points, colorLine, colorPoints, radiusPoint) {
        let polygon = new PIXI.Graphics();
        
        polygon.beginFill(colorPoints, radiusPoint);
        polygon.lineStyle(2, colorLine, 1);

        polygon.moveTo(points[0].x, points[0].y);
        points.slice(1, points.length).forEach(point => {
            polygon.lineTo(point.x, point.y);
        });
        polygon.closePath();
        polygon.endFill();
        this.app.stage.addChild(polygon);
        this.otherPolygons.push(polygon);
        
        return polygon;
    }

    getPoints() {
        return this.pointsGraphic;
    }

    _closePolygon(new_point) {
        let shouldClose = false;
        if (this.pointsGraphic.length > 0) {
            let point = this.pointsGraphic[0];
            if (point.x - this.limitClosestPoint < new_point.x  &&
                new_point.x < point.x + this.limitClosestPoint &&
                point.y - this.limitClosestPoint < new_point.y &&
                new_point.y < point.y + this.limitClosestPoint) {
                    shouldClose = true;
                }
        }

        return shouldClose;
    }

    // create a point (circle)
    _createPoint(point) {
        let pointGraphic = new PIXI.Graphics();
        // pointGraphic.hitArea = new PIXI.Rectangle(0, 0, this.app.width, this.app.height);
        if (this.interaction) {
            pointGraphic.interactive = true;
            pointGraphic.buttonMode = true;
        }
        pointGraphic
                .on('pointerdown', this.pointEvent.onPointDragStart)
                .on('pointerdown', this._dragPointActivated.bind(this))
                .on('pointerup', this.pointEvent.onPointDragEnd)
                .on('pointerup', this._dragPointDeactivated.bind(this))
                .on('pointerupoutside', this.pointEvent.onPointDragEnd)
                .on('pointerupoutside', this._dragPointDeactivated.bind(this))
                .on('pointermove', this.pointEvent.onPointDragMove)
                .on('pointermove', this._updateGraphs.bind(this));
        pointGraphic.lineStyle(0);
        pointGraphic.beginFill(this.color, 1);
        pointGraphic.drawCircle(0, 0, 8);
        pointGraphic.x = point.x;
        pointGraphic.y = point.y;
        pointGraphic.endFill();

        const pointText = this.helperCalculus.getPositionCoordinates(point, this.width, this.height, this.scale);
        
        const richText = new PIXI.Text(`(${pointText.x},${pointText.y})`, this.style);
        pointGraphic.addChild(richText);

        this.app.stage.addChild(pointGraphic);
        this.pointsGraphic.push(pointGraphic);
        
        return pointGraphic;
    }

    _dragPointActivated(e) {
        let pointGraphic = e.target;
        if (e.target !== this.pointsGraphic[0]){
            this.dragPoint = true;           
        }
    }

    _dragPointDeactivated() {
        this.dragPoint = false;
    }

    _updateGraphs(e) {
        if (this.dragPoint) {
            let pointGraphic = e.currentTarget;

            // remove textbox with coordinates
            pointGraphic.children.forEach(text => {
                text.destroy();
                pointGraphic.removeChild(text);
            });

            let pointText = this.helperCalculus.getPositionCoordinates(pointGraphic, this.width, this.height, this.scale);
            // add text coordinates
            const richText = new PIXI.Text(`(${pointText.x},${pointText.y})`, this.style);
            pointGraphic.addChild(richText);
    
            this.app.stage.addChild(pointGraphic);
    
            if (this.polygonIsClosed) {
                this._createPolygon(
                    () => this.polygon.closePath(),
                    () => this.polygon.beginFill(this.color, 0.25),
                    () => this.polygon.endFill());
            } else {
                this._createPolygon();
            }
        }
    }
}