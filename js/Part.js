class Part {
    constructor(source){
        this.src = this.getSource(source);

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.src.width;
        this.canvas.height = this.src.height;

        // 잘린 선의 좌표
        this.sliceLine = [];

        
        this.angle = 0;     // 회전 각도 누적
        this.prevAngle = 0; // 이전 각도

        this.ctx = this.canvas.getContext("2d");
        this.ctx.fillStyle = "#000";
        
        this.x = 0;
        this.y = 0;
        this.active = false;

        
        this.update();
    }

    // 회전 전 작업
    rotateInit(){
        let [width, height] = this.src.getSize();
        let wantSize = Math.sqrt( Math.pow(width, 2) + Math.pow(height, 2) );
        if(this.canvas.width < wantSize && this.canvas.height < wantSize){
            // 이미지의 가운데를 중점으로 최대 크기로 캔버스를 늘림
            let max_size = Math.sqrt( Math.pow(this.src.width, 2) + Math.pow(this.src.height, 2) );
            this.canvas.width = this.canvas.height = max_size;
            this.x = parseInt(this.x - (max_size - this.src.width) / 2);
            this.y = parseInt(this.y - (max_size - this.src.height) / 2);
            this.ctx.clearRect(0, 0, max_size, max_size);
        }
        

        // 캔버스의 중점
        this.angleX = this.angleY = this.canvas.width / 2;
        

        // 이미지를 담는 캔버스
        this.copy = document.createElement("canvas");
        this.copy.width = this.src.width;
        this.copy.height = this.src.height;
        let ctx = this.copy.getContext("2d");
        ctx.putImageData(this.src.imageData, 0, 0);
        
        let x = this.angleX - this.copy.width / 2;
        let y = this.angleY - this.copy.height / 2;
        this.ctx.putImageData(this.src.imageData, x, y);
    }

    // 회전
    rotate(angle){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // 이미지 데이터를 회전 후 재저장한다.
        this.ctx.translate(this.angleX, this.angleY);
        this.ctx.rotate(angle);
        this.ctx.translate(-this.angleX, -this.angleY);

        let x = this.angleX - this.copy.width / 2;
        let y = this.angleY - this.copy.height / 2;
        this.ctx.drawImage(this.copy, x, y);

        let source = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        this.src = this.getSource({imageData: source});
    }
    
    // 이미지 업데이트
    update(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 파츠의 이미지
        this.ctx.putImageData(this.src.imageData, 0, 0);

        // 파츠의 테두리
        if(this.active){
            this.ctx.putImageData(this.src.borderData, 0, 0);
        }

        //파츠의 잘린 선
        this.sliceLine.forEach(([x, y]) => {
            this.ctx.fillRect(x, y, 1, 1);
        });
    }

    // 소스 가져오기
    getSource({image = null, imageData = null}){
        // URL을 입력한 경우
        if(image != null){
            let canvas = document.createElement("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            let ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0, image.width, image.height);

            imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } 
        
        return new Source(imageData);
    }

    // 클릭 되었는지 확인
    isClicked(x, y){
        return this.src.getColor(x - this.x, y - this.y);
    }
}