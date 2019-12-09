const POINT_LEFT = "point_left";
const POINT_RIGHT = "point_right";
const INTERSECTION = "intersection";
const POLY_A_ID = 'A';
const POLY_B_ID = 'B';

class Event {
    constructor(id, type, point, ...segments) {
        this.id = id;
        this.type = type;
        this.point = point;
        this.segments = segments;
    }
}

class PolyUnionBuilder {
    constructor(polyA, polyB){
        this.polyA = polyA;
        this.polyB = polyB;
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

    _insertSegmentInEvents(segment, id) {
        if (this._comparatorEvents(segment.a, segment.b) < 0) {
            this.events.insert(segment.a, new Event(id, POINT_LEFT, segment.a, segment));
            this.events.insert(segment.b, new Event(id, POINT_RIGHT, segment.b, segment));
        } else {
            let s1 = new Segment(segment.b, segment.a);
            s1.setPolyName(segment.polyName);
            this.events.insert(segment.a, new Event(id, POINT_RIGHT, segment.a, s1));
            this.events.insert(segment.b, new Event(id, POINT_LEFT, segment.b, s1));
        }
    }

    _initEvents(polyA, polyB) {
        for (let i = 0; i < polyA.length - 1; i++) {
            let segment = new Segment(polyA[i], polyA[i+1]);
            segment.setPolyName(POLY_A_ID);
            this._insertSegmentInEvents(segment, POLY_A_ID);
        }

        for (let i = 0; i < polyB.length - 1; i++) {
            let segment = new Segment(polyB[i], polyB[i+1]);
            segment.setPolyName(POLY_B_ID);
            this._insertSegmentInEvents(segment, POLY_B_ID);
        }
        
        let lastSegA = new Segment(polyA[polyA.length - 1], polyA[0]);
        let lastSegB = new Segment(polyB[polyB.length - 1], polyB[0]);
        lastSegA.setPolyName(POLY_A_ID);
        lastSegB.setPolyName(POLY_B_ID);
        this._insertSegmentInEvents(lastSegA, POLY_A_ID);
        this._insertSegmentInEvents(lastSegB, POLY_B_ID);
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

    _pushIntersectionSegmentsInto(queue, s1, s2, id) {
        if (s1 && s1.data.id != id && this._segmentIntersection(s1.key, s2.key)) {
            let s1Copy = JSON.parse(JSON.stringify(s1.key));
            let s2Copy = JSON.parse(JSON.stringify(s2.key));
            queue.push(s1Copy, s2Copy);
        }
    }

    swapLineSegmentsIntersectionAlgo(polyA, polyB) {
        let intersections = [];
        this._initEvents(polyA, polyB);
        while(this.events.size > 0 ) {
            let pKey = this.events.min();
            // avoid working with the object itself, make a deep copy.
            let p = JSON.parse(JSON.stringify(this.events.find(pKey).data));
            this.lastEvent = p;
            this.events.remove(pKey);
            let p2 = null;

            if (p.type != INTERSECTION) {
                let p2key = this.events.min();
                p2 = JSON.parse(JSON.stringify(this.events.find(p2key).data));
                this.events.remove(p2key);
            }
            
            // vertex corresponds to a new vertex of polygon
            if (p && p2 && p.type === POINT_LEFT && p2.type === POINT_LEFT) {
                this.lastEvent.point.x += 0.1;
                this.lineStatus.insert(p.segments[0], p.id);
                this.lineStatus.insert(p2.segments[0], p.id);
                let sAbove = null;
                let sBelow = null;
                let idAbove = null;
                let idBelow = null;

                if (p.segments[0].b.y < p2.segments[0].b.y) {
                    sAbove = p.segments[0];
                    sBelow = p2.segments[0];
                    idAbove = p.id;
                    idBelow = p2.id;
                } else {
                    sBelow = p.segments[0];
                    sAbove = p2.segments[0];
                    idBelow = p.id;
                    idAbove = p2.id;
                }

                let s = this.lineStatus.find(sAbove);
                let sPrev = this.lineStatus.prev(s);
                let s2 = this.lineStatus.find(sBelow);
                let s2Next = this.lineStatus.next(s2);

                this._pushIntersectionSegmentsInto(this._queue, sPrev, s, idAbove);
                this._pushIntersectionSegmentsInto(this._queue, s2Next, s2, idBelow);
            }
            else if(p && p2 && p.type === POINT_RIGHT && p2.type === POINT_LEFT) {
                let skey = p.segments[0];
                this.lineStatus.remove(skey);

                this.lineStatus.insert(p2.segments[0], p2.id);
                let s2 = this.lineStatus.find(p2.segments[0]);
                let s2Next = this.lineStatus.next(s2);
                let s2Prev = this.lineStatus.prev(s2);

                this._pushIntersectionSegmentsInto(this._queue, s2Next, s2, p2.id);
                this._pushIntersectionSegmentsInto(this._queue, s2Prev, s2, p2.id);
            }
            else if(p && p2 && p.type === POINT_LEFT && p2.type === POINT_RIGHT) {
                let s2key = p2.segments[0];
                this.lineStatus.remove(s2key);

                this.lineStatus.insert(p.segments[0], p.id);
                let s = this.lineStatus.find(p.segments[0]);
                let sNext = this.lineStatus.next(s);
                let sPrev = this.lineStatus.prev(s);

                this._pushIntersectionSegmentsInto(this._queue, sNext, s, p.id);
                this._pushIntersectionSegmentsInto(this._queue, sPrev, s, p.id);
            }
            else if(p.type === POINT_RIGHT && p2.type === POINT_RIGHT) {
                let skey = p.segments[0];
                this.lineStatus.remove(skey);

                let s2key = p2.segments[0];
                this.lineStatus.remove(s2key);
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

                    this._pushIntersectionSegmentsInto(this._queue, s3, s2, s2.data);
                    this._pushIntersectionSegmentsInto(this._queue, s4, s1, s1.data);
                    
                    // interchange s1 and s2
                    this.lineStatus.remove(s1Key);
                    this.lineStatus.remove(s2Key);
                    this.lastEvent.point.x += 2;
                    this.lineStatus.insert(s2Key, s2Key.polyName);
                    this.lineStatus.insert(s1Key, s1Key.polyName);
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
                    let event = new Event(`${s.polyName}, ${s1.polyName}`, INTERSECTION, intersection, s, s1);
                    this.events.insert(intersection, event);
                }
            }
        }

        return intersections;
    }
}