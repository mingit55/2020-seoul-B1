class Glue extends Tools {
    constructor(){
        super(...arguments);
        this.glueParts = [];
    }
    onmousedown(e){
        if(!this.selected){
            this.activateClicked(e);
        } 
        else {
            this.parts.reverse();
            let [x, y] = this.getXY(e);
            let clicked = this.parts.find(part => part.isClicked(x, y));

            if(clicked && this.selected !== clicked && clicked.isNear(this.selected)){
                clicked.active = true;
                this.glueParts.push(clicked);
            }
            this.parts.reverse();
        }

        this.workspace.render();
    }
    onmousemove(e){}
    onmouseup(e){}
    oncontextmenu(e){
        e.preventDefault();
        if(!this.selected) return;

        let X = e.pageX;
        let Y = e.pageY;

        let menus = [
            {name: "붙이기", onclick: this.execute},
            {name: "취소", onclick: this.glueInit},
        ];
        
        this.app.makeContextMenu({menus, X, Y});
    }

    execute = () => {
        let glueParts = [ this.selected, ...this.glueParts ];
        let left = glueParts.reduce((p, c) => Math.min(p, c.x), glueParts[0].x);
        let top = glueParts.reduce((p, c) => Math.min(p, c.y), glueParts[0].y);
        let right = glueParts.reduce((p, c) => Math.max(p, c.x + c.src.width-1), glueParts[0].x + glueParts[0].src.width-1);
        let bottom = glueParts.reduce((p, c) => Math.max(p, c.y + c.src.height-1), glueParts[0].y + glueParts[0].src.height-1);
        let x = left;
        let y = top;
        let width = right - left + 1;
        let height = bottom - top + 1;

        let arr = [];
        arr.length = width * height * 4;
        arr.fill(0);
        
        let uint8 = Uint8ClampedArray.from(arr);
        let px, py; // 실제 픽셀 좌표
        let fx, fy; // forEach 파츠의 좌표
        let gx, gy; // glueCanvas의 좌표

        // 잘린 선을 저장해둘 캔버스
        let sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = width;
        sliceCanvas.height = height;
        let sctx = sliceCanvas.getContext("2d");

        glueParts.reverse().forEach(part => {
            // 잘린 선 붙여넣기
            sctx.drawImage(part.sliceCanvas, part.x - x, part.y - y);

            // 이미지 데이터 붙여넣기
            for(px = x; px < x + width; px++){
                for(py = y; py < y + height; py++){
                    fx = px - part.x;
                    fy = py - part.y;

                    gx = px - x;
                    gy = py - y;

                    let color = part.src.getColor(fx, fy);
                    if(!color) continue;

                    let idx = gx * 4 + gy * 4 * width;
                    uint8[idx] = color.r;
                    uint8[idx + 1] = color.g;
                    uint8[idx + 2] = color.b;
                    uint8[idx + 3] = color.a;
                }
            }
        });

        let imageData = new ImageData(uint8, width, height);
        let newPart = new Part({imageData});
        newPart.x = x;
        newPart.y = y;
        newPart.sliceCanvas = sliceCanvas;
        newPart.sctx = sctx;
        newPart.updateSliceData();
        
        glueParts.forEach(part => {
            let idx = this.parts.findIndex(item => item == part);
            this.parts.splice(idx, 1);
        });

        this.parts.push(newPart);
        this.workspace.render();
    }

    glueInit = () => {
        this.glueParts.forEach(part => part.active = false);
        this.glueParts = [];
        this.selected = null;

        this.workspace.render();
    }
}