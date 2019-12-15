const POINT_LEFT = "point_left";
const POINT_RIGHT = "point_right";
const INTERSECTION = "intersection";
const POLY_A_ID = 'A';
const POLY_B_ID = 'B';
const EXT_EDGE = 'EXT';
const INT_EDGE = 'INT';
const EXT_POLY = 'EXT_POLY';
const INT_POLY = 'INT_POLY';

class LineStatusEvent {
    constructor(id) {
        // which polygon it belongs: A or B, etc.
        this.id = id;
        // what kind of edge it is: external or internal
        this.type = null;
        // saves information about last intersection on edge
        this.lastIntersection = null;
    }
}

class Event {
    constructor(id, type, point, ...segments) {
        this.id = id;
        this.type = type;
        this.point = point;
        this.segments = segments;
    }
}

class Polygon {

    constructor() {
        this.edges = [];
        this.type = null;
        this.closed = false;
    }

    // verify if one of the edges of a candidate corresponds to
    // one of the edges 
    connects(candidate, edge) {
        return ((candidate && edge) && (candidate.a.x == edge.a.x && candidate.a.y == edge.a.y ||
            candidate.a.x == edge.b.x && candidate.a.y == edge.b.y ||
            candidate.b.x == edge.a.x && candidate.b.y == edge.a.y ||
            candidate.b.x == edge.b.x && candidate.b.y == edge.b.y)) 
    }

    addEdge(edge, pos) {
        this.edges.splice(pos, 0, edge);
    }

    addEdges(...edges) {
        this.edges.push(...edges);
    }

    isPartOfBoundaryChain(candidateEdge) {
        let size = this.edges.length;

        if (size > 0) {
            var firstEdge = this.edges[0];
        }
        if (size > 1) {
            var lastEdge = this.edges[size - 1];
        }
        
        if (this.connects(candidateEdge, firstEdge)) {
            return [true, 0];
        } else if(this.connects(candidateEdge, lastEdge)) {
            return [true, size];
        }
        return [false, -1];
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
        this.unionPolyResult = [];

        this.polygons = [];
    }

    _round(num) {
        return Math.round(num * 100) / 100
    }

    _comparatorEvents(a, b) {
        if (a.x === b.x) {
            return a.y - b.y;
        }
        return a.x - b.x;
    }

    _minPoints (a, b) {
        if (this._comparatorEvents(a, b) < 0) {
            return a.x;
        }
        return b.x;
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

        if ((y1 - y2) === 0 && (s1.a.x!==s2.a.x || s1.a.y!== s2.a.y)) {
            console.log('WHY?');
        }

        return y1 - y2;
    }

