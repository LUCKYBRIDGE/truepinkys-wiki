# 트루핑키스 위키

학생이 필요한 지식을 안전하게 찾고, 교과목·주제태그·검색 보조어를 함께 사용해 탐색하는 정적 위키입니다.

## 구조

- `index.html`: 단일 페이지 앱, 검색, 필터, 지식 보기
- `data/source/knowledge/**/*.json`: 개발자가 직접 수정하는 지식 원본 파일
- `data/source/taxonomy.json`: 교과목, 주제태그, 인기 검색어 원본
- `data/source/curriculum-map.json`: 교육과정 참고 분류 원본
- `data/generated/taxonomy.json`: 화면에서 읽는 교과목, 주제태그, 인기 검색어
- `data/generated/curriculum-map.json`: 화면에서 읽는 교육과정 참고 분류
- `data/generated/knowledge-index.json`: 첫 화면과 목록에 쓰는 가벼운 지식 색인
- `data/generated/search-index.json`: 검색 화면에서만 불러오는 검색용 색인
- `data/generated/quiz-index.json`: 퀴즈 코너에서만 불러오는 퀴즈용 색인
- `data/generated/docs/*.json`: 지식 상세 화면에서 하나씩 불러오는 개별 지식 파일
- `docs/wiki-content-guidelines.md`: 새 지식 추가 지침
- `scripts/build-wiki-data.mjs`: 원본 지식 데이터에서 화면용 분할 데이터를 생성하는 스크립트
- `scripts/wiki-source.mjs`: 원본 지식과 생성 데이터 경로를 함께 관리하는 공통 모듈
- `scripts/validate-wiki-content.mjs`: 지식 데이터 검증 스크립트
- `scripts/validate-curriculum-map.mjs`: 교육과정 분류 데이터 검증 스크립트

## 지식 데이터 원칙

각 지식은 아래 필드를 중심으로 작성합니다.

- `definition`: 검색과 지식 첫머리에 쓰는 한 줄 뜻입니다.
- `subjects`: 초등 교과목 기준 분류입니다. 여러 교과목에 동시에 속할 수 있습니다.
- `topicTags`: 학생이 실제로 궁금해할 생활 주제입니다.
- `aliases`: 검색어의 다른 표현, 쉬운 말, 오타 대응용 표현입니다.
- `keywords`: 검색 보조 단어입니다.
- `chapters`: 본문 내용입니다. 큰 단원과 작은 단원으로 나누어 지식의 흐름을 보여 줍니다.
- `quiz`: 지식을 읽은 뒤 풀어볼 수 있는 객관식 퀴즈입니다. 각 문제는 `question`, `choices`, `answerIndex`, `explanation`을 가집니다. 선택지별 해설이 필요하면 `choiceExplanations`에 보기 4개의 해설을 같은 순서로 넣습니다. 빈칸 채우기 객관식은 `type: "blank"`를 함께 쓰고 질문에 `____`를 넣습니다.
- `sources`: 학생이 확인할 수 있는 공공기관·교육 자료 출처입니다. 문자열이 아니라 `publisher`, `title`, `url`, `usedFor`, `license`, `checkedAt`을 가진 객체로 작성합니다.

나중에 데이터베이스나 로그인 시스템을 붙일 수 있도록, 현재는 원본 JSON 데이터와 화면용 생성 데이터를 분리해 둡니다.

교과목, 주제태그, 인기 검색어는 `data/source/taxonomy.json`에서 관리합니다.

새 지식 추가 전에는 `docs/wiki-content-guidelines.md`를 확인하고, 원문 문장·이미지·표·그래프를 복제하지 않은 학생용 새 문장으로 작성합니다.

퀴즈는 지식 하나하나를 읽고 직접 판단해 작성합니다. 문제 수를 맞추려고 억지로 늘리거나, 여러 지식에 같은 틀을 적용해 일괄 생성하지 않습니다.

## 데이터 생성

지식 내용은 `data/source/knowledge` 아래의 지식별 JSON 파일을 원본으로 수정합니다. 원본을 수정한 뒤에는 아래 명령으로 첫 화면용 색인, 검색 색인, 퀴즈 색인, 개별 지식 파일을 다시 생성합니다.

```bash
node scripts/build-wiki-data.mjs
```

`data/generated` 아래 파일은 직접 수정하지 않습니다. 첫 화면은 `data/generated/knowledge-index.json`만 먼저 읽고, 지식 상세·검색·퀴즈 화면에 들어갈 때 필요한 데이터만 추가로 불러옵니다. 그래서 원본 지식이 늘어나도 첫 접속에서 전체 지식을 한 번에 읽지 않습니다.

향후 Markdown 원본을 도입할 때도 웹 화면은 계속 `data/generated`의 JSON을 읽고, 빌드 스크립트가 `data/source`의 JSON 또는 MD 원본을 공통 지식 객체로 변환하는 방식으로 확장합니다.

## 검증

```bash
node scripts/build-wiki-data.mjs
node scripts/validate-wiki-content.mjs
node scripts/validate-curriculum-map.mjs
node scripts/validate-search-quality.mjs
jq empty data/source/taxonomy.json data/source/curriculum-map.json data/source/knowledge/digital/ai.json data/source/knowledge/economy/petrodollar.json data/generated/taxonomy.json data/generated/curriculum-map.json data/generated/knowledge-index.json data/generated/search-index.json data/generated/quiz-index.json data/generated/docs/ai.json data/generated/docs/petrodollar.json
git diff --check
```

## 로컬 실행

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.
