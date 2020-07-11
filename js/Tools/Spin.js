class Spin extends Tools {
    constructor(){
        super(...arguments);

        this.prevSelected = null;
        this.spinning = false;
    }
    ondblclick(e){
        if(this.selected) return;
        this.activateClicked(e);
        this.selected.beforeRotate();
    }
    onmousedown(e){
        if(!this.selected) return;
        
        let [X] = this.getXY(e);
        this.bx = X;
        this.spinning = true;
    }
    onmousemove(e){
        if(!this.selected || !this.spinning) return;

        // 마우스 진행 방향에 따라 각도 변환
        let [X] = this.getXY(e);
        let movePixel = this.bx - X; 
        this.bx = X;
        
        let angle = (Math.PI/180) * movePixel;
        this.selected.prevAngle += angle;
        this.selected.rotate(angle);
        this.workspace.render();
    }
    onmouseup(e){
        this.spinning = false;     
    }
    oncontextmenu(e){
        e.preventDefault();
        if(!this.selected) return;

        let X = e.pageX;
        let Y = e.pageY;
        let menus = [
            { name: "확인", onclick: this.accept },
            { name: "취소", onclick: this.spinInit }
        ];
        this.app.makeContextMenu({menus, X, Y});
    }

    accept = e => {
        if(!this.selected) return;
        let [x, y] = this.selected.src.getSize();
        // this.selected.sliceLine = this.selected.sliceLine.map(([sx, sy]) => [sx + x, sy + y])
        this.selected.active = false;
        this.selected.recalculate();
        this.selected = null;
        this.workspace.render();
    }

    spinInit = e => {
        if(!this.selected) return;
        this.selected.rotateReset();
        this.selected.active = false;
        this.selected = null;
        this.workspace.render();
    }
}