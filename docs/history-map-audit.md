# 역사 지도 자료 점검 기록

확인일: 2026-06-05

## 점검 기준

- 지도는 `data/source/knowledge/**.json`의 `figures` 배열과 `assets/history-maps/` 자산을 기준으로 전수 확인했습니다.
- 직접 제작하거나 AI로 재생성한 역사 지도는 부정확한 경계, 전선, 세력권을 만들 위험이 있으므로 사용하지 않습니다.
- 유지 가능한 지도는 출처 페이지, 원본 파일 URL, 저작자/기관, 라이선스, 확인일, 사용 조건을 `dataSource`와 `sourceNote`에 남깁니다.
- 사용 조건이 애매하거나 실제 역사 지도로 보기 어려운 자료는 교체 또는 보류 대상으로 둡니다.

## 현재 사용 중인 지도 자산

| 자산 | 사용 지식 | 원자료 판정 | 위험도 | 처리 |
| --- | --- | --- | --- | --- |
| `assets/history-maps/imported/three-kingdoms-of-korea-map.png` | `baekje`, `gaya`, `goguryeo`, `gwanggaeto-the-great`, `kim-yu-sin`, `silla`, `three-kingdoms` | Wikimedia Commons 원본 파일. CC BY-SA 3.0. Commons 설명에 사용자 제작·수정 이력이 있어 공식 기관 지도는 아님. | 유지 가능, 정확도 주의 | 출처·저작자·라이선스·확인일·사용 조건 표기 보완 완료. 세력권 정밀 지도로 설명하지 않습니다. |
| `assets/history-maps/imported/unified-silla-balhae-8th-century.jpg` | `balhae`, `dae-joyeong`, `unified-silla` | Wikimedia Commons 원본 파일. Korea.net / 해외문화홍보원 Flickr 자료, CC BY-SA 2.0 검증 표기. | 유지 가능 | 출처·원본 파일 URL·기관·라이선스·확인일·사용 조건 표기 보완 완료. |
| `assets/history-maps/imported/korea-manchuria-1906.jpg` | `bongodong-battle`, `cheongsanri-battle`, `independence-movement` | Wikimedia Commons 원본 파일. United States Dept. of the Navy, Public domain. | 유지 가능 | 출처·원본 파일 URL·기관·라이선스·확인일·사용 조건 표기 보완 완료. 1920년대 전투 전용 작전도가 아니라 1906년 지역 참고 지도임을 본문 맥락에서 과장하지 않습니다. |
| `assets/history-maps/imported/history-of-korea-960.png` | `goryeo`, `mongol-invasions-goryeo`, `wang-geon` | Wikimedia Commons 원본 파일. Public domain. Commons 이력상 Historiographer 업로드. | 유지 가능, 정확도 주의 | 출처·원본 파일 URL·저작자·라이선스·확인일·사용 조건 표기 보완 완료. 고려 전 시기 전체를 정밀하게 설명하는 지도로 쓰지 않습니다. |
| `assets/history-maps/imported/history-of-korea-1592-1597.svg` | `hansan-island-battle`, `imjin-war`, `jinju-fortress-battle`, `yi-sun-sin` | Wikimedia Commons 원본 파일. Yug, CC0 1.0. | 유지 가능 | 출처·원본 파일 URL·저작자·라이선스·확인일·사용 조건 표기 보완 완료. |
| `assets/history-maps/imported/korea-map-1939.svg` | `japanese-colonial-period` | Wikimedia Commons 원본 파일. Emok, CC BY-SA 3.0. | 유지 가능 | 출처·원본 파일 URL·저작자·라이선스·확인일·사용 조건 표기 보완 완료. |
| `assets/history-maps/imported/joseon-qing-border-gwangyeodo.png` | `jeongmyo-horan`, `manchu-war`, `namhansanseong-defense` | Wikimedia Commons 원본 파일. 1776년 고지도, Public domain. | 유지 가능 | 출처·원본 파일 URL·저작자/기관·라이선스·확인일·사용 조건 표기 보완 완료. 전쟁 이동 경로 지도로 과장하지 않습니다. |
| `assets/history-maps/imported/joseon-at-its-end.jpg` | `joseon`, `king-sejong`, `yi-seong-gye` | Wikimedia Commons 원본 파일. Tobias Mayer 고지도 복제, Public domain. | 유지 가능, 시대 부합성 주의 | 출처·원본 파일 URL·저작자·라이선스·확인일·사용 조건 표기 보완 완료. 세종·조선 건국 시기의 실제 국경선 지도로 설명하지 않습니다. |
| `assets/history-maps/imported/pusan-perimeter.jpg` | `korean-war` | Wikimedia Commons 원본 파일. United States Army Center of Military History, Public domain. | 유지 가능 | 출처·원본 파일 URL·기관·라이선스·확인일·사용 조건 표기 보완 완료. |

## 위험도별 정리

- 유지 가능: 현재 9개 자산 모두 라이선스가 확인된 실제 Commons 원본 파일입니다.
- 출처 표기 보완 필요: 작업 전에는 모든 지도 카드에 확인일, 원본 파일 URL, 사용 조건 표기가 부족했습니다. 이번 작업에서 보완했습니다.
- 교체 필요: 현재 사용 중인 직접 제작 대체 지도는 없습니다.
- 제거 또는 보류 권장: 현재 제거·보류할 지도는 없습니다. 다만 공식 기관 지도가 아닌 Commons 사용자 제작 역사 지도는 정확도 주의 문맥을 유지하고, 더 신뢰도 높은 공공기관·박물관 지도가 확인되면 우선 교체합니다.

## 폐기한 직접 제작 지도

아래 SVG는 과거 커밋 `db08116`에서 직접 제작 지도 자산으로 추가되었고, 커밋 `09d8430`에서 삭제되었습니다. 직접 제작 지도는 Natural Earth 바탕지도와 공식 자료를 참고했다는 설명이 있었지만, 역사 국경·전선·세력권을 직접 그린 대체 지도라 교육용 백과의 정확성 기준에 부족하다고 보아 폐기 상태를 유지합니다.

- `assets/history-maps/goryeo-core.svg`
- `assets/history-maps/imjin-war-routes.svg`
- `assets/history-maps/independence-movement-regions.svg`
- `assets/history-maps/joseon-core.svg`
- `assets/history-maps/korean-war-lines.svg`
- `assets/history-maps/north-south-states.svg`
- `assets/history-maps/qing-invasions-joseon.svg`
- `assets/history-maps/three-kingdoms-and-gaya.svg`

## 앞으로의 처리 원칙

- 역사 지도는 먼저 공공기관, 박물관, 국가기관, 공공 데이터, Wikimedia Commons 등 라이선스가 명확한 실제 자료를 찾습니다.
- 정확한 실제 지도를 찾지 못하면 직접 새로 그리지 않고 지도 자료를 보류하거나 지도 자체를 빼는 방향을 우선 검토합니다.
- 원본 이미지를 그대로 쓰는 경우 로컬 파일명은 원출처 식별이 가능하게 두고, `dataSource`에는 출처 페이지 URL과 원본 파일 URL을 모두 남깁니다.
- CC BY, CC BY-SA 자료는 저작자·출처·라이선스 표기와 변경 여부 표시를 지킵니다. 원본 그대로 쓰는 경우에도 원본 파일을 수정하지 않았다는 문구를 남깁니다.
