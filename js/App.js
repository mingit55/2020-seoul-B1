class App {
    constructor(){
        this.idb = new IDB("jeonju", ["papers", "buyList"], () => this.init());
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

        this.entryHashModule = null;
        await fetch("/json/craftworks.json")
            .then((res) => res.json())
            .then((data) =>{
                let entries = data;
                let hash_tags = [];
                entries.forEach(item => {
                    item.hash_tags.forEach(tag => {
                        if (!hash_tags.includes(tag)) {
                            hash_tags.push(tag);
                        }
                    });
                });
                this.entryHashModule = new HashModule("#entry_hash_tags", hash_tags);
                this.entryHashModule.init();
            })

        this.papers = [];
        this.buyList = [];
        
        await this.getDatas();

        this.adviceNodes = document.querySelectorAll("#myTabContent .tab-pane");
        this.advices = [];
        for(let i = 0; i < this.adviceNodes.length; i++){
            this.advices.push(this.adviceNodes[i].innerText.trim());
        }
        this.keyword;
        this.splittedAdvices;
        this.tabs = document.querySelectorAll("#search_nav a");
        this.nowTab = 0;
        this.keywordCount = 0;
        this.keywordIndex = 0;

        this.searchStatusNode = document.querySelector("#search_status");

        this.setEvents();
    }
    get currentTool(){
        return this.tools[this.selectedTool];
    }

    // 한지 목록 가져오기
    getDatas(){
        return new Promise(res => {
            this.idb.getList("papers")
                .then(list => {
                    this.papers = list;
                    this.idb.getList("buyList")
                        .then(list =>{
                            this.buyList = list;
                            res(true);
                        });
                });
        })
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
                // 만약 도구가 회전이였다면 초기화
                this.selectedTool === "spin" && this.currentTool.spinInit();
                this.selectedTool === "glue" && this.currentTool.glueInit();
                
                this.currentTool.selected = null;
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
            $("#paper-list").empty();
            this.buyList.forEach((buy) => {
                let paper = this.papers.filter(p => p.id == buy.id)[0];
                $("#paper-list").append(`<div class="list-group-item d-flex" data-id="${paper.id}">
                    <img src="${paper.image}" alt="한지 이미지" width="80" height="80">
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
                            <span class="text-muted">${buy.buy}개</span>
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

                let buyListIndex = this.buyList.findIndex(b => b.id == paper.id);
                let buyItem = this.buyList[buyListIndex];
                if(--this.buyList[buyListIndex].buy <= 0){
                    this.buyList.splice(buyListIndex, 1);
                    this.idb.delete("buyList", buyItem.id);
                    e.currentTarget.remove();
                }else{
                    this.idb.update("buyList", this.buyList[buyListIndex]);
                }
            }
        });

        /**
         * 삭제하기 버튼
         */
        $("[data-role='remove-paper'].tool-btn").on("click", e => {
            this.tools.select.removeSelected();
        });


        /**
         * 도움말 영역 탭
         */
        
        for(let i = 0; i < this.tabs.length; i++){
            let temp = i;
            this.tabs[i].addEventListener("click", () => {
                this.nowTab = temp;
            })
        }
        $("#search_form").on("keydown", e => {
            if(e.keyCode === 13){
                e.preventDefault();
                $("#search_btn").click();
            }
        });
        /**
         * 검색하기 버튼
         */
        $("#search_btn").on("click", e => {
            this.keyword = document.querySelector("#search_form").value;
            if(this.keyword.length == 0)return false;
            this.splittedAdvices = this.advices.map(advice => advice.split(this.keyword));
            this.keywordCount = this.splittedAdvices.map(sa => sa.length).reduce((sum, val) => sum + val, 0) - 4;
            if(this.keywordCount === 0){ // 검색된 키워드가 없으면
                this.searchStatusNode.innerText = "일치하는 내용이 없습니다.";
            }else{ // 검색된 키워드가 있으면
                for(let i = this.nowTab; i < this.nowTab + 4; i++){
                    if(this.splittedAdvices[i % 4].length > 1){ // 최초 키워드 탐색
                        this.nowTab = i % 4;
                        this.keywordIndex = this.splittedAdvices.filter((_, idx) => idx < i % 4)
                                                                .map((item) => item.length - 1)
                                                                .reduce((sum, val) => sum + val, 0);
                        break;
                    }
                }
                this.highlightingKeyword();
            }
        });
        /**
         * 검색 이전 버튼
         */
        $("#search_prev").on("click", e => {
            if(this.keywordCount === 0){ // 검색된 키워드가 없으면
                return false;
            }
            this.keywordIndex = (this.keywordCount + this.keywordIndex - 1) % this.keywordCount;
            this.highlightingKeyword();
        });
        /**
         * 검색 다음 버튼
         */
        $("#search_next").on("click", e => {
            if(this.keywordCount === 0){ // 검색된 키워드가 없으면
                return false;
            }
            this.keywordIndex = (this.keywordIndex + 1) % this.keywordCount;
            this.highlightingKeyword();
        });

    }

    highlightingKeyword(){
        this.searchStatusNode.innerText = `${this.keywordCount}개 중의 ${this.keywordIndex + 1}번째`;
        let cnt = 0;
        for(let i = 0; i < 4; i++){
            cnt += this.splittedAdvices[i].length - 1;
            if(this.keywordIndex < cnt){
                this.nowTab = i;
                this.tabs[i].click();
                break;
            }
        }
        for(let i = 0; i < this.adviceNodes.length; i++){
            let keyword = this.keyword;
            if(keyword == " ")keyword = "&nbsp;";
            this.adviceNodes[i].innerHTML = this.splittedAdvices[i].join(`<span class="highlight">${keyword}</span>`)
            document.querySelectorAll("span.highlight")[this.keywordIndex].style.backgroundColor = "rgba(255, 255, 0, 0.5)";
        }
    }
}

window.onload = function(){
    this.app = new App();
};