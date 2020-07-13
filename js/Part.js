class Part {
    constructor(source){
        this.src = this.getSource(source);

        // 이미지 데이터를 표시하는 캔버스
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.src.width;
        this.canvas.height = this.src.height;

        // 잘린 선을 표시하는 캔버스
        this.sliceCanvas = document.createElement("canvas");
        this.sliceCanvas.width = this.src.width;
        this.sliceCanvas.height = this.src.height;
        this.sctx = this.sliceCanvas.getContext("2d");

        this.ctx = this.canvas.getContext("2d");
        this.ctx.fillStyle = "#000";
        this.angle = 0;
        
        this.x = 0;
        this.y = 0;
        this.active = false;
        this.angle = 0;

        
        this.update();
        document.body.append(this.sliceCanvas);
    }

    // 회전 전 작업
    beforeRotate(){
        // 이미지 데이터 저장
        this.prevSrc = this.src;
        this.prevImage = document.createElement("canvas"); // putImageData는 각도가 반영되지 않으므로, 캔버스로 바꿈
        this.prevImage.width = this.canvas.width;
        this.prevImage.height = this.canvas.height;
        let ctx = this.prevImage.getContext("2d");
        ctx.putImageData(this.src.imageData, 0, 0);

        // 잘린 선 데이터 저장
        this.prevSlice = document.createElement("canvas");
        this.prevSlice.width = this.sliceCanvas.width;
        this.prevSlice.height = this.sliceCanvas.height;
        let sctx = this.prevSlice.getContext("2d");
        sctx.drawImage(this.sliceCanvas, 0, 0);
        
        let [,, width, height] = this.src.getSize();
        let wantSize = Math.sqrt( Math.pow(width, 2) + Math.pow(height, 2) );
        if(this.canvas.width < wantSize && this.canvas.height < wantSize){
            // 이미지의 가운데를 중점으로 최대 크기로 캔버스를 늘림
            this.canvas.width = this.canvas.height = wantSize;
            this.sliceCanvas.width = this.sliceCanvas.height = wantSize;
            let moveX = (wantSize - width) / 2;
            let moveY = (wantSize - height) / 2;
            this.x = parseInt(this.x - moveX);
            this.y = parseInt(this.y - moveY);
            this.ctx.clearRect(0, 0, wantSize, wantSize);
        }
        
        // 캔버스의 중점
        this.angleX = this.angleY = this.canvas.width / 2;
    }

    // 회전
    rotate(angle){
        this.angle += angle;

        let copy = document.createElement("canvas");
        copy.width = this.canvas.width;
        copy.height = this.canvas.height;
        
        let ctx = copy.getContext("2d");

        ctx.translate(this.angleX, this.angleY);
        ctx.rotate(this.angle);
        ctx.translate(-this.angleX, -this.angleY);
        
        let x = this.angleX - this.prevSrc.width / 2;
        let y = this.angleY - this.prevSrc.height / 2;
        // 이미지 데이터를 회전 후 재저장한다.
        ctx.drawImage(this.prevImage, x, y);

        let source = ctx.getImageData(0, 0, copy.width, copy.height);
        this.src = this.getSource({imageData: source});

        // 잘린 선을 회전 후 재저장한다.
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.drawImage(this.prevSlice, x, y);

        this.sctx.clearRect(0, 0, this.sliceCanvas.width, this.sliceCanvas.height);
        this.sctx.drawImage(copy, 0, 0);
    }

    // 회전 초기화 
    rotateReset(){
        this.src = this.prevSrc;
        let moveX = (this.canvas.width - this.src.width) / 2;
        let moveY = (this.canvas.height - this.src.height) / 2;
        this.x = parseInt(this.x + moveX);
        this.y = parseInt(this.y + moveY);
        this.canvas.width = this.src.width;
        this.canvas.height = this.src.height;
        this.sliceCanvas = this.prevSlice;
        this.sctx = this.prevSlice.getContext("2d");
        this.angle = 0;

        this.recalculate();
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
        this.ctx.drawImage(this.sliceCanvas, 0, 0);
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

        // 잘린 선 데이터 수정
        let sliceData = this.sctx.getImageData(0, 0, this.sliceCanvas.width, this.sliceCanvas.height);
        
        this.sliceCanvas.width = w;
        this.sliceCanvas.height = h;
        
        this.sctx.clearRect(0, 0, w, h);
        this.sctx.putImageData(sliceData, -x, -y);
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

    // 해당 파츠에서 실제로 잘린 선만 sliceCanvas에 남기기
    updateSliceData(){
        let sliceData = this.sctx.getImageData(0, 0, this.src.width, this.src.height).data;
        this.sctx.clearRect(0, 0, this.sliceCanvas.width, this.sliceCanvas.height);

        let tempColor = [];
        Array.from(sliceData)
            .forEach((color, i) => {
                tempColor.push(color);
                if(tempColor.length === 4){
                    let x = Math.floor(i / 4) % this.src.width;
                    let y = Math.floor((i / 4) / this.src.width);
                    if(tempColor[3] !== 0 && this.src.isBorderPixel(x, y)){
                        this.sctx.fillRect(x, y, 1, 1);
                    }
                    tempColor = [];
                }
            });
    }
}