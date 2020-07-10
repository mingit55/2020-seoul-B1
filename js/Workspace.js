class Workspace {
    constructor(app){
        this.app = app;

        // 출력용 캔버스
        this.canvas = $("#workspace")[0];
        this.ctx = this.canvas.getContext("2d");

        // 궤적 생성용 캔버스
        this.curveCanvas = document.createElement("canvas");
        this.curveCanvas.width = this.canvas.width;
        this.curveCanvas.height = this.canvas.height;

        this.parts = [];

        this.strokeStyle = "#333";
        this.fillStyle = "#555";
        this.borderGap = "rounded";
        this.borderWidth = 1;
    }
    
    // 클릭한 좌표가 Workspace 내인지
    isContains({pageX, pageY}){  
        let {left, top} = $(this.canvas).offset();
        let width = $(this.canvas).width();
        let height = $(this.canvas).height();
        
        return left <= pageX && pageX <= left + width && top <= pageY && pageY <= top + height;
    }

    // 파츠 추가
    pushPart(part){
        this.parts.push(part);
        this.render();
    }

    // 콘텍스트 스타일 세팅
    setContextStyle(ctx){
        ctx.strokeStyle = this.strokeStyle;
        ctx.fillStyle = this.fillStyle;
        ctx.borderGap = this.borderGap;
        ctx.borderWidth = this.borderWidth;
    }


    // 한지 렌더링
    render(){
        // 1. 화면을 비운다.
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 2. 각 파츠를 출력한다.
        this.parts.forEach(part => {
            part.update();
            this.ctx.drawImage(part.canvas, part.x, part.y);
            this.ctx.strokeRect(part.x, part.y, part.canvas.width, part.canvas.height);
        });

        // 3. (현재 도구가 자르기라면) 자르기 스크린을 출력한다.
        if(this.app.selectedTool == "cut") {
            this.ctx.drawImage(this.curveCanvas, 0, 0);
        }
    }
}