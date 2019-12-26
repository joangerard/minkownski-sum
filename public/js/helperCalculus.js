class HelperCalculus {
    getPositionCoordinates(point, widthCanvas, HeightCanvas, scale = 1) {
        return new Point(
            Math.round((point.x - widthCanvas/2)/scale * 100)/100,
            Math.round((HeightCanvas/2 - point.y)/scale * 100)/100
        );
    }

    getPositionCoordinatesList(points, widthCanvas, heightCanvas, scale = 1) {
        let new_points = [];
        points.forEach(point => {
            new_points.push(this.getPositionCoordinates(point, widthCanvas, heightCanvas, scale));
        });

        return new_points;
    }

    getCanvasCoordinates(point, widthCanvas, HeightCanvas, scale = 1) {
        return new Point(
            Math.round((point.x*scale + widthCanvas/2) * 100) / 100,
            Math.round((HeightCanvas/2 - point.y*scale) * 100) / 100
        );
    }

    getCanvasCoordinatesList(points, widthCanvas, heightCanvas, scale = 1) {
        let new_points = [];

        points.forEach(point => {
            new_points.push(this.getCanvasCoordinates(point, widthCanvas, heightCanvas, scale));
        });

        return new_points;
    }

    getInvertedCoordinates(point, widthCanvas, heightCanvas) {
        return new Point(widthCanvas - point.x, heightCanvas - point.y);
    }

    getInvertedCoordinatesList(points, widthCanvas, heightCanvas) {
        let new_points = [];
        points.forEach(point => {
            new_points.push(this.getInvertedCoordinates(point, widthCanvas, heightCanvas));
        });

        return new_points;
    }

    deplacePoints(points, directionCoord) {
        let newPoints = [];
        points.forEach(point => {
            let newPoint = new Point(point.x + directionCoord.x, point.y + directionCoord.y)
            newPoints.push(newPoint);
        });
        return newPoints;
    }
}