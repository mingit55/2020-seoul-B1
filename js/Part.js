class Part {
    constructor(source){
        this.src = this.getSource(source);
        this.canvas = document.createElement("canvas");
        this.canvas.width = this.src.width;
        this.canvas.height = this.src.height;

        this.ctx = this.canvas.getContext("2d");

        this.x = 0;
        this.y = 0;
        this.active = false;
        
        this.update();
    }
    
    update(){
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.ctx.putImageData(this.src.imageData, 0, 0);

        if(this.active){
            this.ctx.putImageData(this.src.borderData, 0, 0);
        }
    }

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

    isClicked(x, y){
        return this.src.getColor(x - this.x, y - this.y);
    }
}