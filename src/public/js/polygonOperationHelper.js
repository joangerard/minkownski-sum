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

    minkownskiSumLinearAlgo(polygonP, polygonR) {
        let i = 0;
        let j = 0;

        let n = polygonP.length - 1;
        let m = polygonR.length - 1;

        polygonP = this.orderAnticlockwise(polygonP);
        polygonR = this.orderAnticlockwise(polygonR);

        polygonP.push(polygonP[0]);
        polygonP.push(polygonP[1]);
        polygonR.push(polygonR[0]);
        polygonR.push(polygonR[1]);

        let polygonMS = [];

        do {
            let point = new Point(polygonP[i].x + polygonR[j].x, polygonP[i].y + polygonR[j].y);
            polygonMS.push(point);

            let pAngle = this.getAngle(polygonP[i], polygonP[i+1]);
            let rAngle = this.getAngle(polygonR[j], polygonR[j+1]);
            if (pAngle < rAngle) {
                i++;
            } else if( pAngle > rAngle) {
                j++;
            } else {
                i++;
                j++;
            }
        } while (i < n+2 && j < m+2);

        return polygonMS;
    }

    arrayRotate(arr, reverse) {
        if (reverse) arr.unshift(arr.pop());
        else arr.push(arr.shift());
        return arr;
    }


    angleTrunc(a){
        while(a < 0) {
            a += Math.PI * 2;
        }
        return a;
    }

    getAngle(pointA, pointB) {
        let deltaY = pointB.y - pointA.y;
        let deltaX = pointB.x - pointA.x;

        return this.angleTrunc(Math.atan2(deltaY, deltaX));
    }

    orderAnticlockwise(points) {
        // sort by x
        let center = new Point(1/points.length * points.reduce((acc, p1) => acc + p1.x, 0), 
                                 1/points.length * points.reduce((acc, p1) => acc + p1.y, 0));
        
        points.sort((a, b) => {
            if (a.x - center.x >= 0 && b.x - center.x < 0)
                return true;
            if (a.x - center.x < 0 && b.x - center.x >= 0)
                return false;
            if (a.x - center.x == 0 && b.x - center.x == 0) {
                if (a.y - center.y >= 0 || b.y - center.y >= 0)
                    return a.y > b.y;
                return b.y > a.y;
            }

            // compute the cross product of vectors (center -> a) x (center -> b)
            let det = (a.x - center.x) * (b.y - center.y) - (b.x - center.x) * (a.y - center.y);
            if (det < 0)
                return true;
            if (det > 0)
                return false;

            // points a and b are on the same line from the center
            // check which point is closer to the center
            let d1 = (a.x - center.x) * (a.x - center.x) + (a.y - center.y) * (a.y - center.y);
            let d2 = (b.x - center.x) * (b.x - center.x) + (b.y - center.y) * (b.y - center.y);
            return d1 > d2;
        });

        // get minimum Y coordinate among all the points
        let minYIndex = 0;
        let minY = points[minYIndex].y;
        for (let i = 0; i < points.length; i++) {
            if (points[i].y < minY) {
                minYIndex = i;
                minY = points[i].y;
            }
        }

        //rotate array of points to start with that min y point.
        while (minYIndex > 0) {
            this.arrayRotate(points);
            minYIndex--;
        }

        return points;
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

    pointInTriangle(p1, p2, p3, p4) {
        let d1 = this.getDeterminant(p1, p2, p4);
        let d2 = this.getDeterminant(p2, p3, p4);
        let d3 = this.getDeterminant(p3, p1, p4);
  
        let nega = (d1 < 0) || (d2 < 0) || (d3 < 0);
        let posi = (d1 > 0) || (d2 > 0) || (d3 > 0);
  
        return !(nega && posi);
      }

    isAnEar(p1, p2, p3, polygon) {
        let earFound = true;

        // right turn
        if (this.getDeterminant(p1, p2, p3) < 0) {
            // verify that there is no other point inside triangle
            for (let j = 0; j < polygon.length; j++) {
                if (polygon[j] != p1 && 
                    polygon[j] != p2 &&
                    polygon[j] != p3) {
                    if (this.pointInTriangle(p1, p2, p3, polygon[j])) {
                        earFound = false;
                    }
                }
            }
        } else {
            earFound = false;
        }

        return earFound;
    }

    findEar(polygon) {
        let p1, p2, p3;

        for (let i = 1; i < polygon.length - 1; i++) {
            p1 = polygon[i - 1];
            p2 = polygon[i];
            p3 = polygon[i + 1];

            if (this.isAnEar(p1, p2, p3, polygon)) {
                return i;
            }
        }

        return 0;
    }

    triangulatePoly(polygon, triangles) {
        // base case: triangle
        if (polygon.length === 3) {
            let triangle = new Triangle(polygon[0], polygon[1], polygon[2]);
            triangles.push(triangle);
            return triangles;
        }
        
        // else find an ear an delete that vertex from the polygon
        let vertex = this.findEar(polygon);

        // last vertex
        if (vertex === polygon.length - 1){
            let triangle = new Triangle(polygon[vertex - 1], polygon[vertex], polygon[0]);
            triangles.push(triangle);
        }
        // first vertex 
        else if (vertex === 0) {
            let triangle = new Triangle(polygon[polygon.length - 1], polygon[vertex], polygon[vertex + 1]);
            triangles.push(triangle);
        } 
        // vertex in the middle
        else {
            let triangle = new Triangle(polygon[vertex - 1], polygon[vertex], polygon[vertex + 1]);
            triangles.push(triangle);
        }
        
        // delete ear vertex
        polygon.splice(vertex, 1);

        return this.triangulatePoly(polygon, triangles);
    }  

    copyPoints(fromPoints) {
        let toPoints = [];
        for (let i in fromPoints) {
            toPoints.push(new Point(fromPoints[i].x, fromPoints[i].y));
        }

        return toPoints;
    }

    isClockWise(points) {
        // to understand why it works please see
        // https://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-points-are-in-clockwise-order
        let sum = 0;
        for (let i = 0; i < points.length - 1; i++) {
            sum += (points[i+1].x - points[i].x)*(points[i+1].y + points[i].y);
        }

        sum += (points[0].x - points[points.length - 1].x)*(points[0].y + points[points.length - 1].y)

        return sum < 0;
    }
}