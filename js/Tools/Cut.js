class Cut extends Tools {
    constructor(){
        super(...arguments);

        this.canvas = this.workspace.curveCanvas;
        this.ctx = this.canvas.getContext("2d");
        this.ctx.lineWidth = 1;
        this.ctx.lineCap = "rounded";

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
    }
    onmousemove(e){
        if(!this.selected) return;

        const [X, Y] = this.getXY(e);       
        this.ctx.lineTo(X, Y);
        this.ctx.stroke();

        this.workspace.render();
    }
    onmouseup(e){

    }
    oncontextmenu(e){
        e.preventDefault();
        if(!this.selected) return;

        let X = e.pageX;
        let Y = e.pageY;

        let menus = [
            {name: "자르기", onclick: this.execute},
            {name: "취소", onclick: this.cancel},
        ]

        this.app.makeContextMenu({menus, X, Y});
    }

    /**
     * 자르기
     */
    execute = e => {
        let idx = this.parts.findIndex(part => part == this.selected);
        let part = this.parts[idx];

        let origin;         // 원본 데이터의 Uint8
        let splitted = [];  // 자른 데이터의 Uint8를 저장할 배열
        let x, y;           // 각 픽셀마다 검사를 할 X, Y
        let cy;             // 

        origin = Uint8ClampedArray.from(part.src.imageData.data);  
        
        let getColor = (x, y) => part.src.getColor(x, y, origin);
        
        for(y = 0; y < source.height; y++){
            for(x = 0; x < source.width; x++){
                if(!getColor(x, y)) continue;

                cy = y;
                while(getColor(x, cy - 1)) cy--;
                
            }
        }
    }



    /**
     * 취소
     */
    cancel = e => {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.selected = null;
        this.workspace.render();
    }
}