    _pointInLine(p1, p2, x, y) {

        if ((x === p1.x && y === p1.y) || (x === p2.x && y === p2.y)){
            return true;
        }

         // calculate y coordinate for segment 1 on last event x coordinate.
         let m1 = (p2.y - p1.y)/(p2.x - p1.x);
         // y = m*x + b
         let b1 = p1.y - m1 * p1.x;
         let y1 = m1 * x + b1;

         return Math.abs(y - y1) < 0.1;
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

    _avoidVerticalHorizontalSegments(p1, p2) {
        if (p1.x === p2.x) {
            p1.x += 1;
            p2.x -= 1;
        }
        if (p1.y === p2.y) {
            p1.y += 1;
            p2.y -= 1;
        }
    }

    _filterCornerCasesInPoly(poly) {
        for (let i = 0; i < poly.length - 1; i++) {
             // avoid straight lines
            this._avoidVerticalHorizontalSegments(poly[i], poly[i+1]);
        }
        this._avoidVerticalHorizontalSegments(poly[poly.length - 1], poly[0]);
    }

    _avoidSegmentSupperposition(polyA, polyB) {
        // avoid that segments are one on each other.
        for (let i = 0; i < polyA.length - 1; i++) {
            for (let j = 0; j < polyB.length; j++) {
                if (this._pointInLine(polyA[i], polyA[i+1], polyB[j].x, polyB[j].y)) {
                    polyB[j].x += 1;
                    polyB[j].y -= 1;
                }
            }
        }

        // last segment
        for (let j = 0; j < polyB.length; j++) {
            if (this._pointInLine(polyA[polyA.length-1], polyA[0], polyB[j].x, polyB[j].y)) {
                polyB[j].x += 1;
                polyB[j].y -= 1;
            }
        }
    }

    _initEvents(polyA, polyB) {
        // corner cases : vertical/horizontal lines && segment supperposition.
        this._filterCornerCasesInPoly(polyA);
        this._filterCornerCasesInPoly(polyB);
        this._avoidSegmentSupperposition(polyA, polyB);
        this._avoidSegmentSupperposition(polyB, polyA);
        this._filterCornerCasesInPoly(polyB);

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
        if (s1 && s2 && s1.data.id != s2.data.id && this._segmentIntersection(s1.key, s2.key)) {
            let s1Copy = JSON.parse(JSON.stringify(s1.key));
            let s2Copy = JSON.parse(JSON.stringify(s2.key));
            queue.push(s1Copy, s2Copy);
            return true;
        }
        return false;
    }
    
    _getAboveBelowSegments(s1, s2, s1id, s2id) {
        let sAbove = null;
        let sBelow = null;
        let idAbove = null;
        let idBelow = null;

        if (this._comparatorSegments(s1, s2) < 0) {
            sAbove = s1;
            sBelow = s2;
            idAbove = s1id;
            idBelow = s2id;
        } else {
            sBelow = s1;
            sAbove = s2;
            idBelow = s1id;
            idAbove = s2id;
        }

        return [sAbove, sBelow, idAbove, idBelow];
    }

    _assignExteriorOrInteriorEdgeLeftLeft(sAbove, sBelow) {
        let prev = this.lineStatus.prev(sAbove);
        let count = 0;
        while (prev != null) {
            if (prev.data.id != sAbove.data.id) {
                count++;
            }
            prev = this.lineStatus.prev(prev);
        }
        if (!sAbove || !sAbove.data || !sBelow ||!sBelow.data) {
            console.log('lolz');
        }

        if (count % 2 === 0) {
            sAbove.data.type = EXT_EDGE;
            sBelow.data.type = EXT_EDGE;
        }
        else {
            sAbove.data.type = INT_EDGE;
            sBelow.data.type = INT_EDGE;
        }
    }

    _closePolygonChaineIfNeeded(poly) {
        if (poly.edges.length > 1) {
            if (poly.connects(poly.edges[poly.length - 1], poly.edges[0])) {
                poly.closed = true;
            }
        }
    }

    _joingPolyChaine(polyA, polyB) {
        let AtoB0, posAB;

        [AtoB0, posAB] = polyA.isPartOfBoundaryChain(polyB.edges[0]);

        if (AtoB0) {
            // A -> 0 ; B -> 0
            if (posAB === 0 ) {
                polyB.edges = [...polyB.edges.reverse(), ...polyA.edges];
          
                return polyB;
            } else {
                // A -> A.lenght-1 ; B -> 0
                polyA.addEdges(...polyB.edges);
              
                return polyA;
            }
        }

        if (polyB.edges.length > 1) {
            [AtoB0, posAB] = polyA.isPartOfBoundaryChain(polyB.edges[polyB.edges.length - 1]);

            if (AtoB0) {
                // A -> 0 ; B -> B.length-1
                if (posAB === 0) {
                    polyB.addEdges(...polyA.edges);
          
                    return polyB;
                } else {
                    // A -> A.length-1 ; B -> B.length-1
                    polyB.edges = [...polyB.edges, ...polyA.edges.reverse()];
  
                    return polyB;
                }
            }
        }
        
    }

    _addPointFrom(edges, i, j, points) {
        if (edges[i].a.x === edges[j].a.x &&
            edges[i].a.y === edges[j].a.y) {

            points.push(new Point(edges[i].a.x, edges[i].a.y));
        }
        else if (edges[i].b.x === edges[j].a.x &&
                 edges[i].b.y === edges[j].a.y) {

            points.push(new Point(edges[i].b.x, edges[i].b.y));
        }
        else if (edges[i].a.x === edges[j].b.x &&
                 edges[i].a.y === edges[j].b.y) {

            points.push(new Point(edges[i].a.x, edges[i].a.y));
        }
        else if (edges[i].b.x === edges[j].b.x &&
                 edges[i].b.y === edges[j].b.y) {
            points.push(new Point(edges[i].b.x, edges[i].b.y));
        }
    }

    _reducePoint(points, i, j) {
        if (Math.abs(points[i].x - points[j].x) <= 6 && Math.abs(points[i].y - points[j].y) <= 6) {
            points[i].x = Math.floor((points[i].x + points[j].x)/2);
            points[i].y = Math.floor((points[i].y + points[j].y)/2);
            points.splice(j, 1);
            return i;
        }
        return i+1;
    }

    getPointsFromEdges(edges) {
        let points = [];
        for(let i = 0; i < edges.length - 1; i++) {
            this._addPointFrom(edges, i, i+1, points);
        }

        this._addPointFrom(edges, edges.length - 1, 0, points);

        // delete points which are near to each other.
        let i = 0;
        while(i < points.length - 1) {
            i = this._reducePoint(points, i, i+1);
        }
        this._reducePoint(points, points.length - 2, points.length - 1);
        this._reducePoint(points, points.length - 1, 0);

        return points;
    }

    _addToPolygonsList(newSegment, polygons, type=INT_POLY) {
        let belongsToBC, pos;
        if (polygons.length > 0 ){
            let segmentBelongsToSomePoly = false;
            let indexPolyItBelongs = [];
            for (let i = 0; i < polygons.length; i++) {

                [belongsToBC, pos] = polygons[i].isPartOfBoundaryChain(newSegment);
                if (belongsToBC) {
                    if (!segmentBelongsToSomePoly) {
                        polygons[i].addEdge(newSegment, pos);
                    }
                    polygons[i].type = type;
                    segmentBelongsToSomePoly = true;
                    indexPolyItBelongs.push(i);
                }
            }
            
            if (!segmentBelongsToSomePoly) {
                // manage the hypothesis that it is a hole
                let polygon = new Polygon();
                polygons.type = type;
                polygon.addEdge(newSegment);
                polygons.push(polygon);
            } else if(indexPolyItBelongs.length > 1) {
                // joining the polygons
                let idPolyA = indexPolyItBelongs.pop();
                let idPolyB = indexPolyItBelongs.pop();
                
                let newPoly = this._joingPolyChaine(polygons[idPolyA], polygons[idPolyB]);
                newPoly.type = type;
                // delete both polygons 
                polygons.splice(idPolyA, 1);
                polygons.splice(idPolyB, 1);
                // add the new one
                polygons.push(newPoly);
            }
        } else {
            let polygon = new Polygon();
            polygons.type = type;
            polygon.addEdge(newSegment);
            polygons.push(polygon);
        }
    }

    _addUnionSegmentFromSegment(segment, polygons, type=INT_POLY) {
        //create edge from segment.a -> intersection point.
        let initialPoint = segment.data.lastIntersection ? segment.data.lastIntersection : segment.key.a;
        let newSegment = new Segment(initialPoint, segment.key.b);
        this._addToPolygonsList(newSegment, polygons, type);
    }

    _addUnionSegmentFrom(segment, intersectionPoint, polygons, type=INT_POLY) {
        //create edge from segment.a -> intersection point.
        let initialPoint = segment.data.lastIntersection ? segment.data.lastIntersection : segment.key.a;
        let newSegment = new Segment(initialPoint, intersectionPoint);
        this._addToPolygonsList(newSegment, polygons, type);
    }

    swapLineSegmentsIntersectionAlgo(polyA, polyB) {
        let intersections = [];
        let previousX = null;
        this.events = new AVLTree(this._comparatorEvents);
        this._queue = [];
        this.lineStatus = new AVLTree(this._comparatorSegments.bind(this));
        this.lastEvent = null;
        this.unionPolyResult = [];
        this.polygons = [];
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
                console.log('left-left');
                this.lastEvent.point.x += 0.000001;
                this.lineStatus.insert(p.segments[0], new LineStatusEvent(p.id));
                this.lineStatus.insert(p2.segments[0], new LineStatusEvent(p2.id));
                let sAbove = null;
                let sBelow = null;
                let idAbove = null;
                let idBelow = null;
                [sAbove, sBelow, idAbove, idBelow] = this._getAboveBelowSegments(
                    p.segments[0],
                    p2.segments[0],
                    p.id,
                    p2.id);

                let s = this.lineStatus.find(sAbove);
                let sPrev = this.lineStatus.prev(s);
                let s2 = this.lineStatus.find(sBelow);
                let s2Next = this.lineStatus.next(s2);
                
                this._pushIntersectionSegmentsInto(this._queue, s2, s2Next, idBelow);
                this._pushIntersectionSegmentsInto(this._queue, sPrev, s, idAbove);

                this._assignExteriorOrInteriorEdgeLeftLeft(s, s2);
            }
            else if(p && p2 && p.type === POINT_RIGHT && p2.type === POINT_LEFT) {
                console.log('right-left');
                let skey = p.segments[0];
                let s = this.lineStatus.find(skey);
                let aux = this.lastEvent.point.x;
                if (!s) {
                    this.lastEvent.point.x = skey.a.x;
                    s = this.lineStatus.find(skey);
                }
                let edgeType = s.data.type
                
                if (s.data.type === EXT_EDGE) {
                    this._addUnionSegmentFromSegment(s, this.polygons);
                }
                this.lineStatus.remove(skey);
                this.lastEvent.point.x = aux;

                // copy edge type: EXT/INT from previous.
                let lineStatusEvent = new LineStatusEvent(p2.id);
                lineStatusEvent.type = edgeType;
                this.lineStatus.insert(p2.segments[0], lineStatusEvent);
                let s2 = this.lineStatus.find(p2.segments[0]);
                let s2Next = this.lineStatus.next(s2);
                let s2Prev = this.lineStatus.prev(s2);

                this._pushIntersectionSegmentsInto(this._queue, s2, s2Next, p2.id);
                this._pushIntersectionSegmentsInto(this._queue, s2Prev, s2, p2.id);
            }
            else if(p && p2 && p.type === POINT_LEFT && p2.type === POINT_RIGHT) {
                console.log('left-right');
                let s2key = p2.segments[0];
                
                let s2 = this.lineStatus.find(s2key);
                let aux = this.lastEvent.point.x;
                if (!s2) {
                    this.lastEvent.point.x = s2key.a.x;
                    s2 = this.lineStatus.find(s2key);
                }
                let edgeType = s2.data.type;

                if (s2.data.type === EXT_EDGE) {
                    this._addUnionSegmentFromSegment(s2, this.polygons);
                }

                this.lineStatus.remove(s2key);
                this.lastEvent.point.x = aux;
                // copy edge type: EXT/INT from previous.
                let lineStatusEvent = new LineStatusEvent(p.id);
                lineStatusEvent.type = edgeType;

                this.lineStatus.insert(p.segments[0], lineStatusEvent);
                let s = this.lineStatus.find(p.segments[0]);
                let sNext = this.lineStatus.next(s);
                let sPrev = this.lineStatus.prev(s);

                this._pushIntersectionSegmentsInto(this._queue, s, sNext, p.id);
                this._pushIntersectionSegmentsInto(this._queue, sPrev, s, p.id);
            }
            else if(p.type === POINT_RIGHT && p2.type === POINT_RIGHT) {
                console.log('right-right');

                let skey = p.segments[0];
                let s = this.lineStatus.find(skey);
                let polyType = INT_POLY;

                if (this.events.size === 0) {
                    polyType = EXT_POLY;
                }

                if (!s) {
                    this.lastEvent.point.x -= 0.000001;
                    s = this.lineStatus.find(skey);
                }

                if (!s) {
                    this.lastEvent.point.x = skey.a.x
                    s = this.lineStatus.find(skey);
                }

                if (s.data.type === EXT_EDGE) {
                    this._addUnionSegmentFromSegment(s, this.polygons, polyType);
                }
                this.lineStatus.remove(skey);

                let s2key = p2.segments[0];
                let s2 = this.lineStatus.find(s2key);

                if (!s2) {
                    this.lastEvent.point.x -= 0.000001;
                    s2 = this.lineStatus.find(s2key);
                } 

                if (!s2) {
                    this.lastEvent.point.x = s2key.a.x
                    s2 = this.lineStatus.find(s2key);
                }

                if (s2.data.type === EXT_EDGE) {
                    this._addUnionSegmentFromSegment(s2, this.polygons, polyType);
                }

                this.lineStatus.remove(s2key);
            }
            else {
                console.log('intersection');
                // intersection
                let s1Key = p.segments[0];
                let s2Key = p.segments[1];
                let intersectionPoint = new Point(this.lastEvent.point.x, this.lastEvent.point.y);

                this.lastEvent.point.x -= 0.000001;
                let s1 = this.lineStatus.find(s1Key);
                let s2 = this.lineStatus.find(s2Key);

                if (s1 && s2) {
                    let s3 = this.lineStatus.prev(s1);
                    let s4 = this.lineStatus.next(s2);

                    this._pushIntersectionSegmentsInto(this._queue, s3, s2, s2.data.id);
                    if (s4) {
                        this._pushIntersectionSegmentsInto(this._queue, s1, s4, s4.data.id);
                    }

                    // add edges to the union polygon
                    if (s1.data.type === EXT_EDGE) {
                        //create edge from s1.a -> intersection point.
                        this._addUnionSegmentFrom(s1, intersectionPoint, this.polygons);
                    }
                    if (s2.data.type === EXT_EDGE) {
                         //create edge from s2.a -> intersection point.
                         this._addUnionSegmentFrom(s2, intersectionPoint, this.polygons);
                    }
                    
                    // interchange s1 and s2
                    // the type of edges (ext/int) interchanges aswell
                    let s1Type = s1.data.type;
                    let s2Type = s2.data.type;
                    if (s1Type === s2Type) {
                        // if both are equal changed it
                        if (s1Type === EXT_EDGE) {
                            s1Type = INT_EDGE;
                            s2Type = INT_EDGE;
                        } else {
                            s1Type = EXT_EDGE;
                            s2Type = EXT_EDGE;
                        }
                    } else {
                        // flip it
                        let aux = s1Type;
                        s1Type = s2Type;
                        s2Type = aux;
                    }

                    this.lineStatus.remove(s1Key);
                    this.lineStatus.remove(s2Key);
                    this.lastEvent.point.x += 0.000002;

                    let lineStatusEvents1 = new LineStatusEvent(s1Key.polyName);
                    lineStatusEvents1.type = s1Type;
                    lineStatusEvents1.lastIntersection = intersectionPoint;

                    let lineStatusEvents2 = new LineStatusEvent(s2Key.polyName);
                    lineStatusEvents2.type = s2Type;
                    lineStatusEvents2.lastIntersection = intersectionPoint;
                    this.lineStatus.insert(s2Key, lineStatusEvents2);
                    this.lineStatus.insert(s1Key, lineStatusEvents1);
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
                console.log('Intersection at ', intersection.x, intersection.y);
                // if it's not already on my events queue
                if (!this.events.find(intersection)) {
                    intersections.push(intersection);
                    let event = new Event(`${s.polyName}, ${s1.polyName}`, INTERSECTION, intersection, s, s1);
                    this.events.insert(intersection, event);
                }
            }

            previousX = this.lastEvent.point.x;
        }

        return [intersections, this.polygons];
    }
}