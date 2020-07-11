class Glue extends Tools {
    constructor(){
        super(...arguments);
        this.glueParts = [];
    }
    onmousedown(e){
        if(!this.selected){
            this.activateClicked(e);
        } 
        else {
            let [x, y] = this.getXY(e);
            let clicked = this.parts.find(part => part.isClicked(x, y));

            if(this.selected !== clicked && clicked.isNear(this.selected)){
                clicked.active = true;
                this.glueParts.push(clicked);
            }
        }

        this.workspace.render();
    }
    onmousemove(e){}
    onmouseup(e){}

    glueInit(){
        this.glueParts = [];
        
    }
}