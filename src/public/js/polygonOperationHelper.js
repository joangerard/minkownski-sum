class PolygonOperationHelper {
    minkownskiSumBruteForceAlgo(polygonA, polygonB) {
        let polygonResult = []

        polygonA.forEach(pointA => {
            polygonB.forEach(pointB =>{
                polygonResult.push(new Point(pointA.x + pointB.x, pointA.y + pointB.y));
            });
        });

        return this.convexHull(polygonResult);
    }

    getDeterminant(p1, p2, p3) {
        return (p2.x - p1.x) * (p3.y - p2.y) - 
                (p2.y - p1.y) * (p3.x - p2.x);
    }

    convexHull(points) {
        // sort point by x coordinate
        points.sort((p1, p2) => p1.x > p2.x);

        // create two stacks: one for the upper points and the other for the lower points.
        let upPoints = [points[0], points[1]];
        let lowPoints = [points[0], points[1]];

        for (let i = 2; i < points.length; i++) {

            // If it is a right turn and the number of upper points are
            // more than 1 then pop
            while(upPoints.length > 1 && this.getDeterminant(
                    upPoints[upPoints.length - 2],
                    upPoints[upPoints.length - 1],
                    points[i]
                ) < 0) {
            upPoints.pop();
            }
            upPoints.push(points[i]);
            
            // If it is a left turn and the number of lower points are
            // more than 1 then pop
            while(lowPoints.length > 1 && this.getDeterminant(
                    lowPoints[lowPoints.length - 2],
                    lowPoints[lowPoints.length - 1],
                    points[i]
                ) > 0) {
            lowPoints.pop();
            }
            lowPoints.push(points[i]);
        }

        // delete duplicate points and order them anti-clockwise
        lowPoints.splice(lowPoints.length - 1, 1);
        upPoints = upPoints.reverse();
        upPoints.splice(upPoints.length - 1, 1);

        // create convex hull points list and connect them
        return [...lowPoints, ...upPoints];
    }
}