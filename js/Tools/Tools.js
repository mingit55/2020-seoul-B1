class Tools {
    constructor(app){
        this.app = app;
        this.workspace = app.workspace;
        this.parts = app.workspace.parts;
        this.selected = null; // 이 도구가 선택한 대상
    }

    // X, Y 좌표 가져오기
    getXY({pageX, pageY}){
        let canvas = this.workspace.canvas;
        let {left, top} = $(canvas).offset();
        let X = parseInt(pageX - left);
        let Y = parseInt(pageY - top);
        X = X < 0 ? 0 : X > canvas.width ? canvas.width : X;
        Y = Y < 0 ? 0 : Y > canvas.height ? canvas.height : Y;
        return [X, Y];
    }

    // 마우스 위치의 파츠 활성화 시킨다
    activateClicked(e){
        this.parts.reverse();

        // 모든 활성화 파츠 비활성화
        this.parts.forEach(part => part.active = false);
        
        // 클릭한 파츠를 가져옴
        let [X, Y] = this.getXY(e);
        let idx = this.parts.findIndex(part => part.isClicked(X, Y));

        if(idx >= 0) {
            // 클릭된 파츠가 있으면 활성화
            this.selected = this.parts[idx];
            this.selected.active = "select";

            // 가장 위로 올리기
            this.parts.splice(idx, 1);
            this.parts.unshift(this.selected);
        } else {
            this.selected = null;
        }
        
        this.parts.reverse();
        this.workspace.render();

        return this.parts;
    }

    // 각 툴마다 선택된 파츠를 활성화시킴
    init(){
        this.parts.forEach(part => part.active = part === this.selected);   
        this.workspace.render();
    }
}