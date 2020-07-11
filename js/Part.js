class Part {
    constructor(source){
        this.src = this.getSource(source);

        this.canvas = document.createElement("canvas");
        this.canvas.width = this.src.width;
        this.canvas.height = this.src.height;

        // 잘린 선
        this.sliceLine = [];
        this.prevLine = [];

        this.ctx = this.canvas.getContext("2d");
        this.ctx.fillStyle = "#000";
        
        this.x = 0;
        this.y = 0;
        this.active = false;

        
        this.update();
    }

    // 회전 전 작업
    beforeRotate(){
        this.prevSrc = this.src;
        
        let [,, width, height] = this.src.getSize();
        let wantSize = Math.sqrt( Math.pow(width, 2) + Math.pow(height, 2) );
        if(this.canvas.width < wantSize && this.canvas.height < wantSize){
            // 이미지의 가운데를 중점으로 최대 크기로 캔버스를 늘림
            let max_size = Math.sqrt( Math.pow(width, 2) + Math.pow(height, 2) );
            this.canvas.width = this.canvas.height = max_size;
            let moveX = (max_size - width) / 2;
            let moveY = (max_size - height) / 2;
            this.x = parseInt(this.x - moveX);
            this.y = parseInt(this.y - moveY);
            this.sliceLine = this.sliceLine.map(([x, y]) => ([x + moveX, y + moveY]))
            this.prevLine = JSON.parse(JSON.stringify(this.sliceLine));
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
        
        // 담은 이미지를 가운데로 맞춰서 뿌림
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

        this.sliceLine = this.prevLine.map(([x, y]) => {
            let r = Math.sqrt(Math.pow(x - this.angleX, 2), + Math.pow(this.angleY - y, 2));
            let nowAngle = Math.asin((this.angleY - y) / r);
            let moveAngle = nowAngle + angle;
            return [ this.angleX + Math.cos(moveAngle) * r, this.angleY - Math.sin(moveAngle) * r];
        });
    }

    // 회전 초기화 
    rotateReset(){
        this.src = this.prevSrc;
        let moveX = (this.canvas.width - this.src.width) / 2;
        let moveY = (this.canvas.height - this.src.height) / 2;
        this.x = parseInt(this.x + moveX);
        this.y = parseInt(this.y + moveY);
        this.sliceLine = this.prevLine.map(([x, y]) => ([x - moveX, y - moveY]));
        this.canvas.width = this.src.width;
        this.canvas.height = this.src.height;
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

    // 실제 사이즈로 맞춰서 imageData 재생성
    recalculate(){
        let [x, y, w, h] = this.src.getSize();
        this.canvas.width = w;
        this.canvas.height = h;
        let arr = [];
        arr.length = w * h * 4;
        arr.fill(0);
        let uint8 = Uint8ClampedArray.from(arr);
        for(let i = x; i < x + w; i++){
            for(let j = y; j < y + h; j++){
                let color = this.src.getColor(i, j);
                if(!color) continue;
                let {r, g, b, a} = color;
                let idx = (i-x) * 4 + (j-y) * 4 * w;
                uint8[idx] = r;
                uint8[idx+1] = g;
                uint8[idx+2] = b;
                uint8[idx+3] = a;
            }
        }
        this.src.imageData = new ImageData(uint8, w, h);
        this.src.borderData = this.src.getBorderData();

        this.x += x;
        this.y += y;
        this.sliceLine = this.sliceLine.map(([px, py]) => ([px - x, py - y]));
    }

    // 이 파츠가 해당 파츠 주변에 근접해 있는지 검사
    isNear(part){
        let px, py; // 실제 픽셀 좌표
        let tx, ty; // this 파츠의 이미지 좌표
        let ax, ay; // argument 파츠의 이미지 좌표

        for(px = this.x; px <= this.x + this.src.width; px++){
            for(py = this.y; py <= this.y + this.src.height; py++){
                tx = px - this.x;
                ty = py - this.y;

                ax = px - part.x;
                ay = py - part.y;
            
                if(this.src.getColor(tx, ty) && part.src.getColor(ax, ay)) return true;
            }
        }
        return false;
    }
}