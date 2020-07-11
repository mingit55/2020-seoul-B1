const STATUS = {
    DEFAULT: "default",
    FULL: "full",
    OVER: "over",
};

class HashModule {
    constructor(root, autoHash) {
        this.root = document.querySelector(root); // 해시 모듈 들어갈 자리
        this.rootSelector = root;
        this.input; // 입력창
        this.hashList; // 입력한 해시 리스트
        this.statusTab; // 상태표시 창
        this.autoTab; // 자동완성 표시 창
        this.hiddenInput;

        this.status; // 현재 상태 STATUS
        this.hashs = []; // 입력한 해시 데이터
        this.hashIndex = 0; // 입력한 해시 인덱스 - 한개 저장시 자동으로 1 증가
        this.prevInput = ""; // 지난 입력 결과

        this.autoHash = autoHash; // 자동 완성 데이터
        this.filteredAuto = []; // 필터된 자동 완성 데이터
        this.autoActive = false; // 연관 해시 선택 여부
        this.selectedAuto = -1;
    }
    init() {
        this.root.innerHTML = "<span class='hash-mark'>#</span>"; // 입력 해시태그 디자인

        // 해시태그 입력창 추가
        this.input = document.createElement("input");
        this.root.append(this.input);

        // 해시태그 리스트 추가
        this.hashList = document.createElement("div");
        this.hashList.classList.add("hash-list");
        this.root.append(this.hashList);

        // 해시태그 상태 추가
        this.statusTab = document.createElement("div");
        this.statusTab.classList.add("hash-status");
        this.root.append(this.statusTab);

        // 해시 재동완성 창 추가
        this.autoTab = document.createElement("div");
        this.autoTab.classList.add("hash-auto");
        this.root.append(this.autoTab);

        // 해시 숨겨진 인풋
        this.hiddenInput = document.createElement("input");
        this.hiddenInput.name = "hash_tags";
        this.hiddenInput.style.display = "none";
        this.root.append(this.hiddenInput);

        // 키 이벤트 설정
        this.input.addEventListener("keydown", e => {
            let text = e.target.value;

            // 해시 태그 추가 - 입력되어 있으며 입력 키를 입력했을 때
            if (
                text != "" &&
                (e.keyCode == 32 ||
                    (e.keyCode == 13 && !this.autoActive) ||
                    e.keyCode == 9)
            ) {
                // 해시 입력키
                e.preventDefault();

                // 10개 이상 상태 변경
                if (this.hashs.length >= 10) {
                    this.setStatus(STATUS.FULL);
                    return false;
                }

                // 중복 태그 상태 변경
                if (
                    this.hashs.filter(item => item.data === "#" + text).length >
                    0
                ) {
                    this.setStatus(STATUS.OVER);
                    return false;
                }

                // 글자수 제한
                if (text.length < 2 || text.length > 30) {
                    return false;
                }

                // 해시 전송용 데이터 설정
                this.hiddenInput.value = JSON.stringify(this.hashs);

                // 추가시 초기화 - 자동완성, 인덱스, 인풋 밸류
                this.setAutos("-");
                let index = this.hashIndex;
                e.target.value = "";

                // 해시 DOM추가
                let hash = document.createElement("div");
                hash.innerText = `#${text}`;
                hash.classList.add("hash");

                let span = document.createElement("span");
                span.innerHTML = "&times;";
                span.classList.add("hash-del");
                hash.append(span);

                this.hashList.append(hash);

                this.hashs.push({ id: index, data: "#" + text });
                this.hashIndex = this.hashIndex + 1;

                // 해시 삭제 이벤트 추가
                span.addEventListener("click", () => {
                    // DOM 요소 삭제
                    this.hashList.removeChild(hash);
                    // 해시 목록에서 제거
                    this.hashs = this.hashs.filter(item => item.id != index);
                    // 최대 상태 제거
                    this.setStatus(STATUS.DEFAULT);
                    // 해시 전송용 데이터 설정
                    this.hiddenInput.value = JSON.stringify(this.hashs);

                    // 삭제 해도 입력한 값과 중복된 태그가 남아있으면 중복 상태 변경
                    if (
                        this.hashs.filter(
                            item => item.data === "#" + this.input.value
                        ).length > 0
                    ) {
                        this.setStatus(STATUS.OVER);
                    }
                });
            }

            // 위아래 이동
            if (
                (e.keyCode == 38 || e.keyCode == 40) &&
                this.filteredAuto.length !== 0
            ) {
                e.preventDefault();
                // 38 - 위 / 40 - 아래
                if (!this.autoActive) {
                    // 처음 선택
                    if (e.keyCode === 38) {
                        // 위
                        this.selectedAuto = this.filteredAuto.length - 1;
                    }
                    if (e.keyCode === 40) {
                        // 아래
                        this.selectedAuto = 0;
                    }
                } else {
                    // 최초 이후 선택
                    if (e.keyCode === 38) {
                        // 위
                        this.selectedAuto =
                            this.selectedAuto - 1 < 0
                                ? this.filteredAuto.length - 1
                                : this.selectedAuto - 1;
                    }
                    if (e.keyCode === 40) {
                        // 아래
                        this.selectedAuto =
                            this.selectedAuto + 1 >= this.filteredAuto.length
                                ? 0
                                : this.selectedAuto + 1;
                    }
                }
                this.autoActive = true;
                document
                    .querySelectorAll(this.rootSelector + " .auto-item")
                    .forEach(dom => dom.classList.remove("active"));
                document
                    .querySelector(
                        `${this.rootSelector} .auto-item:nth-child(${this.selectedAuto + 1})`
                    )
                    .classList.add("active");
            }

            // 연관 해시 선택
            if (e.keyCode == 13 && this.autoActive) {
                e.preventDefault();
                this.selectAuto(this.selectedAuto);
            }
        });

        this.input.addEventListener("input", e => {
            //유효성 검사 입력 방지
            e.target.value = e.target.value.replace(
                /[^A-Za-z0-9ㄱ-ㅎㅏ-ㅣ가-힣_]+/g,
                ""
            );
            //자동완성
            this.setAutos(e.target.value);

            // 이전 인풋 값을 비교해서 바뀌었는지 확인하고 상태 결정
            if (this.status == STATUS.OVER) {
                if (e.target.value != this.prevInput)
                    // 바뀌었으면 평범
                    this.setStatus(STATUS.DEFAULT);
                else {
                    this.setStatus(STATUS.OVER);
                }
            }

            this.prevInput = e.target.value;
        });
    }

