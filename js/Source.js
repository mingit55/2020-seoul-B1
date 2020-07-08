class Source {
    constructor(imageData){
        this.imageData = imageData;
        this.borderColor = [255, 64, 64];
        this.borderData = this.getborderData();
    }
    get width(){
        return this.imageData.width;
    }
    get height(){
        return this.imageData.height;
    }

    // 테두리 ImageData 가져오기
    getborderData(){
        let uint8 = Uint8ClampedArray.from(this.imageData.data);
        
        let setColor = (x, y) => this.setColor(x, y, this.borderColor, uint8);

        // 색상이 이미 있으면서 외곽에 위치한 픽셀의 색상을 바꾼다.
        for(let x = 0; x < this.width; x++){
            for(let y = 0; y < this.height; y++){
                if(this.getColor(x, y) && this.isOuterPixel(x, y)) {
                    setColor(x, y);
                }
            }
        }

        return new ImageData(uint8, this.width, this.height);
    }

    // 해당 데이터 내의 픽셀 색상을 가져온다.
    getColor(x, y, data = this.imageData.data){
        const {width, height} = this;
        let r, g, b, a;
        if(x >= 0 && y >= 0 && x < width && y < height) {
            r = data[x * 4 + y * width * 4];
            g = data[x * 4 + y * width * 4 + 1];
            b = data[x * 4 + y * width * 4 + 2];
            a = data[x * 4 + y * width * 4 + 3];

            return !a ? false : {r, g, b, a};
        } else {
            return false;
        }
    }

    // 해당 데이터 내의 픽셀 색상을 변경한다.
    setColor(x, y, [r, g, b, a = 255], data = this.imageData.data){
        data[x * 4 + y * this.width * 4] = r;
        data[x * 4 + y * this.width * 4 + 1] = g;
        data[x * 4 + y * this.width * 4 + 2] = b;
        data[x * 4 + y * this.width * 4 + 3] = a;
    }

    // 해당 좌표가 외곽에 위치하는지 검사한다.
    isOuterPixel(x, y, data = this.imageData.data){
        let getColor = (x, y) => this.getColor(x, y, data);
        let leftColor = getColor(x - 1, y);
        let rightColor = getColor(x + 1, y);
        let topColor = getColor(x, y - 1);
        let bottomColor = getColor(x, y + 1);
        
        return !leftColor || !rightColor || !topColor || !bottomColor;
    }
}