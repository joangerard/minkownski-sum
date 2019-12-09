const POINT_LEFT = "point_left";
const POINT_RIGHT = "point_right";
const INTERSECTION = "intersection";

class Event {
    constructor(type, point, ...segments) {
        this.type = type;
        this.point = point;
        this.segments = segments;
    }
}

class SweepLineSegmentIntersection {
    constructor(){
        this.events = new AVLTree(this._comparatorEvents);
        this._queue = [];
        this.lineStatus = new AVLTree(this._comparatorSegments.bind(this));
        this.lastEvent = null;
    }

    _comparatorEvents(a, b) {
        if (a.x === b.x) {
            return a.y - b.y;
        }
        return a.x - b.x;
    }

    _comparatorSegments(s1, s2) {
        // calculate y coordinate for segment 1 on last event x coordinate.
        let m1 = (s1.b.y - s1.a.y)/(s1.b.x - s1.a.x);
        // y = m*x + b
        let b1 = s1.a.y - m1 * s1.a.x;
        let y1 = m1 * this.lastEvent.point.x + b1;

        // calculate y coordinate for segment 2 on last event x coordinate.
        let m2 = (s2.b.y - s2.a.y)/(s2.b.x - s2.a.x);
        let b2 = s2.a.y - m2 * s2.a.x;
        let y2 = m2 * this.lastEvent.point.x + b2;

        return y1 - y2;
    }

    _initEvents(segments) {
        segments.forEach(segment => {
            if (this._comparatorEvents(segment.a, segment.b) < 0) {
                this.events.insert(segment.a, new Event(POINT_LEFT, segment.a, segment));
                this.events.insert(segment.b, new Event(POINT_RIGHT, segment.b, segment));
            } else {
                this.events.insert(segment.a, new Event(POINT_RIGHT, segment.a, segment));
                this.events.insert(segment.b, new Event(POINT_LEFT, segment.b, segment));
            }
        });
    }

    _segmentIntersection(s1, s2) {
        let intersects = this._getPointIntersection(s1.a, s1.b, s2.a, s2.b);

        return (intersects && intersects.x > this.lastEvent.point.x);
    }

    _intersects(a,b,c,d,p,q,r,s) {
        var det, gamma, lambda;
        det = (c - a) * (s - q) - (r - p) * (d - b);
        if (det === 0) {
            return false;
        } else {
            lambda = ((s - q) * (r - a) + (p - r) * (s - b)) / det;
            gamma = ((b - d) * (r - a) + (c - a) * (s - b)) / det;
            return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
        }
    };

    _getPointIntersection(pointA, pointB, pointC, pointD) {
        var z1 = (pointA.x - pointB.x);
        var z2 = (pointC.x - pointD.x);
        var z3 = (pointA.y - pointB.y);
        var z4 = (pointC.y - pointD.y);
        var dist = z1 * z4 - z3 * z2;
        if (dist == 0) {
          return null;
        }
        var tempA = (pointA.x * pointB.y - pointA.y * pointB.x);
        var tempB = (pointC.x * pointD.y - pointC.y * pointD.x);
        var xCoor = (tempA * z2 - z1 * tempB) / dist;
        var yCoor = (tempA * z4 - z3 * tempB) / dist;
      
        if (xCoor < Math.min(pointA.x, pointB.x) || xCoor > Math.max(pointA.x, pointB.x) ||
          xCoor < Math.min(pointC.x, pointD.x) || xCoor > Math.max(pointC.x, pointD.x)) {
          return null;
        }
        if (yCoor < Math.min(pointA.y, pointB.y) || yCoor > Math.max(pointA.y, pointB.y) ||
          yCoor < Math.min(pointC.y, pointD.y) || yCoor > Math.max(pointC.y, pointD.y)) {
          return null;
        }
      
        return new Point(xCoor, yCoor);
    }

    swapLineSegmentsIntersectionAlgo(segments) {
        let intersections = [];
        this._initEvents(segments);
        while(this.events.size > 0 ) {
            let pKey = this.events.min();
            // avoid working with the object itself, make a deep copy.
            let p = JSON.parse(JSON.stringify(this.events.find(pKey).data));
            this.lastEvent = p;
            this.events.remove(pKey);
            
            if (p.type === POINT_LEFT) {
                this.lineStatus.insert(p.segments[0]);
                let s = this.lineStatus.find(p.segments[0]);
                let s1 = this.lineStatus.prev(s);
                let s2 = this.lineStatus.next(s);
                if (s1 && this._segmentIntersection(s1.key, s.key)) {
                    let s1Copy = JSON.parse(JSON.stringify(s1.key));
                    let sCopy = JSON.parse(JSON.stringify(s.key));
                    this._queue.push(s1Copy, sCopy);
                }
                if (s2 && this._segmentIntersection(s2.key, s.key)) {
                    let s2Copy = JSON.parse(JSON.stringify(s2.key));
                    let sCopy = JSON.parse(JSON.stringify(s.key));
                    this._queue.push(sCopy, s2Copy);
                }
            }
            else if(p.type === POINT_RIGHT) {
                let skey = p.segments[0];
                let s = this.lineStatus.find(skey);
                let s1 = this.lineStatus.prev(s);
                let s2 = this.lineStatus.next(s);

                if (s1 && s2) {
                    let intersection = this._getPointIntersection(s1.key.a, s1.key.b, s2.key.a, s2.key.b);

                    if (intersection && intersection.x > s.key.b.x) {
                        let s1Copy = JSON.parse(JSON.stringify(s1.key));
                        let s2Copy = JSON.parse(JSON.stringify(s2.key));
                        this._queue.push(s1Copy, s2Copy);
                    }
                }
                
                this.lineStatus.remove(skey);
            }
            else {
                // intersection
                let s1Key = p.segments[0];
                let s2Key = p.segments[1];

                this.lastEvent.point.x -= 1;

                let s1 = this.lineStatus.find(s1Key);
                let s2 = this.lineStatus.find(s2Key);

                if (s1 && s2) {
                    let s3 = this.lineStatus.prev(s1);
                    let s4 = this.lineStatus.next(s2);

                    if (s3 && this._segmentIntersection(s3.key, s2.key)) {
                        let s3Copy = JSON.parse(JSON.stringify(s3.key));
                        let s2Copy = JSON.parse(JSON.stringify(s2.key));
                        this._queue.push(s3Copy, s2Copy);
                    }
                    if (s4 && this._segmentIntersection(s1.key, s4.key)) {
                        let s1Copy = JSON.parse(JSON.stringify(s1.key));
                        let s4Copy = JSON.parse(JSON.stringify(s4.key));
                        this._queue.push(s1Copy, s4Copy);
                    }

                    // interchange s1 and s2

                    this.lineStatus.remove(s1Key);
                    this.lineStatus.remove(s2Key);
                    this.lastEvent.point.x += 2;
                    this.lineStatus.insert(s2Key);
                    this.lineStatus.insert(s1Key);
                }
                
            }

            // detected intersections now will be processed
            while (this._queue.length > 0) {
                let s = this._queue.shift();
                let s1 = this._queue.shift();
                // common abscisa for s and s1
                let intersection = this._getPointIntersection(s.a, s.b, s1.a, s1.b);

                if (!intersection) {
                    break;
                }
                // if it's not already on my events queue
                if (!this.events.find(intersection)) {
                    intersections.push(intersection);
                    let event = new Event(INTERSECTION, intersection, s, s1);
                    this.events.insert(intersection, event);
                }
            }
        }

        return intersections;
    }
}