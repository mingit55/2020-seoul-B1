class App {
    constructor(){
        this.init();
    }
    async init(){
        this.selectedTool;
        this.workspace = new Workspace(this);
        this.tools = {
            select: new Select(this),
            spin: new Spin(this),
            cut: new Cut(this),
            glue: new Glue(this),
        }
        this.papers = await this.getPapers();
        
        this.setEvents();
    }
    get currentTool(){
        return this.tools[this.selectedTool];
    }

    // 한지 목록 가져오기
    getPapers(){
        return fetch("/json/papers.json")
            .then(res => res.json())
            .then(list => list.map(item => {
                item.cnt = 1;

                item.width_size = parseInt(item.width_size.replace(/[^0-9]/, ""));
                item.height_size = parseInt(item.height_size.replace(/[^0-9]/, ""));

                return item;
            }));
    }

    // 콘텍스트 메뉴 만들기
    makeContextMenu({menus, X, Y}){
        $(".context-menu").remove();

        let $menuBox = $(`<div class="context-menu"></div>`);
        menus.forEach(({name, onclick}) => {
            let $menu = $(`<div class="menu-item">${name}</div>`)
            $menu.on("click", onclick);
            $menuBox.append($menu);
        });

        $menuBox.css({
            left: X + "px",
            top: Y + "px"
        });

        $(document.body).append($menuBox)
    }

    // 이벤트 설정
    setEvents(){
        /**
         * 도구 이벤트
         */

         // 각각의 도구들의 이벤트로 연결한다.
        $(this.workspace.canvas).on("mousedown", e => {
            if(!this.selectedTool || e.which !== 1) return;
            this.currentTool.onmousedown && this.currentTool.onmousedown(e);
        });
        $(this.workspace.canvas).on("dblclick", e => {
            if(!this.selectedTool || e.which !== 1) return;
            this.currentTool.ondblclick && this.currentTool.ondblclick(e);
        });
        $(window).on("mousemove", e => {
            if(!this.selectedTool || e.which !== 1) return;
            this.currentTool.onmousemove && this.currentTool.onmousemove(e);
        });
        $(window).on("mouseup", e => {
            if(!this.selectedTool || e.which !== 1) return;
            this.currentTool.onmouseup && this.currentTool.onmouseup(e);
        });
        $(window).on("contextmenu", e => {
            if(!this.selectedTool) return;
            this.currentTool.oncontextmenu && this.currentTool.oncontextmenu(e);
        });

        // 드래그 방지
        $(this.workspace.canvas).on("dragstart", e => e.preventDefault());

        // 콘텍스트 메뉴 사라지기
        $(window).on("click", e => {
            $(".context-menu").remove();
        });


        /**
         * 도구 선택
         */
        $("#tool-bar .tool").on("click", e => {
            let role = e.currentTarget.dataset.role;

            $("#tool-bar .tool.active").removeClass("active");
            if(this.currentTool) {
                this.currentTool.selected = null;
                
                // 만약 도구가 회전이였다면 초기화
                this.selectedTool === "spin" && this.currentTool.spinInit();
            }

            if(role === this.selectedTool){
                this.selectedTool = null; 
            } else {
                this.selectedTool = role;
                $(e.currentTarget).addClass("active");
                this.currentTool.init();
            }
        });


        /**
         * 추가하기 버튼
         */
        // 모달이 나타날 때
        $("#paper-modal").on("show.bs.modal", () => {
            this.papers.forEach(paper => {
                $("#paper-list").append(`<div class="list-group-item d-flex" data-id="${paper.id}">
                    <img src="/images/papers/${paper.image}" alt="한지 이미지" width="80" height="80">
                    <div class="ml-3">
                        <div>
                            <b>${paper.paper_name}</b>
                        </div>
                        <div>
                            <span class="text-muted mr-2">사이즈</span>
                            <span class="text-muted">${paper.width_size} × ${paper.height_size}</span>
                        </div>
                        <div>
                            <span class="text-muted mr-2">보유 수</span>
                            <span class="text-muted">${paper.cnt}개</span>
                        </div>
                    </div>
                </div>`);
            });
        });
        // 모달 안의 한지를 클릭할 때
        $("#paper-list").on("click", ".list-group-item", e => {
            $("#paper-modal").modal("hide");

            let idx = this.papers.findIndex(p => p.id == e.currentTarget.dataset.id);
            if(idx >= 0){
                let paper = this.papers[idx];
            
                let image = new Image();
                image.width = paper.width_size;
                image.height = paper.height_size;
                image.src = e.currentTarget.querySelector("img").src;
                image.onload = () => {
                    let part = new Part({image});
                    this.workspace.pushPart(part);
                }

                if(--paper.cnt <= 0){
                    this.papers.splice(idx, 1);
                    e.currentTarget.remove();
                }
            }
        });

        /**
         * 삭제하기 버튼
         */
        $("[data-role='remove-paper'].tool-btn").on("click", e => {
            this.tools.select.removeSelected();
        });
    }
}

window.onload = function(){
    this.app = new App();
};