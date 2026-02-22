# IsoCity Studio — CLAUDE.md

## 프로젝트 개요

**IsoCity Studio** — 실제 도시 데이터(GIS)를 아이소메트릭 2.5D 다이아몬드 그리드 위에 레이어로 시각화하고, 존(zone)을 정의·편집하여 게임/시뮬레이션에 연결할 수 있는 도시 맵 에디터.

mapo-blocks 게임의 맵 제작 도구로 시작했으나, 어떤 도시든 적용 가능한 범용 도구로 설계.

## 팀

| 이름 | 역할 | 비고 |
|------|------|------|
| **JJ** | 프로젝트 리더 | 방향과 최종 판단 |
| **Cody** | 엔지니어 (Claude Code) | 구현 전담 |

## 관련 프로젝트

```
mapo-blocks     → 도시경영 게임 (장기 프로젝트)
isocity-studio  → 맵 에디터 도구 ★ 현재
```

## 기술 스택

| 구성 | 선택 |
|------|------|
| 렌더링 | Canvas 2D |
| UI | Vanilla JS |
| 빌드 | Vite |
| 언어 | JavaScript (ES Modules) |
| 포트 | 4000 (dev server) |

## 레포 구조

```
isocity-studio/
├── index.html
├── vite.config.js
├── package.json
├── src/
│   ├── main.js                ← 엔트리포인트
│   ├── style.css
│   ├── core/
│   │   ├── grid.js            ← 다이아몬드 그리드 생성 + 히트 테스트
│   │   ├── project.js         ← 프로젝트(도시) 로더 (project.json)
│   │   ├── renderer.js        ← Canvas 렌더러 (레이어 + 그리드 + 존)
│   │   └── assignments.js     ← 존 할당 상태 관리 (assign/unassign/undo)
│   └── ui/
│       ├── layers.js          ← 레이어 패널 (가시성 토글, 투명도)
│       └── zones.js           ← 존 목록 (그룹별 접기, 검색, 할당 UI)
├── public/
│   └── projects/
│       └── mapo-gu/           ← 마포구 프로젝트 (첫 번째 도시)
│           ├── project.json   ← 레이어, 그룹, 존 정의
│           ├── bg-blank.jpeg  ← 빈 배경 (건물 없음)
│           ├── bg-full.jpeg   ← 건물 포함 배경
│           └── map.svg        ← OSM 기반 SVG 참조 맵
└── data/                      ← (예정) GIS 원본 데이터
```

## 핵심 개념

### 프로젝트 (Project)
하나의 도시를 정의하는 단위. `public/projects/{city}/project.json`에 설정.

```json
{
  "name": "마포구",
  "mapW": 1400, "mapH": 1000,
  "layers": [...],
  "groups": [...],
  "gridDefaults": { "cellW": 70, "cellH": 35 }
}
```

### 레이어 (Layer)
배경 이미지, SVG 맵, (향후) GIS 데이터 등. 가시성·투명도 개별 제어.

### 그리드 (Grid)
아이소메트릭 2:1 다이아몬드 셀. cellW × cellH, 스태거드 배치.
경계 제한 없이 맵 전체를 커버.

### 존 (Zone)
게임의 "블록"에 해당. 하나 이상의 셀로 구성.
그룹(동/구역)에 속함. 여러 셀을 묶어 하나의 존으로 만들 수 있음.

### 할당 (Assignment)
셀 → 존 매핑. Export하면 게임 엔진이 사용할 수 있는 JSON 생성.

## 워크플로우

1. 그리드 크기/오프셋 조정 → 도로·지형에 맞추기
2. 레이어 전환하며 참조 (Blank, Buildings, SVG Map)
3. 셀 클릭으로 선택 → 우측 존 이름 클릭 → 할당
4. 넓은 지역(상암 등): 여러 셀 선택 → 하나의 존으로 묶기
5. Export JSON → mapo-blocks 등 게임에서 사용

## 로드맵

### Phase 1: 존 빌더 (현재)
- ✅ 다이아몬드 그리드 생성
- ✅ 레이어 시스템 (이미지)
- ✅ 존 할당 (셀 선택 → 존 매핑)
- ✅ Export/Import JSON
- ✅ 프로젝트 시스템 (project.json)

### Phase 2: GIS 레이어
- 지하철 노선 + 역 위치
- 주요 도로망
- 한강 + 교량
- 행정구역 경계선
- 용도지역 (주거/상업/녹지)

### Phase 3: 편집 강화
- 셀 드래그 선택 (브러시 모드)
- 존 경계 자동 감지 (도로 기반)
- 미니맵
- 줌/팬 네비게이션

### Phase 4: 게임 연동
- mapo-blocks 호환 Export 포맷
- 건물 배치 프리뷰
- 인접 그래프 자동 생성

## 권한 경계

### Cody 자유 판단 가능
- UI/UX 디테일, CSS
- Canvas 렌더링 최적화
- 모듈 구조, 유틸리티
- 빌드/배포 설정
- 새 레이어 타입 추가

### JJ 확인 필요
- 프로젝트 데이터 구조 변경
- 새 도시 프로젝트 추가
- 게임 연동 포맷 변경
- 외부 API/서비스 연동

## 커밋 컨벤션

```
feat: 지하철 레이어 추가
fix: 셀 히트 테스트 경계 오류
ui: 존 목록 검색 개선
data: 마포구 GIS 데이터 업데이트
```
