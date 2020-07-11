class Register {
    constructor() {
        this.form = document.querySelector("#register_form");
        this.email = document.querySelector("#register_email");
        this.password = document.querySelector("#register_password");
        this.passwordCheck = document.querySelector("#register_password_check");
        this.profile = document.querySelector("#register_profile");
        this.name = document.querySelector("#register_name");
        this.type = document.querySelector("#register_type");
        this.init();
    }

    init() {
        this.profile.addEventListener("change", e => {
            let image = e.target.files[0];
            let allowed = ["jpg", "jpeg", "png", "gif"];
            let extname = image.name
                .substr(image.name.lastIndexOf(".") + 1)
                .toLowerCase();

            if (
                allowed.includes(extname) &&
                image.type.substr(0, 5) == "image"
            ) {
                if (image.size / 1024 / 1024 > 5) {
                    alert("파일 크기는 5MB를 넘을 수 없습니다.");
                    e.preventDefault();
                    e.target.value = "";
                }
            } else {
                alert("이미지 파일이 아닙니다.");
                e.preventDefault();
                e.target.value = "";
                return false;
            }
        });

        this.form.addEventListener("submit", e => {
            let user = {
                email: this.email.value,
                password: this.password.value,
                profile: this.profile.value,
                name: this.name.value,
                type: this.type.value,
            };
            let flag = true;

            if (this.password.value !== this.passwordCheck.value) {
                this.setDangerMessage("#password_check_danger", "비밀번호와 비밀번호 확인이 불일치합니다.");
                e.preventDefault();
                return false;
            }else this.setDangerMessage("#password_check_danger", "");

            let image = this.profile.files[0];

            if (image.type.substring(0, 5) == "image") {
                if (image.size / 1024 / 1024 > 5) {
                    this.setDangerMessage("#profile_danger", "이미지 파일은 5MB 이상 업로드 할 수 없습니다.");
                    e.preventDefault();
                    return false;
                }else this.setDangerMessage("#profile_danger", "");
            } else {
                this.setDangerMessage("#profile_danger", "이미지 파일만 업로드 할 수 있습니다.");
                e.preventDefault();
                return false;
            }

            if (!/^([a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z]{3,4})$/.test(user.email)) {
                this.setDangerMessage("#email_danger", "올바른 이메일을 입력하세요.");
                e.preventDefault();
                flag = false;
            }else this.setDangerMessage("#email_danger", "");

            if (
                !/^(?=.*[a-zA-Z].*)(?=.*[0-9].*)(?=.*[!@#$%^&*\(\)].*)([a-zA-Z0-9!@#$%^&*\(\)]{8,})$/.test(
                    user.password
                )
            ) {
                this.setDangerMessage("#password_danger", "올바른 비밀번호를 입력하세요.");
                e.preventDefault();
                flag = false;
            }else this.setDangerMessage("#password_danger", "");

            if (!/^([ㄱ-ㅎㅏ-ㅣ가-힣]{2,4})$/.test(user.name)) {
                this.setDangerMessage("#name_danger", "올바른 이름을 입력하세요.");
                e.preventDefault();
                flag = false;
            }else this.setDangerMessage("#name_danger", "");

            if(!flag){
                e.preventDefault();
                return false;
            }

            alert("정상적으로 회원가입 되었습니다.");
        });
    }

    setDangerMessage(id, text){
        let node = document.querySelector(id);
        node.innerText = text;
    }
}

window.onload = () => {
    let app = new Register();
};
