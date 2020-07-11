class Store {
    constructor() {
        // 인덱스드 디비
        this.idb = new IDB("jeonju", ["papers", "buyList"], () => this.init());

        // 해시 모듈
        this.searchHashModule;
        this.addHashModule;

        // 폼 인풋
        this.addImage = document.querySelector("#paper_image");
        this.addName = document.querySelector("#paper_name");
        this.addCompany = document.querySelector("#company_name");
        this.addWidth = document.querySelector("#width_size");
        this.addHeight = document.querySelector("#height_size");
        this.addPoint = document.querySelector("#point");

        // 한지 데이터
        this.papers = [];
        this.counts = [];
    }

    // 데이터 불러오기
    loadPapers(){
        this.idb.getList("papers") // 디비 데이터 가져오기
            .then((data) => {
                if(data.length == 0){ // 디비에 데이터가 없으면 데이터 삽입
                    fetch("/json/papers.json")
                        .then(res => res.json())
                        .then(res => {
                            this.papers = res.map(item => {
                                item.buy = 0;
                                item.width_size=parseInt(item.width_size);
                                item.height_size=parseInt(item.height_size);
                                item.point=parseInt(item.point);
                                item.image = "/images/papers/" + item.image; 
                                return item;
                            });
            
                            this.papers.forEach(paper => {
                                this.idb.add("papers", paper);
                            });
                            this.counts = new Array(this.papers.length).fill(0);
                            console.log(this.counts);
                            this.setHahModule();
                        })
                }else{
                    this.papers = data; // 데이터 불러오기
                    this.counts = new Array(this.papers.length).fill(0);
                }
                return data;
            })
            .then(() => {
                this.setHahModule();    
            });
    }

    // 해시 모듈 설정
    setHahModule(){
        this.searchHashModule = new HashModule("#search-hash", this.getAllHashs());
        this.searchHashModule.init();

        this.addHashModule = new HashModule("#add-hash", this.getAllHashs());
        this.addHashModule.init();
        this.rendering();
    }

    init() {
        this.loadPapers();
        
        // 검색 이벤트 설정
        document.querySelector("#search-btn").addEventListener("click", e => {
            this.rendering();
        });

        // 너비 높이 입력 제한 이벤트
        this.addWidth.addEventListener("input", e =>{
            e.preventDefault();
            e.target.value = e.target.value.replace(/[^0-9]+/g, "");
        });
        this.addHeight.addEventListener("input", e =>{
            e.preventDefault();
            e.target.value = e.target.value.replace(/[^0-9]+/g, "");
        });
        this.addWidth.addEventListener("change", e =>{
            if(e.target.value < 100)e.target.value = 100;
            if(e.target.value > 1000)e.target.value = 1000;
        });
        this.addHeight.addEventListener("change", e =>{
            if(e.target.value < 100)e.target.value = 100;
            if(e.target.value > 1000)e.target.value = 1000;
        });
        
        // 포안트 입력 제한 이벤트
        this.addPoint.addEventListener("input", e =>{
            e.preventDefault();
            e.target.value = e.target.value.replace(/[^0-9]+/g, "");
        });
        this.addPoint.addEventListener("change", e =>{
            if(e.target.value < 10)e.target.value = 10;
            if(e.target.value > 1000)e.target.value = 1000;
            e.target.value = parseInt(e.target.value / 10) * 10;
        });

        // 이미지 입력제한 이벤트
        this.addImage.addEventListener("change", e => {
            let image = e.target.files[0];
            if(image.type.substring(0, 5) == "image"){
                if(image.type == "image/jpeg" ||
                    image.type == "image/png" || 
                    image.type == "image/gif"){
                    if(image.size / 1024 / 1024 > 5){
                        alert("파일 크기는 5MB를 넘을 수 없습니다.");
                        e.preventDefault();
                        e.target.value = "";
                    }
                }else{
                    alert("jpg, png, gif 만 가능");
                    e.preventDefault();
                    e.target.value = "";
                    return false;    
                }
            }else{
                alert("이미지 파일이 아닙니다.");
                e.preventDefault();
                e.target.value = "";
                return false;
            }
        });

        // 추가하기 이벤트
        document.querySelector("#add-modal form").addEventListener("submit", e=> {
            e.preventDefault();
            if(this.addHashModule.hashs.length == 0){
                return false;
            }
            this.getImageURL(this.addImage.files[0])
                .then(url =>{
                    let paper = {
                        id: this.papers.length + 1,
                        image : url,
                        paper_name : this.addName.value,
                        company_name : this.addCompany.value,
                        width_size: parseInt(this.addWidth.value),
                        height_size : parseInt(this.addHeight.value),
                        point: parseInt(this.addPoint.value),
                        hash_tags : this.addHashModule.hashs.map(hash => hash.data),
                        buy: 0
                    };
                    this.clearModal();
                    console.log("add paper item");

                    this.papers.push(paper);
                    this.idb.add("papers", paper);
                    this.counts.push(0);
                    alert("추가되었습니다.");
                    this.searchHashModule.updateAutoHash(this.getAllHashs());
                    this.addHashModule.updateAutoHash(this.getAllHashs());
                    this.rendering();
                });
        });

        // 구매하기 이벤트
        document.querySelector("#buy_btn").addEventListener("click", (e) => { 
            

            this.idb.getList("buyList")
            .then((list) => {
                let cnt = 0;
                for(let i = 0; i < this.papers.length; i++){
                    if(this.counts[i] > 0){
                        cnt += this.counts[i];
                        let filteredBuyList = list.filter((item) => item.id = this.papers[i].id);
                        if(filteredBuyList.length == 0){
                            this.idb.add("buyList", {id: this.papers[i].id, buy: this.counts[i]});
                        }else{
                            this.idb.update("buyList", {id: this.papers[i].id, buy: filteredBuyList[0].buy + this.counts[i]});
                        }
                        
                        this.counts[i] = 0;
                    }
                }
                alert(`총 ${cnt}개의 한지가 구매되었습니다.`);
                this.rendering();
            })

            
        });
    }

    // 모달 입력창 초기화
    clearModal(){
        this.addImage.value = "";
        this.addName.value = "";
        this.addCompany.value = "";
        this.addWidth.value = 100;
        this.addHeight.value = 100;
        this.addPoint.value = 10;
        this.addHashModule.resetHash();
        $("#add-modal").modal("hide");
    }
    // 리스트 렌더
    renderPaperList(){
        let div = document.createElement("div");

        // 검색 필터 적용
        let filteredPaper = this.papers;

        if(this.searchHashModule.hashs.length > 0)
        filteredPaper = this.papers.filter(paper => {
            let flag = false;

            this.searchHashModule.hashs.forEach(hash => {
                if(paper.hash_tags.includes(hash.data)){
                    flag = true;
                }
            });

            return flag;
        })
        
        // 리스트 비우기
        document.querySelector("#paper_list").innerHTML = "";
        filteredPaper.forEach((paper, idx) => {
            let tags = [];
            paper.hash_tags.forEach(tag => {
                tags.push(`<span class="badge">${tag}</span>`);
            });
            div.innerHTML = `<div class="col-lg-3 col-md-6 mb-4 paper-item" data-id="${paper.id}">
                <div class="card">
                    <img class="card-img-top" src="${paper.image}" alt="한지 이미지">
                    <div class="card-body">
                        <div>
                            <b class="card-title">${paper.paper_name}</b>
                            <span class="badge badge-primary">${paper.point}p</span>
                        </div>
                        <div class="card-text mt-2">
                            <span class="text-muted">${paper.company_name}</span>
                            <span class="text-muted">${paper.width_size}px × ${paper.height_size}px</span>
                        </div>
                        <div class="card-text mt-2">
                            ${tags.join("")}
                        </div>
                        <button class="btn btn-primary mt-3">구매하기</button>
                    </div>
                </div>
            </div>`;

            // 카트에 추가하기 이벤트
            let paperItem = div.firstChild;
            paperItem.querySelector("button").addEventListener("click", () => {
                this.counts[idx]++;
                this.rendering();
            })
            document.querySelector("#paper_list").append(paperItem);
        });
    }

    // 갯수 업데이트
    updatePaperList(){
        console.log(this.counts);
        this.papers.forEach((paper, idx) => {
            let node = document.querySelector(`.paper-item[data-id='${paper.id}']`);
            if(node !== null){
                let text = "구매하기";
                if(this.counts[idx] > 0){
                    text = `추가하기(${this.counts[idx]}개)`;
                }
                node.querySelector("button").innerText = text;
            }
            
        });
    }

    renderBuyList(){
        // 리스트 비우기
        document.querySelector("#buy_list").innerHTML = "";
        for(let i = 0; i < this.papers.length; i++){
            if(this.counts[i] === 0)continue;
            let table = document.createElement("table");
            table.innerHTML = `<tr>
                <td>
                    <img src="${this.papers[i].image}" alt="한지 이미지" width="60" height="60">
                </td>
                <td>${this.papers[i].paper_name}</td>
                <td>${this.papers[i].company_name}</td>
                <td>${this.papers[i].point}p</td>
                <td><input type="number" class="buy-cnt" class="form-control" value='${this.counts[i]}'>개</td>
                <td>${parseInt(this.papers[i].point) * this.counts[i]}p</td>
                <th>
                    <button class="btn btn-danger">삭제하기</button>
                </th>
            </tr>`;

            // 삭제 이벤트
            let buyItem = table.querySelector("tr");
            buyItem.querySelector("button").addEventListener("click", () => {
                this.counts[i] = 0;
                this.rendering();
            });

            buyItem.querySelector("input").addEventListener("input", e =>{
                e.preventDefault();
                e.target.value = e.target.value.replace(/[^0-9]+/g, "");
            });
            buyItem.querySelector("input").addEventListener("change", e =>{
                if(e.target.value < 1)e.target.value = 1;
                if(e.target.value > 1000)e.target.value = 1000;
                this.counts[i] = parseInt(e.target.value);
                this.rendering();
            });

            document.querySelector("#buy_list").append(buyItem);
        }
        
        let totalPoint = this.papers.map((paper, idx) => this.counts[idx] * parseInt(paper.point)).reduce((sum, val) => sum + val, 0);
        document.querySelector("#total_point").innerText = totalPoint + "p";
    }

    rendering(){
        this.renderPaperList();
        this.renderBuyList();
        this.updatePaperList();
    }

    // 사용자 입력 이미지 데이터화
    getImageURL(file){
        return new Promise(resolve => {
            let getImage = new Promise(res => {
                let reader = new FileReader();
                reader.onload = () => res(reader.result);
                reader.readAsDataURL(file);
            });
    
            getImage.then(url => {
                let image = new Image();
                image.src = url;
                image.onload = () => {
                    let cropSize = 64; 
                    let canvas = document.createElement("canvas")
                        , ctx = canvas.getContext("2d")
                        , cx, cy, cw, ch; // crop x, y, w, h
                    canvas.width = cropSize;
                    canvas.height = cropSize;
    
                    if(image.width > image.height){
                        cw = ch = image.height; 
                        cx = (image.width - image.height) / 2;
                        cy = 0;
                    } else {
                        cw = ch = image.width;
                        cx = 0;
                        cy = (image.height - image.width) / 2;
                    }
                    ctx.drawImage(image, cx, cy, cw, ch, 0, 0, cropSize, cropSize);
                    resolve(canvas.toDataURL("image/jpg"));
                };
            });
        });
    }

    // 모든 해시 데이터 추출
    getAllHashs() {
        let hash = [];
        this.papers.forEach(item => {
            item.hash_tags.forEach(tag => {
                if (!hash.includes(tag)) {
                    hash.push(tag);
                }
            });
        });
        return hash;
    }
}

window.onload = () => {
    let app = new Store();
};
