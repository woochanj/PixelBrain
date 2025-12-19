# 🦙 나만의 AI 챗봇 만들기 & 외부 접속 가이드

이 문서는 **Ollama**를 사용하여 로컬 AI 서버를 구축하고, **웹 채팅 인터페이스**를 만들어 **같은 와이파이 내의 다른 기기(스마트폰 등)**에서 접속하는 방법까지의 전체 과정을 정리한 가이드입니다.

---

## 0. 설치 및 초기 설정 (가장 먼저 할 일)

### 0.1 Ollama 다운로드 및 설치
1.  **[Ollama 공식 홈페이지](https://ollama.com)**에 접속하여 `Download` 버튼을 누릅니다.
2.  Windows 버전을 다운로드하고 설치합니다.
3.  설치가 완료되면 작업표시줄(시계 옆)에 귀여운 라마 아이콘이 생깁니다.

### 0.2 모델 설치 (Gemma 3 12B)
설치 직후에는 뇌(모델)가 없는 상태입니다. 터미널(PowerShell)을 열고 다음 명령어를 입력하면 자동으로 다운로드됩니다.
(용량이 약 8GB 정도 되니 시간이 조금 걸릴 수 있습니다.)

```powershell
ollama run gemma3:12b
```
*설치가 끝나고 대화 프롬프트(`>>>`)가 나오면 `/bye`를 입력해서 빠져나오세요.*

### 0.3 GUI 설정 (외부 접속 허용)
만약 사용 중인 Ollama 앱에 설정 화면이 있다면(또는 AnythingLLM 같은 도구를 쓴다면) 다음 설정을 켜주세요.

1.  Ollama 트레이 아이콘 우클릭 -> **Settings** 또는 **Manage** (버전에 따라 다를 수 있음)
2.  **`Expose Ollama to the network`** (네트워크 노출) 체크박스를 **ON**으로 켭니다.
    *   *이 옵션이 없다면 아래 "3. Ollama 서버 설정" 챕터의 환경 변수 설정을 따라 하시면 됩니다.*

---

## 1. 환경 준비 (Python & 라이브러리)

가장 먼저 Python 환경을 만들고 필요한 도구를 설치했습니다.

1.  **가상환경 생성** (프로젝트 격리를 위해 권장)
    ```powershell
    python -m venv venv
    ```
2.  **가상환경 활성화**
    ```powershell
    # 윈도우 PowerShell 기준
    .\venv\Scripts\Activate.ps1
    ```
3.  **필수 라이브러리 설치**
    ```powershell
    pip install requests
    ```

---

## 2. 웹 채팅 화면 만들기 (Frontend)

터미널이 아닌 예쁜 웹 화면에서 대화하기 위해 3가지 파일을 `chat-app` 폴더에 만들었습니다.

*   **`index.html`**: 전체적인 화면 구조 (뼈대)
    *   *팁: 스마트폰에서 화면이 작게 보이지 않도록 `<meta name="viewport" ...>` 태그 설정이 중요합니다.*
*   **`style.css`**: 애플 스타일의 글래스모피즘 디자인 (꾸미기)
*   **`app.js`**: Ollama와 대화하는 자바스크립트 코드 (지능)
    *   *중요 수정사항:* `app.js` 내부의 접속 주소를 다음과 같이 변경했습니다.
        ```javascript
        // localhost 대신 내 PC의 IP 주소 사용
        const OLLAMA_API_URL = 'http://192.168.61.249:11434/api/generate';
        ```

---

## 3. Ollama 서버 설정 (외부 접속 허용) 🔓

기본적으로 Ollama는 보안상 내 컴퓨터(localhost)에서만 접속됩니다. 이를 외부(스마트폰 등)에서도 접속하게 하려면 설정 변경이 필요합니다.

### 3.1 윈도우 환경 변수 영구 등록
터미널(PowerShell)에서 다음 명령어를 한 번 실행하면 설정이 윈도우에 영구적으로 저장됩니다.

```powershell
# 1. 외부 접속 허용 (모든 IP에서 듣기)
setx OLLAMA_HOST "0.0.0.0"

# 2. CORS(보안 정책) 허용 (웹 브라우저 접속 허용)
setx OLLAMA_ORIGINS "*"
```

> **중요:** 이 설정을 적용하려면 **실행 중인 Ollama 앱(트레이 아이콘)을 완전히 껐다가 다시 켜야 합니다.** (`Quit Ollama` -> 다시 실행)

---

## 4. 윈도우 방화벽 설정 🛡️ (아주 중요!)

외부에서 접속하려면 **두 개의 문(AI와 웹서버)**을 모두 열어줘야 합니다.

**관리자 권한 PowerShell**에서 다음 두 명령어를 **모두** 실행하세요:

```powershell
# 1. AI 뇌 서버 (Ollama: 11434) 개방
New-NetFirewallRule -DisplayName "Ollama-Allow-LAN" -Direction Inbound -LocalPort 11434 -Protocol TCP -Action Allow

# 2. 웹 채팅 페이지 (Python Server: 8080) 개방
New-NetFirewallRule -DisplayName "Python-WebServer-8080" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

---

## 5. 실행 및 접속 방법 🚀

모든 설정이 끝났습니다! 이제 언제든지 다음 순서대로 실행하면 됩니다.

### A. Ollama 실행
그냥 윈도우 바탕화면이나 시작 메뉴에서 **Ollama** 아이콘을 눌러 실행합니다. (트레이에 아이콘이 생기면 성공)

### B. 웹 서버 실행 (채팅 화면 띄우기)
`index.html` 파일을 브라우저에 보여줄 웹 서버가 필요합니다. 터미널에서 다음 명령어를 실행하세요.

```powershell
cd chat-app
python -m http.server 8080
```

### C. 접속하기
*   **내 컴퓨터에서:** `http://localhost:8080`
*   **스마트폰 / 태블릿에서:** `http://192.168.61.249:8080`

이제 스마트폰으로 접속해서 편하게 AI와 대화할 수 있습니다! 🎉
