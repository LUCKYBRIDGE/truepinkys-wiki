# 트루핑키스 위키

학생이 필요한 지식을 안전하게 찾고, 교과목·주제태그·검색 보조어를 함께 사용해 탐색하는 정적 위키입니다.

## 구조

- `index.html`: 단일 페이지 앱, 검색, 필터, 지식 보기
- `data/documents.json`: 위키 지식 데이터
- `data/taxonomy.json`: 교과목, 주제태그, 인기 검색어
- `docs/wiki-content-guidelines.md`: 새 지식 추가 지침
- `scripts/validate-wiki-content.mjs`: 지식 데이터 검증 스크립트

## 지식 데이터 원칙

각 지식은 아래 필드를 중심으로 작성합니다.

- `definition`: 검색과 지식 첫머리에 쓰는 한 줄 뜻입니다.
- `subjects`: 초등 교과목 기준 분류입니다. 여러 교과목에 동시에 속할 수 있습니다.
- `topicTags`: 학생이 실제로 궁금해할 생활 주제입니다.
- `aliases`: 검색어의 다른 표현, 쉬운 말, 오타 대응용 표현입니다.
- `keywords`: 검색 보조 단어입니다.
- `chapters`: 본문 내용입니다. 큰 단원과 작은 단원으로 나누어 지식의 흐름을 보여 줍니다.
- `quiz`: 지식을 읽은 뒤 풀어볼 수 있는 객관식 퀴즈입니다. 각 문제는 `question`, `choices`, `answerIndex`, `explanation`을 가집니다.
- `sources`: 학생이 확인할 수 있는 공공기관·교육 자료 출처입니다. 문자열이 아니라 `publisher`, `title`, `url`, `usedFor`, `license`, `checkedAt`을 가진 객체로 작성합니다.

나중에 데이터베이스나 로그인 시스템을 붙일 수 있도록, 현재는 JSON 데이터와 화면 로직을 분리해 둡니다.

교과목, 주제태그, 인기 검색어는 `data/taxonomy.json`에서 관리합니다.

새 지식 추가 전에는 `docs/wiki-content-guidelines.md`를 확인하고, 원문 문장·이미지·표·그래프를 복제하지 않은 학생용 새 문장으로 작성합니다.

## 검증

```bash
node scripts/validate-wiki-content.mjs
jq empty data/documents.json data/taxonomy.json
git diff --check
```

## 로컬 실행

```bash
python3 -m http.server 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.