    setStatus(status) {
        this.status = status; // 현재 상태 저장

        // 상태에 따라 상태 메시지 설정
        this.statusTab.innerText = "";
        if (this.status == STATUS.FULL) {
            this.statusTab.innerText = "태그는 10개까지만 추가할 수 있습니다.";
        }
        if (this.status == STATUS.OVER) {
            this.statusTab.innerText = "이미 추가한 태그입니다.";
        }
    }

    setAutos(text) {
        if (text.length !== 0) {
            // 텍스트가 입력되있으면 연관 해시 검색
            this.filteredAuto = this.autoHash.filter(
                tag => tag.substr(1, text.length) == text
            );
        } else {
            this.filteredAuto = [];
        }

        this.autoActive = false;

        this.autoTab.innerHTML = "";
        this.filteredAuto.forEach((hash, idx) => {
            let autoItem = document.createElement("div");
            autoItem.classList.add("auto-item");
            autoItem.innerText = hash;
            this.autoTab.append(autoItem);

            autoItem.addEventListener("click", () => {
                this.selectAuto(idx);
            });
        });
    }

    selectAuto(index) {
        this.input.value = this.filteredAuto[index].substr(
            1,
            this.filteredAuto[index].length - 1
        );
        this.autoActive = false;
        this.setAutos(this.input.value);
    }

    resetHash(){
        this.hashs = [];
        this.input.value = "";
        this.hashList.innerHTML = "";
        this.statusTab.innerHTML = ""; // 상태표시 창
        this.autoTab.innerHTML = ""; // 자동완성 표시 창
        this.status = STATUS.DEFAULT;
        this.autoActive = false; // 연관 해시 선택 여부
        this.selectedAuto = -1;
    }

    updateAutoHash(autoHash){
        this.autoHash = autoHash;
    }
}
