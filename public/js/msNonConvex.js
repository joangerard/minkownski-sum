class msNonConvex {
    constructor(rPolygonCanvas, qPolygonCanvas, resPolygonCanvas, helperCalculus, polyOperation, polyUnion, width, height, scale, defaultInit) {
        this.rPoly = rPolygonCanvas;
        this.qPoly = qPolygonCanvas;
        this.ms = new MinkowskiSumApp(rPolygonCanvas, qPolygonCanvas, resPolygonCanvas, null,  helperCalculus, polyOperation, polyUnion, width, height, scale, false);
        if (defaultInit) {
            this._init();
        }
    }

    _init() {
        this.rPoly.addPoint(new Point(105.24996948242188,128.4986626039592));
        this.rPoly.addPoint(new Point(151.24996948242188,155.49868938316055));
        this.rPoly.addPoint(new Point(163.24996948242188,100.49863483293555));
        this.rPoly.addPoint(new Point(203.24996948242188,150.49868442404917));
        this.rPoly.addPoint(new Point(263.2499694824219,137.49867153035964));
        this.rPoly.addPoint(new Point(212.24996948242188,186.498720129651));
        this.rPoly.addPoint(new Point(254.24996948242188,221.49875484343056));
        this.rPoly.addPoint(new Point(174.24996948242188,211.49874492520783));
        this.rPoly.addPoint(new Point(138.24996948242188,255.49878856538783));
        this.rPoly.addPoint(new Point(144.24996948242188,185.49871913782874));
        this.rPoly.addPoint(new Point(105.24996948242188,128.4986626039592));

        this.qPoly.addPoint(new Point(115.4896240234375,142.67281890728327));
        this.qPoly.addPoint(new Point(175.4896240234375,177.67281089642086));
        this.qPoly.addPoint(new Point(227.4896240234375,134.67282073833755));
        this.qPoly.addPoint(new Point(231.4896240234375,222.6728005967406));
        this.qPoly.addPoint(new Point(160.4896240234375,236.6727973923956));
        this.qPoly.addPoint(new Point(115.4896240234375,142.67281890728327));

        this.linearAlgoNonConvex();
    }
    
    linearAlgoNonConvex() {
        return this.ms.linearAlgoNonConvex();
    }
}