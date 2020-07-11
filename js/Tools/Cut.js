class Cut extends Tools {
    constructor(){
        super(...arguments);

        this.cutting = false;

        // 실제 캔버스 :: 실제 사용자에게 보여지는 화면
        this.canvas = this.workspace.curveCanvas;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = "rounded";
        this.ctx.strokeStyle = "#000";
        this.ctx.setLineDash([2, 5]);

        // 가상 캔버스 :: 안쪽에서 좌표계산할 떄 사용하는 화면
        this.virtualCanvas = document.createElement("canvas");
        this.virtualCanvas.width = this.canvas.width;
        this.virtualCanvas.height = this.canvas.height;
        this.vtx = this.virtualCanvas.getContext("2d");
        this.vtx.lineWidth = 1;
        this.vtx.lineCap = "rounded";
        this.vtx.strokeStyle = "#f00";
    }

    /**
     * 각종 이벤트
     */
    ondblclick(e){
        this.activateClicked(e);
    }
    onmousedown(e){
        const [X, Y] = this.getXY(e);

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
        this.ctx.moveTo(X, Y);

        this.vtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.vtx.beginPath();
        this.vtx.moveTo(X, Y);

        this.cutting = true;
    }
    onmousemove(e){
        if(!this.selected || !this.cutting) return;

        const [X, Y] = this.getXY(e);


        this.vtx.lineTo(X, Y);
        this.vtx.stroke();

        this.ctx.lineTo(X, Y);
        this.ctx.stroke();

        this.workspace.render();
    }
    onmouseup(e){
        this.cutting = false;
    }
    oncontextmenu(e){
        e.preventDefault();
        if(!this.selected) return;

        let X = e.pageX;
        let Y = e.pageY;

        let menus = [
            {name: "자르기", onclick: this.execute},
            {name: "취소", onclick: this.clear},
        ]

        this.app.makeContextMenu({menus, X, Y});
    }

    /**
     * 자르기
     */
    execute = e => {
        /*  변수 선언
        */
        let part;           // 선택한 파츠
        let part_idx;       // 선택한 파츠의 Index
        let source;         // 원본 데이터 Source
        let origin_arr;     // 원본 데이터의 imageData Array
        let curve_arr;      // 궤적을 그린 imageData Array
        let splitted;       // 자른 데이터의 Uint8를 저장할 배열
        let finder;         // 검사해야할 좌표들의 배열
        let leftChecked;    // 좌측 검사 여부
        let rightChecked;   // 우측 검사 여부

        // 함수
        let makeData;       // 새로운 이미지 데이터 배열을 생성하는 함수
        let getColorOrigin; // 원본 이미지의 색상 가져오는 함수
        let getColorCurve;  // 궤적 이미지의 색상 가져오는 함수

        part_idx = this.parts.findIndex(part => part == this.selected);
        part = this.parts.splice(part_idx, 1)[0];
        source = part.src;
        origin_arr = Uint8ClampedArray.from(source.imageData.data);
        curve_arr = Uint8ClampedArray.from( this.vtx.getImageData(0, 0, this.canvas.width, this.canvas.height).data );
        splitted = [];
        makeData = () => {
            let arr = [];
            arr.length = source.width * source.height * 4;
            return Uint8ClampedArray.from(arr);
        }
        getColorOrigin = (x, y) => source.getColor(x, y, { data: origin_arr, width: source.width, height: source.height });
        getColorCurve = (x, y) => source.getColor(x, y, { data: curve_arr, width: this.canvas.width, height: this.canvas.height });
        
        /*  이미지 Array와 궤적 Array의 교집함을 제외시킴
        */

        let sliceLine = []; // 잘린 궤적의 좌표를 담는 배열
        for(let x = 0; x < this.canvas.width; x++){
            for(let y = 0; y < this.canvas.height; y++){
                if(getColorOrigin(x - part.x, y - part.y) && getColorCurve(x, y)){
                   source.setColor(x - part.x, y - part.y, [0, 0, 0, 0], origin_arr);
                   sliceLine.push([x - part.x, y - part.y]);
               }
           }
        }

        /* 잘려진 파츠별로 분리시킴
        */
        for(let y = 0; y < source.height; y++){
            for(let x = 0; x < source.width; x++){
                // 원본 데이터에서 색상이 있는 애들만 검사
                if(!getColorOrigin(x, y)) continue;
                
                let new_arr = makeData();
                
                // 값 초기화
                finder = [ [x, y] ];
                
                // 검사할 것이 사라질 때까지 반복
                while(finder.length > 0){
                    let [x, y] = finder.pop();
                    
                    // 색상이 있는 픽셀들의 가장 위로 올라감
                    while(y - 1 >= 0 && getColorOrigin(x, y - 1)) y--;

                    leftChecked = false;
                    rightChecked = false;

                    // 다시 아래로 내려감
                    do {
                        // 색상이 있는지 검사 => 없으면 멈춤
                        let pixelColor = getColorOrigin(x, y);
                        if(pixelColor == false) {
                            break;
                        }

                        // 원래 배열의 색상은 없애고, 새로운 배열에 색상을 추가
                        let {r, g, b, a} = pixelColor;
                        source.setColor(x, y, [0, 0, 0, 0], origin_arr);
                        source.setColor(x, y, [r, g, b, a], new_arr);

                        // 왼쪽 검사
                        if(x > 0){
                            if(getColorOrigin(x - 1, y)){
                                if(leftChecked == false){
                                    finder.push([x-1, y]);
                                    leftChecked = true;
                                }
                            } else if(leftChecked){
                                leftChecked  = false;
                            }
                        }
                        // 오른쪽 검사
                        if(x < source.width - 1){

                            if(getColorOrigin(x + 1, y)){
                                if(rightChecked == false){
                                    finder.push([x+1, y]);
                                    rightChecked = true;
                                }
                            } else if(rightChecked){
                                rightChecked = false;
                            }
                        }

                    } while(++y < source.height);
                }

                splitted.push(new_arr);
            }
        }

        // 잘라진 조각을 파츠로 재구성
        splitted = splitted.map(split => {
            let newPart = new Part({
                imageData: new ImageData(split, source.width, source.height)
            });
            newPart.x = part.x;
            newPart.y = part.y;
            
            let [x, y] = newPart.src.getSize();

            // 잘린 부분은 테두리 선으로 표시
            newPart.sliceLine = [... part.sliceLine, ...sliceLine].filter(([x, y]) => newPart.src.isBorderPixel(x, y));

            // 잘린 선의 위치를 재계산
            newPart.recalculate();

            return newPart;
        });


        this.parts.push(...splitted);
        this.clear();
    }



    /**
     * 취소
     */
    clear = e => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.vtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.selected.active = false;
        this.selected = null;
        this.workspace.render();
    }
}
