class Spin extends Tools {
    constructor(){
        super(...arguments);
        
        this.spinning = false;
    }
    ondblclick(e){
        let prevSelected = this.selected;
        this.activateClicked(e);

        // 이전 파트는 원상태로 복구
        console.log(prevSelected)
        if(prevSelected && this.selected !== prevSelected){
            prevSelected.rotateInit();
            prevSelected.rotate(-prevSelected.prevAngle);
            prevSelected.prevAngle = 0;
        }
    }
    onmousedown(e){
        let [X, Y] = this.getXY(e);
        if(!this.selected || !this.selected.isClicked(X, Y)) return;

        this.bx = X;
        this.spinning = true;
        this.selected.rotateInit();
    }
    onmousemove(e){
        if(!this.selected || !this.spinning) return;

        // 마우스 진행 방향에 따라 각도 변환
        let [X] = this.getXY(e);
        let movePixel = this.bx - X; 
        this.bx = X;
        
        let moveAngle = (Math.PI/180) * movePixel;
        this.selected.prevAngle += moveAngle;
        this.selected.rotate(moveAngle);
        this.workspace.render();

        console.log(this.selected.prevAngle * 180 / Math.PI);
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
        this.selected.active = false;
        this.selected.prevAngle = 0;
        this.selected = null;
        this.workspace.render();
    }

    spinInit = e => {
        if(!this.selected) return;
        this.selected.rotateInit();
        console.log(-this.selected.prevAngle);
        this.selected.rotate(-this.selected.prevAngle);
        this.selected.prevAngle = 0;
        this.selected.active = false;
        this.selected = null;
        this.workspace.render();
    }
}