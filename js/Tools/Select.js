class Select extends Tools {
    constructor(){
        super(...arguments);

        // 처음 클릭한 좌표
        this.fx = 0;
        this.fy = 0;
    }
    onmousedown(e){
        this.activateClicked(e); // 클릭한 위치의 파츠를 활성화 시킴

        if(this.selected){
            // 각 좌표를 저장
            let [X, Y] = this.getXY(e);
            this.fx = this.selected.x + X;
            this.fy = this.selected.y + Y;
            this.selected.bx = this.selected.x;
            this.selected.by = this.selected.y;
        }

    }
    onmousemove(e){
        if(!this.selected || !this.fx || !this.fy || e.which !== 1) return;

        
        let [X, Y] = this.getXY(e);
        this.selected.x =  this.selected.bx * 2 + X - this.fx;
        this.selected.y =  this.selected.by * 2 + Y - this.fy;

        this.workspace.render();
    }
    onmouseup(e){
        if(!this.selected || !this.fx || !this.fy || e.which !== 1) return;
        this.fx = this.fy = 0;
    }
    removeSelected(){
        let idx = this.parts.findIndex(part => part == this.selected);
        if(idx >= 0){
            this.parts.splice(idx, 1);
            this.workspace.render();
        }
    }
}